import { Decimal128, Db, MongoClient, type Collection } from 'mongodb';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';
import type { Account, CreateAccountInput, ProviderCode, UpdateAccountInput } from '../domain/accounts/account';
import type { Balance, BalanceStatus, BulkBalanceUpdateItem } from '../domain/balances/balance';
import type { FxRate } from '../domain/fx/rate';
import type { CurrencyCode, User } from '../domain/users/user';
import type { Environment } from '../config/environment';
import { clampTwoDecimals, difference, sum } from '../utils/money';

interface UserDocument {
  _id: string;
  email: string;
  createdAt: string;
  lastLoginAt?: string;
  profile: { baseCurrency: CurrencyCode; locale: string };
  status: 'ACTIVE' | 'INACTIVE';
}

interface AccountDocument {
  _id: string;
  userId: string;
  name: string;
  provider: ProviderCode;
  baseCurrency: CurrencyCode;
  active: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

interface BalanceDocument {
  _id: string;
  userId: string;
  accountId: string;
  year: number;
  month: number;
  status: BalanceStatus;
  opening: Decimal128;
  inflow: Decimal128;
  outflow: Decimal128;
  closing: Decimal128;
  difference: Decimal128;
  usdEquivalent: Decimal128;
  note?: string;
  createdAt: string;
  updatedAt: string;
  provider?: ProviderCode;
  currency?: CurrencyCode;
}

interface FxRateDocument {
  _id: string;
  date: string;
  base: CurrencyCode;
  rates: Record<string, string>;
  source: 'CBR_T+1';
  fetchedAt: string;
}

export interface MongoCollections {
  users: Collection<UserDocument>;
  accounts: Collection<AccountDocument>;
  balances: Collection<BalanceDocument>;
  fxRates: Collection<FxRateDocument>;
}

export async function connectToDatabase(env: Environment): Promise<{ client: MongoClient; db: Db; collections: MongoCollections }> {
  const client = new MongoClient(env.mongoUri);
  await client.connect();
  const db = client.db(env.mongoDbName);
  const collections: MongoCollections = {
    users: db.collection<UserDocument>('users'),
    accounts: db.collection<AccountDocument>('accounts'),
    balances: db.collection<BalanceDocument>('balances'),
    fxRates: db.collection<FxRateDocument>('fx_rates'),
  };
  return { client, db, collections };
}

function decimalFromString(value: string): Decimal128 {
  return Decimal128.fromString(clampTwoDecimals(value).toString());
}

function decimalToString(value: Decimal128 | null | undefined): string {
  if (!value) {
    return '0.00';
  }
  return clampTwoDecimals(value.toString()).toString();
}

function buildBalanceId(): string {
  return nanoid();
}

export class MongoStoreService {
  constructor(private readonly collections: MongoCollections) {}

  private get users(): Collection<UserDocument> {
    return this.collections.users;
  }

  private get accounts(): Collection<AccountDocument> {
    return this.collections.accounts;
  }

  private get balances(): Collection<BalanceDocument> {
    return this.collections.balances;
  }

  private get fxRates(): Collection<FxRateDocument> {
    return this.collections.fxRates;
  }

  private mapUser(doc: UserDocument): User {
    return {
      id: doc._id,
      email: doc.email,
      createdAt: doc.createdAt,
      lastLoginAt: doc.lastLoginAt,
      profile: doc.profile,
      status: doc.status,
    };
  }

  private mapAccount(doc: AccountDocument): Account {
    return {
      id: doc._id,
      userId: doc.userId,
      name: doc.name,
      provider: doc.provider,
      baseCurrency: doc.baseCurrency,
      active: doc.active,
      note: doc.note,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  private mapBalance(doc: BalanceDocument): Balance {
    return {
      id: doc._id,
      userId: doc.userId,
      accountId: doc.accountId,
      year: doc.year,
      month: doc.month,
      status: doc.status,
      opening: decimalToString(doc.opening),
      inflow: decimalToString(doc.inflow),
      outflow: decimalToString(doc.outflow),
      closing: decimalToString(doc.closing),
      difference: decimalToString(doc.difference),
      usdEquivalent: decimalToString(doc.usdEquivalent),
      note: doc.note,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      provider: doc.provider,
      currency: doc.currency,
    };
  }

  private mapFxRate(doc: FxRateDocument): FxRate {
    return {
      id: doc._id,
      date: doc.date,
      base: doc.base,
      rates: doc.rates,
      source: doc.source,
      fetchedAt: doc.fetchedAt,
    };
  }

  async seedUser(email: string): Promise<User> {
    const now = new Date().toISOString();
    const existing = await this.users.findOneAndUpdate(
      { email },
      { $set: { lastLoginAt: now }, $setOnInsert: {
        _id: nanoid(),
        email,
        createdAt: now,
        profile: { baseCurrency: 'USD', locale: 'en' },
        status: 'ACTIVE',
      } },
      { upsert: true, returnDocument: 'after' },
    );

    if (!existing.value) {
      const created = await this.users.findOne({ email });
      if (!created) {
        throw new Error('Failed to create user');
      }
      return this.mapUser(created);
    }

    return this.mapUser(existing.value);
  }

  async upsertFxRate(rate: FxRate): Promise<FxRate> {
    const doc: FxRateDocument = {
      _id: rate.id,
      date: rate.date,
      base: rate.base,
      rates: rate.rates,
      source: rate.source,
      fetchedAt: rate.fetchedAt,
    };
    await this.fxRates.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true });
    const stored = await this.fxRates.findOne({ _id: doc._id });
    if (!stored) {
      throw new Error('Failed to upsert FX rate');
    }
    return this.mapFxRate(stored);
  }

  async listFxRates(from?: string, to?: string): Promise<FxRate[]> {
    const filter: Record<string, unknown> = {};
    if (from && to) {
      filter.date = { $gte: from, $lte: to };
    } else if (from) {
      filter.date = { $gte: from };
    } else if (to) {
      filter.date = { $lte: to };
    }
    const docs = await this.fxRates.find(filter).sort({ date: 1 }).toArray();
    return docs.map((doc) => this.mapFxRate(doc));
  }

  async getFxRate(date: string): Promise<FxRate | null> {
    const doc = await this.fxRates.findOne({ date });
    return doc ? this.mapFxRate(doc) : null;
  }

  async createAccount(userId: string, input: CreateAccountInput): Promise<Account> {
    const now = new Date().toISOString();
    const doc: AccountDocument = {
      _id: nanoid(),
      userId,
      name: input.name,
      provider: input.provider,
      baseCurrency: input.baseCurrency,
      active: input.active ?? true,
      note: input.note,
      createdAt: now,
      updatedAt: now,
    };
    await this.accounts.insertOne(doc);
    return this.mapAccount(doc);
  }

  async updateAccount(userId: string, accountId: string, input: UpdateAccountInput): Promise<Account> {
    const now = new Date().toISOString();
    const update: Partial<AccountDocument> = { ...input, updatedAt: now } as Partial<AccountDocument>;
    const result = await this.accounts.findOneAndUpdate(
      { _id: accountId, userId },
      { $set: update },
      { returnDocument: 'after' },
    );
    if (!result.value) {
      throw new Error('Account not found');
    }
    return this.mapAccount(result.value);
  }

  async deleteAccount(userId: string, accountId: string): Promise<void> {
    const account = await this.accounts.findOne({ _id: accountId, userId });
    if (!account) {
      throw new Error('Account not found');
    }
    const balanceCount = await this.balances.countDocuments({ accountId: account._id });
    if (balanceCount > 0) {
      throw new Error('Cannot delete account with balances');
    }
    await this.accounts.deleteOne({ _id: account._id, userId });
  }

  async getAccount(userId: string, accountId: string): Promise<AccountDocument> {
    const account = await this.accounts.findOne({ _id: accountId, userId });
    if (!account) {
      throw new Error('Account not found');
    }
    return account;
  }

  async listAccounts(userId: string): Promise<Account[]> {
    const docs = await this.accounts.find({ userId }).sort({ createdAt: 1 }).toArray();
    return docs.map((doc) => this.mapAccount(doc));
  }

  private async ensureMonthlyBalance(
    userId: string,
    account: AccountDocument,
    year: number,
    month: number,
    opening: string,
  ): Promise<BalanceDocument> {
    const existing = await this.balances.findOne({ userId, accountId: account._id, year, month });
    if (existing) {
      return existing;
    }
    const now = new Date().toISOString();
    const balance: BalanceDocument = {
      _id: buildBalanceId(),
      userId,
      accountId: account._id,
      year,
      month,
      status: 'OPEN',
      opening: decimalFromString(opening),
      inflow: decimalFromString('0'),
      outflow: decimalFromString('0'),
      closing: decimalFromString(opening),
      difference: decimalFromString('0'),
      usdEquivalent: decimalFromString(opening),
      createdAt: now,
      updatedAt: now,
      provider: account.provider,
      currency: account.baseCurrency,
    };
    await this.balances.insertOne(balance);
    return balance;
  }

  private async updateBalanceValues(
    balance: BalanceDocument,
    input: Partial<BulkBalanceUpdateItem>,
    account: AccountDocument,
  ): Promise<BalanceDocument> {
    const inflowStr = clampTwoDecimals(input.inflow ?? decimalToString(balance.inflow)).toString();
    const outflowStr = clampTwoDecimals(input.outflow ?? decimalToString(balance.outflow)).toString();
    const closingStr = clampTwoDecimals(input.closing ?? decimalToString(balance.closing)).toString();
    const openingStr = decimalToString(balance.opening);
    const differenceStr = clampTwoDecimals(difference(closingStr, openingStr)).toString();
    const now = new Date().toISOString();
    const update = {
      inflow: decimalFromString(inflowStr),
      outflow: decimalFromString(outflowStr),
      closing: decimalFromString(closingStr),
      difference: decimalFromString(differenceStr),
      usdEquivalent: decimalFromString(closingStr),
      updatedAt: now,
      provider: account.provider,
      currency: account.baseCurrency,
    } satisfies Partial<BalanceDocument>;

    const result = await this.balances.findOneAndUpdate(
      { _id: balance._id, userId: balance.userId },
      { $set: update },
      { returnDocument: 'after' },
    );

    if (!result.value) {
      throw new Error('Failed to update balance');
    }

    return result.value;
  }

  async listBalances(userId: string, year: number, month: number): Promise<Balance[]> {
    const docs = await this.balances
      .find({ userId, year, month })
      .sort({ createdAt: 1 })
      .toArray();
    return docs.map((doc) => this.mapBalance(doc));
  }

  async listBalanceSeries(userId: string, from: string, to: string): Promise<Balance[]> {
    const [fromYear, fromMonth] = from.split('-').map((part) => Number.parseInt(part, 10));
    const [toYear, toMonth] = to.split('-').map((part) => Number.parseInt(part, 10));
    const docs = await this.balances.find({ userId }).toArray();
    const filtered = docs.filter((doc) => {
      const docKey = doc.year * 100 + doc.month;
      const startKey = fromYear * 100 + fromMonth;
      const endKey = toYear * 100 + toMonth;
      return docKey >= startKey && docKey <= endKey;
    });
    filtered.sort((a, b) => {
      if (a.year === b.year) {
        return a.month - b.month;
      }
      return a.year - b.year;
    });
    return filtered.map((doc) => this.mapBalance(doc));
  }

  async updateBulkBalances(
    userId: string,
    year: number,
    month: number,
    payload: BulkBalanceUpdateItem[],
  ): Promise<Balance[]> {
    const updatedBalances: Balance[] = [];
    for (const item of payload) {
      const account = await this.getAccount(userId, item.accountId);
      const existing = await this.balances.findOne({ userId, accountId: account._id, year, month });
      if (existing && existing.status === 'CLOSED') {
        throw new Error('Cannot update closed month');
      }
      const baseBalance = existing ?? (await this.ensureMonthlyBalance(userId, account, year, month, existing ? decimalToString(existing.opening) : '0'));
      const updatedDoc = await this.updateBalanceValues(baseBalance, item, account);
      updatedBalances.push(this.mapBalance(updatedDoc));
    }
    return updatedBalances;
  }

  async getBalance(userId: string, balanceId: string): Promise<BalanceDocument> {
    const balance = await this.balances.findOne({ _id: balanceId, userId });
    if (!balance) {
      throw new Error('Balance not found');
    }
    return balance;
  }

  async closeBalance(userId: string, balanceId: string): Promise<Balance> {
    const current = await this.getBalance(userId, balanceId);
    if (current.status === 'CLOSED') {
      return this.mapBalance(current);
    }
    const now = new Date().toISOString();
    const result = await this.balances.findOneAndUpdate(
      { _id: balanceId, userId },
      { $set: { status: 'CLOSED', updatedAt: now } },
      { returnDocument: 'after' },
    );
    if (!result.value) {
      throw new Error('Balance not found');
    }
    const account = await this.getAccount(userId, result.value.accountId);
    const currentMonth = dayjs(`${result.value.year}-${String(result.value.month).padStart(2, '0')}-01`);
    const next = currentMonth.add(1, 'month');
    const nextYear = next.year();
    const nextMonth = next.month() + 1;
    const existingNext = await this.balances.findOne({ userId, accountId: account._id, year: nextYear, month: nextMonth });
    if (!existingNext) {
      await this.ensureMonthlyBalance(
        userId,
        account,
        nextYear,
        nextMonth,
        decimalToString(result.value.closing),
      );
    }
    return this.mapBalance(result.value);
  }

  async reopenBalance(userId: string, balanceId: string): Promise<Balance> {
    const current = await this.getBalance(userId, balanceId);
    if (current.status !== 'CLOSED') {
      return this.mapBalance(current);
    }
    const now = new Date().toISOString();
    const result = await this.balances.findOneAndUpdate(
      { _id: balanceId, userId },
      { $set: { status: 'OPEN', updatedAt: now } },
      { returnDocument: 'after' },
    );
    if (!result.value) {
      throw new Error('Balance not found');
    }
    return this.mapBalance(result.value);
  }

  async computeMonthlyDashboard(userId: string, year: number, month: number): Promise<{ totalClosing: string; accounts: number }> {
    const balances = await this.balances.find({ userId, year, month }).toArray();
    const totalClosing = sum(balances.map((balance) => decimalToString(balance.closing)));
    return {
      totalClosing: totalClosing.toFixed(2),
      accounts: balances.length,
    };
  }
}
