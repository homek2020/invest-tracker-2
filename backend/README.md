# Invest Tracker API

A minimal Express + MongoDB backend that powers the Invest Tracker applications. The service focuses on the essential flows—auth, accounts, balances, FX rates, and dashboard summaries—without any caching or queueing layers.

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB 6.0+

## Environment variables

Create a `.env` file inside `backend/` (or export the variables in your shell) with the following keys:

```bash
MONGO_URI="mongodb://127.0.0.1:27017/invest_tracker"
MONGO_DB="invest_tracker"
JWT_SECRET="super-secret-value"
PORT=4000
```

The defaults match a local MongoDB instance. Override them to target a remote database or adjust the port.

## Install dependencies

```bash
npm install
```

## Running the server in development

```bash
npm run dev
```

The command starts the API with `ts-node-dev`, recompiling TypeScript files on change. When the server boots it establishes a MongoDB connection, creates the required indexes, and listens on the configured port.

## Building for production

```bash
npm run build
npm run start
```

`npm run build` compiles the TypeScript sources to CommonJS output in `dist/`. `npm run start` launches the compiled JavaScript server.

## API overview

All endpoints live under the `/api/v1` prefix and require a bearer token issued by `POST /api/v1/auth/login`.

- `POST /api/v1/auth/login` — minimal email-based login that creates the user if it does not exist and returns a JWT.
- `GET /api/v1/accounts` — list accounts for the authenticated user.
- `POST /api/v1/accounts` — create an account.
- `PATCH /api/v1/accounts/:id` — update basic account fields.
- `DELETE /api/v1/accounts/:id` — remove an account that has no balances.
- `GET /api/v1/balances` — fetch balances, optionally filtered by year and month.
- `POST /api/v1/balances/bulk` — create or update balances for a month across accounts in a single call.
- `POST /api/v1/balances/:id/close` — close a month and automatically open the next one with the carried opening balance.
- `POST /api/v1/balances/:id/reopen` — reopen a previously closed month.
- `GET /api/v1/balances/series` — retrieve chronological balance data for charting.
- `GET /api/v1/fx/rates` — fetch the most recent FX rates (or for a specific date).
- `GET /api/v1/fx/history` — list FX rates across a date range.
- `POST /api/v1/fx/update` — store FX rates for a date.
- `GET /api/v1/fx/usd-view` — convert an amount from another currency to USD using the latest stored rate.
- `GET /api/v1/dashboard/summary` — aggregate closing balances and differences for the requested period.

The Mongo collections use Decimal128 for monetary values and are created on demand; no additional setup scripts are required for the first version.
