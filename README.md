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

### Test

```bash
npm test
```

## Project Structure

```
server/          Backend API (Express)
  index.js       Entry point
  routes/api.js  Portfolio API routes
client/          Frontend dashboard
  index.html     Main page
  styles.css     Styling
  app.js         Client-side logic
tests/           Test suite
```

## API

| Method | Endpoint                  | Description             |
|--------|---------------------------|-------------------------|
| GET    | `/api/health`             | Health check            |
| GET    | `/api/portfolio`          | Get full portfolio      |
| POST   | `/api/portfolio/assets`   | Add an asset            |
| GET    | `/api/portfolio/summary`  | Portfolio summary       |

## License

Apache-2.0
