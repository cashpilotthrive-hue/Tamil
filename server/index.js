const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const rateLimit = require('./middleware/rateLimit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(rateLimit());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client')));

app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

app.get('/', rateLimit(), (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Tamil server running on port ${PORT}`);
  });
}

module.exports = app;
