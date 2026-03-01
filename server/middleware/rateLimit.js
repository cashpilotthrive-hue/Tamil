const rateLimit = (windowMs = 60000, maxRequests = 100) => {
  const hits = new Map();

  setInterval(() => hits.clear(), windowMs).unref();

  return (req, res, next) => {
    const key = req.ip;
    const count = (hits.get(key) || 0) + 1;
    hits.set(key, count);
    if (count > maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    next();
  };
};

module.exports = rateLimit;
