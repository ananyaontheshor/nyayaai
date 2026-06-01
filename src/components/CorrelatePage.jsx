import { getStoredKey } from '../App';
import { useState } from 'react';
import { Link2, Search, Loader, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ACT_SUGGESTIONS = [
  { label: 'Art. 21 & CrPC Bail', query: 'Article 21 Constitution personal liberty bail Code of Criminal Procedure' },
  { label: 'IPC & PMLA', query: 'Indian Penal Code predicate offence Prevention of Money Laundering Act proceeds of crime' },
  { label: 'Companies Act & SEBI', query: 'Companies Act 2013 Section 188 related party transactions SEBI LODR insider trading' },
  { label: 'IT Act & DPDP Act', query: 'Information Technology Act Section 43A data protection Digital Personal Data Protection Act 2023' },
  { label: 'FEMA & RBI', query: 'Foreign Exchange Management Act external commercial borrowings RBI master direction FEMA regulations' },
  { label: 'IBC & SARFAESI', query: 'Insolvency Bankruptcy Code moratorium Section 14 SARFAESI Act recovery proceedings' },
  { label: 'GST & Income Tax', query: 'Goods Services Tax input tax credit Section 37 Income Tax Act TDS provisions interplay' },
  { label: 'Labour Laws', query: 'Industrial Disputes Act Section 25F retrenchment compensation Shops Establishments Act' },
];

export default function CorrelatePage({ mcpSearch }) {
  const [query, setQuery] = useState('');
  const [legResults, setLegResults] = useState([]);
  const [caseResults, setCaseResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [correlation, setCorrelation] = useState('');
  const [corrLoading, setCorrLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function doCorrelate(q = query) {
    if (!q.trim()) return;
    setLoading(true);
    setLegResults([]);
    setCaseResults([]);
    setCorrelation('');
    setSearched(false);

    try {
      const [legData, caseData] = await Promise.all([
        mcpSearch({ query: q, namespace: 'legislation', sources: ['IN/IndiaCode'], topK: 8 }),
        mcpSearch({ query: q, namespace: 'case_law', sources: ['IN/SCJudgments', 'IN/HighCourtAWS'], topK: 8 }),
      ]);
      setLegResults(legData.results || []);
      setCaseResults(caseData.results || []);
      setSearched(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function generateCorrelation() {
    setCorrLoading(true);
    setCorrelation('');

    const legSnippets = legResults.slice(0, 5).map(r =>
      `[ACT] ${r.title || r.case_name || ''}: ${(r.snippet || '').slice(0, 400)}`
    ).join('\n\n');

    const caseSnippets = caseResults.slice(0, 5).map(r =>
      `[CASE] ${r.title || r.case_name || ''} (${r.date || ''}): ${(r.snippet || '').slice(0, 400)}`
    ).join('\n\n');

    const prompt = `You are an expert Indian legal researcher. Given the following search query and matching legislation/case law, provide a detailed cross-correlation analysis.

QUERY: ${query}

LEGISLATION FOUND:
${legSnippets || 'None found in India Code'}

CASE LAW FOUND:
${caseSnippets || 'None found'}

Produce a structured correlation report:

## 1. Legislative Framework
List and explain the key acts, sections, and rules that apply. Group by statute.

## 2. Judicial Interpretation
How have courts interpreted these provisions? Key holdings from the cases above.

## 3. Cross-Act Interplay
Where do multiple acts interact, conflict, or complement each other? Explain the legal hierarchy and which prevails.

## 4. Landmark Cases & Their Effect on the Legislation
How has case law shaped the interpretation or application of these statutory provisions?

## 5. Practical Compliance Map
A table showing: Provision | Source Act | Judicial Interpretation | Practical Implication

## 6. Unresolved Tensions / Open Questions
Any conflicts between acts, or areas where the law is unsettled.

Be precise with section numbers and case citations.`;

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': getStoredKey() },
        body: JSON.stringify({ docText: '', question: prompt }),
      });
      const data = await res.json();
      setCorrelation(data.analysis || data.result || '');
    } catch (e) {
      setCorrelation('Correlation failed: ' + e.message);
    } finally {
      setCorrLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2><Link2 size={20} /> Article &amp; Section Correlator</h2>
        <p>Cross-reference Indian acts and sections with judicial interpretations</p>
      </div>

      <div className="page-body">
        <div className="card">
          <div className="card-title">Cross-Reference Query</div>
          <div className="input-group">
            <input className="input"
              placeholder="e.g. Article 21 and CrPC bail, IBC moratorium vs SARFAESI recovery..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doCorrelate()} />
            <button className="btn btn-primary" onClick={() => doCorrelate()} disabled={loading}>
              {loading ? <span className="spinner" /> : <Search size={15} />}
              Search
            </button>
          </div>
          <div className="chip-row">
            {ACT_SUGGESTIONS.map(s => (
              <button key={s.label} className="chip"
                onClick={() => { setQuery(s.query); doCorrelate(s.query); }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {searched && (
          <>
            <div className="grid-2" style={{ marginBottom: 16 }}>
              {/* Legislation column */}
              <div>
                <div className="card-title" style={{ marginBottom: 8 }}>
                  <span className="tag tag-indigo" style={{ marginRight: 6 }}>Acts</span>
                  {legResults.length} matches from India Code
                </div>
                <div className="result-scroll">
                  {legResults.map((r, i) => (
                    <div key={i} className="result-item">
                      <div className="result-title">{r.title || r.case_name || 'Legislation'}</div>
                      <div className="result-meta">
                        <span className="tag tag-indigo">{r.source}</span>
                        {r.date && <span className="tag tag-muted">{r.date}</span>}
                        {r.score && <span className="tag tag-green">{(r.score * 100).toFixed(0)}%</span>}
                      </div>
                      <div className="result-snippet">{r.snippet || ''}</div>
                    </div>
                  ))}
                  {legResults.length === 0 && <div className="empty-state" style={{ padding: 30 }}><p>No legislation found</p></div>}
                </div>
              </div>

              {/* Case law column */}
              <div>
                <div className="card-title" style={{ marginBottom: 8 }}>
                  <span className="tag tag-orange" style={{ marginRight: 6 }}>Cases</span>
                  {caseResults.length} matches from Supreme/High Courts
                </div>
                <div className="result-scroll">
                  {caseResults.map((r, i) => (
                    <div key={i} className="result-item">
                      <div className="result-title">{r.title || r.case_name || 'Case'}</div>
                      <div className="result-meta">
                        <span className="tag tag-orange">{r.source}</span>
                        {r.date && <span className="tag tag-muted">{r.date}</span>}
                        {r.score && <span className="tag tag-green">{(r.score * 100).toFixed(0)}%</span>}
                      </div>
                      <div className="result-snippet">{r.snippet || ''}</div>
                    </div>
                  ))}
                  {caseResults.length === 0 && <div className="empty-state" style={{ padding: 30 }}><p>No cases found</p></div>}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={generateCorrelation} disabled={corrLoading}>
                {corrLoading ? <span className="spinner" /> : <Link2 size={15} />}
                Generate AI Correlation Report
              </button>
            </div>

            {correlation && (
              <div className="analysis-panel">
                <h3><Link2 size={15} /> Cross-Correlation Analysis</h3>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{correlation}</ReactMarkdown>
              </div>
            )}
          </>
        )}

        {!searched && !loading && (
          <div className="empty-state">
            <Link2 size={36} />
            <p>Search for acts and sections to see cross-references and judicial interpretations.</p>
          </div>
        )}
      </div>
    </div>
  );
}
