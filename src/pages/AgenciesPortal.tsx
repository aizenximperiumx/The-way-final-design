import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Upload, Shield, Video, FileText, Send } from 'lucide-react';
import logoUrl from '../../1776590293988-019da507-f581-77e9-8281-8d60b280ccd6-removebg-preview.png';
import toast from 'react-hot-toast';
import { UNIVERSITY_OPTIONS, getUniversityName } from '../lib/universities';
import { getSupabase } from '../lib/supabase';

export default function AgenciesPortal() {
  const { user } = useAuth();
  const { addApplication, applications, documents, users, chatMessages, addChatMessage, agencyAddExtraDocs } = useAppStore();
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [pdfs, setPdfs] = useState<string[]>([]);
  const [passportCopyUrl, setPassportCopyUrl] = useState<string>('');
  const [highSchoolUrl, setHighSchoolUrl] = useState<string>('');
  const [extraDocs, setExtraDocs] = useState<string[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    age: '',
    country: '',
    phone: '',
    contactEmail: '',
    studentEmail: '',
    passportNumber: '',
    dob: '',
    nationality: '',
    secondNationality: '',
    homeAddress: '',
    university: '',
  });
  const [viewApp, setViewApp] = useState<{ open: boolean; id?: string }>({ open: false });

  const uploadWebhook = (import.meta.env as { VITE_FILE_UPLOAD_WEBHOOK?: string }).VITE_FILE_UPLOAD_WEBHOOK || '/api/upload-file';
  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.readAsDataURL(file);
    });
  const uploadFile = async (file: File) => {
    if (!uploadWebhook) return URL.createObjectURL(file);
    const dataBase64 = await toBase64(file);
    const supabase = getSupabase();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const resp = await fetch(uploadWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ filename: file.name, contentType: file.type, dataBase64 }),
    });
    const uploadData = (await resp.json()) as { url?: unknown };
    if (!resp.ok) throw new Error('Upload failed');
    if (!uploadData || typeof uploadData.url !== 'string') throw new Error('Upload did not return a URL');
    return uploadData.url;
  };

  const onFileVideo = (f: File | undefined) => {
    if (!f) {
      toast.error('No video file accessible. If selecting from iCloud/OneDrive, make sure it is downloaded locally.');
      return;
    }
    (async () => {
      try {
        const url = await uploadFile(f);
        setVideoUrl(url);
      } catch {
        try {
          setVideoUrl(URL.createObjectURL(f));
        } catch {
          toast.error('Unable to read video. Please copy it to a local folder (e.g., Downloads) and try again.');
        }
      }
    })();
  };
  const onPassportCopy = (f: File | undefined) => {
    if (!f) return;
    (async () => {
      try {
        const url = await uploadFile(f);
        setPassportCopyUrl(url);
      } catch {
        setPassportCopyUrl(URL.createObjectURL(f));
      }
    })();
  };
  const onHighSchool = (f: File | undefined) => {
    if (!f) return;
    (async () => {
      try {
        const url = await uploadFile(f);
        setHighSchoolUrl(url);
      } catch {
        setHighSchoolUrl(URL.createObjectURL(f));
      }
    })();
  };
  const onFilePdf = (files: FileList | null) => {
    if (!files) return;
    (async () => {
      try {
        const urls = await Promise.all(Array.from(files).map(async (f) => uploadFile(f)));
        setPdfs(urls);
      } catch {
        const urls: string[] = [];
        Array.from(files).forEach((f) => urls.push(URL.createObjectURL(f)));
        setPdfs(urls);
      }
    })();
  };
  const onFileExtra = (files: FileList | null) => {
    if (!files) return;
    (async () => {
      try {
        const urls = await Promise.all(Array.from(files).map(async (f) => uploadFile(f)));
        setExtraDocs(urls);
      } catch {
        const urls: string[] = [];
        Array.from(files).forEach((f) => urls.push(URL.createObjectURL(f)));
        setExtraDocs(urls);
      }
    })();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'agency') {
      toast.error('Agency login required');
      return;
    }
    if (!videoUrl) {
      toast.error('Please upload a video (min 40 seconds)');
      return;
    }
    const details = `Full name: ${form.fullName}
Age: ${form.age}
Country: ${form.country}
Phone: ${form.phone}
Contact email: ${form.contactEmail}
Student email: ${form.studentEmail}
Passport: ${form.passportNumber}
DOB: ${form.dob}
Nationality: ${form.nationality}
Second nationality: ${form.secondNationality}
Home address: ${form.homeAddress}
University: ${getUniversityName(form.university)}`;
    const application = {
      name: form.fullName,
      email: form.studentEmail,
      contactEmail: form.contactEmail,
      studentEmail: form.studentEmail,
      phone: form.phone,
      country: form.country,
      program: 'General',
      university: form.university || undefined,
      status: 'submitted' as const,
      stage: 'applied' as const,
      createdAt: new Date().toISOString(),
      internalNotes: [
        { id: Date.now().toString(), authorName: user.name, text: `Agency submission\nAge: ${form.age}\nPassport: ${form.passportNumber}\nDOB: ${form.dob}\nNationality: ${form.nationality}\nSecond: ${form.secondNationality}\nAddress: ${form.homeAddress}\nVideo: ${videoUrl}\nPDFs: ${pdfs.join(', ')}`, createdAt: new Date().toISOString() }
      ],
      source: 'agency' as const,
      agencyId: user.id,
      intakeDetails: details,
      intakeVideoUrl: videoUrl,
      intakePassportCopy: passportCopyUrl || undefined,
      intakeHighSchoolCertificate: highSchoolUrl || undefined,
      intakeAttachments: pdfs,
      intakeExtraDocs: extraDocs,
    };
    try {
      await addApplication(application);
      toast.success('Agency application submitted');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit');
      return;
    }
    setForm({
      fullName: '', age: '', country: '', phone: '', contactEmail: '', studentEmail: '', passportNumber: '', dob: '', nationality: '', secondNationality: '', homeAddress: '', university: '',
    });
    setVideoUrl('');
    setPdfs([]);
    setPassportCopyUrl('');
    setHighSchoolUrl('');
    setExtraDocs([]);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="The Way" className="h-12 w-auto object-contain" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Agencies Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60">{user?.role === 'agency' ? user.name : 'Login required'}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="tw-card tw-card-hover p-8">
          <h1 className="text-2xl font-black text-black mb-6">Submit New Student</h1>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Full name</label>
              <input className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Age</label>
              <input className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Country</label>
              <input className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Phone number</label>
              <input className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Contact Email</label>
              <input type="email" className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} required />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Student Email</label>
              <input type="email" className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={form.studentEmail} onChange={(e) => setForm({ ...form, studentEmail: e.target.value })} required />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Passport number</label>
              <input className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={form.passportNumber} onChange={(e) => setForm({ ...form, passportNumber: e.target.value })} required />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Date of birth</label>
              <input type="date" className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} required />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nationality</label>
              <input className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} required />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Second nationality (optional)</label>
              <input className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={form.secondNationality} onChange={(e) => setForm({ ...form, secondNationality: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Home address</label>
              <input className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={form.homeAddress} onChange={(e) => setForm({ ...form, homeAddress: e.target.value })} required />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">University to enroll</label>
              <select className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} required>
                <option value="" disabled>Select university</option>
                {UNIVERSITY_OPTIONS.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Upload video (&gt;=40s)</label>
              <div className="flex items-center gap-3">
              <input type="file" accept="video/*" capture onChange={(e) => onFileVideo(e.target.files?.[0])} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" />
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">Tip: If your video is in iCloud/OneDrive, mark it "Always keep on this device" or copy it to Downloads before uploading.</p>
                {videoUrl && <Video className="w-5 h-5 text-amber-500" />}
              </div>
            </div>
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Passport Copy</label>
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*,.pdf" onChange={(e) => onPassportCopy(e.target.files?.[0])} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">High School Certificate</label>
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*,.pdf" onChange={(e) => onHighSchool(e.target.files?.[0])} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" />
            </div>
          </div>
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Upload PDFs</label>
              <div className="flex items-center gap-3">
                <input multiple type="file" accept="application/pdf" onChange={(e) => onFilePdf(e.target.files)} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" />
                {pdfs.length > 0 && <FileText className="w-5 h-5 text-amber-500" />}
              </div>
            </div>
          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Extra Documents (optional)</label>
            <div className="flex items-center gap-3">
              <input multiple type="file" accept="application/pdf,image/*" onChange={(e) => onFileExtra(e.target.files)} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none" />
            </div>
          </div>

            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl font-black hover:bg-amber-500 hover:text-black transition-all">
                <Upload className="w-4 h-4" />
                Submit Application
              </button>
            </div>
          </form>
        </motion.div>
        {user?.role === 'agency' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="tw-card tw-card-hover p-8 mt-6">
            <h2 className="text-xl font-black text-black mb-6">My Submissions</h2>
            <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar">
              {applications.filter(a => (a.source ?? 'public') === 'agency' && a.agencyId === user.id).map((a) => {
                const steps = ['translation','university-approval','recognition-letter','ministry-order','visa-documents'] as const;
                const done = a.studentId ? steps.filter(s => documents.some(d => d.studentId === a.studentId && d.type === s && d.status === 'verified')).length : 0;
                const pct = Math.round((done / steps.length) * 100);
                const stepLabels: Record<typeof steps[number], string> = {
                  'translation': 'Documents translation',
                  'university-approval': 'University initial approval',
                  'recognition-letter': 'Recognition letter',
                  'ministry-order': 'Ministry order',
                  'visa-documents': 'Visa required documents',
                };
                const next = done < steps.length ? stepLabels[steps[done]] : 'All steps complete';
                return (
                <div key={a.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-black">{a.name}</p>
                    <div className="flex items-center gap-2">
                      {a.hold && (
                        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700">Needs Info</span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${a.status === 'approved' ? 'bg-green-100 text-green-700' : a.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{a.status}</span>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-gray-600 mt-1">{a.university ? getUniversityName(a.university) : '-'}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{new Date(a.createdAt).toLocaleDateString()}</p>
                  {a.status === 'approved' && (
                    <div className="mt-2">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-2 bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold mt-1">Progress: {done}/5 - Next: {next}</p>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {steps.map((s) => {
                          const has = a.studentId ? documents.some(d => d.studentId === a.studentId && d.type === s && d.status === 'verified') : false;
                          return (
                            <div key={s} className={`px-3 py-2 rounded-xl border text-[12px] font-bold ${has ? 'bg-green-50 border-green-100 text-green-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                              {stepLabels[s]}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="mt-2">
                    <button onClick={() => setViewApp({ open: true, id: a.id })} className="px-3 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-amber-500 hover:text-black transition-all">View Profile</button>
                  </div>
                </div>
              )})}
              {applications.filter(a => (a.source ?? 'public') === 'agency' && a.agencyId === user.id).length === 0 && (
                <p className="text-sm font-medium text-gray-500">No submissions yet</p>
              )}
            </div>
          </motion.div>
        )}
      </main>
      {viewApp?.open && (() => {
        const a = applications.find(x => x.id === viewApp.id);
        if (!a) return null;
        const steps = ['translation','university-approval','recognition-letter','ministry-order','visa-documents'];
        const done = a.studentId ? steps.filter(s => documents.some(d => d.studentId === a.studentId && d.type === s && d.status === 'verified')).length : 0;
        const pct = Math.round((done / steps.length) * 100);
        const staff = a.assignedStaffId ? users.find(u => u.id === a.assignedStaffId) : null;
        const thread = a.assignedStaffId
          ? chatMessages
            .filter(m =>
              m.applicationId === a.id &&
              ((m.userId === user?.id && m.toUserId === a.assignedStaffId) || (m.userId === a.assignedStaffId && m.toUserId === user?.id))
            )
            .slice()
            .sort((x, y) => new Date(x.time).getTime() - new Date(y.time).getTime())
          : [];
        return (
          <div className="fixed inset-0 z-[120] p-4 flex items-start justify-center overflow-y-auto">
            <div className="absolute inset-0 bg-black/60" onClick={() => setViewApp({ open: false })} />
            <div className="relative tw-card p-8 w-full max-w-3xl my-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <h3 className="text-2xl font-black text-black mb-6">Student Profile</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500">Name</p>
                  <p className="font-black">{a.name}</p>
                  <p className="text-xs font-bold text-gray-500 mt-2">University</p>
                  <p className="font-black">{a.university ? getUniversityName(a.university) : '-'}</p>
                  <div className="mt-4">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-2 bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-500 font-bold mt-1">Progress: {done}/5</p>
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {(['translation','university-approval','recognition-letter','ministry-order','visa-documents'] as const).map((s) => {
                        const has = a.studentId ? documents.some(d => d.studentId === a.studentId && d.type === s && d.status === 'verified') : false;
                        const label = s === 'translation' ? 'Documents translation'
                          : s === 'university-approval' ? 'University initial approval'
                          : s === 'recognition-letter' ? 'Recognition letter'
                          : s === 'ministry-order' ? 'Ministry order' : 'Visa required documents';
                        return (
                          <div key={s} className={`px-3 py-2 rounded-xl border text-[12px] font-bold ${has ? 'bg-green-50 border-green-100 text-green-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                            {label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {a.intakeVideoUrl && <video controls className="w-full rounded-2xl border border-gray-100" src={a.intakeVideoUrl} />}
                  <pre className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium whitespace-pre-wrap">{a.intakeDetails || 'No intake summary'}</pre>
                  <div className="flex flex-wrap gap-2">
                    {a.intakePassportCopy && <a href={a.intakePassportCopy} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black">Passport</a>}
                    {a.intakeHighSchoolCertificate && <a href={a.intakeHighSchoolCertificate} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] font-black">HS Certificate</a>}
                    {(a.intakeAttachments || []).map((p,i)=> <a key={i} href={p} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black">PDF {i+1}</a>)}
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-white border border-gray-100 rounded-[28px] p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Timeline</p>
                {(a.events ?? []).length === 0 ? (
                  <p className="text-sm font-medium text-gray-500">No activity yet.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-2">
                    {(a.events ?? [])
                      .slice()
                      .sort((x, y) => new Date(y.time).getTime() - new Date(x.time).getTime())
                      .slice(0, 12)
                      .map((ev) => (
                        <div key={ev.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-black">{ev.type.replaceAll('_', ' ')}</p>
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{ev.byName}</p>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400">{new Date(ev.time).toLocaleString()}</p>
                          </div>
                          {ev.details && <p className="text-sm font-medium text-gray-600 mt-2 whitespace-pre-wrap">{ev.details}</p>}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              {a.hold && (
                <div className="mt-6 bg-red-50 border border-red-100 rounded-[28px] p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-600">More info requested</p>
                  <p className="font-black text-black mt-1">{a.hold.message}</p>
                  <p className="text-[10px] font-bold text-red-600 mt-2">{a.hold.byName} - {new Date(a.hold.time).toLocaleString()}</p>
                  <div className="mt-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Upload additional documents</label>
                    <input
                      multiple
                      type="file"
                      accept="application/pdf,image/*,video/*"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        (async () => {
                          try {
                            const urls = await Promise.all(Array.from(files).map(async (f) => uploadFile(f)));
                            agencyAddExtraDocs(a.id, urls);
                            toast.success('Documents uploaded');
                          } catch (err) {
                            const msg = err instanceof Error ? err.message : 'Upload failed';
                            toast.error(msg);
                          } finally {
                            e.target.value = '';
                          }
                        })();
                      }}
                      className="mt-2 w-full px-5 py-3 bg-white rounded-2xl border border-red-100"
                    />
                  </div>
                </div>
              )}
              <div className="mt-6">
                {a.assignedStaffId && user?.role === 'agency' ? (
                  <div className="bg-gray-50 border border-gray-100 rounded-[28px] overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Chat with assigned admin</p>
                        <p className="font-black text-black">{staff?.name ?? 'Assigned Admin'}</p>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Per student</span>
                    </div>
                    <div className="p-6 max-h-64 overflow-y-auto custom-scrollbar space-y-3">
                      {thread.length === 0 ? (
                        <p className="text-sm font-medium text-gray-500">No messages yet.</p>
                      ) : (
                        thread.map((m) => {
                          const mine = m.userId === user.id;
                          return (
                            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                              <div className={`${mine ? 'bg-black text-white rounded-2xl rounded-tr-none' : 'bg-white border border-gray-200 rounded-2xl rounded-tl-none'} px-4 py-3 max-w-[80%]`}>
                                <p className="text-sm font-medium whitespace-pre-wrap">{m.text}</p>
                                <p className={`text-[10px] font-bold mt-2 ${mine ? 'text-white/40' : 'text-gray-400'}`}>{new Date(m.time).toLocaleString()}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="p-4 border-t border-gray-100 bg-white">
                      <div className="relative">
                        <input
                          value={chatDraft}
                          onChange={(e) => setChatDraft(e.target.value)}
                          placeholder="Type a message..."
                          className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                        <button
                          onClick={() => {
                            const msg = chatDraft.trim();
                            if (!msg || !a.assignedStaffId) return;
                            try {
                              addChatMessage(a.assignedStaffId, msg, a.id);
                              setChatDraft('');
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : 'Unable to send message');
                            }
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black text-white rounded-xl flex items-center justify-center hover:bg-amber-500 hover:text-black transition-all"
                          aria-label="Send"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium text-gray-500">
                    Chat will be available after an admin is assigned to this student.
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setViewApp({ open: false })} className="px-6 py-3 rounded-2xl font-black text-sm bg-black text-white hover:bg-amber-500 hover:text-black transition-all">Close</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}


