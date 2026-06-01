import { useState } from 'react';
import { Gavel, Search, Loader, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ANALYSIS_TYPES = [
  { id: 'full', label: 'Full Analysis', prompt: 'Provide a structured legal analysis: (1) Key Facts, (2) Legal Issues Framed, (3) Ratio Decidendi / Holding, (4) Acts & Sections Cited, (5) Dissent if any, (6) Precedents Applied, (7) Significance & Impact on Indian law.' },
  { id: 'ratio', label: 'Ratio Decidendi', prompt: 'Extract and explain the ratio decidendi of this judgment. What is the binding principle of law? What are the obiter dicta? How does this affect future cases?' },
  { id: 'sections', label: 'Sections & Acts', prompt: 'List all sections of acts/statutes cited in this judgment. For each, state: (a) the section and act name, (b) how it was interpreted, (c) any constitutional validity discussion.' },
  { id: 'summary', label: 'Plain Summary', prompt: 'Summarise this judgment in plain language for a non-lawyer. What happened, who won, why, and what does it mean in practice?' },
  { id: 'custom', label: 'Custom Question', prompt: '' },
];

const SEARCH_SUGGESTIONS = [
  { q: 'Maneka Gandhi v Union of India due process', src: ['IN/SCJudgments'] },
  { q: 'Kesavananda Bharati basic structure doctrine', src: ['IN/SCJudgments'] },
  { q: 'SEBI insider trading Rajat Gupta order', src: ['IN/SEBI'] },
  { q: 'anticipatory bail Section 438 CrPC landmark', src: ['IN/SCJudgments', 'IN/HighCourtAWS'] },
  { q: 'corporate veil piercing companies act', src: ['IN/SCJudgments'] },
];

export default function AnalyzePage({ mcpSearch, mcpGetDocument }) {
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [docText, setDocText] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState('full');
  const [customQ, setCustomQ] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [pastedDoc, setPastedDoc] = useState('');
  const [inputMode, setInputMode] = useState('search'); // search | paste

  async function doSearch() {
    if (!searchQ.trim()) return;
    setSearchLoading(true);
    setSearchResults([]);
    try {
      const data = await mcpSearch({
        query: searchQ,
        namespace: 'case_law',
        sources: [],
        topK: 8,
      });
      setSearchResults(data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  }

  async function selectDoc(r) {
    setSelected(r);
    setDocText('');
    setAnalysis('');
    setDocLoading(true);
    try {
      const doc = await mcpGetDocument(r.source, r.id);
      setDocText(doc.text || doc.content || JSON.stringify(doc, null, 2));
    } catch (e) {
      setDocText('Could not load full document: ' + e.message);
    } finally {
      setDocLoading(false);
    }
  }

  async function runAnalysis() {
    const text = inputMode === 'paste' ? pastedDoc : docText;
    if (!text) return;
    setAnalysisLoading(true);
    setAnalysis('');
    const typeObj = ANALYSIS_TYPES.find(t => t.id === analysisType);
    const question = analysisType === 'custom' ? customQ : typeObj.prompt;
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docText: text.slice(0, 14000), question }),
      });
      const data = await res.json();
      setAnalysis(data.analysis || data.result || '');
    } catch (e) {
      setAnalysis('Analysis error: ' + e.message);
    } finally {
      setAnalysisLoading(false);
    }
  }

  const activeDoc = inputMode === 'paste' ? pastedDoc : docText;

  return (
    <div>
      <div className="page-header">
        <h2><Gavel size={20} /> Judgment Analyser</h2>
        <p>Deep AI analysis of Supreme Court and High Court judgments</p>
      </div>

      <div className="page-body">
        <div className="tabs">
          <button className={`tab ${inputMode === 'search' ? 'active' : ''}`} onClick={() => setInputMode('search')}>Search &amp; Analyse</button>
          <button className={`tab ${inputMode === 'paste' ? 'active' : ''}`} onClick={() => setInputMode('paste')}>Paste Judgment Text</button>
        </div>

        <div className="grid-2" style={{ alignItems: 'start' }}>
          {/* Left panel */}
          <div>
            {inputMode === 'search' && (
              <div className="card">
                <div className="card-title">Find a Judgment</div>
                <div className="input-group">
                  <input className="input" placeholder="Search judgments..." value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && doSearch()} />
                  <button className="btn btn-primary" onClick={doSearch} disabled={searchLoading}>
                    {searchLoading ? <span className="spinner" /> : <Search size={15} />}
                  </button>
                </div>

                <div className="chip-row">
                  {SEARCH_SUGGESTIONS.map(s => (
                    <button key={s.q} className="chip" onClick={() => { setSearchQ(s.q); }}>{s.q.slice(0, 40)}</button>
                  ))}
                </div>

                <div className="result-scroll" style={{ maxHeight: 400 }}>
                  {searchResults.map((r, i) => (
                    <div key={i} className="result-item"
                      style={selected?.id === r.id ? { borderColor: 'var(--accent)' } : {}}
                      onClick={() => selectDoc(r)}>
                      <div className="result-title">{r.title || r.case_name || 'Document'}</div>
                      <div className="result-meta">
                        <span className="tag tag-indigo">{r.source}</span>
                        {r.date && <span className="tag tag-muted">{r.date}</span>}
                      </div>
                      <div className="result-snippet">{r.snippet || ''}</div>
                    </div>
                  ))}
                </div>

                {docLoading && <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 12, fontSize: 13, color: 'var(--muted)' }}><span className="spinner" /> Loading document...</div>}

                {docText && !docLoading && (
                  <div style={{ marginTop: 12 }}>
                    <div className="card-title">Document Preview</div>
                    <div className="doc-viewer" style={{ maxHeight: 200 }}>
                      <pre>{docText.slice(0, 1500)}...</pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {inputMode === 'paste' && (
              <div className="card">
                <div className="card-title">Paste Judgment Text</div>
                <textarea className="input" style={{ minHeight: 300 }}
                  placeholder="Paste the full text of the judgment here..."
                  value={pastedDoc}
                  onChange={e => setPastedDoc(e.target.value)} />
              </div>
            )}
          </div>

          {/* Right panel — analysis config + output */}
          <div>
            <div className="card">
              <div className="card-title">Analysis Type</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {ANALYSIS_TYPES.map(t => (
                  <label key={t.id} style={{ display: 'flex', gap: 8, cursor: 'pointer', alignItems: 'center', fontSize: 13.5 }}>
                    <input type="radio" name="atype" value={t.id} checked={analysisType === t.id}
                      onChange={() => setAnalysisType(t.id)} style={{ accentColor: 'var(--accent)' }} />
                    {t.label}
                  </label>
                ))}
              </div>

              {analysisType === 'custom' && (
                <textarea className="input" style={{ minHeight: 80, marginBottom: 12 }}
                  placeholder="Enter your legal question about this judgment..."
                  value={customQ} onChange={e => setCustomQ(e.target.value)} />
              )}

              <button className="btn btn-primary" onClick={runAnalysis}
                disabled={!activeDoc || analysisLoading || (analysisType === 'custom' && !customQ)}>
                {analysisLoading ? <span className="spinner" /> : <ChevronRight size={15} />}
                Run Analysis
              </button>
            </div>

            {analysis && (
              <div className="analysis-panel">
                <h3><Gavel size={15} /> Analysis Result</h3>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
              </div>
            )}

            {!analysis && !analysisLoading && (
              <div className="empty-state">
                <Gavel size={36} />
                <p>{activeDoc ? 'Choose an analysis type and click Run Analysis.' : 'Select or paste a judgment first.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
