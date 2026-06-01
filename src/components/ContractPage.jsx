import { getStoredKey } from '../App';
import { useState } from 'react';
import { FileSignature, Play, AlertTriangle, Info, CheckCircle, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import FileUpload from './FileUpload';

const CONTRACT_TYPES = [
  'Employment Contract', 'Non-Disclosure Agreement (NDA)', 'Service Agreement',
  'Sale Deed / Property Agreement', 'Lease / Rent Agreement', 'Loan Agreement',
  'Partnership Deed', 'Shareholder Agreement', 'Franchise Agreement',
  'Software License Agreement', 'Consultancy Agreement', 'Supply Agreement',
  'Distribution Agreement', 'Joint Venture Agreement', 'Settlement Agreement',
  'Other / Unknown',
];

const FOCUS_AREAS = [
  'Liability & Indemnity', 'Termination Clauses', 'Intellectual Property',
  'Data Protection / Privacy', 'Dispute Resolution / Arbitration', 'Governing Law & Jurisdiction',
  'Payment Terms', 'Force Majeure', 'Confidentiality', 'Non-compete / Non-solicitation',
  'Representations & Warranties', 'Stamp Duty Compliance',
];

const JURISDICTIONS = [
  'Pan-India (Central Laws)', 'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu',
  'Uttar Pradesh', 'Gujarat', 'West Bengal', 'Telangana', 'Rajasthan', 'Kerala',
];

export default function ContractPage() {
  const [docText, setDocText]         = useState('');
  const [pastedText, setPastedText]   = useState('');
  const [inputMode, setInputMode]     = useState('upload');
  const [contractType, setContractType] = useState('');
  const [jurisdiction, setJurisdiction] = useState('Pan-India (Central Laws)');
  const [focusAreas, setFocusAreas]   = useState([]);
  const [analysis, setAnalysis]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [tab, setTab]                 = useState('input');

  const activeText = inputMode === 'upload' ? docText : pastedText;

  function toggleFocus(f) {
    setFocusAreas(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }

  async function runReview() {
    if (!activeText.trim()) return;
    setLoading(true);
    setAnalysis('');
    setTab('result');
    try {
      const res = await fetch('/api/contract-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': getStoredKey() },
        body: JSON.stringify({
          docText: activeText,
          contractType: contractType || 'General Contract',
          jurisdiction,
          focusAreas,
        }),
      });
      const data = await res.json();
      setAnalysis(data.analysis || '');
    } catch (e) {
      setAnalysis('Review failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2><FileSignature size={20} /> Contract Review & Analysis</h2>
        <p>AI-powered review against Indian Contract Act, SEBI, FEMA, IT Act, labour laws and more</p>
      </div>

      <div className="page-body">
        <div className="tabs">
          <button className={`tab ${tab === 'input' ? 'active' : ''}`} onClick={() => setTab('input')}>Contract Input</button>
          <button className={`tab ${tab === 'result' ? 'active' : ''}`} onClick={() => setTab('result')}>Review Result</button>
        </div>

        {tab === 'input' && (
          <div className="grid-2" style={{ alignItems: 'start', gap: 20 }}>
            {/* Left: document */}
            <div>
              <div className="card">
                <div className="card-title">Contract Document</div>
                <div className="tabs" style={{ marginBottom: 14, borderBottom: '1px solid var(--border)' }}>
                  <button className={`tab ${inputMode === 'upload' ? 'active' : ''}`} onClick={() => setInputMode('upload')}>Upload File</button>
                  <button className={`tab ${inputMode === 'paste' ? 'active' : ''}`} onClick={() => setInputMode('paste')}>Paste Text</button>
                </div>

                {inputMode === 'upload' && (
                  <FileUpload
                    label="Upload contract (PDF, DOCX, TXT)"
                    onExtracted={(text) => setDocText(text)}
                  />
                )}

                {inputMode === 'paste' && (
                  <textarea className="input" style={{ minHeight: 300 }}
                    placeholder="Paste the full contract text here…"
                    value={pastedText} onChange={e => setPastedText(e.target.value)} />
                )}

                {activeText && (
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--green)', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <CheckCircle size={13} /> {activeText.length.toLocaleString()} characters ready for review
                  </div>
                )}
              </div>
            </div>

            {/* Right: options */}
            <div>
              <div className="card">
                <div className="card-title">Review Options</div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6, fontWeight: 600 }}>CONTRACT TYPE</label>
                  <select className="select" style={{ width: '100%' }} value={contractType} onChange={e => setContractType(e.target.value)}>
                    <option value="">Auto-detect</option>
                    {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6, fontWeight: 600 }}>GOVERNING JURISDICTION</label>
                  <select className="select" style={{ width: '100%' }} value={jurisdiction} onChange={e => setJurisdiction(e.target.value)}>
                    {JURISDICTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 8, fontWeight: 600 }}>FOCUS AREAS (optional)</label>
                  <div className="chip-row">
                    {FOCUS_AREAS.map(f => (
                      <span key={f} className={`chip ${focusAreas.includes(f) ? 'active' : ''}`} onClick={() => toggleFocus(f)}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <button className="btn btn-primary" style={{ width: '100%' }}
                  onClick={runReview} disabled={!activeText.trim() || loading}>
                  {loading ? <span className="spinner" /> : <Play size={15} />}
                  Run Contract Review
                </button>
              </div>

              {/* What the review covers */}
              <div className="card" style={{ marginTop: 0 }}>
                <div className="card-title">What This Review Covers</div>
                {[
                  { icon: AlertTriangle, color: 'var(--red)',   label: 'Critical Issues', desc: 'Illegal, void, or highly risky clauses' },
                  { icon: AlertTriangle, color: 'var(--amber)', label: 'Concerns',        desc: 'Ambiguous or unfavourable provisions' },
                  { icon: Info,          color: 'var(--blue)',  label: 'Observations',    desc: 'Minor improvements and best practice' },
                  { icon: CheckCircle,   color: 'var(--green)', label: 'Compliance',      desc: 'Indian law compliance check' },
                ].map(i => {
                  const Icon = i.icon;
                  return (
                    <div key={i.label} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                      <Icon size={14} color={i.color} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{i.label}</span>
                        <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 8 }}>{i.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'result' && (
          <div>
            {loading && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 24, color: 'var(--text2)', fontSize: 14 }}>
                <span className="spinner" style={{ width: 24, height: 24 }} />
                Analysing contract against Indian law…
              </div>
            )}

            {analysis && !loading && (
              <>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setAnalysis(''); setTab('input'); }}>
                    <RotateCcw size={13} /> New Review
                  </button>
                </div>
                <div className="analysis-panel">
                  <h3><FileSignature size={15} /> Contract Review Report</h3>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
                </div>
              </>
            )}

            {!loading && !analysis && (
              <div className="empty-state">
                <FileSignature size={36} />
                <p>Upload or paste a contract and click Run Contract Review.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
