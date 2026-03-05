# Tamil

Autonomous financial system — a full-stack application for managing financial portfolios.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later

### Install

```bash
npm install
```

### Run

```bash
npm start
```

The server starts at `http://localhost:3000`.

User Dashboard: `http://localhost:3000/`
Admin Panel: `http://localhost:3000/admin.html`
(Default credentials: admin / admin123)

### Test

```bash
npm test
```

## Project Structure

```
server/                 Backend API (Express)
  index.js              Entry point
  routes/api.js         Portfolio API routes
  routes/admin.js       Admin API routes (protected)
  middleware/auth.js    Authentication middleware
  middleware/rateLimit.js  Rate limiting middleware
client/                 Frontend
  index.html            User dashboard
  styles.css            User dashboard styling
  app.js                User dashboard logic
  admin.html            Admin panel
  admin-styles.css      Admin panel styling
  admin-app.js          Admin panel logic
tests/                  Test suite
  api.test.js           API tests
  admin.test.js         Admin API tests
```

## API

### Public API

| Method | Endpoint                  | Description             |
|--------|---------------------------|-------------------------|
| GET    | `/api/health`             | Health check            |
| GET    | `/api/portfolio`          | Get full portfolio      |
| POST   | `/api/portfolio/assets`   | Add an asset            |
| GET    | `/api/portfolio/summary`  | Portfolio summary       |

### Admin API (Requires Authentication)

| Method | Endpoint                       | Description              |
|--------|--------------------------------|--------------------------|
| POST   | `/admin/login`                 | Admin login              |
| POST   | `/admin/logout`                | Admin logout             |
| GET    | `/admin/portfolio/stats`       | Detailed statistics      |
| PUT    | `/admin/portfolio/assets/:id`  | Update asset             |
| DELETE | `/admin/portfolio/assets/:id`  | Delete asset             |
| DELETE | `/admin/portfolio/clear`       | Clear all assets         |

## Features

- **User Dashboard**: View and add assets to your portfolio
- **Admin Panel**: Advanced portfolio management with authentication
  - View detailed statistics and analytics
  - Edit and delete existing assets
  - Bulk operations (clear all assets)
  - Session-based authentication
- **Rate Limiting**: Protection against excessive requests
- **Full Test Coverage**: Comprehensive test suite for all features

## License

Apache-2.0
