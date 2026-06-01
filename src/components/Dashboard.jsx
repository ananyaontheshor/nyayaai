import { Scale, Search, Shield, Link2, Gavel, BookOpen, TrendingUp, Building, FileText, Radio, FileSignature, StickyNote } from 'lucide-react';

const SOURCES = [
  { id: 'IN/SCJudgments',  label: 'Supreme Court',      count: '3,700',    color: 'var(--gold)',  icon: Gavel },
  { id: 'IN/HighCourtAWS', label: 'High Courts',         count: '4,54,227', color: 'var(--blue)',  icon: Scale },
  { id: 'IN/SEBI',         label: 'SEBI Orders',         count: '7,160',    color: 'var(--green)', icon: TrendingUp },
  { id: 'IN/RBI',          label: 'RBI Notifications',   count: '13,050',   color: '#a78bfa',      icon: Building },
  { id: 'IN/IndiaCode',    label: 'India Code (Acts)',   count: '225+',     color: 'var(--amber)', icon: BookOpen },
  { id: 'IN/eGazette',     label: 'e-Gazette',           count: '8,150',    color: '#38bdf8',      icon: FileText },
  { id: 'IN/TRAI',         label: 'TRAI Regulations',    count: '371',      color: '#34d399',      icon: Radio },
];

const FEATURES = [
  { page: 'search',     icon: Search,        color: 'var(--blue)',  title: 'Case Law Search',         desc: 'Semantic search across 4.8 lakh+ SC and High Court judgments with AI snippets' },
  { page: 'analyze',    icon: Gavel,         color: 'var(--gold)',  title: 'Judgment Analyser',       desc: 'Extract ratio decidendi, cited sections, and case significance with one click' },
  { page: 'compliance', icon: Shield,        color: 'var(--green)', title: 'Multi-Agent Compliance',  desc: '4 parallel agents — Legislation, Case Law, Regulatory, Synthesis — with document upload' },
  { page: 'correlate',  icon: Link2,         color: '#a78bfa',      title: 'Article Correlator',      desc: 'Cross-reference acts & sections with judicial interpretations side-by-side' },
  { page: 'contract',   icon: FileSignature, color: 'var(--amber)', title: 'Contract Review',         desc: 'AI review of contracts against Indian Contract Act, SEBI, FEMA, IT Act, labour laws' },
  { page: 'notes',      icon: StickyNote,    color: '#38bdf8',      title: 'Research Notes',          desc: 'Personal Markdown notes linked to your legal research, saved locally' },
];

export default function Dashboard({ onNavigate }) {
  return (
    <div>
      <div className="page-header">
        <h2><Scale size={20} /> Indian Legal Research Platform</h2>
        <p>AI-powered research using live Supreme Court, High Court, SEBI, RBI, India Code and e-Gazette data</p>
      </div>

      <div className="page-body">
        {/* Hero */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #0b1526 0%, #111d35 50%, #0d1f3c 100%)',
          borderColor: 'var(--border2)', marginBottom: 24, padding: '28px 28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, var(--blue) 0%, #1d4ed8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              boxShadow: '0 0 24px rgba(59,130,246,0.4)',
            }}>⚖</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)' }}>NyayaAI</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Indian Legal Intelligence Platform</div>
            </div>
          </div>
          <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 600 }}>
            Research Indian law with AI assistance. Search 5 lakh+ court judgments, analyse contracts, run multi-agent compliance checks, and cross-reference acts and sections — all powered by live Indian legal databases.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => onNavigate('compliance')}>
              <Shield size={14} /> Compliance Check
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('search')}>
              <Search size={14} /> Search Case Law
            </button>
            <button className="btn btn-secondary" onClick={() => onNavigate('contract')}>
              <FileSignature size={14} /> Review Contract
            </button>
          </div>
        </div>

        {/* Features grid */}
        <div className="card-title" style={{ marginBottom: 12 }}>Features</div>
        <div className="grid-3" style={{ marginBottom: 24 }}>
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.page} className="card"
                style={{ cursor: 'pointer', borderLeft: `3px solid ${f.color}`, marginBottom: 0, transition: 'transform 0.1s, border-color 0.1s' }}
                onClick={() => onNavigate(f.page)}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: `rgba(${f.color === 'var(--blue)' ? '59,130,246' : f.color === 'var(--gold)' ? '212,168,83' : f.color === 'var(--green)' ? '34,197,94' : f.color === 'var(--amber)' ? '245,158,11' : '99,102,241'},0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color={f.color} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>{f.desc}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Data sources */}
        <div className="card-title" style={{ marginBottom: 12 }}>Live Data Sources</div>
        <div className="grid-4">
          {SOURCES.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.id} className="stat-card" style={{ borderTop: `2px solid ${s.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Icon size={15} color={s.color} />
                  <span style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>{s.label}</span>
                </div>
                <div className="stat-val" style={{ color: s.color, fontSize: 20 }}>{s.count}</div>
                <div className="stat-label">documents indexed</div>
              </div>
            );
          })}
        </div>

        <div className="divider" />
        <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.6, textAlign: 'center' }}>
          NyayaAI provides legal information only, not legal advice. Results should be reviewed by a qualified advocate before reliance. •{' '}
          Documents uploaded are processed via Anthropic's API and are not stored permanently. •{' '}
          Do not upload documents containing sensitive personal data (Aadhaar, PAN, bank details, biometrics).
        </div>
      </div>
    </div>
  );
}
