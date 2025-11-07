# Invest Tracker 2

Invest Tracker helps long-term investors monitor monthly performance across multiple brokerage providers. The project contains a Fastify-based API server and a Vite/React client that implement the workflows described in the [product requirements](docs/product_requirements.md).

## Getting started

The repository is organised as a two-service workspace:

| Service   | Path      | Description |
|-----------|-----------|-------------|
| API       | `backend` | Fastify server backed by MongoDB persistence and JWT-based auth flows. |
| Web       | `frontend`| React single-page application built with Vite, React Query and Zustand. |

### Prerequisites

* Node.js 18+
* npm 9+
* MongoDB 6.0+

### Configure MongoDB

1. Start a MongoDB instance locally or point the application at a managed cluster. The default connection string expects `mongodb://127.0.0.1:27017`.
2. Export the backend environment variables so the API and setup scripts can connect:

   ```bash
   export MONGO_URI="mongodb://127.0.0.1:27017"
   export MONGO_DB_NAME="invest_tracker"
   ```

   The backend package ships with a dedicated [README](backend/README.md) that covers the available configuration knobs in more detail.

3. Bootstrap the schema (collections and indexes) before launching the API. The helper scripts live in [`backend/scripts`](backend/scripts/):

   ```bash
   cd backend
   npm run db:create-collections
   npm run db:create-indexes
   ```

### Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

> The package manifests already include every dependency described in the requirements. Installing them locally is only necessary if you want to run the application.

### Run the API server

```bash
cd backend
npm run dev
```

The API listens on <http://localhost:3000> and exposes the `/api/v1` routes from the requirements document. The development command relies on [`ts-node-dev`](https://github.com/wclr/ts-node-dev) with CommonJS output, avoiding the ES module loader requirement that was causing runtime errors. Ensure `MONGO_URI` and `MONGO_DB_NAME` are set in the environment before starting the server so it can establish the MongoDB connection.

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
    config/       # Environment and runtime configuration
    domain/       # Domain models for users, accounts, balances and FX
    routes/       # REST endpoints mapped to use cases
    services/     # Auth + MongoDB data access services
frontend/
  src/
    api/          # REST API clients
    components/   # Reusable UI components
    pages/        # Feature screens (dashboard, accounts, balances, FX)
    hooks/        # Client-side auth bootstrap
    theme/        # Global styling tokens
```

Refer to the requirements document for the full product scope and future roadmap.
