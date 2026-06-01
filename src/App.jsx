import { useState, useEffect } from 'react';
import { Home, Search, Gavel, Shield, Link2, FileSignature, StickyNote } from 'lucide-react';
import Dashboard      from './components/Dashboard';
import SearchPage     from './components/SearchPage';
import AnalyzePage    from './components/AnalyzePage';
import CompliancePage from './components/CompliancePage';
import CorrelatePage  from './components/CorrelatePage';
import ContractPage   from './components/ContractPage';
import NotesPage      from './components/NotesPage';
import SetupScreen    from './components/SetupScreen';
import './index.css';

const LS_KEY = 'nyayaai_api_key';

// Read key from localStorage
export function getStoredKey() {
  return localStorage.getItem(LS_KEY) || '';
}

// Save key to localStorage
export function storeKey(key) {
  localStorage.setItem(LS_KEY, key);
}

// Clear key
export function clearKey() {
  localStorage.removeItem(LS_KEY);
}

// All API calls attach the key as a header
function apiFetch(path, body) {
  return fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getStoredKey(),
    },
    body: JSON.stringify(body),
  });
}

async function mcpSearch(params) {
  const res = await apiFetch('/api/search', params);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function mcpGetDocument(source, sourceId) {
  const res = await apiFetch('/api/document', { source, sourceId });
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
  const [page, setPage] = useState('home');
  // Check if key exists in localStorage
  const [ready, setReady] = useState(null);

  useEffect(() => {
    const key = getStoredKey();
    setReady(!!key && key.startsWith('sk-ant-'));
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
          <div style={{ marginTop: 8 }}>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 11, padding: '4px 8px', color: 'var(--muted)', width: '100%', justifyContent: 'center' }}
              onClick={() => { clearKey(); setReady(false); }}
            >
              🔑 Change API Key
            </button>
          </div>
          <div style={{ marginTop: 4, fontSize: 10, color: '#3a4a6a', lineHeight: 1.5 }}>
            Legal information only. Not legal advice.
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
