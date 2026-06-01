import { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Save, Tag, Search, Edit3, Clock } from 'lucide-react';

const TAGS = ['Case Law', 'Legislation', 'Compliance', 'Contract', 'Research', 'SEBI', 'RBI', 'Criminal', 'Constitutional', 'Tax', 'Labour', 'Property', 'IP', 'Personal'];

const STORAGE_KEY = 'nyayaai_notes';

function loadNotes() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function fmtDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function NotesPage() {
  const [notes, setNotes]           = useState(loadNotes);
  const [selected, setSelected]     = useState(null);
  const [title, setTitle]           = useState('');
  const [body, setBody]             = useState('');
  const [tags, setTagsState]        = useState([]);
  const [search, setSearch]         = useState('');
  const [dirty, setDirty]           = useState(false);
  const [filterTag, setFilterTag]   = useState('');

  useEffect(() => {
    if (notes.length > 0 && !selected) openNote(notes[0].id);
  }, []);

  function openNote(id) {
    const n = notes.find(x => x.id === id);
    if (!n) return;
    setSelected(id);
    setTitle(n.title);
    setBody(n.body);
    setTagsState(n.tags || []);
    setDirty(false);
  }

  function newNote() {
    const id = Date.now().toString();
    const n = { id, title: 'Untitled Note', body: '', tags: [], created: Date.now(), updated: Date.now() };
    const updated = [n, ...notes];
    setNotes(updated);
    saveNotes(updated);
    openNote(id);
    setDirty(true);
  }

  function saveNote() {
    if (!selected) return;
    const updated = notes.map(n =>
      n.id === selected ? { ...n, title: title || 'Untitled', body, tags, updated: Date.now() } : n
    );
    setNotes(updated);
    saveNotes(updated);
    setDirty(false);
  }

  function deleteNote(id) {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
    if (selected === id) {
      setSelected(null); setTitle(''); setBody(''); setTagsState([]);
      if (updated.length) openNote(updated[0].id);
    }
  }

  function toggleTag(t) {
    setTagsState(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    setDirty(true);
  }

  const filteredNotes = notes.filter(n => {
    const q = search.toLowerCase();
    const matchSearch = !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
    const matchTag = !filterTag || (n.tags || []).includes(filterTag);
    return matchSearch && matchTag;
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <h2><BookOpen size={20} /> Legal Research Notes</h2>
            <p>Personal notes linked to your research — stored locally in browser</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={newNote}>
            <Plus size={14} /> New Note
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 73px)', overflow: 'hidden' }}>
        {/* ── Sidebar ── */}
        <div style={{
          width: 280, flexShrink: 0,
          borderRight: '1px solid var(--border)',
          background: 'var(--surface)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Search */}
          <div style={{ padding: '14px 14px 10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input className="input" style={{ paddingLeft: 30, fontSize: 12.5 }}
                placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {/* Tag filter */}
          <div style={{ padding: '0 14px 10px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <span className={`chip ${!filterTag ? 'active' : ''}`} style={{ fontSize: 11 }} onClick={() => setFilterTag('')}>All</span>
            {TAGS.filter(t => notes.some(n => (n.tags || []).includes(t))).map(t => (
              <span key={t} className={`chip ${filterTag === t ? 'active' : ''}`} style={{ fontSize: 11 }} onClick={() => setFilterTag(f => f === t ? '' : t)}>{t}</span>
            ))}
          </div>

          {/* Note list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px' }}>
            {filteredNotes.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', fontSize: 12.5, color: 'var(--muted)' }}>
                {notes.length === 0 ? 'No notes yet. Click + New Note.' : 'No matching notes.'}
              </div>
            )}
            {filteredNotes.map(n => (
              <div key={n.id} className={`note-card ${selected === n.id ? 'active' : ''}`}
                onClick={() => openNote(n.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="note-title">{n.title || 'Untitled'}</div>
                  <button className="btn btn-ghost" style={{ padding: '2px 5px', marginLeft: 4 }}
                    onClick={e => { e.stopPropagation(); deleteNote(n.id); }}>
                    <Trash2 size={12} color="var(--muted)" />
                  </button>
                </div>
                <div className="note-preview">{n.body || '(empty)'}</div>
                <div className="note-meta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} /> {fmtDate(n.updated)}
                  </span>
                  {(n.tags || []).slice(0, 2).map(t => (
                    <span key={t} className="tag tag-blue" style={{ fontSize: 10, padding: '1px 7px' }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Editor ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
          {selected ? (
            <>
              {/* Title bar */}
              <div style={{
                padding: '14px 24px', borderBottom: '1px solid var(--border)',
                background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <input
                  className="input"
                  style={{ flex: 1, fontSize: 16, fontWeight: 700, background: 'transparent', border: 'none', boxShadow: 'none', padding: '0' }}
                  placeholder="Note title…"
                  value={title}
                  onChange={e => { setTitle(e.target.value); setDirty(true); }}
                />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {dirty && <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>Unsaved</span>}
                  <button className="btn btn-primary btn-sm" onClick={saveNote} disabled={!dirty}>
                    <Save size={13} /> Save
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                <Tag size={13} color="var(--muted)" />
                {TAGS.map(t => (
                  <span key={t} className={`chip ${tags.includes(t) ? 'active' : ''}`}
                    style={{ fontSize: 11 }} onClick={() => toggleTag(t)}>{t}</span>
                ))}
              </div>

              {/* Body */}
              <textarea
                className="input"
                style={{
                  flex: 1, resize: 'none', border: 'none', borderRadius: 0,
                  background: 'var(--bg)', padding: '20px 24px',
                  fontSize: 14, lineHeight: 1.8, boxShadow: 'none',
                  fontFamily: "'Inter', sans-serif",
                }}
                placeholder="Start typing your legal research notes…

You can use Markdown:
# Heading
**Bold**, *italic*, `code`
- Bullet list
> Blockquote for citations

e.g. *Maneka Gandhi v Union of India* (1978) held that..."
                value={body}
                onChange={e => { setBody(e.target.value); setDirty(true); }}
                onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveNote(); } }}
              />

              <div style={{ padding: '8px 24px', borderTop: '1px solid var(--border)', fontSize: 11.5, color: 'var(--muted)', display: 'flex', gap: 16 }}>
                <span>{body.length.toLocaleString()} chars</span>
                <span>{body.split(/\s+/).filter(Boolean).length} words</span>
                <span>Ctrl+S to save</span>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ flex: 1 }}>
              <Edit3 size={36} />
              <p>Create a new note or select one from the list.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
