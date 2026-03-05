const express = require('express');
const router = express.Router();
const { authMiddleware, login, logout } = require('../middleware/auth');

// Get shared portfolio data from api.js
const apiModule = require('./api');

// Auth routes
router.post('/login', login);
router.post('/logout', authMiddleware, logout);

// Admin-only routes (protected)
router.get('/portfolio/stats', authMiddleware, (_req, res) => {
  const portfolio = apiModule.getPortfolio();
  const stats = {
    totalAssets: portfolio.assets.length,
    totalValue: portfolio.totalValue,
    currency: portfolio.currency,
    assetTypes: {},
    recentAssets: portfolio.assets.slice(-5).reverse(),
  };

  for (const asset of portfolio.assets) {
    if (!stats.assetTypes[asset.type]) {
      stats.assetTypes[asset.type] = { count: 0, totalValue: 0, avgValue: 0 };
    }
    stats.assetTypes[asset.type].count += 1;
    stats.assetTypes[asset.type].totalValue += asset.value;
  }

  for (const type in stats.assetTypes) {
    stats.assetTypes[type].avgValue =
      stats.assetTypes[type].totalValue / stats.assetTypes[type].count;
  }

  res.json(stats);
});

router.delete('/portfolio/assets/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const success = apiModule.deleteAsset(id);
  if (success) {
    res.json({ message: 'Asset deleted', id });
  } else {
    res.status(404).json({ error: 'Asset not found' });
  }
});

router.put('/portfolio/assets/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id);
  const { name, value, type } = req.body;

  if (!name && value == null && !type) {
    return res.status(400).json({ error: 'At least one field required' });
  }

  if (value != null && (typeof value !== 'number' || value < 0)) {
    return res.status(400).json({ error: 'value must be a non-negative number' });
  }

  const asset = apiModule.updateAsset(id, { name, value, type });
  if (asset) {
    res.json(asset);
  } else {
    res.status(404).json({ error: 'Asset not found' });
  }
});

router.delete('/portfolio/clear', authMiddleware, (_req, res) => {
  apiModule.clearPortfolio();
  res.json({ message: 'Portfolio cleared' });
});

module.exports = router;
