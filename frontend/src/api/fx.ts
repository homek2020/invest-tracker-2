import { api } from './client';

export interface FxRate {
  id: string;
  date: string;
  base: string;
  rates: Record<string, string>;
  fetchedAt: string;
}

export async function listFxRates(from?: string, to?: string): Promise<FxRate[]> {
  const response = await api.get<FxRate[]>('/fx/rates', { params: { from, to } });
  return response.data as FxRate[];
}

export async function convertToUsd(date: string, amount: string, from: string) {
  const response = await api.get<{ usd: string }>('/fx/usd-view', { params: { date, amount, from } });
  return response.data;
}
