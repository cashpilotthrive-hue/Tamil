const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

process.env.ADMIN_KEY = 'test-admin-key';
const app = require('../server/index');

const ADMIN_KEY = process.env.ADMIN_KEY;

let server;
let baseUrl;

function request(method, path, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let body;
        try {
          body = JSON.parse(data);
        } catch {
          body = data;
        }
        resolve({ status: res.statusCode, body });
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('API', () => {
  before((_, done) => {
    server = app.listen(0, () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      done();
    });
  });

  after((_, done) => {
    server.close(done);
  });

  it('GET /api/health returns ok', async () => {
    const res = await request('GET', '/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.ok(res.body.timestamp);
  });

  it('GET /api/portfolio returns portfolio', async () => {
    const res = await request('GET', '/api/portfolio');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.assets));
    assert.equal(res.body.currency, 'USD');
  });

  it('POST /api/portfolio/assets without admin key returns 401', async () => {
    const res = await request('POST', '/api/portfolio/assets', { name: 'Test' });
    assert.equal(res.status, 401);
    assert.ok(res.body.error);
  });

  it('POST /api/portfolio/assets validates input', async () => {
    const res = await request('POST', '/api/portfolio/assets', { name: 'Test' }, { 'X-Admin-Key': ADMIN_KEY });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('POST /api/portfolio/assets rejects negative value', async () => {
    const res = await request('POST', '/api/portfolio/assets', {
      name: 'Bad',
      type: 'stock',
      value: -100,
    }, { 'X-Admin-Key': ADMIN_KEY });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('POST /api/portfolio/assets creates asset', async () => {
    const res = await request('POST', '/api/portfolio/assets', {
      name: 'AAPL',
      type: 'stock',
      value: 150.50,
    }, { 'X-Admin-Key': ADMIN_KEY });
    assert.equal(res.status, 201);
    assert.equal(res.body.name, 'AAPL');
    assert.equal(res.body.type, 'stock');
    assert.equal(res.body.value, 150.50);
    assert.ok(res.body.id);
  });

  it('GET /api/portfolio/summary reflects added assets', async () => {
    const res = await request('GET', '/api/portfolio/summary');
    assert.equal(res.status, 200);
    assert.ok(res.body.totalAssets >= 1);
    assert.ok(res.body.totalValue > 0);
  });

  it('DELETE /api/portfolio/assets/:id without admin key returns 401', async () => {
    const res = await request('DELETE', '/api/portfolio/assets/1');
    assert.equal(res.status, 401);
    assert.ok(res.body.error);
  });

  it('DELETE /api/portfolio/assets/:id removes asset', async () => {
    const createRes = await request('POST', '/api/portfolio/assets', {
      name: 'ToDelete',
      type: 'cash',
      value: 500,
    }, { 'X-Admin-Key': ADMIN_KEY });
    assert.equal(createRes.status, 201);
    const id = createRes.body.id;

    const delRes = await request('DELETE', `/api/portfolio/assets/${id}`, null, { 'X-Admin-Key': ADMIN_KEY });
    assert.equal(delRes.status, 204);
  });

  it('DELETE /api/portfolio/assets/:id returns 404 for missing asset', async () => {
    const res = await request('DELETE', '/api/portfolio/assets/99999', null, { 'X-Admin-Key': ADMIN_KEY });
    assert.equal(res.status, 404);
    assert.ok(res.body.error);
  });
});
