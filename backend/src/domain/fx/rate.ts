import type { CurrencyCode } from '../users/user.js';

export interface FxRate {
  id: string;
  date: string;
  base: CurrencyCode;
  rates: Record<CurrencyCode, string> & Record<string, string>;
  source: 'CBR_T+1';
  fetchedAt: string;
}

export interface FxConversionRequest {
  date: string;
  amount: string;
  from: CurrencyCode;
}
