import { useState } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, Play, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import FileUpload from './FileUpload';

const DOMAINS = [
  { id: 'corporate',   label: 'Corporate / Companies Act' },
  { id: 'securities',  label: 'Securities / SEBI' },
  { id: 'banking',     label: 'Banking / RBI / FEMA' },
  { id: 'tax',         label: 'GST / Income Tax' },
  { id: 'labour',      label: 'Labour / Employment' },
  { id: 'ip',          label: 'Intellectual Property' },
  { id: 'data',        label: 'Data Protection / IT Act' },
  { id: 'criminal',    label: 'Criminal / PMLA / NDPS' },
  { id: 'consumer',    label: 'Consumer Protection' },
  { id: 'general',     label: 'General / Multi-domain' },
];

// All major Indian acts grouped by domain
const ACT_GROUPS = [
  {
    group: 'Constitutional & Criminal',
    acts: [
      'Constitution of India',
      'Indian Penal Code 1860 (IPC)',
      'Bharatiya Nyaya Sanhita 2023 (BNS)',
      'Code of Criminal Procedure 1973 (CrPC)',
      'Bharatiya Nagarik Suraksha Sanhita 2023',
      'Indian Evidence Act 1872',
      'Prevention of Money Laundering Act 2002 (PMLA)',
      'NDPS Act 1985',
      'UAPA 1967',
    ],
  },
  {
    group: 'Corporate & Securities',
    acts: [
      'Companies Act 2013',
      'SEBI Act 1992',
      'SEBI LODR Regulations 2015',
      'SEBI (Prohibition of Insider Trading) Regulations 2015',
      'SEBI ICDR Regulations 2018',
      'Securities Contracts (Regulation) Act 1956',
      'Depositories Act 1996',
      'Competition Act 2002',
      'LLP Act 2008',
    ],
  },
  {
    group: 'Finance & Banking',
    acts: [
      'RBI Act 1934',
      'Banking Regulation Act 1949',
      'FEMA 1999',
      'IBC (Insolvency & Bankruptcy Code) 2016',
      'SARFAESI Act 2002',
      'Negotiable Instruments Act 1881',
      'Payment & Settlement Systems Act 2007',
    ],
  },
  {
    group: 'Tax',
    acts: [
      'Income Tax Act 1961',
      'GST (CGST Act 2017)',
      'Customs Act 1962',
      'Stamp Act 1899',
    ],
  },
  {
    group: 'Labour & Employment',
    acts: [
      'Industrial Disputes Act 1947',
      'Factories Act 1948',
      'EPF & MP Act 1952',
      'POSH Act 2013',
      'Contract Labour Act 1970',
      'Minimum Wages Act 1948',
      'Code on Wages 2019',
    ],
  },
  {
    group: 'Technology & Data',
    acts: [
      'IT Act 2000',
      'Digital Personal Data Protection Act 2023 (DPDP)',
      'IT (Intermediary Guidelines) Rules 2021',
    ],
  },
  {
    group: 'Property & Contract',
    acts: [
      'Indian Contract Act 1872',
      'Transfer of Property Act 1882',
      'Specific Relief Act 1963',
      'Registration Act 1908',
      'RERA 2016',
    ],
  },
  {
    group: 'Consumer & IP',
    acts: [
      'Consumer Protection Act 2019',
      'Patents Act 1970',
      'Trade Marks Act 1999',
      'Copyright Act 1957',
      'Designs Act 2000',
    ],
  },
];

const ALL_ACTS = ACT_GROUPS.flatMap(g => g.acts);

const AGENTS = [
  { id: 'legislation', label: 'Legislation Agent',  desc: 'Searches India Code for applicable acts & sections', color: 'var(--blue)' },
  { id: 'caselaw',     label: 'Case Law Agent',      desc: 'Finds SC & High Court precedents',                  color: 'var(--gold)' },
  { id: 'regulatory',  label: 'Regulatory Agent',    desc: 'Checks SEBI/RBI/TRAI circulars',                    color: 'var(--green)' },
  { id: 'synthesis',   label: 'Synthesis Agent',     desc: 'Combines findings into compliance opinion',         color: 'var(--amber)' },
];

const EXAMPLES = [
  'A fintech startup wants to launch a P2P lending platform. What RBI compliance requirements apply?',
  'A company wants to buy back 10% of its shares. What are the Companies Act and SEBI requirements?',
  'A listed company director traded shares 2 days before a board meeting announcing a merger. SEBI violations?',
  'A startup wants to collect and process biometric data of users. What Indian laws apply?',
  'An employer wants to implement mandatory arbitration clauses in employment contracts. Is this valid?',
];

export default function CompliancePage({ mcpSearch }) {
  const [scenario, setScenario]       = useState('');
  const [domain, setDomain]           = useState('general');
  const [selectedActs, setSelectedActs] = useState([]);
  const [allActsMode, setAllActsMode] = useState(true);
  const [docText, setDocText]         = useState('');
  const [docName, setDocName]         = useState('');
  const [tab, setTab]                 = useState('setup');
  const [agentState, setAgentState]   = useState({ legislation: 'idle', caselaw: 'idle', regulatory: 'idle', synthesis: 'idle' });
  const [agentLogs, setAgentLogs]     = useState({});
  const [finalReport, setFinalReport] = useState('');
  const [running, setRunning]         = useState(false);
  const [showActPicker, setShowActPicker] = useState(false);

  function toggleAct(act) {
    setSelectedActs(prev =>
      prev.includes(act) ? prev.filter(a => a !== act) : [...prev, act]
    );
  }

  function setAgent(id, state, log) {
    setAgentState(s => ({ ...s, [id]: state }));
    if (log !== undefined) setAgentLogs(l => ({ ...l, [id]: log }));
  }

  async function agentSearch(id, queries) {
    setAgent(id, 'running');
    const hits = [];
    for (const { q, ns, src } of queries) {
      try {
        const d = await mcpSearch({ query: q, namespace: ns, sources: src || [], topK: 5 });
        if (d?.results) hits.push(...d.results);
      } catch {}
    }
    return hits;
  }

  async function runCompliance() {
    if (!scenario.trim()) return;
    setRunning(true);
    setFinalReport('');
    setAgentLogs({});
    setAgentState({ legislation: 'idle', caselaw: 'idle', regulatory: 'idle', synthesis: 'idle' });
    setTab('agents');

    const domainLabel = DOMAINS.find(d => d.id === domain)?.label || domain;
    const actsToCheck = allActsMode ? [] : selectedActs;

    const [legHits, caseHits, regHits] = await Promise.all([
      agentSearch('legislation', [{ q: `${scenario} applicable acts sections ${domainLabel}`, ns: 'legislation' }]),
      agentSearch('caselaw', [{ q: `${scenario} Supreme Court High Court judgment`, ns: 'case_law', src: ['IN/SCJudgments', 'IN/HighCourtAWS'] }]),
      agentSearch('regulatory', [
        { q: `${scenario} circular notification guidelines ${domainLabel}`, ns: 'doctrine', src: ['IN/RBI', 'IN/SEBI', 'IN/TRAI'] },
        { q: `${scenario} order ${domainLabel}`, ns: 'case_law', src: ['IN/SEBI'] },
      ]),
    ]);

    const fmt = (hits, label) =>
      hits.slice(0, 5).map(h => `• ${h.title || 'Document'} [${h.source}]${h.date ? ' ' + h.date : ''}`).join('\n') || `No ${label} found`;

    setAgent('legislation', 'done', `Found ${legHits.length} legislation docs:\n${fmt(legHits, 'legislation')}`);
    setAgent('caselaw', 'done', `Found ${caseHits.length} case law docs:\n${fmt(caseHits, 'cases')}`);
    setAgent('regulatory', 'done', `Found ${regHits.length} regulatory docs:\n${fmt(regHits, 'regulations')}`);

    setAgent('synthesis', 'running');

    const snippets = [
      ...legHits.slice(0, 3).map(h => `[Legislation] ${h.title}: ${(h.snippet || '').slice(0, 300)}`),
      ...caseHits.slice(0, 3).map(h => `[Case] ${h.title} ${h.date || ''}: ${(h.snippet || '').slice(0, 300)}`),
      ...regHits.slice(0, 3).map(h => `[Regulatory] ${h.title}: ${(h.snippet || '').slice(0, 300)}`),
    ].join('\n\n');

    try {
      const res = await fetch('/api/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          domain: domainLabel,
          acts: actsToCheck.length ? actsToCheck : undefined,
          docText: docText ? `${snippets}\n\nUPLOADED DOCUMENT:\n${docText.slice(0, 6000)}` : snippets,
        }),
      });
      const data = await res.json();
      setAgent('synthesis', 'done', 'Synthesis complete');
      setFinalReport(data.analysis || '');
      setTab('report');
    } catch (e) {
      setAgent('synthesis', 'error', e.message);
    }

    setRunning(false);
  }

  const dotCls = s => s === 'running' ? 'running' : s === 'done' ? 'done' : s === 'error' ? 'error' : 'idle';

  return (
    <div>
      <div className="page-header">
        <h2><Shield size={20} /> Multi-Agent Compliance Check</h2>
        <p>Four parallel agents search legislation, case law, and regulatory sources simultaneously</p>
      </div>

      <div className="page-body">
        <div className="tabs">
          {[['setup','Setup'],['agents','Agent Monitor'],['report','Report']].map(([id,lbl]) => (
            <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>{lbl}</button>
          ))}
        </div>

        {/* ── SETUP ── */}
        {tab === 'setup' && (
          <div>
            <div className="card">
              <div className="card-title">Describe Your Scenario</div>
              <textarea className="input" style={{ minHeight: 110, marginBottom: 12 }}
                placeholder="Describe the business situation, transaction, or activity you want to check for compliance…"
                value={scenario} onChange={e => setScenario(e.target.value)} />

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <select className="select" value={domain} onChange={e => setDomain(e.target.value)}>
                  {DOMAINS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </div>

              {/* Act selector */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div className="card-title" style={{ marginBottom: 0 }}>Acts to Check Against</div>
                  <span className={`act-pill ${allActsMode ? 'selected' : ''}`} onClick={() => setAllActsMode(true)}>
                    <span className="check">{allActsMode ? '✓' : ''}</span>
                    All Applicable Acts (default)
                  </span>
                  <span className={`act-pill ${!allActsMode ? 'selected' : ''}`} onClick={() => { setAllActsMode(false); setShowActPicker(true); }}>
                    <span className="check">{!allActsMode ? '✓' : ''}</span>
                    Specify Acts
                  </span>
                </div>

                {!allActsMode && (
                  <div>
                    <button className="btn btn-secondary btn-sm" style={{ marginBottom: 10 }} onClick={() => setShowActPicker(p => !p)}>
                      {showActPicker ? 'Hide' : 'Select'} Acts ({selectedActs.length} selected)
                    </button>
                    {selectedActs.length > 0 && (
                      <div className="chip-row">
                        {selectedActs.map(a => (
                          <span key={a} className="chip active" onClick={() => toggleAct(a)}>{a} ×</span>
                        ))}
                      </div>
                    )}
                    {showActPicker && (
                      <div className="card" style={{ maxHeight: 380, overflowY: 'auto', padding: 16, marginBottom: 0 }}>
                        {ACT_GROUPS.map(g => (
                          <div key={g.group} style={{ marginBottom: 14 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>{g.group}</div>
                            <div className="chip-row" style={{ marginBottom: 0 }}>
                              {g.acts.map(a => (
                                <span key={a} className={`act-pill ${selectedActs.includes(a) ? 'selected' : ''}`} onClick={() => toggleAct(a)}>
                                  <span className="check">{selectedActs.includes(a) ? '✓' : ''}</span>
                                  {a}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Document upload */}
              <div style={{ marginBottom: 16 }}>
                <div className="card-title" style={{ marginBottom: 10 }}>Upload Document for Review <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(optional)</span></div>
                <FileUpload
                  label="Upload contract, policy, or legal document for compliance review"
                  onExtracted={(text, name) => { setDocText(text); setDocName(name); }}
                />
                {docText && (
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--green)', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <CheckCircle size={13} /> {docName} — {docText.length.toLocaleString()} characters extracted
                  </div>
                )}
              </div>

              <button className="btn btn-primary" onClick={runCompliance} disabled={running || !scenario.trim()}>
                {running ? <span className="spinner" /> : <Play size={15} />}
                Run Compliance Check
              </button>
            </div>

            {/* Example scenarios */}
            <div className="card-title" style={{ marginBottom: 8 }}>Example Scenarios</div>
            {EXAMPLES.map((ex, i) => (
              <div key={i} className="result-item" onClick={() => setScenario(ex)}>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>{ex}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── AGENTS ── */}
        {tab === 'agents' && (
          <div>
            <div className="agent-status" style={{ marginBottom: 20 }}>
              {AGENTS.map(a => (
                <div key={a.id} className={`agent-row ${agentState[a.id]}`}>
                  <div className={`agent-dot ${dotCls(agentState[a.id])}`} />
                  {agentState[a.id] === 'running' && <span className="spinner" />}
                  {agentState[a.id] === 'done'    && <CheckCircle size={15} color="var(--green)" />}
                  {agentState[a.id] === 'error'   && <XCircle size={15} color="var(--red)" />}
                  {agentState[a.id] === 'idle'    && <AlertCircle size={15} color="var(--border2)" />}
                  <div style={{ flex: 1 }}>
                    <div className="agent-name" style={{ color: a.color }}>{a.label}</div>
                    <div className="agent-status-text">{a.desc}</div>
                  </div>
                  <span className={`tag ${agentState[a.id] === 'done' ? 'tag-green' : agentState[a.id] === 'running' ? 'tag-blue' : agentState[a.id] === 'error' ? 'tag-red' : 'tag-muted'}`}>
                    {agentState[a.id]}
                  </span>
                </div>
              ))}
            </div>

            {Object.entries(agentLogs).map(([id, log]) => {
              const a = AGENTS.find(x => x.id === id);
              return (
                <div key={id} className="analysis-panel" style={{ marginBottom: 12 }}>
                  <h3 style={{ color: a?.color }}>{a?.label} — Findings</h3>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.65 }}>{log}</pre>
                </div>
              );
            })}

            {!running && !finalReport && (
              <div className="empty-state">
                <Shield size={36} />
                <p>Go to Setup and run a compliance check to see agent activity.</p>
              </div>
            )}
          </div>
        )}

        {/* ── REPORT ── */}
        {tab === 'report' && (
          <div>
            {finalReport ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setTab('setup'); setFinalReport(''); }}>
                    <RotateCcw size={13} /> New Check
                  </button>
                </div>
                <div className="analysis-panel">
                  <h3><Shield size={15} /> Compliance Report</h3>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{finalReport}</ReactMarkdown>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <Shield size={36} />
                <p>Run a compliance check to generate your report.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
