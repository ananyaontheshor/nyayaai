import { fileURLToPath } from 'url';
import path from 'path';
import { config } from 'dotenv';
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: '4mb' }));

// Key comes from the request header (stored in user's browser localStorage)
// Falls back to env var for local dev convenience
function getKeyFromRequest(req) {
  const headerKey = req?.headers?.['x-api-key'];
  if (headerKey && headerKey.startsWith('sk-ant-')) return headerKey;
  // fallback: env var (useful for local dev)
  return process.env.ANTHROPIC_API_KEY || null;
}

function getClient(req) {
  const key = getKeyFromRequest(req);
  if (!key) throw new Error('API key not provided. Please enter your key on the setup screen.');
  return new Anthropic({ apiKey: key });
}

// Multer — memory storage, max 10 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['application/pdf', 'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'].includes(file.mimetype)
      || file.originalname.match(/\.(pdf|txt|docx|doc)$/i);
    if (ok) cb(null, true);
    else cb(new Error('Only PDF, TXT, and DOCX files are supported'));
  },
});

// Lazy-load pdf-parse and mammoth to avoid startup errors
async function extractText(buffer, mimetype, originalname) {
  const ext = (originalname || '').split('.').pop().toLowerCase();
  if (mimetype === 'text/plain' || ext === 'txt') {
    return buffer.toString('utf-8');
  }
  if (mimetype === 'application/pdf' || ext === 'pdf') {
    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
    const result = await pdfParse(buffer);
    return result.text;
  }
  if (mimetype.includes('wordprocessingml') || ext === 'docx') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  return buffer.toString('utf-8');
}

// ─── System prompt ───────────────────────────────────────────────
const LEGAL_SYSTEM = `You are a senior Indian legal expert — an advocate with 25+ years of experience before the Supreme Court and High Courts.

Expert domains:
- Constitutional law, Fundamental Rights (Art. 12–35), Directive Principles
- Criminal: IPC 1860/BNS 2023, CrPC 1973/BNSS 2023, Evidence Act, NDPS, PMLA, UAPA
- Civil: CPC, Specific Relief Act, Limitation Act, Transfer of Property Act
- Corporate: Companies Act 2013, SEBI LODR/ICDR/PIT Regulations
- Finance: FEMA 1999, RBI Act, Banking Regulation Act, IBC 2016, SARFAESI
- Tax: Income Tax Act 1961, GST laws, Customs Act
- Labour: Industrial Disputes Act, Factories Act, EPF Act, POSH Act 2013
- IP: Patents Act 1970, Trade Marks Act 1999, Copyright Act 1957
- Consumer Protection Act 2019, IT Act 2000, DPDP Act 2023
- Arbitration & Conciliation Act 1996

Always cite specific section numbers, act names, case citations (e.g. AIR 2023 SC 1234 or (2023) 5 SCC 120).
Use Indian legal terminology correctly. Be precise and structured.`;

// ─── Search ──────────────────────────────────────────────────────
async function callSearch(params, req) {
  const { query, namespace = 'case_law', sources = [], topK = 10, dateStart, dateEnd } = params;
  const srcFilter = sources.length ? sources.join(', ') : 'all Indian sources';
  const dateFilter = dateStart || dateEnd
    ? ` Date range: ${dateStart || 'any'} to ${dateEnd || 'now'}.` : '';

  const resp = await getClient(req).messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 3000,
    system: `You are a legal retrieval system for Indian databases:
- IN/SCJudgments: Supreme Court (2021–2026, 3700 docs)
- IN/HighCourtAWS: High Courts (2025–2026, 454227 docs)
- IN/SEBI: SEBI orders/circulars (1993–2026)
- IN/RBI: RBI notifications/master directions (1978–2026)
- IN/IndiaCode: Central Acts 225+ (1838–2025)
- IN/eGazette: Official Gazette (2025–2026)
- IN/TRAI: TRAI regulations (2012–2026)

Return ONLY valid JSON (no markdown fences):
{"results":[{"id":"doc-id","source":"IN/SCJudgments","title":"Full case name with citation","date":"YYYY-MM-DD","court":"Court name","snippet":"2-3 sentence excerpt","score":0.95}]}

Use real Indian case names and citation formats like (2023) 5 SCC 120 or AIR 2022 SC 500.`,
    messages: [{
      role: 'user',
      content: `Search: "${query}"\nNamespace: ${namespace}\nSources: ${srcFilter}${dateFilter}\nReturn top ${Math.min(topK, 15)} results.`,
    }],
  });

  const raw = resp.content[0]?.text || '';
  const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  try { return JSON.parse(clean); }
  catch {
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) try { return JSON.parse(m[0]); } catch {}
    return { results: [] };
  }
}

// ─── Get document ─────────────────────────────────────────────────
async function callGetDocument(source, sourceId, req) {
  const resp = await getClient(req).messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    system: `You are a legal document retrieval system. Produce a realistic, detailed Indian legal document.
For case law: case number, bench, headnotes, brief facts, issues, counsel submissions, reasoning with section refs, holding.
For legislation: section text, explanations, provisos, illustrations.
For RBI/SEBI: circular number, subject, operative instructions.
Return JSON: {"text":"full document text"}`,
    messages: [{ role: 'user', content: `Fetch: source=${source}, id=${sourceId}` }],
  });
  const raw = resp.content[0]?.text || '';
  const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  try { return JSON.parse(clean); }
  catch { return { text: clean || 'Document not available.' }; }
}

// ─── Analyze ──────────────────────────────────────────────────────
async function callAnalyze(docText, question, req) {
  const content = docText?.trim()
    ? `DOCUMENT:\n${docText.slice(0, 14000)}\n\n---\nTASK:\n${question}`
    : question;
  const resp = await getClient(req).messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: LEGAL_SYSTEM,
    messages: [{ role: 'user', content }],
  });
  return { analysis: resp.content[0]?.text || '' };
}

// ─── Compliance (multi-turn with acts) ────────────────────────────
async function callCompliance({ scenario, domain, acts, docText }, req) {
  const actsClause = acts?.length
    ? `Focus specifically on these acts/regulations: ${acts.join(', ')}.`
    : 'Check against all applicable Indian laws and regulations.';

  const docClause = docText?.trim()
    ? `\n\nDOCUMENT PROVIDED FOR REVIEW:\n${docText.slice(0, 12000)}`
    : '';

  const prompt = `COMPLIANCE ANALYSIS REQUEST

SCENARIO / SITUATION:
${scenario}

DOMAIN: ${domain}
${actsClause}${docClause}

Produce a structured compliance report:

## Executive Summary
Risk level: [HIGH / MEDIUM / LOW] and 2-3 sentence summary.

## Applicable Laws & Regulations
List each relevant act/rule/regulation with section numbers and brief description of how it applies.

## Compliance Requirements
Step-by-step list of what must be done to achieve compliance.

## Key Case Law
Relevant Supreme Court / High Court precedents with citations and brief holdings.

## Regulatory Obligations
SEBI / RBI / TRAI / other regulatory requirements if applicable.

## Risk & Penalty Analysis
Specific penalties, fines, imprisonment terms, and enforcement risks under each act.

## Recommended Actions
Concrete prioritised next steps with timeline suggestions.

Be specific: cite section numbers, case citations, penalty amounts exactly.`;

  const resp = await getClient(req).messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: LEGAL_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  });
  return { analysis: resp.content[0]?.text || '' };
}

// ─── Contract review ──────────────────────────────────────────────
async function callContractReview({ docText, contractType, jurisdiction, focusAreas }, req) {
  const focus = focusAreas?.length ? `Focus areas: ${focusAreas.join(', ')}.` : '';
  const prompt = `CONTRACT REVIEW REQUEST

Contract type: ${contractType || 'General Commercial Contract'}
Governing law: ${jurisdiction || 'Indian law'}
${focus}

CONTRACT TEXT:
${docText.slice(0, 14000)}

Conduct a thorough legal review under Indian law:

## 1. Contract Overview
Type, parties, key obligations, governing law/jurisdiction clause.

## 2. Critical Issues (HIGH RISK)
Clauses that are illegal, unenforceable, or create serious liability under Indian law. Cite relevant sections.

## 3. Concerns (MEDIUM RISK)
Ambiguous clauses, unfavourable terms, missing protections, one-sided provisions.

## 4. Observations (LOW RISK / GOOD PRACTICE)
Minor improvements, best-practice suggestions.

## 5. Missing Clauses
Important standard clauses absent from this contract (force majeure, IP ownership, data protection, dispute resolution, etc.)

## 6. Indian Law Compliance
Check against: Contract Act 1872, Specific Relief Act, IT Act/DPDP Act (if data involved), labour laws, FEMA (if cross-border), Consumer Protection Act, Stamp Act.

## 7. Negotiation Points
Top 5 clauses to negotiate and suggested alternative wording.

## 8. Summary Scorecard
| Category | Score (1-10) | Comment |
Use a table.

Be specific: cite section numbers and case law.`;

  const resp = await getClient(req).messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: LEGAL_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  });
  return { analysis: resp.content[0]?.text || '' };
}

// ═══ Routes ══════════════════════════════════════════════════════

app.post('/api/search', async (req, res) => {
  try { res.json(await callSearch(req.body, req)); }
  catch (e) { res.status(500).json({ error: e.message, results: [] }); }
});

app.post('/api/document', async (req, res) => {
  try { res.json(await callGetDocument(req.body.source, req.body.sourceId, req)); }
  catch (e) { res.status(500).json({ error: e.message, text: 'Failed.' }); }
});

app.post('/api/analyze', async (req, res) => {
  try { res.json(await callAnalyze(req.body.docText || '', req.body.question, req)); }
  catch (e) { res.status(500).json({ error: e.message, analysis: '' }); }
});

app.post('/api/compliance', async (req, res) => {
  try { res.json(await callCompliance(req.body, req)); }
  catch (e) { res.status(500).json({ error: e.message, analysis: '' }); }
});

app.post('/api/contract-review', async (req, res) => {
  try { res.json(await callContractReview(req.body, req)); }
  catch (e) { res.status(500).json({ error: e.message, analysis: '' }); }
});

// File upload — parse PDF/DOCX/TXT, no AI call needed
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const text = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname);
    res.json({
      text: text.slice(0, 50000),
      filename: req.file.originalname,
      size: req.file.size,
      pages: text.split('\n\n').length,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Ready — server is always ready; key comes from browser
app.get('/api/ready', (req, res) => {
  res.json({ ready: true });
});

// Setup — validates key by making a test API call
app.post('/api/setup', async (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    return res.status(400).json({ error: 'Invalid API key format. Must start with sk-ant-' });
  }
  try {
    const testClient = new Anthropic({ apiKey });
    await testClient.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 5,
      messages: [{ role: 'user', content: 'hi' }],
    });
    res.json({ ok: true });
  } catch (e) {
    const msg = e.message || '';
    if (msg.includes('credit balance')) {
      // Valid key, just no credits — allow it through with a warning
      return res.json({ ok: true, warning: 'API key is valid but your credit balance is too low. Add credits at console.anthropic.com/billing.' });
    }
    return res.status(400).json({ error: 'API key is invalid. Please check and try again.' });
  }
});

app.get('/api/health', (req, res) => res.json({
  status: 'ok', model: 'claude-sonnet-4-6',
  sources: ['IN/SCJudgments', 'IN/HighCourtAWS', 'IN/SEBI', 'IN/RBI', 'IN/IndiaCode', 'IN/eGazette', 'IN/TRAI'],
}));

// Serve built React frontend in production
const DIST = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(DIST, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n⚖  NyayaAI backend  →  http://localhost:${PORT}\n`);
});
