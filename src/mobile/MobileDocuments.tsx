import React, { useRef, useState } from 'react';
import { Camera as CameraIcon, Upload, FileText, Download, CheckCircle2, Clock, AlertCircle, ClipboardList } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useAppStore } from '../store/appStore';
import { getSupabase } from '../lib/supabase';
import { openStorageUrl } from '../lib/storage';
import MobileLayout from './MobileLayout';

const MobileDocuments: React.FC = () => {
  const { user } = useAuth();
  const { documents, documentRequests, studentFulfillRequest } = useAppStore();
  const [busy, setBusy] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const myDocs = documents.filter(d => d.studentId === user?.id);
  const myRequests = documentRequests.filter(r => r.studentId === user?.id && r.status === 'pending');

  const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,168,0,0.14)' };

  const uploadBase64 = async (reqId: string, dataBase64: string, filename: string, contentType: string) => {
    setBusy(reqId);
    try {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const resp = await fetch('/api/upload-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ filename, contentType, dataBase64 }),
      });
      const json = await resp.json().catch(() => null) as { url?: string; error?: string } | null;
      if (!resp.ok || !json?.url) throw new Error(json?.error ?? 'Upload failed');
      studentFulfillRequest(reqId, json.url);
      toast.success('Uploaded');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(null);
    }
  };

  const takePhoto = async (reqId: string) => {
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Upload document',
        promptLabelPhoto: 'Choose from gallery',
        promptLabelPicture: 'Take a photo',
      });
      if (photo.dataUrl) await uploadBase64(reqId, photo.dataUrl, `photo.${photo.format || 'jpg'}`, `image/${photo.format || 'jpeg'}`);
    } catch { /* user cancelled */ }
  };

  const onFile = (reqId: string, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === 'string') void uploadBase64(reqId, reader.result, file.name, file.type || 'application/octet-stream'); };
    reader.readAsDataURL(file);
  };

  const statusPill = (s: string) => {
    if (s === 'verified') return { t: 'Verified', bg: 'rgba(76,175,80,0.15)', c: '#7BE08A', Icon: CheckCircle2 };
    if (s === 'rejected') return { t: 'Rejected', bg: 'rgba(244,67,54,0.15)', c: '#FF8A80', Icon: AlertCircle };
    return { t: 'In review', bg: 'rgba(245,168,0,0.15)', c: 'var(--v3-yellow)', Icon: Clock };
  };

  return (
    <MobileLayout title="Documents">
      {/* Requested documents */}
      {myRequests.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-4 h-4" style={{ color: 'var(--v3-yellow)' }} />
            <p className="text-[11px] tracking-[2px] uppercase font-bold" style={{ color: 'var(--v3-yellow)' }}>Requested by your advisor</p>
          </div>
          <div className="space-y-3">
            {myRequests.map((req) => (
              <div key={req.id} className="rounded-2xl p-4" style={{ background: 'rgba(245,168,0,0.08)', border: '1px solid rgba(245,168,0,0.25)' }}>
                <p className="text-[14px] font-bold" style={{ color: 'var(--v3-white)' }}>{req.title}</p>
                {req.description && <p className="text-[12px] mt-0.5" style={{ color: 'rgba(245,240,232,0.6)' }}>{req.description}</p>}
                <input
                  ref={el => { fileRefs.current[req.id] = el; }}
                  type="file"
                  className="hidden"
                  onChange={(e) => { onFile(req.id, e.target.files?.[0]); e.target.value = ''; }}
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => void takePhoto(req.id)}
                    disabled={busy === req.id}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold disabled:opacity-60"
                    style={{ background: 'var(--v3-yellow)', color: 'var(--v3-navy)' }}
                  >
                    {busy === req.id ? <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" /> : <><CameraIcon className="w-4 h-4" /> Photo</>}
                  </button>
                  <button
                    onClick={() => fileRefs.current[req.id]?.click()}
                    disabled={busy === req.id}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold disabled:opacity-60"
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--v3-white)', border: '1px solid rgba(245,168,0,0.2)' }}
                  >
                    <Upload className="w-4 h-4" /> File
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* My documents */}
      <p className="mt-7 mb-3 text-[11px] tracking-[2px] uppercase font-bold" style={{ color: 'rgba(245,240,232,0.5)' }}>Your documents</p>
      {myDocs.length === 0 ? (
        <div className="rounded-2xl py-12 text-center" style={card}>
          <FileText className="w-9 h-9 mx-auto mb-3" style={{ color: 'rgba(245,240,232,0.25)' }} />
          <p className="text-[14px] font-semibold" style={{ color: 'var(--v3-white)' }}>No documents yet</p>
          <p className="text-[12px] mt-1" style={{ color: 'rgba(245,240,232,0.5)' }}>Documents from your advisor will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {myDocs.map((doc) => {
            const p = statusPill(doc.status);
            return (
              <div key={doc.id} className="rounded-2xl p-4 flex items-center gap-3" style={card}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,168,0,0.12)' }}>
                  <FileText className="w-5 h-5" style={{ color: 'var(--v3-yellow)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate" style={{ color: 'var(--v3-white)' }}>{doc.title}</p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: p.bg, color: p.c }}>
                    <p.Icon className="w-3 h-3" /> {p.t}
                  </span>
                </div>
                {doc.file && (
                  <button onClick={() => void openStorageUrl(doc.file!)} className="p-2.5 rounded-xl shrink-0" style={{ background: 'rgba(245,168,0,0.12)', color: 'var(--v3-yellow)' }}>
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </MobileLayout>
  );
};

export default MobileDocuments;
