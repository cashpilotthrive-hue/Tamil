const crypto = require('crypto');

const ADMIN_KEY = process.env.ADMIN_KEY || crypto.randomBytes(32).toString('hex');

if (!process.env.ADMIN_KEY) {
  console.warn('WARNING: ADMIN_KEY env var not set. A temporary key has been generated and will change on restart.');
  console.log(`Temporary admin key: ${ADMIN_KEY}`);
}

const requireAdmin = (req, res, next) => {
  const key = req.headers['x-admin-key'];
  if (!key || key !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized: valid X-Admin-Key header required' });
  }
  next();
};

module.exports = { requireAdmin };
