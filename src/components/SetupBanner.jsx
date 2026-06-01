import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function SetupBanner() {
  const [ready, setReady] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/ready').then(r => r.json()).then(d => setReady(d.ready)).catch(() => setReady(false));
  }, []);

  if (ready !== false || dismissed) return null;

  return (
    <div className="setup-banner">
      <AlertTriangle size={14} color="var(--gold)" style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>
        <strong style={{ color: 'var(--gold)' }}>Setup required:</strong>{' '}
        Add <code style={{ background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4, fontSize: 11.5 }}>ANTHROPIC_API_KEY=sk-ant-…</code>{' '}
        to the <code style={{ background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4, fontSize: 11.5 }}>.env</code>{' '}
        file then restart the server. Get a key at{' '}
        <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">console.anthropic.com</a>
      </span>
      <button className="btn btn-ghost" style={{ padding: '3px 7px' }} onClick={() => setDismissed(true)}>
        <X size={13} />
      </button>
    </div>
  );
}
