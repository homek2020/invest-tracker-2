#!/usr/bin/env node
import { MongoClient } from 'mongodb';

const mongoUri = process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGO_DB_NAME ?? 'invest_tracker';

async function createIndexes() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(dbName);

  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  console.log('Ensured unique index on users.email');

  await db.collection('accounts').createIndex({ userId: 1, provider: 1 });
  await db.collection('accounts').createIndex({ userId: 1, active: 1 });
  console.log('Ensured indexes on accounts collection');

  await db
    .collection('balances')
    .createIndex({ accountId: 1, year: 1, month: 1 }, { unique: true });
  await db.collection('balances').createIndex({ userId: 1, year: 1, month: 1 });
  console.log('Ensured indexes on balances collection');

  await db.collection('fx_rates').createIndex({ date: 1 }, { unique: true });
  console.log('Ensured unique index on fx_rates.date');

  await db.collection('login_logs').createIndex({ userId: 1, ts: -1 });
  await db.collection('login_logs').createIndex({ ts: -1 });
  console.log('Ensured indexes on login_logs collection');

  await client.close();
}

createIndexes().catch((error) => {
  console.error('Error creating indexes', error);
  process.exit(1);
});
