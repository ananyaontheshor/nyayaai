import { useState, useEffect } from 'react';
import { Home, Search, Gavel, Shield, Link2, FileSignature, StickyNote } from 'lucide-react';
import Dashboard     from './components/Dashboard';
import SearchPage    from './components/SearchPage';
import AnalyzePage   from './components/AnalyzePage';
import CompliancePage from './components/CompliancePage';
import CorrelatePage  from './components/CorrelatePage';
import ContractPage   from './components/ContractPage';
import NotesPage      from './components/NotesPage';
import SetupScreen    from './components/SetupScreen';
import './index.css';

async function mcpSearch(params) {
  const res = await fetch('/api/search', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function mcpGetDocument(source, sourceId) {
  const res = await fetch('/api/document', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, sourceId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const NAV = [
  { id: 'home',       label: 'Dashboard',         icon: Home,          badge: null },
  { id: 'search',     label: 'Case Law Search',    icon: Search,        badge: '5L+' },
  { id: 'analyze',    label: 'Judgment Analyser',  icon: Gavel,         badge: null },
  { id: 'compliance', label: 'Compliance Check',   icon: Shield,        badge: 'AI' },
  { id: 'correlate',  label: 'Article Correlator', icon: Link2,         badge: null },
  { id: 'contract',   label: 'Contract Review',    icon: FileSignature, badge: 'New' },
  { id: 'notes',      label: 'Research Notes',     icon: StickyNote,    badge: null },
];

export default function App() {
  const [page, setPage]       = useState('home');
  const [ready, setReady]     = useState(null); // null = loading, false = needs setup, true = ready

  useEffect(() => {
    fetch('/api/ready')
      .then(r => r.json())
      .then(d => setReady(d.ready))
      .catch(() => setReady(false));
  }, []);

  // Still checking
  if (ready === null) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--blue) 0%, #1d4ed8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, boxShadow: '0 0 30px rgba(59,130,246,0.3)',
          }}>⚖</div>
          <span className="spinner" style={{ width: 22, height: 22 }} />
        </div>
      </div>
    );
  }

  // Needs setup
  if (!ready) {
    return <SetupScreen onReady={() => setReady(true)} />;
  }

  // Main app
  const shared = { mcpSearch, mcpGetDocument };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">⚖</div>
            NyayaAI
          </div>
          <div className="logo-sub">Indian Legal Intelligence</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Workspace</div>
          {NAV.map(n => {
            const Icon = n.icon;
            return (
              <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`}
                onClick={() => setPage(n.id)}>
                <Icon size={15} />
                {n.label}
                {n.badge && <span className="nav-badge">{n.badge}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div><span className="status-dot" />Live data connected</div>
          <div style={{ marginTop: 5, fontSize: 10.5, lineHeight: 1.5 }}>
            SC · High Courts · SEBI · RBI · India Code · e-Gazette
          </div>
          <div style={{ marginTop: 6, fontSize: 10, color: '#3a4a6a', lineHeight: 1.5 }}>
            Legal information only. Not legal advice.<br />Consult a qualified advocate.
          </div>
        </div>
      </aside>

      <main className="main">
        {page === 'home'       && <Dashboard onNavigate={setPage} />}
        {page === 'search'     && <SearchPage {...shared} />}
        {page === 'analyze'    && <AnalyzePage {...shared} />}
        {page === 'compliance' && <CompliancePage {...shared} />}
        {page === 'correlate'  && <CorrelatePage {...shared} />}
        {page === 'contract'   && <ContractPage />}
        {page === 'notes'      && <NotesPage />}
      </main>
    </div>
  );
}
