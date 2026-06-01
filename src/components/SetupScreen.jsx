import { useState } from 'react';
import { KeyRound, ExternalLink, CheckCircle, AlertTriangle, Loader, Eye, EyeOff, ChevronRight, Shield } from 'lucide-react';

const STEPS = [
  { n: 1, label: 'Get API Key', desc: 'Create a free account on Anthropic Console' },
  { n: 2, label: 'Add Credits', desc: 'Add $5–$10 to get started (lasts hundreds of queries)' },
  { n: 3, label: 'Paste Key', desc: 'Paste your key below — saved automatically' },
];

export default function SetupScreen({ onReady }) {
  const [key, setKey]           = useState('');
  const [show, setShow]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [warning, setWarning]   = useState('');
  const [success, setSuccess]   = useState(false);

  const valid = key.startsWith('sk-ant-') && key.length > 30;

  async function handleSubmit() {
    if (!valid) return;
    setLoading(true);
    setError('');
    setWarning('');
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Setup failed.');
      } else {
        setSuccess(true);
        if (data.warning) setWarning(data.warning);
        setTimeout(() => onReady(), 1800);
      }
    } catch (e) {
      setError('Could not connect to backend. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--blue) 0%, #1d4ed8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, boxShadow: '0 0 40px rgba(59,130,246,0.35)',
          }}>⚖</div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>
            NyayaAI
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 5 }}>
            Indian Legal Intelligence Platform
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', margin: '0 auto 4px',
                  background: s.n === 3 ? 'var(--blue-dim)' : 'var(--surface2)',
                  border: `1px solid ${s.n === 3 ? 'var(--blue)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  color: s.n === 3 ? 'var(--blue)' : 'var(--muted)',
                }}>
                  {s.n}
                </div>
                <div style={{ fontSize: 11, color: s.n === 3 ? 'var(--text2)' : 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {s.label}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 32, height: 1, background: 'var(--border)', flexShrink: 0, marginBottom: 14 }} />
              )}
            </div>
          ))}
        </div>

        {/* Main card */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <KeyRound size={20} color="var(--gold)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Enter your Anthropic API Key</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                Saved locally to your machine — never shared
              </div>
            </div>
          </div>

          {/* Key input */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <input
              className="input"
              type={show ? 'text' : 'password'}
              placeholder="sk-ant-api03-..."
              value={key}
              onChange={e => { setKey(e.target.value.trim()); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && valid && !loading && handleSubmit()}
              style={{ paddingRight: 44, fontFamily: 'monospace', fontSize: 13 }}
              autoFocus
            />
            <button
              className="btn btn-ghost"
              style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', padding: '4px 8px' }}
              onClick={() => setShow(s => !s)}
              tabIndex={-1}
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Validation hint */}
          {key && !valid && (
            <div style={{ fontSize: 12, color: 'var(--amber)', marginBottom: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
              <AlertTriangle size={12} /> Key should start with <code style={{ background: 'var(--surface2)', padding: '1px 5px', borderRadius: 3 }}>sk-ant-</code>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12, display: 'flex', gap: 7, alignItems: 'flex-start', background: 'var(--red-dim)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
            </div>
          )}

          {/* Warning */}
          {warning && (
            <div style={{ fontSize: 13, color: 'var(--amber)', marginBottom: 12, display: 'flex', gap: 7, alignItems: 'flex-start', background: 'var(--amber-dim)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(245,158,11,0.25)' }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{warning}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{ fontSize: 13, color: 'var(--green)', marginBottom: 12, display: 'flex', gap: 7, alignItems: 'center', background: 'var(--green-dim)', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(34,197,94,0.25)' }}>
              <CheckCircle size={14} /> API key saved! Launching NyayaAI…
            </div>
          )}

          {/* Submit */}
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', fontSize: 14 }}
            onClick={handleSubmit}
            disabled={!valid || loading || success}
          >
            {loading ? <><span className="spinner" /> Verifying key…</> :
             success ? <><CheckCircle size={15} /> Connected!</> :
             <>Launch NyayaAI <ChevronRight size={15} /></>}
          </button>

          <div className="divider" />

          {/* How to get a key */}
          <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>How to get your API key:</div>
            <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <li>
                Go to{' '}
                <a href="https://console.anthropic.com" target="_blank" rel="noreferrer"
                  style={{ color: 'var(--blue)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  console.anthropic.com <ExternalLink size={11} />
                </a>
                {' '}and sign up (free)
              </li>
              <li>Click <strong style={{ color: 'var(--text)' }}>API Keys</strong> in the sidebar → <strong style={{ color: 'var(--text)' }}>Create Key</strong></li>
              <li>Go to <strong style={{ color: 'var(--text)' }}>Billing</strong> and add $5–$10 of credits</li>
              <li>Paste the key above — it's saved to your machine only</li>
            </ol>
          </div>
        </div>

        {/* Privacy note */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 16, padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
          <Shield size={14} color="var(--muted)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.55 }}>
            Your API key is stored only in the <code style={{ background: 'var(--surface2)', padding: '1px 5px', borderRadius: 3 }}>.env</code> file on this machine.
            It is never sent anywhere except directly to Anthropic's API. NyayaAI has no servers — everything runs locally.
          </div>
        </div>
      </div>
    </div>
  );
}
