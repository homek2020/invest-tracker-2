import type { CurrencyCode } from '../users/user.js';
import type { ProviderCode } from '../accounts/account.js';

export type BalanceStatus = 'OPEN' | 'CLOSED';

export interface Balance {
  id: string;
  userId: string;
  accountId: string;
  year: number;
  month: number;
  status: BalanceStatus;
  opening: string;
  inflow: string;
  outflow: string;
  closing: string;
  difference: string;
  usdEquivalent: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  provider?: ProviderCode;
  currency?: CurrencyCode;
}

export interface BalanceAuditEntry {
  timestamp: string;
  userId: string;
  action: 'UPDATE' | 'CLOSE' | 'REOPEN';
  before?: Partial<Balance>;
  after?: Partial<Balance>;
}

export interface BulkBalanceUpdateItem {
  accountId: string;
  inflow: string;
  outflow: string;
  closing: string;
}

export interface BalanceSeriesQuery {
  from: string;
  to: string;
}
