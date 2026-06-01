import { getStoredKey } from '../App';
import { useState } from 'react';
import { Search, Loader, ExternalLink, Calendar, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SOURCES = [
  { id: '', label: 'All Sources' },
  { id: 'IN/SCJudgments', label: 'Supreme Court' },
  { id: 'IN/HighCourtAWS', label: 'High Courts' },
  { id: 'IN/SEBI', label: 'SEBI' },
  { id: 'IN/RBI', label: 'RBI' },
  { id: 'IN/IndiaCode', label: 'India Code' },
  { id: 'IN/eGazette', label: 'e-Gazette' },
];

const NAMESPACES = [
  { id: 'case_law', label: 'Case Law' },
  { id: 'legislation', label: 'Legislation' },
  { id: 'doctrine', label: 'Regulations / Doctrine' },
];

const SUGGESTED = [
  'Article 21 right to life personal liberty',
  'Section 138 Negotiable Instruments Act cheque dishonour',
  'SEBI insider trading regulations',
  'IBC insolvency resolution process',
  'Arbitration and Conciliation Act Section 34',
  'GST input tax credit fraud',
  'PMLA money laundering provisions',
  'Consumer protection unfair trade practices',
];

export default function SearchPage({ mcpSearch, mcpGetDocument }) {
  const [query, setQuery] = useState('');
  const [namespace, setNamespace] = useState('case_law');
  const [source, setSource] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [docLoading, setDocLoading] = useState(false);
  const [docText, setDocText] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  async function doSearch(q = query) {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);
    setSelected(null);
    setDocText('');
    setAiSummary('');
    try {
      const data = await mcpSearch({
        query: q,
        namespace,
        sources: source ? [source] : [],
        topK: 12,
        dateStart: dateStart || undefined,
        dateEnd: dateEnd || undefined,
      });
      setResults(data.results || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function openDoc(result) {
    setSelected(result);
    setDocText('');
    setAiSummary('');
    setDocLoading(true);
    try {
      const doc = await mcpGetDocument(result.source, result.id);
      setDocText(doc.text || doc.content || JSON.stringify(doc, null, 2));
    } catch (e) {
      setDocText('Could not load full document: ' + e.message);
    } finally {
      setDocLoading(false);
    }
  }

  async function summarize() {
    if (!docText) return;
    setSummaryLoading(true);
    setAiSummary('');
    try {
      // Build prompt and call the analyze endpoint
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': getStoredKey() },
        body: JSON.stringify({
          docText: docText.slice(0, 12000),
          question: 'Provide a structured legal analysis: (1) Key Facts, (2) Legal Issues, (3) Ratio Decidendi / Holding, (4) Relevant Acts & Sections cited, (5) Significance & Impact.',
        }),
      });
      const data = await res.json();
      setAiSummary(data.analysis || data.result || '');
    } catch (e) {
      setAiSummary('Analysis failed: ' + e.message);
    } finally {
      setSummaryLoading(false);
    }
  }

  const sourceLabel = (id) => SOURCES.find(s => s.id === id)?.label || id;

  return (
    <div>
      <div className="page-header">
        <h2><Search size={20} /> Case Law &amp; Legislation Search</h2>
        <p>Search 4.8 lakh+ Indian judgments, 225+ acts, SEBI orders, RBI notifications</p>
      </div>

      <div className="page-body">
        <div className="card">
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <input
              className="input"
              placeholder="Search: e.g. Article 21 personal liberty, cheque bounce NI Act 138..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
            />
            <button className="btn btn-primary" onClick={() => doSearch()} disabled={loading}>
              {loading ? <span className="spinner" /> : <Search size={16} />}
              Search
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="select" value={namespace} onChange={e => setNamespace(e.target.value)}>
              {NAMESPACES.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
            <select className="select" value={source} onChange={e => setSource(e.target.value)}>
              {SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <input className="input" style={{ maxWidth: 160 }} type="date" value={dateStart}
              onChange={e => setDateStart(e.target.value)} title="From date" />
            <input className="input" style={{ maxWidth: 160 }} type="date" value={dateEnd}
              onChange={e => setDateEnd(e.target.value)} title="To date" />
          </div>

          <div className="chip-row" style={{ marginTop: 12 }}>
            {SUGGESTED.map(s => (
              <button key={s} className="chip" onClick={() => { setQuery(s); doSearch(s); }}>{s}</button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
          {/* Results list */}
          <div>
            {results.length > 0 && (
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
                {results.length} results
              </div>
            )}
            <div className="result-scroll">
              {results.map((r, i) => (
                <div key={i} className={`result-item ${selected?.id === r.id ? 'active' : ''}`}
                  style={selected?.id === r.id ? { borderColor: 'var(--accent)' } : {}}
                  onClick={() => openDoc(r)}>
                  <div className="result-title">{r.title || r.case_name || 'Untitled Document'}</div>
                  <div className="result-meta">
                    <span className="tag tag-indigo">{sourceLabel(r.source)}</span>
                    {r.date && (
                      <span className="tag tag-muted" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <Calendar size={10} />{r.date}
                      </span>
                    )}
                    {r.court && <span className="tag tag-muted">{r.court}</span>}
                    {r.score && <span className="tag tag-green">{(r.score * 100).toFixed(0)}% match</span>}
                  </div>
                  <div className="result-snippet">{r.snippet || r.text?.slice(0, 200) || ''}</div>
                </div>
              ))}

              {!loading && results.length === 0 && query && (
                <div className="empty-state">
                  <Search size={36} />
                  <p>No results. Try different keywords or broader filters.</p>
                </div>
              )}

              {!loading && results.length === 0 && !query && (
                <div className="empty-state">
                  <BookOpen size={36} />
                  <p>Enter a query above to search Indian legal documents.</p>
                </div>
              )}
            </div>
          </div>

          {/* Document panel */}
          {selected && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {selected.title || selected.case_name || 'Document'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary" onClick={summarize} disabled={!docText || summaryLoading}>
                    {summaryLoading ? <span className="spinner" /> : null}
                    AI Analyse
                  </button>
                  <button className="btn btn-ghost" onClick={() => setSelected(null)}>✕</button>
                </div>
              </div>

              {docLoading && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 20, color: 'var(--muted)', fontSize: 13 }}>
                  <span className="spinner" /> Loading document...
                </div>
              )}

              {aiSummary && (
                <div className="analysis-panel" style={{ marginBottom: 16 }}>
                  <h3>AI Legal Analysis</h3>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiSummary}</ReactMarkdown>
                </div>
              )}

              {docText && !docLoading && (
                <div className="doc-viewer">
                  <pre>{docText.slice(0, 8000)}{docText.length > 8000 ? '\n\n[Document truncated for display]' : ''}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
