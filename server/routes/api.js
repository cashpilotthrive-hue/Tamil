const express = require('express');
const router = express.Router();

let nextAssetId = 1;
const portfolio = {
  assets: [],
  totalValue: 0,
  currency: 'USD',
};

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/portfolio', (_req, res) => {
  res.json(portfolio);
});

router.post('/portfolio/assets', (req, res) => {
  const { name, value, type } = req.body;
  if (!name || value == null || !type) {
    return res.status(400).json({ error: 'name, value, and type are required' });
  }
  if (typeof value !== 'number' || value < 0) {
    return res.status(400).json({ error: 'value must be a non-negative number' });
  }
  const asset = { id: nextAssetId++, name, value, type };
  portfolio.assets.push(asset);
  portfolio.totalValue = portfolio.assets.reduce((sum, a) => sum + a.value, 0);
  res.status(201).json(asset);
});

router.get('/portfolio/summary', (_req, res) => {
  const summary = {
    totalAssets: portfolio.assets.length,
    totalValue: portfolio.totalValue,
    currency: portfolio.currency,
    byType: {},
  };
  for (const asset of portfolio.assets) {
    if (!summary.byType[asset.type]) {
      summary.byType[asset.type] = { count: 0, value: 0 };
    }
    summary.byType[asset.type].count += 1;
    summary.byType[asset.type].value += asset.value;
  }
  res.json(summary);
});

module.exports = router;
