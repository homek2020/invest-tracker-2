import type { CurrencyCode } from '../users/user';

export type FxRateMap = Partial<Record<CurrencyCode, string>> & Record<string, string>;

export interface FxRate {
  id: string;
  date: string;
  base: CurrencyCode;
  rates: FxRateMap;
  source: 'CBR_T+1';
  fetchedAt: string;
}

export interface FxConversionRequest {
  date: string;
  amount: string;
  from: CurrencyCode;
}
