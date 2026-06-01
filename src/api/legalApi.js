// Legal Data Hunter API wrapper
// Calls the Claude Code MCP tools via a backend proxy
// In this webapp we call the backend which proxies to MCP tools

const BASE = '/api';

export async function searchLegal({ query, namespace = 'case_law', sources = [], topK = 10, dateStart, dateEnd }) {
  const res = await fetch(`${BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, namespace, sources, topK, dateStart, dateEnd }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getDocument(source, sourceId) {
  const res = await fetch(`${BASE}/document`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, sourceId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function analyzeJudgment(docText, question) {
  const res = await fetch(`${BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ docText, question }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function runComplianceCheck(scenario, domain) {
  const res = await fetch(`${BASE}/compliance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario, domain }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function correlateArticles(query) {
  const res = await fetch(`${BASE}/correlate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
