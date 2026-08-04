import React, { useRef, useState } from 'react';
import { X, Camera, Paperclip, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore, type Application } from '../../store/appStore';
import { uploadFileToStorage } from '../../lib/upload';
import { GOLD, NAVY, dim, goldA, card } from '../ui';
import DocScanner from '../DocScanner';

/**
 * Upload a document straight into a case from the phone — photograph it or
 * pick a file, name it, done. This is the reason an advisor can leave the
 * laptop closed: most of what they add to a file is a photographed letter.
 */

const PRESETS = [
  'Ministry order', 'Recognition letter', 'Acceptance letter', 'Translated document',
  'Visa document', 'Residency document', 'Passport copy', 'Other',
];

const UploadSheet: React.FC<{ app: Application; onClose: () => void }> = ({ app, onClose }) => {
  const staffUploadDocument = useAppStore(s => s.staffUploadDocument);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!file || !title.trim() || !app.studentId) return;
    setBusy(true);
    try {
      const url = await uploadFileToStorage(file);
      staffUploadDocument({
        studentId: app.studentId,
        title: title.trim(),
        type: title.trim(),
        file: url,
      });
      toast.success('Document added to the file');
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  if (scanning) {
    return (
      <DocScanner
        title={title || 'Document'}
        onCapture={(f) => { setFile(f); setScanning(false); }}
        onFallback={() => { setScanning(false); inputRef.current?.click(); }}
        onClose={() => setScanning(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(4,10,20,0.72)' }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-[28px] p-5"
        style={{
          background: 'linear-gradient(180deg,#0D1F3C,#0A1628)',
          borderTop: `1px solid ${goldA(0.2)}`,
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)',
        }}
      >
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-[11px] tracking-[2px] uppercase font-bold" style={{ color: GOLD }}>Add a document</p>
            <p className="v3-serif text-[21px] font-black mt-1" style={{ color: '#fff' }}>{app.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <X className="w-4 h-4" style={{ color: dim(0.7) }} />
          </button>
        </div>

        <p className="text-[11px] tracking-[2px] uppercase font-bold mt-5 mb-2.5" style={{ color: dim(0.5) }}>What is it</p>
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map(p => (
            <button
              key={p}
              onClick={() => setTitle(p === 'Other' ? '' : p)}
              className="px-3 py-2 rounded-full text-[11.5px] font-bold"
              style={title === p
                ? { background: GOLD, color: NAVY }
                : { background: 'rgba(255,255,255,0.05)', border: `1px solid ${goldA(0.14)}`, color: dim(0.65) }}
            >
              {p}
            </button>
          ))}
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Or type a name"
          className="w-full mt-3 px-4 rounded-2xl outline-none text-[14.5px]"
          style={{ ...card, height: 46, color: '#fff' }}
        />

        <p className="text-[11px] tracking-[2px] uppercase font-bold mt-5 mb-2.5" style={{ color: dim(0.5) }}>The file</p>
        {file ? (
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl" style={card}>
            <Paperclip className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
            <span className="flex-1 text-[13.5px] truncate" style={{ color: '#fff' }}>{file.name}</span>
            <button onClick={() => setFile(null)} className="text-[11px] font-bold uppercase" style={{ color: dim(0.55) }}>
              Change
            </button>
          </div>
        ) : (
          <div className="flex gap-2.5">
            <button
              onClick={() => setScanning(true)}
              className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[12px] font-black uppercase tracking-wider"
              style={{ background: goldA(0.14), color: GOLD, border: `1px solid ${goldA(0.22)}` }}
            >
              <Camera className="w-4 h-4" /> Photograph
            </button>
            <button
              onClick={() => inputRef.current?.click()}
              className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[12px] font-black uppercase tracking-wider"
              style={{ background: 'rgba(255,255,255,0.05)', color: dim(0.6), border: `1px solid ${goldA(0.12)}` }}
            >
              <Paperclip className="w-4 h-4" /> Choose file
            </button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f); }}
        />

        <button
          onClick={submit}
          disabled={!file || !title.trim() || busy}
          className="w-full mt-5 py-4 rounded-2xl text-[12px] font-black uppercase tracking-[1.5px] flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ background: GOLD, color: NAVY }}
        >
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading</> : 'Add to the file'}
        </button>
      </div>
    </div>
  );
};

export default UploadSheet;
