# Invest Tracker 2

Invest Tracker helps long-term investors monitor monthly performance across multiple brokerage providers. The project contains a Fastify-based API server and a Vite/React client that implement the workflows described in the [product requirements](docs/product_requirements.md).

## Getting started

The repository is organised as a two-service workspace:

| Service   | Path      | Description |
|-----------|-----------|-------------|
| API       | `backend` | Fastify server with in-memory persistence that mimics the target Mongo/Redis architecture. |
| Web       | `frontend`| React single-page application built with Vite, React Query and Zustand. |

### Prerequisites

* Node.js 18+
* npm 9+

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

The API listens on <http://localhost:3000> and exposes the `/api/v1` routes from the requirements document. The implementation ships with an in-memory data store to simplify local evaluation; swap the repositories with MongoDB adapters for production use.

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
    services/     # Auth + in-memory persistence services
frontend/
  src/
    api/          # REST API clients
    components/   # Reusable UI components
    pages/        # Feature screens (dashboard, accounts, balances, FX)
    hooks/        # Client-side auth bootstrap
    theme/        # Global styling tokens
```

Refer to the requirements document for the full product scope and future roadmap.
