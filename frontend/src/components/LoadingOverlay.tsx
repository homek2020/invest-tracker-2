interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading' }: LoadingOverlayProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span className="badge">⏳</span>
      <span>{message}...</span>
    </div>
  );
}
