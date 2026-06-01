import { useState, useRef } from 'react';
import { Upload, File, X, FileText, AlertCircle } from 'lucide-react';
import PrivacyConsent from './PrivacyConsent';

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function FileUpload({ onExtracted, label = 'Upload Document (PDF, DOCX, TXT)' }) {
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState(null);  // file waiting for consent
  const [showConsent, setShowConsent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();

  function handleFiles(files) {
    const file = files[0];
    if (!file) return;
    setPending(file);
    setShowConsent(true);
  }

  async function doUpload(file) {
    setUploading(true);
    setError('');
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setUploaded({ name: data.filename, size: file.size, pages: data.pages });
      onExtracted(data.text, data.filename);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  function onConsentAccept() {
    setShowConsent(false);
    if (pending) doUpload(pending);
    setPending(null);
  }

  function clearFile() {
    setUploaded(null);
    setError('');
    onExtracted('', '');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <>
      {showConsent && (
        <PrivacyConsent
          onAccept={onConsentAccept}
          onDecline={() => { setShowConsent(false); setPending(null); }}
        />
      )}

      {!uploaded && (
        <div
          className={`upload-zone ${dragging ? 'drag-over' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,.docx,.doc"
            style={{ display: 'none' }}
            onChange={e => handleFiles(e.target.files)}
          />
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Extracting text…</span>
            </div>
          ) : (
            <>
              <Upload size={28} className="upload-icon" />
              <p style={{ fontWeight: 600, color: 'var(--text2)', marginTop: 8 }}>{label}</p>
              <p style={{ fontSize: 12 }}>Drag & drop or click to browse · PDF, DOCX, TXT · Max 10 MB</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                A privacy consent will be shown before upload
              </p>
            </>
          )}
        </div>
      )}

      {uploaded && !uploading && (
        <div className="file-pill" style={{ width: '100%' }}>
          <FileText size={16} color="var(--blue)" style={{ flexShrink: 0 }} />
          <span className="file-name">{uploaded.name}</span>
          <span className="file-size">{formatSize(uploaded.size)}</span>
          <button className="btn btn-ghost" style={{ marginLeft: 'auto', padding: '2px 6px' }} onClick={clearFile}>
            <X size={13} />
          </button>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginTop: 8, fontSize: 12.5, color: 'var(--red)' }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}
    </>
  );
}
