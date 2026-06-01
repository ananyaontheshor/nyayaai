import { useState } from 'react';
import { ShieldCheck, X, Lock, Eye, Trash2 } from 'lucide-react';

export default function PrivacyConsent({ onAccept, onDecline }) {
  const [checks, setChecks] = useState({ noSensitive: false, noPersonal: false, understand: false });
  const allChecked = Object.values(checks).every(Boolean);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(6,12,24,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 32, maxWidth: 540, width: '90%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--gold-dim)', border: '1px solid rgba(212,168,83,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ShieldCheck size={22} color="var(--gold)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Data Privacy & Consent</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Required before uploading documents</div>
          </div>
        </div>

        {/* Privacy notice */}
        <div className="privacy-banner" style={{ marginBottom: 18 }}>
          <h4><Lock size={14} /> Privacy Notice</h4>
          <p>
            By uploading a document, you confirm that you have read and understood the following data handling practices for NyayaAI:
          </p>
          <ul>
            <li>Documents are processed by the Anthropic Claude API and are subject to Anthropic's privacy policy</li>
            <li>Do <strong style={{ color: 'var(--text)' }}>not upload</strong> Aadhaar numbers, PAN, bank account details, medical records, or personal identification of third parties</li>
            <li>Documents are not stored permanently — text is held in memory only for the duration of analysis</li>
            <li>You are responsible for ensuring you have the right to share the document content</li>
            <li>Sensitive personal data (DPDP Act 2023, Section 2) must be redacted before uploading</li>
          </ul>
        </div>

        {/* Consent checkboxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {[
            {
              key: 'noSensitive',
              icon: <Eye size={13} />,
              text: <><strong>I confirm</strong> this document does not contain sensitive personal data (Aadhaar, PAN, biometrics, medical records, financial account numbers, or similar).</>,
            },
            {
              key: 'noPersonal',
              icon: <Lock size={13} />,
              text: <><strong>I confirm</strong> I am authorised to share the contents of this document and have redacted or anonymised any third-party personal information where necessary.</>,
            },
            {
              key: 'understand',
              icon: <ShieldCheck size={13} />,
              text: <><strong>I understand</strong> that NyayaAI provides legal information only — not legal advice — and that results should be reviewed by a qualified advocate before acting upon them.</>,
            },
          ].map(item => (
            <div key={item.key} className="consent-row" onClick={() => setChecks(c => ({ ...c, [item.key]: !c[item.key] }))}>
              <input type="checkbox" checked={checks[item.key]} readOnly />
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                <span style={{ color: 'var(--muted)', marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
                <span>{item.text}</span>
              </label>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onDecline}>
            Cancel
          </button>
          <button
            className="btn btn-gold"
            style={{ flex: 2 }}
            disabled={!allChecked}
            onClick={onAccept}
          >
            <ShieldCheck size={15} />
            I Agree — Upload Document
          </button>
        </div>

        <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>
          Data processed under Anthropic's API Terms. Not stored beyond current session.
        </div>
      </div>
    </div>
  );
}
