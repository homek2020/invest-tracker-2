import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card } from '../components/Card';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { createAccount, deleteAccount, listAccounts, type Account } from '../api/accounts';

const providerOptions = ['FINAM', 'TRADEREPUBLIC', 'BYBIT', 'BCS', 'IBKR'];
const currencyOptions = ['USD', 'EUR', 'RUB', 'GBP'];

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState<Partial<Account>>({ provider: 'FINAM', baseCurrency: 'USD', active: true });
  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: listAccounts });

  const createMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setFormState({ provider: 'FINAM', baseCurrency: 'USD', active: true });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  });

  return (
    <Card
      title="Accounts"
      description="Manage investment accounts and providers"
      action={
        <button
          className="button-primary"
          onClick={() => createMutation.mutate(formState)}
          disabled={!formState.name || !formState.provider || !formState.baseCurrency}
        >
          Create account
        </button>
      }
    >
      <div className="form-grid">
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" value={formState.name ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))} />
        </div>
        <div className="field">
          <label htmlFor="provider">Provider</label>
          <select
            id="provider"
            value={formState.provider as string}
            onChange={(event) => setFormState((prev) => ({ ...prev, provider: event.target.value }))}
          >
            {providerOptions.map((provider) => (
              <option key={provider}>{provider}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="currency">Base Currency</label>
          <select
            id="currency"
            value={formState.baseCurrency as string}
            onChange={(event) => setFormState((prev) => ({ ...prev, baseCurrency: event.target.value }))}
          >
            {currencyOptions.map((currency) => (
              <option key={currency}>{currency}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="note">Note</label>
          <input id="note" value={formState.note ?? ''} onChange={(event) => setFormState((prev) => ({ ...prev, note: event.target.value }))} />
        </div>
      </div>
      <div style={{ marginTop: '2rem' }}>
        {accountsQuery.isLoading ? (
          <LoadingOverlay message="Loading accounts" />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Provider</th>
                <th>Currency</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accountsQuery.data?.map((account) => (
                <tr key={account.id} className="table-row">
                  <td>{account.name}</td>
                  <td>{account.provider}</td>
                  <td>{account.baseCurrency}</td>
                  <td>
                    <span className="badge">{account.active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td>
                    <button className="button-primary" style={{ padding: '0.35rem 0.75rem' }} onClick={() => deleteMutation.mutate(account.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}
