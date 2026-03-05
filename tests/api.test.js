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

  it('PUT /api/portfolio/assets/:id updates asset', async () => {
    const create = await request('POST', '/api/portfolio/assets', {
      name: 'BTC',
      type: 'crypto',
      value: 30000,
    });
    assert.equal(create.status, 201);
    const id = create.body.id;

    const update = await request('PUT', `/api/portfolio/assets/${id}`, {
      name: 'BTC Updated',
      type: 'crypto',
      value: 35000,
    });
    assert.equal(update.status, 200);
    assert.equal(update.body.name, 'BTC Updated');
    assert.equal(update.body.value, 35000);
    assert.equal(update.body.id, id);
  });

  it('PUT /api/portfolio/assets/:id returns 404 for unknown id', async () => {
    const res = await request('PUT', '/api/portfolio/assets/99999', {
      name: 'Ghost',
      type: 'cash',
      value: 1,
    });
    assert.equal(res.status, 404);
    assert.ok(res.body.error);
  });

  it('DELETE /api/portfolio/assets/:id removes asset', async () => {
    const create = await request('POST', '/api/portfolio/assets', {
      name: 'ETH',
      type: 'crypto',
      value: 2000,
    });
    assert.equal(create.status, 201);
    const id = create.body.id;

    const del = await request('DELETE', `/api/portfolio/assets/${id}`);
    assert.equal(del.status, 204);

    const portfolio = await request('GET', '/api/portfolio');
    assert.ok(!portfolio.body.assets.find((a) => a.id === id));
  });

  it('DELETE /api/portfolio/assets/:id returns 404 for unknown id', async () => {
    const res = await request('DELETE', '/api/portfolio/assets/99999');
    assert.equal(res.status, 404);
    assert.ok(res.body.error);
  });

  it('DELETE /api/portfolio/assets resets portfolio', async () => {
    await request('POST', '/api/portfolio/assets', {
      name: 'MSFT',
      type: 'stock',
      value: 400,
    });

    const del = await request('DELETE', '/api/portfolio/assets');
    assert.equal(del.status, 204);

    const portfolio = await request('GET', '/api/portfolio');
    assert.equal(portfolio.body.assets.length, 0);
    assert.equal(portfolio.body.totalValue, 0);
  });
});
