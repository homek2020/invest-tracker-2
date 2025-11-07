# Invest Tracker 2

Invest Tracker helps long-term investors monitor monthly performance across multiple brokerage providers. The project contains a lightweight Express API and a Vite/React client that implement the workflows described in the [product requirements](docs/product_requirements.md).

## Getting started

The repository is organised as a two-service workspace:

| Service | Path | Description |
|---------|------|-------------|
| API | `backend` | Express server backed by MongoDB persistence and JWT-based auth flows. |
| Web | `frontend` | React single-page application built with Vite, React Query and Zustand. |

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB 6.0+

### Configure MongoDB

1. Start a MongoDB instance locally or point the application at a managed cluster. The default connection string expects `mongodb://127.0.0.1:27017`.
2. Create a `.env` file inside `backend/` (or export environment variables) with at least:
   ```bash
   MONGO_URI="mongodb://127.0.0.1:27017/invest_tracker"
   MONGO_DB="invest_tracker"
   JWT_SECRET="super-secret-value"
   PORT=4000
   ```
   The backend package ships with a dedicated [README](backend/README.md) that summarises every configuration option.

No separate schema bootstrap step is needed—the API will create collections and indexes on demand when it connects to MongoDB.

### Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

> The package manifests already include every dependency described in the requirements. Installing them locally is only necessary if you plan to run the application.

### Run the API server

```bash
cd backend
npm run dev
```

The API listens on <http://localhost:4000> and exposes the `/api/v1` routes from the requirements document. The development command relies on [`ts-node-dev`](https://github.com/wclr/ts-node-dev) with CommonJS output, avoiding Node’s ES module loader quirks. Ensure the environment variables from the previous step are available before starting the server so it can establish the MongoDB connection.

### Run the web client

```bash
cd frontend
npm run dev
```

Open <http://localhost:5173> in a browser. The client performs OTP authentication automatically for a demo user, provides CRUD for accounts, monthly balance workflows, FX views and a dashboard overview.

## Testing

The current iteration focuses on the end-to-end slices. Add unit and integration tests as the codebase evolves.

## Project structure

```
backend/
  src/
    middleware/   # Authentication guard
    routes/       # REST endpoints mapped to use cases
    services/     # MongoDB connection helpers
frontend/
  src/
    api/          # REST API clients
    components/   # Reusable UI components
    pages/        # Feature screens (dashboard, accounts, balances, FX)
    hooks/        # Client-side auth bootstrap
    theme/        # Global styling tokens
```

Refer to the requirements document for the full product scope and future roadmap.
