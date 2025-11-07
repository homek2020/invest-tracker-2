# Invest Tracker API

This package hosts the Fastify-based API server. It relies on MongoDB for persistence and exposes CLI helpers to create the collections and indexes expected by the application domain.

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB 6.0+

## Environment variables

Configure the MongoDB connection details before running any scripts:

```bash
export MONGO_URI="mongodb://127.0.0.1:27017"
export MONGO_DB_NAME="invest_tracker"
```

You can place these variables in an `.env` file and load them with a tool such as [`direnv`](https://direnv.net/) or your shell profile.

## MongoDB bootstrap scripts

All database setup utilities live in [`backend/scripts`](scripts/). Two npm commands wrap them for convenience:

```bash
npm run db:create-collections   # creates the MongoDB collections used by the API
npm run db:create-indexes       # applies indexes for query performance and uniqueness rules
```

Run both commands once after provisioning a MongoDB instance. They are idempotent, so executing them repeatedly is safe.

## Install dependencies

```bash
npm install
```

## Development server

Start the API with hot reloading via [`tsx`](https://github.com/privatenumber/tsx):

```bash
npm run dev
```

The server listens on <http://localhost:3000> by default. Ensure the MongoDB environment variables are available so the application can connect on boot.

## Production build

```bash
npm run build
npm run start
```

The build step emits the compiled JavaScript into `dist/` and `npm run start` launches the compiled server.
