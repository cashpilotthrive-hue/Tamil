const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../server/index');

let server;
let baseUrl;
let sessionId;

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: { 'Content-Type': 'application/json', ...headers },
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

describe('Admin API', () => {
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

  it('POST /admin/login rejects invalid credentials', async () => {
    const res = await request('POST', '/admin/login', {
      username: 'wrong',
      password: 'wrong',
    });
    assert.equal(res.status, 401);
    assert.ok(res.body.error);
  });

  it('POST /admin/login accepts valid credentials', async () => {
    const res = await request('POST', '/admin/login', {
      username: 'admin',
      password: 'admin123',
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.sessionId);
    assert.ok(res.body.expiresIn);
    sessionId = res.body.sessionId;
  });

  it('GET /admin/portfolio/stats requires authentication', async () => {
    const res = await request('GET', '/admin/portfolio/stats');
    assert.equal(res.status, 401);
  });

  it('GET /admin/portfolio/stats returns statistics', async () => {
    const res = await request('GET', '/admin/portfolio/stats', null, {
      'x-admin-session': sessionId,
    });
    assert.equal(res.status, 200);
    assert.equal(typeof res.body.totalAssets, 'number');
    assert.equal(typeof res.body.totalValue, 'number');
    assert.ok(res.body.assetTypes);
  });

  it('PUT /admin/portfolio/assets/:id requires authentication', async () => {
    const res = await request('PUT', '/admin/portfolio/assets/1', {
      name: 'Updated',
    });
    assert.equal(res.status, 401);
  });

  it('PUT /admin/portfolio/assets/:id updates asset', async () => {
    // First create an asset
    await request('POST', '/api/portfolio/assets', {
      name: 'TestAsset',
      type: 'stock',
      value: 100,
    });

    // Update it
    const res = await request('PUT', '/admin/portfolio/assets/1', {
      name: 'UpdatedAsset',
      value: 200,
    }, {
      'x-admin-session': sessionId,
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'UpdatedAsset');
    assert.equal(res.body.value, 200);
  });

  it('PUT /admin/portfolio/assets/:id validates value', async () => {
    const res = await request('PUT', '/admin/portfolio/assets/1', {
      value: -100,
    }, {
      'x-admin-session': sessionId,
    });
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });

  it('PUT /admin/portfolio/assets/:id returns 404 for non-existent asset', async () => {
    const res = await request('PUT', '/admin/portfolio/assets/9999', {
      name: 'Test',
    }, {
      'x-admin-session': sessionId,
    });
    assert.equal(res.status, 404);
  });

  it('DELETE /admin/portfolio/assets/:id requires authentication', async () => {
    const res = await request('DELETE', '/admin/portfolio/assets/1');
    assert.equal(res.status, 401);
  });

  it('DELETE /admin/portfolio/assets/:id deletes asset', async () => {
    // Create an asset
    const createRes = await request('POST', '/api/portfolio/assets', {
      name: 'ToDelete',
      type: 'stock',
      value: 50,
    });
    const assetId = createRes.body.id;

    // Delete it
    const res = await request('DELETE', `/admin/portfolio/assets/${assetId}`, null, {
      'x-admin-session': sessionId,
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.id, assetId);
  });

  it('DELETE /admin/portfolio/assets/:id returns 404 for non-existent asset', async () => {
    const res = await request('DELETE', '/admin/portfolio/assets/9999', null, {
      'x-admin-session': sessionId,
    });
    assert.equal(res.status, 404);
  });

  it('DELETE /admin/portfolio/clear requires authentication', async () => {
    const res = await request('DELETE', '/admin/portfolio/clear');
    assert.equal(res.status, 401);
  });

  it('DELETE /admin/portfolio/clear clears all assets', async () => {
    // Add some assets
    await request('POST', '/api/portfolio/assets', {
      name: 'Asset1',
      type: 'stock',
      value: 100,
    });
    await request('POST', '/api/portfolio/assets', {
      name: 'Asset2',
      type: 'bond',
      value: 200,
    });

    // Clear portfolio
    const res = await request('DELETE', '/admin/portfolio/clear', null, {
      'x-admin-session': sessionId,
    });
    assert.equal(res.status, 200);

    // Verify empty
    const portfolioRes = await request('GET', '/api/portfolio');
    assert.equal(portfolioRes.body.assets.length, 0);
    assert.equal(portfolioRes.body.totalValue, 0);
  });

  it('POST /admin/logout logs out admin', async () => {
    const res = await request('POST', '/admin/logout', null, {
      'x-admin-session': sessionId,
    });
    assert.equal(res.status, 200);

    // Verify session is invalid
    const statsRes = await request('GET', '/admin/portfolio/stats', null, {
      'x-admin-session': sessionId,
    });
    assert.equal(statsRes.status, 401);
  });
});
