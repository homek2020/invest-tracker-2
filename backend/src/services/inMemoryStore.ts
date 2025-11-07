import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import type { Account, CreateAccountInput, UpdateAccountInput } from '../domain/accounts/account.js';
import type { Balance, BulkBalanceUpdateItem } from '../domain/balances/balance.js';
import type { FxRate } from '../domain/fx/rate.js';
import type { User } from '../domain/users/user.js';
import { clampTwoDecimals, difference, sum } from '../utils/money.js';

export interface InMemoryStore {
  users: Map<string, User>;
  accounts: Map<string, Account>;
  balances: Map<string, Balance>;
  fxRates: Map<string, FxRate>;
}

export function createStore(): InMemoryStore {
  return {
    users: new Map(),
    accounts: new Map(),
    balances: new Map(),
    fxRates: new Map(),
  };
}

export class StoreService {
  constructor(private readonly store: InMemoryStore) {}

  seedUser(email: string): User {
    const existing = Array.from(this.store.users.values()).find((user) => user.email === email);
    if (existing) {
      return existing;
    }
    const now = new Date().toISOString();
    const user: User = {
      id: nanoid(),
      email,
      createdAt: now,
      profile: { baseCurrency: 'USD', locale: 'en' },
      status: 'ACTIVE',
    };
    this.store.users.set(user.id, user);
    return user;
  }

  upsertFxRate(rate: FxRate): FxRate {
    this.store.fxRates.set(rate.date, rate);
    return rate;
  }

  listFxRates(from?: string, to?: string): FxRate[] {
    const rates = Array.from(this.store.fxRates.values());
    if (!from && !to) {
      return rates.sort((a, b) => a.date.localeCompare(b.date));
    }
    const start = from ? dayjs(from) : null;
    const end = to ? dayjs(to) : null;
    return rates
      .filter((rate) => {
        const date = dayjs(rate.date);
        if (start && date.isBefore(start)) {
          return false;
        }
        if (end && date.isAfter(end)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  getFxRate(date: string): FxRate | undefined {
    return this.store.fxRates.get(date);
  }

  createAccount(userId: string, input: CreateAccountInput): Account {
    const now = new Date().toISOString();
    const account: Account = {
      id: nanoid(),
      userId,
      createdAt: now,
      updatedAt: now,
      active: input.active ?? true,
      baseCurrency: input.baseCurrency,
      name: input.name,
      provider: input.provider,
      note: input.note,
    };
    this.store.accounts.set(account.id, account);
    return account;
  }

  updateAccount(userId: string, accountId: string, input: UpdateAccountInput): Account {
    const account = this.getAccount(userId, accountId);
    const updated: Account = {
      ...account,
      ...input,
      updatedAt: new Date().toISOString(),
    };
    this.store.accounts.set(accountId, updated);
    return updated;
  }

  deleteAccount(userId: string, accountId: string): void {
    const account = this.getAccount(userId, accountId);
    const hasBalances = Array.from(this.store.balances.values()).some(
      (balance) => balance.accountId === account.id,
    );
    if (hasBalances) {
      throw new Error('Cannot delete account with balances');
    }
    this.store.accounts.delete(account.id);
  }

  getAccount(userId: string, accountId: string): Account {
    const account = this.store.accounts.get(accountId);
    if (!account || account.userId !== userId) {
      throw new Error('Account not found');
    }
    return account;
  }

  listAccounts(userId: string): Account[] {
    return Array.from(this.store.accounts.values()).filter((account) => account.userId === userId);
  }

  getBalanceKey(accountId: string, year: number, month: number): string {
    return `${accountId}:${year}-${month}`;
  }

  computeDifference(opening: string, closing: string): string {
    return clampTwoDecimals(difference(closing, opening)).toString();
  }

  ensureMonthlyBalance(
    userId: string,
    accountId: string,
    year: number,
    month: number,
    opening: string,
  ): Balance {
    const key = this.getBalanceKey(accountId, year, month);
    const existing = this.store.balances.get(key);
    if (existing) {
      return existing;
    }
    const createdAt = new Date().toISOString();
    const account = this.getAccount(userId, accountId);
    const differenceValue = '0';
    const balance: Balance = {
      id: nanoid(),
      userId,
      accountId,
      year,
      month,
      status: 'OPEN',
      opening,
      inflow: '0',
      outflow: '0',
      closing: opening,
      difference: differenceValue,
      usdEquivalent: opening,
      createdAt,
      updatedAt: createdAt,
      provider: account.provider,
      currency: account.baseCurrency,
    };
    this.store.balances.set(key, balance);
    return balance;
  }

  updateBalanceValues(balance: Balance, input: Partial<BulkBalanceUpdateItem>): Balance {
    const inflow = clampTwoDecimals(input.inflow ?? balance.inflow).toString();
    const outflow = clampTwoDecimals(input.outflow ?? balance.outflow).toString();
    const closing = clampTwoDecimals(input.closing ?? balance.closing).toString();
    const differenceValue = this.computeDifference(balance.opening, closing);
    const updated: Balance = {
      ...balance,
      inflow,
      outflow,
      closing,
      difference: differenceValue,
      usdEquivalent: closing,
      updatedAt: new Date().toISOString(),
    };
    this.store.balances.set(this.getBalanceKey(balance.accountId, balance.year, balance.month), updated);
    return updated;
  }

  listBalances(userId: string, year: number, month: number): Balance[] {
    return Array.from(this.store.balances.values()).filter(
      (balance) => balance.userId === userId && balance.year === year && balance.month === month,
    );
  }

  listBalanceSeries(userId: string, from: string, to: string): Balance[] {
    const [fromYear, fromMonth] = from.split('-').map((part) => Number.parseInt(part, 10));
    const [toYear, toMonth] = to.split('-').map((part) => Number.parseInt(part, 10));
    const fromDate = dayjs(`${fromYear}-${String(fromMonth).padStart(2, '0')}-01`);
    const toDate = dayjs(`${toYear}-${String(toMonth).padStart(2, '0')}-01`);
    return Array.from(this.store.balances.values())
      .filter((balance) => {
        if (balance.userId !== userId) {
          return false;
        }
        const balanceDate = dayjs(`${balance.year}-${String(balance.month).padStart(2, '0')}-01`);
        return balanceDate.isSame(fromDate) ||
          balanceDate.isSame(toDate) ||
          (balanceDate.isAfter(fromDate) && balanceDate.isBefore(toDate));
      })
      .sort((a, b) => {
        if (a.year === b.year) {
          return a.month - b.month;
        }
        return a.year - b.year;
      });
  }

  getBalance(userId: string, balanceId: string): Balance {
    const balance = Array.from(this.store.balances.values()).find(
      (item) => item.id === balanceId && item.userId === userId,
    );
    if (!balance) {
      throw new Error('Balance not found');
    }
    return balance;
  }

  updateBulkBalances(userId: string, year: number, month: number, payload: BulkBalanceUpdateItem[]): Balance[] {
    const updatedBalances: Balance[] = [];
    for (const item of payload) {
      const account = this.getAccount(userId, item.accountId);
      const key = this.getBalanceKey(item.accountId, year, month);
      const existing = this.store.balances.get(key);
      const opening = existing?.opening ?? '0';
      const balance =
        existing ?? this.ensureMonthlyBalance(userId, account.id, year, month, opening);
      if (balance.status === 'CLOSED') {
        throw new Error('Cannot update closed month');
      }
      const updated = this.updateBalanceValues(balance, item);
      updated.currency = account.baseCurrency;
      updated.provider = account.provider;
      updatedBalances.push(updated);
    }
    return updatedBalances;
  }

  closeBalance(userId: string, balanceId: string): Balance {
    const balance = this.getBalance(userId, balanceId);
    if (balance.status === 'CLOSED') {
      return balance;
    }
    const updated: Balance = {
      ...balance,
      status: 'CLOSED',
      updatedAt: new Date().toISOString(),
    };
    this.store.balances.set(this.getBalanceKey(balance.accountId, balance.year, balance.month), updated);

    const nextMonthDate = dayjs(`${balance.year}-${String(balance.month).padStart(2, '0')}-01`).add(1, 'month');
    const nextYear = nextMonthDate.year();
    const nextMonth = nextMonthDate.month() + 1;
    const nextKey = this.getBalanceKey(balance.accountId, nextYear, nextMonth);
    if (!this.store.balances.has(nextKey)) {
      this.ensureMonthlyBalance(userId, balance.accountId, nextYear, nextMonth, balance.closing);
    }

    return updated;
  }

  reopenBalance(userId: string, balanceId: string): Balance {
    const balance = this.getBalance(userId, balanceId);
    if (balance.status !== 'CLOSED') {
      return balance;
    }
    const updated: Balance = {
      ...balance,
      status: 'OPEN',
      updatedAt: new Date().toISOString(),
    };
    this.store.balances.set(this.getBalanceKey(balance.accountId, balance.year, balance.month), updated);
    return updated;
  }

  computeMonthlyDashboard(userId: string, year: number, month: number) {
    const balances = this.listBalances(userId, year, month);
    const totalClosing = sum(balances.map((balance) => balance.closing));
    const accounts = balances.length;
    return {
      totalClosing: totalClosing.toFixed(2),
      accounts,
    };
  }
}
