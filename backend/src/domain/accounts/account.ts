import type { CurrencyCode } from '../users/user.js';

export type ProviderCode = 'FINAM' | 'TRADEREPUBLIC' | 'BYBIT' | 'BCS' | 'IBKR';

export interface Account {
  id: string;
  userId: string;
  name: string;
  provider: ProviderCode;
  baseCurrency: CurrencyCode;
  active: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountInput {
  name: string;
  provider: ProviderCode;
  baseCurrency: CurrencyCode;
  active?: boolean;
  note?: string;
}

export interface UpdateAccountInput {
  name?: string;
  provider?: ProviderCode;
  baseCurrency?: CurrencyCode;
  active?: boolean;
  note?: string;
}
