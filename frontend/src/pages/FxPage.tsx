import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Card } from '../components/Card';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { convertToUsd, listFxRates } from '../api/fx';

export default function FxPage() {
  const today = dayjs().format('YYYY-MM-DD');
  const [filters, setFilters] = useState({ from: dayjs().subtract(7, 'day').format('YYYY-MM-DD'), to: today });
  const [conversion, setConversion] = useState<{ usd: string } | null>(null);

  const ratesQuery = useQuery({
    queryKey: ['fx', filters],
    queryFn: () => listFxRates(filters.from, filters.to),
  });

  return (
    <div className="card-grid">
      <Card
        title="FX Rates"
        description="Browse USD rates fetched from the Central Bank of Russia"
        action={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="date"
              value={filters.from}
              onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
            />
            <input
              type="date"
              value={filters.to}
              onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
            />
          </div>
        }
      >
        {ratesQuery.isLoading ? (
          <LoadingOverlay message="Loading FX" />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>USD/RUB</th>
                <th>USD/EUR</th>
                <th>USD/GBP</th>
              </tr>
            </thead>
            <tbody>
              {ratesQuery.data?.map((rate) => (
                <tr key={rate.date} className="table-row">
                  <td>{rate.date}</td>
                  <td>{rate.rates.RUB ?? '—'}</td>
                  <td>{rate.rates.EUR ?? '—'}</td>
                  <td>{rate.rates.GBP ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <Card title="USD Converter" description="Convert foreign currency balances to USD">
        <form
          style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const date = (form.get('date') as string) ?? today;
            const amount = (form.get('amount') as string) ?? '0';
            const currency = (form.get('currency') as string) ?? 'EUR';
            const response = await convertToUsd(date, amount, currency);
            setConversion(response);
          }}
        >
          <div className="field">
            <label htmlFor="date">Date</label>
            <input type="date" name="date" defaultValue={today} />
          </div>
          <div className="field">
            <label htmlFor="amount">Amount</label>
            <input type="number" step="0.01" name="amount" defaultValue="100" />
          </div>
          <div className="field">
            <label htmlFor="currency">Currency</label>
            <select name="currency" defaultValue="EUR">
              <option value="EUR">EUR</option>
              <option value="RUB">RUB</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <button className="button-primary" type="submit">
            Convert
          </button>
        </form>
        {conversion ? (
          <p style={{ marginTop: '1rem' }}>
            Converted amount: <strong>${conversion.usd}</strong>
          </p>
        ) : null}
      </Card>
    </div>
  );
}
