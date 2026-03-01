const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../server/index');

let server;
let baseUrl;

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, body: JSON.parse(data) });
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

  it('POST /api/portfolio/assets validates input', async () => {
    const res = await request('POST', '/api/portfolio/assets', { name: 'Test' });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('POST /api/portfolio/assets rejects negative value', async () => {
    const res = await request('POST', '/api/portfolio/assets', {
      name: 'Bad',
      type: 'stock',
      value: -100,
    });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('POST /api/portfolio/assets creates asset', async () => {
    const res = await request('POST', '/api/portfolio/assets', {
      name: 'AAPL',
      type: 'stock',
      value: 150.50,
    });
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
});
