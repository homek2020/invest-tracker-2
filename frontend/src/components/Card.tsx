import { ReactNode } from 'react';

interface CardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
}

export function Card({ title, description, action, children }: CardProps) {
  return (
    <section className="card">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>{title}</h2>
          {description ? (
            <p style={{ color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>{description}</p>
          ) : null}
        </div>
        {action}
      </header>
      <div style={{ marginTop: '1.25rem' }}>{children}</div>
    </section>
  );
}
