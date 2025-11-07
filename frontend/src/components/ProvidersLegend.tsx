const providers = [
  { code: 'FINAM', name: 'Finam' },
  { code: 'TRADEREPUBLIC', name: 'Trade Republic' },
  { code: 'BYBIT', name: 'Bybit' },
  { code: 'BCS', name: 'BCS' },
  { code: 'IBKR', name: 'Interactive Brokers' },
];

export function ProvidersLegend() {
  return (
    <div className="card" style={{ padding: '1rem' }}>
      <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Providers</strong>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.35rem' }}>
        {providers.map((provider) => (
          <li key={provider.code} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{provider.name}</span>
            <span className="badge">{provider.code}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
