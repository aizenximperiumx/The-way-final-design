import React, { useRef, useState } from 'react';
import {
  FileUp, CheckCircle2, XCircle, RotateCcw, Clock, Loader2,
  FileText, Eye, Inbox,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore, type DocumentRequest } from '../../store/appStore';
import { uploadFileToStorage } from '../../lib/upload';
import { openStorageUrl } from '../../lib/storage';
import { EmptyState } from './ui';

/**
 * Requested-documents workflow (PRD §8).
 *  - Upload view: the student or agency sees what was requested, uploads each
 *    file and tracks Pending / Uploaded / Approved / Rejected.
 *  - Review view: staff/admin approve, reject or ask for a re-upload;
 *    approved files land in the student application automatically (store).
 */

const statusMeta: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border-amber-200',     icon: <Clock className="h-3 w-3" /> },
  uploaded:  { label: 'Uploaded',  cls: 'bg-blue-50 text-blue-700 border-blue-200',        icon: <FileUp className="h-3 w-3" /> },
  fulfilled: { label: 'Uploaded',  cls: 'bg-blue-50 text-blue-700 border-blue-200',        icon: <FileUp className="h-3 w-3" /> },
  approved:  { label: 'Approved',  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-3 w-3" /> },
  rejected:  { label: 'Rejected',  cls: 'bg-red-50 text-red-700 border-red-200',           icon: <XCircle className="h-3 w-3" /> },
};

export const RequestStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const m = statusMeta[status] ?? statusMeta.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${m.cls}`}>
      {m.icon} {m.label}
    </span>
  );
};

/* ── Upload view (student portal + agency portal) ── */
export const RequestedDocsUploader: React.FC<{
  requests: DocumentRequest[];
  mode: 'student' | 'agency';
}> = ({ requests, mode }) => {
  const { studentFulfillRequest, agentFulfillRequest } = useAppStore();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFile = async (req: DocumentRequest, file?: File) => {
    if (!file) return;
    setUploadingId(req.id);
    try {
      const url = await uploadFileToStorage(file);
      if (mode === 'agency') agentFulfillRequest(req.id, url);
      else studentFulfillRequest(req.id, url);
      toast.success(`"${req.title}" uploaded — waiting for review`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadingId(null);
    }
  };

  if (requests.length === 0) {
    return <EmptyState icon={Inbox} title="No requested documents" hint="When your advisor requests a document, it appears here." />;
  }

  return (
    <ul className="divide-y divide-gray-50">
      {requests.map((req) => {
        const canUpload = req.status === 'pending' || req.status === 'rejected';
        return (
          <li key={req.id} className="flex flex-col gap-2 px-4 sm:px-5 py-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-bold text-gray-900">{req.title}</p>
                <RequestStatusBadge status={req.status} />
                {(req.reuploadCount ?? 0) > 0 && (
                  <span className="text-[10px] font-semibold text-gray-400">re-upload #{req.reuploadCount}</span>
                )}
              </div>
              {req.description && <p className="mt-0.5 text-xs text-gray-500">{req.description}</p>}
              {req.reviewNote && (req.status === 'rejected' || req.status === 'pending') && (
                <p className="mt-0.5 text-xs font-semibold text-red-600">Reviewer: {req.reviewNote}</p>
              )}
              <p className="mt-0.5 text-[11px] text-gray-400">
                Requested by {req.requestedByName} · {new Date(req.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {req.fulfilledFile && (
                <button
                  onClick={() => void openStorageUrl(req.fulfilledFile as string)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" /> View
                </button>
              )}
              {canUpload && (
                <>
                  <input
                    ref={(el) => { fileRefs.current[req.id] = el; }}
                    type="file"
                    className="hidden"
                    onChange={(e) => void handleFile(req, e.target.files?.[0])}
                  />
                  <button
                    onClick={() => fileRefs.current[req.id]?.click()}
                    disabled={uploadingId === req.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0A1628] px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-[#132c50] transition-colors disabled:opacity-60"
                  >
                    {uploadingId === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
                    {req.status === 'rejected' ? 'Re-upload' : 'Upload'}
                  </button>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

/* ── Review view (staff / ops / CEO) ── */
export const RequestedDocsReviewer: React.FC<{
  requests: DocumentRequest[];
  /** Resolve a display name for the request's student. */
  studentName?: (req: DocumentRequest) => string;
}> = ({ requests, studentName }) => {
  const { reviewDocumentRequest } = useAppStore();
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [decision, setDecision] = useState<'rejected' | 'reupload'>('reupload');

  const act = (id: string, d: 'approved' | 'rejected' | 'reupload', n?: string) => {
    try {
      reviewDocumentRequest(id, d, n);
      toast.success(d === 'approved' ? 'Approved — file added to the application' : d === 'rejected' ? 'Rejected' : 'Re-upload requested');
      setNoteFor(null); setNote('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    }
  };

  if (requests.length === 0) {
    return <EmptyState icon={Inbox} title="Nothing to review" hint="Uploads appear here as soon as students or agents send them." />;
  }

  return (
    <ul className="divide-y divide-gray-50">
      {requests.map((req) => {
        const reviewable = req.status === 'uploaded' || req.status === 'fulfilled';
        return (
          <li key={req.id} className="px-4 sm:px-5 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-300" />
                  <p className="text-sm font-bold text-gray-900">{req.title}</p>
                  <RequestStatusBadge status={req.status} />
                  {req.target === 'agency' && <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-600">Agent upload</span>}
                </div>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  {studentName ? studentName(req) : ''}
                  {req.uploadedByName ? ` · uploaded by ${req.uploadedByName}` : ''}
                  {req.fulfilledAt ? ` · ${new Date(req.fulfilledAt).toLocaleString()}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {req.fulfilledFile && (
                  <button
                    onClick={() => void openStorageUrl(req.fulfilledFile as string)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" /> View file
                  </button>
                )}
                {reviewable && (
                  <>
                    <button
                      onClick={() => act(req.id, 'approved')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => { setNoteFor(req.id); setDecision('reupload'); setNote(''); }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Re-upload
                    </button>
                    <button
                      onClick={() => { setNoteFor(req.id); setDecision('rejected'); setNote(''); }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
            {noteFor === req.id && (
              <div className="mt-2 flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3 sm:flex-row">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={decision === 'rejected' ? 'Why is it rejected? (sent to the uploader)' : 'What should be fixed in the re-upload?'}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => act(req.id, decision, note)}
                    className="rounded-lg bg-[#0A1628] px-4 py-2 text-xs font-bold text-amber-400 hover:bg-[#132c50] transition-colors"
                  >
                    Confirm {decision === 'rejected' ? 'reject' : 're-upload'}
                  </button>
                  <button onClick={() => setNoteFor(null)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};
