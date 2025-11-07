#!/usr/bin/env node
import { MongoClient } from 'mongodb';

const mongoUri = process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGO_DB_NAME ?? 'invest_tracker';

async function ensureCollection(db, name) {
  const existing = await db.listCollections({ name }).next();
  if (existing) {
    console.log(`Collection "${name}" already exists`);
    return;
  }
  await db.createCollection(name);
  console.log(`Created collection "${name}"`);
}

async function main() {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(dbName);
  const collections = ['users', 'login_logs', 'accounts', 'balances', 'fx_rates'];
  for (const name of collections) {
    try {
      await ensureCollection(db, name);
    } catch (error) {
      console.error(`Failed to create collection ${name}`, error);
      throw error;
    }
  }
  await client.close();
}

main().catch((error) => {
  console.error('Error creating collections', error);
  process.exit(1);
});
