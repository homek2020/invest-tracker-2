import { Collection, Db, Decimal128, MongoClient, ObjectId } from 'mongodb';

type CollectionName = 'users' | 'accounts' | 'balances' | 'fx_rates' | 'login_logs';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (db) {
    return db;
  }

  const uri = process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/invest_tracker';
  client = new MongoClient(uri);
  await client.connect();

  const dbName = process.env.MONGO_DB ?? (client.options.dbName ?? 'invest_tracker');
  db = client.db(dbName);

  await ensureIndexes(db);
  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Mongo has not been initialised yet');
  }
  return db;
}

export function getCollection<TSchema>(name: CollectionName): Collection<TSchema> {
  return getDb().collection<TSchema>(name);
}

export function toObjectId(id: string): ObjectId {
  return new ObjectId(id);
}

export function toDecimal(value: number | string): Decimal128 {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return Decimal128.fromString('0');
  }
  return Decimal128.fromString(numericValue.toFixed(2));
}

export function decimalToNumber(value: Decimal128): number {
  return Number.parseFloat(value.toString());
}

async function ensureIndexes(database: Db) {
  await database.collection('users').createIndex({ email: 1 }, { unique: true });
  await database.collection('accounts').createIndex({ userId: 1 });
  await database
    .collection('balances')
    .createIndex({ userId: 1, accountId: 1, year: 1, month: 1 }, { unique: true });
  await database.collection('fx_rates').createIndex({ date: 1 }, { unique: true });
}
