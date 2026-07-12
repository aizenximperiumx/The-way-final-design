import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Shield, Video, FileText, Send, User, Award, TrendingUp, Building2, LogOut, ChevronRight, ChevronDown, CheckCircle2, Clock, XCircle } from 'lucide-react';
// Dark-text wordmark (the other logo's white text is invisible on this white header)
import logoUrl from '../../thewaynewlogo-removebg-preview.png';
import toast from 'react-hot-toast';
import { UNIVERSITY_OPTIONS, getUniversityName } from '../lib/universities';
import { getSupabase } from '../lib/supabase';
import { StatGrid, StatCard, DashboardSection } from '../components/dashboard/ui';
import { PipelineTracker } from '../components/dashboard/PipelineTracker';
import { RequestedDocsUploader } from '../components/dashboard/RequestedDocuments';

export default function AgenciesPortal() {
  const { user, logout } = useAuth();
  const { addApplication, applications, documents, users, chatMessages, addChatMessage, agencyAddExtraDocs, credentialRequests, agencyRequestCredentialChange, documentRequests } = useAppStore();
  const [credReqReason, setCredReqReason] = useState('');
  const [credReqOpen, setCredReqOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile'>('dashboard');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [pdfs, setPdfs] = useState<string[]>([]);
  const [passportCopyUrl, setPassportCopyUrl] = useState<string>('');
  const [highSchoolUrl, setHighSchoolUrl] = useState<string>('');
  const [noHighSchoolCertificate, setNoHighSchoolCertificate] = useState(false);
  const [highSchoolMissingNote, setHighSchoolMissingNote] = useState('');
  const [birthCertificateUrl, setBirthCertificateUrl] = useState<string>('');
  const [motherPassportUrl, setMotherPassportUrl] = useState<string>('');
  const [fatherPassportUrl, setFatherPassportUrl] = useState<string>('');
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
    aviationDegree: '',
    studyLevel: '',
  });
  const [viewApp, setViewApp] = useState<{ open: boolean; id?: string }>({ open: false });

  const calculateAge = (dob: string) => {
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
    if (age < 0 || age > 125) return null;
    return age;
  };

  const uploadWebhook = (import.meta.env as { VITE_FILE_UPLOAD_WEBHOOK?: string }).VITE_FILE_UPLOAD_WEBHOOK || '/api/upload-file';
  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.readAsDataURL(file);
    });
  const uploadFile = async (file: File) => {
    const dataBase64 = await toBase64(file);
    const supabase = getSupabase();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const resp = await fetch(uploadWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ filename: file.name, contentType: file.type, dataBase64 }),
    });
    const text = await resp.text().catch(() => '');
    const uploadData = (text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null) as { url?: unknown; error?: unknown; details?: unknown } | null;
    if (!resp.ok) {
      const err = uploadData && typeof uploadData.error === 'string' ? uploadData.error : 'Upload failed';
      const details =
        uploadData && typeof uploadData.details === 'string'
          ? uploadData.details
          : (uploadData && uploadData.details != null ? JSON.stringify(uploadData.details) : '');
      throw new Error(details ? `${err}: ${details.slice(0, 200)}` : err);
    }
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
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Video upload failed');
      }
    })();
  };
  const onPassportCopy = (f: File | undefined) => {
    if (!f) return;
    (async () => {
      try {
        const url = await uploadFile(f);
        setPassportCopyUrl(url);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Passport copy upload failed');
      }
    })();
  };
  const onHighSchool = (f: File | undefined) => {
    if (!f) return;
    (async () => {
      try {
        const url = await uploadFile(f);
        setHighSchoolUrl(url);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'High school certificate upload failed');
      }
    })();
  };
  const onBirthCertificate = (f: File | undefined) => {
    if (!f) return;
    (async () => {
      try {
        const url = await uploadFile(f);
        setBirthCertificateUrl(url);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Birth certificate upload failed');
      }
    })();
  };
  const onMotherPassport = (f: File | undefined) => {
    if (!f) return;
    (async () => {
      try {
        const url = await uploadFile(f);
        setMotherPassportUrl(url);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Mother's passport upload failed");
      }
    })();
  };
  const onFatherPassport = (f: File | undefined) => {
    if (!f) return;
    (async () => {
      try {
        const url = await uploadFile(f);
        setFatherPassportUrl(url);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Father's passport upload failed");
      }
    })();
  };
  const onFilePdf = (files: FileList | null) => {
    if (!files) return;
    (async () => {
      try {
        const urls = await Promise.all(Array.from(files).map(async (f) => uploadFile(f)));
        setPdfs(urls);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'PDF upload failed');
      }
    })();
  };
  const onFileExtra = (files: FileList | null) => {
    if (!files) return;
    (async () => {
      try {
        const urls = await Promise.all(Array.from(files).map(async (f) => uploadFile(f)));
        setExtraDocs(urls);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Extra document upload failed');
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
    const age = calculateAge(form.dob);
    if (age == null) {
      toast.error('Please enter a valid date of birth');
      return;
    }
    const underage = age < 18;
    if (underage) {
      if (!birthCertificateUrl) {
        toast.error('Birth certificate is required for underage students');
        return;
      }
      if (!motherPassportUrl) {
        toast.error("Mother's passport is required for underage students");
        return;
      }
      if (!fatherPassportUrl) {
        toast.error("Father's passport is required for underage students");
        return;
      }
    }
    if (!noHighSchoolCertificate && !highSchoolUrl) {
      toast.error('Please upload the high school certificate (or mark it as not available)');
      return;
    }
    if (noHighSchoolCertificate && !highSchoolMissingNote.trim()) {
      toast.error('Please write a comment about missing high school certificate');
      return;
    }
    const details = `Full name: ${form.fullName}
Age: ${age}
Country: ${form.country}
Phone: ${form.phone}
Contact email: ${form.contactEmail}
Student email: ${form.studentEmail}
Passport: ${form.passportNumber}
DOB: ${form.dob}
Nationality: ${form.nationality}
Second nationality: ${form.secondNationality}
Home address: ${form.homeAddress}
University: ${getUniversityName(form.university)}
Aviation Degree: ${form.aviationDegree}
Study Level: ${form.studyLevel}
High School Note: ${noHighSchoolCertificate ? highSchoolMissingNote : ''}
Underage: ${underage ? 'Yes' : 'No'}`;
    const application = {
      name: form.fullName,
      email: form.studentEmail,
      contactEmail: form.contactEmail,
      studentEmail: form.studentEmail,
      phone: form.phone,
      country: form.country,
      dob: form.dob,
      program: form.aviationDegree ? `Aviation: ${form.aviationDegree}` : 'General',
      university: form.university || undefined,
      status: 'submitted' as const,
      stage: 'applied' as const,
      createdAt: new Date().toISOString(),
      internalNotes: [
        { id: Date.now().toString(), authorName: user.name, text: `Agency submission\nAge: ${age}\nPassport: ${form.passportNumber}\nDOB: ${form.dob}\nNationality: ${form.nationality}\nSecond: ${form.secondNationality}\nAddress: ${form.homeAddress}\nAviation: ${form.aviationDegree}\nLevel: ${form.studyLevel}\nHigh School Note: ${noHighSchoolCertificate ? highSchoolMissingNote : ''}\nUnderage: ${underage ? 'Yes' : 'No'}\nVideo: ${videoUrl}\nPDFs: ${pdfs.join(', ')}`, createdAt: new Date().toISOString() }
      ],
      source: 'agency' as const,
      agencyId: user.id,
      intakeDetails: details,
      intakeVideoUrl: videoUrl,
      intakePassportCopy: passportCopyUrl || undefined,
      intakeHighSchoolCertificate: (!noHighSchoolCertificate ? (highSchoolUrl || undefined) : undefined),
      intakeHighSchoolMissingNote: (noHighSchoolCertificate ? highSchoolMissingNote.trim() : undefined),
      intakeBirthCertificate: (underage ? birthCertificateUrl : undefined),
      intakeMotherPassport: (underage ? motherPassportUrl : undefined),
      intakeFatherPassport: (underage ? fatherPassportUrl : undefined),
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
      fullName: '', age: '', country: '', phone: '', contactEmail: '', studentEmail: '', passportNumber: '', dob: '', nationality: '', secondNationality: '', homeAddress: '', university: '', aviationDegree: '', studyLevel: '',
    });
    setVideoUrl('');
    setPdfs([]);
    setPassportCopyUrl('');
    setHighSchoolUrl('');
    setNoHighSchoolCertificate(false);
    setHighSchoolMissingNote('');
    setBirthCertificateUrl('');
    setMotherPassportUrl('');
    setFatherPassportUrl('');
    setExtraDocs([]);
  };

  // ─── helpers ───────────────────────────────────────────────────────────────
  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none bg-white';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';
  const sectionHeadingCls = 'text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4';
  const uploadZoneCls = 'border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-amber-400 hover:bg-amber-50/30 transition-all cursor-pointer';

  const statusBadge = (status: string) => {
    if (status === 'approved') return 'bg-green-100 text-green-700';
    if (status === 'rejected') return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
  };

  const myApps = applications.filter(a => a.agencyId === user?.id);
  // Documents the admin team requested from THIS agency (agent workflow, PRD §8).
  const myDocRequests = documentRequests
    .filter(r => r.target === 'agency' && r.agencyId === user?.id)
    .sort((a, b) => {
      const open = (s: string) => (s === 'pending' || s === 'rejected' ? 0 : 1);
      return open(a.status) - open(b.status) || b.createdAt.localeCompare(a.createdAt);
    });
  const openDocRequests = myDocRequests.filter(r => r.status === 'pending' || r.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Logo + agency name */}
          <div className="flex items-center gap-3 shrink-0">
            <img src={logoUrl} alt="The Way" className="h-8 w-auto object-contain" />
            <div className="hidden sm:block h-5 w-px bg-gray-200" />
            <span className="hidden sm:block text-sm font-semibold text-gray-800">{user?.name}</span>
          </div>

          {/* Tab nav */}
          <nav className="flex items-center gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Building2 },
              { id: 'profile', label: 'Profile & Intake', icon: User },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'dashboard' | 'profile')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'text-amber-600 bg-amber-50 border-b-2 border-amber-600'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* User info + logout */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              {user?.points ?? 0} pts
            </div>
            <button
              onClick={() => logout()}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* ═══════════════════════════════════════════════════════════════
              DASHBOARD TAB
          ════════════════════════════════════════════════════════════════ */}
          {activeTab === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Stats row */}
              <StatGrid cols={4}>
                {([
                  { label: 'Total Students', value: myApps.length, icon: FileText, tone: 'blue' as const },
                  { label: 'Approved', value: myApps.filter(a => a.status === 'approved').length, icon: CheckCircle2, tone: 'green' as const },
                  { label: 'Pending', value: myApps.filter(a => a.status === 'submitted').length, icon: Clock, tone: 'amber' as const },
                  { label: 'Documents', value: documents.filter(d => applications.some(a => a.studentId === d.studentId && a.agencyId === user?.id)).length, icon: Shield, tone: 'purple' as const },
                ]).map((stat, i) => (
                  <StatCard key={i} label={stat.label} value={stat.value} icon={stat.icon} tone={stat.tone} />
                ))}
              </StatGrid>

              {/* Requested documents — the agent upload workflow (PRD §8) */}
              {myDocRequests.length > 0 && (
                <DashboardSection
                  title="Documents requested from you"
                  icon={Upload}
                  count={openDocRequests > 0 ? `${openDocRequests} to upload` : 'all handled'}
                >
                  <RequestedDocsUploader requests={myDocRequests} mode="agency" />
                </DashboardSection>
              )}

              {/* My Students list */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">My Students</h2>
                  <span className="text-xs text-gray-400 font-medium">{myApps.length} total</span>
                </div>

                {myApps.length === 0 ? (
                  <div className="px-6 py-14 text-center">
                    <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 font-medium">No students yet. Submit your first application below.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {myApps.map((app) => (
                      <div key={app.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors">
                        {/* Avatar + name */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center font-semibold text-sm shrink-0">
                            {app.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{app.name}</p>
                            <p className="text-xs text-gray-400 truncate">{app.studentEmail || app.email}</p>
                          </div>
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-6 flex-wrap">
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-0.5">Program</p>
                            <p className="text-xs font-semibold text-gray-700">{app.program}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-0.5">Date</p>
                            <p className="text-xs font-semibold text-gray-700">{new Date(app.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className={`rounded-full text-xs font-semibold px-2.5 py-0.5 ${statusBadge(app.status)}`}>
                            {app.status}
                          </span>
                        </div>

                        {/* Action */}
                        <button
                          onClick={() => setViewApp({ open: true, id: app.id })}
                          className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-all"
                        >
                          Details
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit New Student form */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-base font-semibold text-gray-900">Submit New Student</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Fill in all required fields and upload the necessary documents.</p>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-8">

                  {/* Section: Personal Information */}
                  <div>
                    <p className={sectionHeadingCls}>Personal Information</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Full Name <span className="text-red-400">*</span></label>
                        <input className={inputCls} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required placeholder="e.g. John Smith" />
                      </div>
                      <div>
                        <label className={labelCls}>Date of Birth <span className="text-red-400">*</span></label>
                        <input
                          type="date"
                          className={inputCls}
                          value={form.dob}
                          onChange={(e) => setForm({ ...form, dob: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Age (calculated)</label>
                        <input
                          className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`}
                          value={form.dob ? (calculateAge(form.dob) == null ? '' : String(calculateAge(form.dob)!)) : ''}
                          readOnly
                          placeholder="Auto-calculated from DOB"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Nationality <span className="text-red-400">*</span></label>
                        <input className={inputCls} value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} required placeholder="e.g. Georgian" />
                      </div>
                      <div>
                        <label className={labelCls}>Second Nationality</label>
                        <input className={inputCls} value={form.secondNationality} onChange={(e) => setForm({ ...form, secondNationality: e.target.value })} placeholder="Optional" />
                      </div>
                      <div>
                        <label className={labelCls}>Passport Number <span className="text-red-400">*</span></label>
                        <input className={inputCls} value={form.passportNumber} onChange={(e) => setForm({ ...form, passportNumber: e.target.value })} required placeholder="e.g. AB1234567" />
                      </div>
                      <div>
                        <label className={labelCls}>Country <span className="text-red-400">*</span></label>
                        <input className={inputCls} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required placeholder="Country of residence" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Home Address <span className="text-red-400">*</span></label>
                        <input className={inputCls} value={form.homeAddress} onChange={(e) => setForm({ ...form, homeAddress: e.target.value })} required placeholder="Full home address" />
                      </div>
                    </div>
                  </div>

                  {/* Section: Contact */}
                  <div>
                    <p className={sectionHeadingCls}>Contact Details</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Contact Email <span className="text-red-400">*</span></label>
                        <input type="email" className={inputCls} value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} required placeholder="Agency contact email" />
                      </div>
                      <div>
                        <label className={labelCls}>Student Email <span className="text-red-400">*</span></label>
                        <input type="email" className={inputCls} value={form.studentEmail} onChange={(e) => setForm({ ...form, studentEmail: e.target.value })} required placeholder="Student's own email" />
                      </div>
                      <div>
                        <label className={labelCls}>Phone Number <span className="text-red-400">*</span></label>
                        <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="+995 555 000 000" />
                      </div>
                    </div>
                  </div>

                  {/* Section: Academic */}
                  <div>
                    <p className={sectionHeadingCls}>Academic Information</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className={labelCls}>University to Enroll <span className="text-red-400">*</span></label>
                        <select className={inputCls} value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} required>
                          <option value="" disabled>Select university…</option>
                          {UNIVERSITY_OPTIONS.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Study Level <span className="text-red-400">*</span></label>
                        <select className={inputCls} value={form.studyLevel} onChange={(e) => setForm({ ...form, studyLevel: e.target.value })} required>
                          <option value="" disabled>Select level…</option>
                          <option value="bachelor">Bachelor's</option>
                          <option value="master">Master's</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Aviation Degree</label>
                        <select className={inputCls} value={form.aviationDegree} onChange={(e) => setForm({ ...form, aviationDegree: e.target.value })}>
                          <option value="">None / Not Aviation</option>
                          <option value="pilot">Commercial Pilot License (CPL)</option>
                          <option value="atpl">Airline Transport Pilot License (ATPL)</option>
                          <option value="engineering">Aviation Engineering</option>
                          <option value="management">Aviation Management</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section: Documents */}
                  <div>
                    <p className={sectionHeadingCls}>Documents & Media</p>
                    <div className="grid sm:grid-cols-2 gap-4">

                      {/* Video */}
                      <div>
                        <label className={labelCls}>
                          Intro Video <span className="text-red-400">*</span>
                          <span className="ml-1 text-xs text-gray-400 font-normal">(min 40 seconds)</span>
                        </label>
                        <label className={uploadZoneCls}>
                          <input type="file" accept="video/*" capture onChange={(e) => onFileVideo(e.target.files?.[0])} className="sr-only" />
                          <div className="flex flex-col items-center gap-2">
                            {videoUrl ? (
                              <>
                                <Video className="w-6 h-6 text-amber-500" />
                                <span className="text-xs font-semibold text-amber-600">Video uploaded</span>
                              </>
                            ) : (
                              <>
                                <Video className="w-6 h-6 text-gray-300" />
                                <span className="text-xs text-gray-400">Click to upload video</span>
                              </>
                            )}
                          </div>
                        </label>
                      </div>

                      {/* Passport Copy */}
                      <div>
                        <label className={labelCls}>Passport Copy</label>
                        <label className={uploadZoneCls}>
                          <input type="file" accept="image/*,.pdf" onChange={(e) => onPassportCopy(e.target.files?.[0])} className="sr-only" />
                          <div className="flex flex-col items-center gap-2">
                            {passportCopyUrl ? (
                              <>
                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                                <span className="text-xs font-semibold text-green-600">Passport uploaded</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-6 h-6 text-gray-300" />
                                <span className="text-xs text-gray-400">Click to upload passport copy</span>
                              </>
                            )}
                          </div>
                        </label>
                      </div>

                      {/* High School Certificate */}
                      <div className="sm:col-span-2">
                        <label className={labelCls}>High School Certificate</label>
                        {!noHighSchoolCertificate && (
                          <label className={`${uploadZoneCls} mb-3`}>
                            <input type="file" accept="image/*,.pdf" onChange={(e) => onHighSchool(e.target.files?.[0])} className="sr-only" />
                            <div className="flex flex-col items-center gap-2">
                              {highSchoolUrl ? (
                                <>
                                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                                  <span className="text-xs font-semibold text-green-600">Certificate uploaded</span>
                                </>
                              ) : (
                                <>
                                  <FileText className="w-6 h-6 text-gray-300" />
                                  <span className="text-xs text-gray-400">Click to upload certificate</span>
                                </>
                              )}
                            </div>
                          </label>
                        )}
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={noHighSchoolCertificate}
                            onChange={(e) => {
                              setNoHighSchoolCertificate(e.target.checked);
                              if (!e.target.checked) setHighSchoolMissingNote('');
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-sm text-gray-600 font-medium">Student does not have a high school certificate</span>
                        </label>
                        {noHighSchoolCertificate && (
                          <textarea
                            value={highSchoolMissingNote}
                            onChange={(e) => setHighSchoolMissingNote(e.target.value)}
                            className={`${inputCls} mt-3 min-h-[80px] resize-none`}
                            placeholder="Write the reason or comment…"
                          />
                        )}
                      </div>

                      {/* Underage documents */}
                      {(() => {
                        const age = form.dob ? calculateAge(form.dob) : null;
                        const underage = age != null && age < 18;
                        if (!underage) return null;
                        return (
                          <>
                            <div className="sm:col-span-2">
                              <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-semibold">
                                Student is under 18 — parental documents required.
                              </div>
                            </div>
                            <div>
                              <label className={labelCls}>Birth Certificate <span className="text-red-400">*</span></label>
                              <label className={uploadZoneCls}>
                                <input type="file" accept="image/*,.pdf" onChange={(e) => onBirthCertificate(e.target.files?.[0])} className="sr-only" />
                                <div className="flex flex-col items-center gap-2">
                                  {birthCertificateUrl ? (
                                    <>
                                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                                      <span className="text-xs font-semibold text-green-600">Uploaded</span>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-6 h-6 text-gray-300" />
                                      <span className="text-xs text-gray-400">Birth certificate</span>
                                    </>
                                  )}
                                </div>
                              </label>
                            </div>
                            <div>
                              <label className={labelCls}>Mother's Passport <span className="text-red-400">*</span></label>
                              <label className={uploadZoneCls}>
                                <input type="file" accept="image/*,.pdf" onChange={(e) => onMotherPassport(e.target.files?.[0])} className="sr-only" />
                                <div className="flex flex-col items-center gap-2">
                                  {motherPassportUrl ? (
                                    <>
                                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                                      <span className="text-xs font-semibold text-green-600">Uploaded</span>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-6 h-6 text-gray-300" />
                                      <span className="text-xs text-gray-400">Mother's passport</span>
                                    </>
                                  )}
                                </div>
                              </label>
                            </div>
                            <div>
                              <label className={labelCls}>Father's Passport <span className="text-red-400">*</span></label>
                              <label className={uploadZoneCls}>
                                <input type="file" accept="image/*,.pdf" onChange={(e) => onFatherPassport(e.target.files?.[0])} className="sr-only" />
                                <div className="flex flex-col items-center gap-2">
                                  {fatherPassportUrl ? (
                                    <>
                                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                                      <span className="text-xs font-semibold text-green-600">Uploaded</span>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-6 h-6 text-gray-300" />
                                      <span className="text-xs text-gray-400">Father's passport</span>
                                    </>
                                  )}
                                </div>
                              </label>
                            </div>
                          </>
                        );
                      })()}

                      {/* PDFs */}
                      <div>
                        <label className={labelCls}>Supporting PDFs</label>
                        <label className={uploadZoneCls}>
                          <input multiple type="file" accept="application/pdf" onChange={(e) => onFilePdf(e.target.files)} className="sr-only" />
                          <div className="flex flex-col items-center gap-2">
                            {pdfs.length > 0 ? (
                              <>
                                <FileText className="w-6 h-6 text-amber-500" />
                                <span className="text-xs font-semibold text-amber-600">{pdfs.length} PDF{pdfs.length > 1 ? 's' : ''} uploaded</span>
                              </>
                            ) : (
                              <>
                                <FileText className="w-6 h-6 text-gray-300" />
                                <span className="text-xs text-gray-400">Click to upload PDFs (multiple allowed)</span>
                              </>
                            )}
                          </div>
                        </label>
                      </div>

                      {/* Extra docs */}
                      <div>
                        <label className={labelCls}>Extra Documents <span className="text-xs text-gray-400 font-normal">(optional)</span></label>
                        <label className={uploadZoneCls}>
                          <input multiple type="file" accept="application/pdf,image/*" onChange={(e) => onFileExtra(e.target.files)} className="sr-only" />
                          <div className="flex flex-col items-center gap-2">
                            {extraDocs.length > 0 ? (
                              <>
                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                                <span className="text-xs font-semibold text-green-600">{extraDocs.length} file{extraDocs.length > 1 ? 's' : ''} uploaded</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-6 h-6 text-gray-300" />
                                <span className="text-xs text-gray-400">Any additional files</span>
                              </>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end pt-2 border-t border-gray-100">
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-amber-600 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-amber-700 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Submit Application
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>

          ) : (
            /* ═══════════════════════════════════════════════════════════════
                PROFILE / INTAKE TAB
            ════════════════════════════════════════════════════════════════ */
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: profile + performance */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Agency info card */}
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0">
                        {user?.name.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">{user?.name}</h2>
                        <p className="text-sm text-gray-400">Official Partner Agency</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold">
                            <Award className="w-3 h-3" />
                            Tier 1 Partner
                          </span>
                          <span className="text-xs text-gray-400">
                            Since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 pt-5 border-t border-gray-100">
                      {[
                        { label: 'Agency ID', value: user?.id.slice(0, 8) },
                        { label: 'Email Address', value: user?.email },
                        { label: 'Portal Username', value: `@${user?.username}` },
                        { label: 'Total Points', value: `${user?.points ?? 0} pts`, highlight: true },
                      ].map((row) => (
                        <div key={row.label}>
                          <p className="text-xs text-gray-400 font-medium mb-0.5">{row.label}</p>
                          <p className={`text-sm font-semibold ${row.highlight ? 'text-amber-600' : 'text-gray-800'}`}>{row.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-5 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-500" />
                      Agency Performance
                    </h3>
                    {(() => {
                      const approved = myApps.filter(a => a.status === 'approved').length;
                      const total = myApps.length;
                      const rate = total > 0 ? Math.round((approved / total) * 100) : 0;
                      return (
                        <div className="space-y-5">
                          <div className="grid sm:grid-cols-3 gap-4">
                            {[
                              { label: 'Success Rate', value: `${rate}%` },
                              { label: 'Active Students', value: myApps.filter(a => a.status === 'approved' && a.stage !== 'enrolled').length },
                              { label: 'Points Earned', value: user?.points ?? 0 },
                            ].map((m) => (
                              <div key={m.label} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                                <p className="text-xs text-gray-400 font-medium mb-1">{m.label}</p>
                                <p className="text-xl font-bold text-gray-900">{m.value}</p>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div className="flex justify-between mb-1.5">
                              <p className="text-xs font-medium text-gray-500">Tier 1</p>
                              <p className="text-xs font-medium text-gray-500">Tier 2 — 1,000 pts</p>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full transition-all"
                                style={{ width: `${Math.min((user?.points ?? 0) / 10, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Right: leaderboard + support */}
                <div className="space-y-6">
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Agencies</h3>
                    <div className="space-y-2">
                      {users
                        .filter(u => u.role === 'agency')
                        .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
                        .slice(0, 5)
                        .map((u, i) => (
                          <div
                            key={u.id}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${
                              u.id === user?.id ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                {i + 1}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                                <p className="text-xs text-gray-400">{u.points ?? 0} pts</p>
                              </div>
                            </div>
                            {u.id === user?.id && <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />}
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Support */}
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Partner Support</h3>
                    <p className="text-xs text-gray-400 mb-4">Need help with an application or special request?</p>
                    <a
                      href="mailto:partners@theway.ge"
                      className="flex items-center justify-between px-4 py-3 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors group"
                    >
                      Contact Manager
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ─── Application Detail Modal ─── */}
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
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setViewApp({ open: false })} />
            <div className="relative bg-white border border-gray-100 rounded-2xl shadow-sm w-full max-w-3xl my-10 overflow-y-auto max-h-[90vh]">

              {/* Modal header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{a.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{a.studentEmail || a.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full text-xs font-semibold px-2.5 py-0.5 ${statusBadge(a.status)}`}>{a.status}</span>
                  <button
                    onClick={() => setViewApp({ open: false })}
                    className="text-gray-400 hover:text-gray-700 text-xs font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="px-6 py-6 space-y-6">
                {/* Student login credentials (agency-managed) */}
                {a.status === 'approved' && a.studentCredentials && (() => {
                  const pendingReq = credentialRequests.find(r => r.applicationId === a.id && r.status === 'pending');
                  return (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4 text-amber-600" />
                        <p className="text-sm font-bold text-gray-900">Student Login</p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Username</p>
                          <p className="text-sm font-mono font-semibold text-gray-900 break-all">{a.studentCredentials.username}</p>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Password</p>
                          <p className="text-xs font-semibold text-gray-500 mt-0.5">
                            Sent to you by email when created — for security it is never stored here.
                          </p>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2">Lost access? Request a reset below — a new password is emailed to you after CEO approval.</p>

                      {pendingReq ? (
                        <div className="mt-3 flex items-center gap-2 rounded-xl bg-white border border-amber-200 px-3 py-2">
                          <Clock className="w-4 h-4 text-amber-500" />
                          <p className="text-xs font-semibold text-amber-700">Change request pending CEO approval</p>
                        </div>
                      ) : credReqOpen ? (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={credReqReason}
                            onChange={(e) => setCredReqReason(e.target.value)}
                            rows={3}
                            placeholder="Why do these credentials need to change? (e.g. student lost access, suspected sharing…)"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setCredReqOpen(false); setCredReqReason(''); }} className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">Cancel</button>
                            <button
                              onClick={() => {
                                try {
                                  agencyRequestCredentialChange(a.id, credReqReason);
                                  toast.success('Request sent to the CEO');
                                  setCredReqOpen(false); setCredReqReason('');
                                } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not send request'); }
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-bold hover:bg-amber-700"
                            >
                              <Send className="w-4 h-4" /> Send request
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setCredReqOpen(true)} className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-amber-200 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors">
                          Request credential change
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Case pipeline — agencies grant Recognition/Ministry permission here */}
                {a.pipeline && <PipelineTracker application={a} />}

                {/* Two columns: progress + video/docs */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Progress */}
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Application Progress</p>
                    <div className="mb-2">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{done} / {steps.length} steps complete</p>
                    </div>
                    <div className="space-y-1.5 mt-3">
                      {(['translation','university-approval','recognition-letter','ministry-order','visa-documents'] as const).map((s) => {
                        const has = a.studentId ? documents.some(d => d.studentId === a.studentId && d.type === s && d.status === 'verified') : false;
                        const label = s === 'translation' ? 'Documents translation'
                          : s === 'university-approval' ? 'University initial approval'
                          : s === 'recognition-letter' ? 'Recognition letter'
                          : s === 'ministry-order' ? 'Ministry order' : 'Visa required documents';
                        return (
                          <div key={s} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${has ? 'bg-green-50 border-green-100 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                            {has ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <Clock className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
                            {label}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 space-y-1">
                      <p className="text-xs text-gray-400 font-medium">University</p>
                      <p className="text-sm font-semibold text-gray-800">{a.university ? getUniversityName(a.university) : '—'}</p>
                    </div>
                  </div>

                  {/* Media + docs */}
                  <div className="space-y-3">
                    {a.intakeVideoUrl && (
                      <video controls className="w-full rounded-xl border border-gray-100" src={a.intakeVideoUrl} />
                    )}
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                      <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap leading-relaxed">{a.intakeDetails || 'No intake summary'}</pre>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {a.intakePassportCopy && (
                        <a href={a.intakePassportCopy} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors">
                          <FileText className="w-3 h-3" /> Passport
                        </a>
                      )}
                      {a.intakeHighSchoolCertificate && (
                        <a href={a.intakeHighSchoolCertificate} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition-colors">
                          <FileText className="w-3 h-3" /> HS Certificate
                        </a>
                      )}
                      {(a.intakeAttachments || []).map((p, i) => (
                        <a key={i} href={p} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors">
                          <FileText className="w-3 h-3" /> PDF {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Timeline</p>
                  {(a.events ?? []).length === 0 ? (
                    <p className="text-sm text-gray-400">No activity yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {(a.events ?? [])
                        .slice()
                        .sort((x, y) => new Date(y.time).getTime() - new Date(x.time).getTime())
                        .slice(0, 12)
                        .map((ev) => (
                          <div key={ev.id} className="bg-white border border-gray-100 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold text-gray-800">{ev.type.replaceAll('_', ' ')}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{ev.byName}</p>
                              </div>
                              <p className="text-[10px] text-gray-400 shrink-0">{new Date(ev.time).toLocaleString()}</p>
                            </div>
                            {ev.details && <p className="text-xs text-gray-600 mt-1.5 whitespace-pre-wrap">{ev.details}</p>}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Hold / more info requested */}
                {a.hold && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <p className="text-xs font-semibold text-red-600 uppercase tracking-wider">More info requested</p>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{a.hold.message}</p>
                    <p className="text-xs text-red-400 mt-1">{a.hold.byName} — {new Date(a.hold.time).toLocaleString()}</p>
                    <div className="mt-4">
                      <label className={labelCls}>Upload additional documents</label>
                      <label className={`${uploadZoneCls} border-red-200 hover:border-red-400 hover:bg-red-50/30`}>
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
                          className="sr-only"
                        />
                        <div className="flex flex-col items-center gap-1.5">
                          <Upload className="w-5 h-5 text-red-300" />
                          <span className="text-xs text-red-400">Click to upload additional files</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Chat */}
                <div>
                  {a.assignedStaffId && user?.role === 'agency' ? (
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400 font-medium">Chat with assigned admin</p>
                          <p className="text-sm font-semibold text-gray-800">{staff?.name ?? 'Assigned Admin'}</p>
                        </div>
                        <span className="text-xs text-gray-400">Per student</span>
                      </div>
                      <div className="p-4 max-h-56 overflow-y-auto space-y-2 bg-white">
                        {thread.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4">No messages yet.</p>
                        ) : (
                          thread.map((m) => {
                            const mine = m.userId === user.id;
                            return (
                              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-3.5 py-2.5 rounded-xl max-w-[78%] text-sm ${mine ? 'bg-amber-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                                  <p className="whitespace-pre-wrap">{m.text}</p>
                                  <p className={`text-[10px] mt-1.5 ${mine ? 'text-amber-200' : 'text-gray-400'}`}>{new Date(m.time).toLocaleString()}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <div className="p-3 border-t border-gray-100 bg-white">
                        <div className="flex gap-2">
                          <input
                            value={chatDraft}
                            onChange={(e) => setChatDraft(e.target.value)}
                            placeholder="Type a message…"
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                const msg = chatDraft.trim();
                                if (!msg || !a.assignedStaffId) return;
                                try {
                                  addChatMessage(a.assignedStaffId, msg, a.id);
                                  setChatDraft('');
                                } catch (err) {
                                  toast.error(err instanceof Error ? err.message : 'Unable to send message');
                                }
                              }
                            }}
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
                            className="bg-amber-600 text-white rounded-lg px-3 py-2 hover:bg-amber-700 transition-colors"
                            aria-label="Send"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-400">
                      Chat will be available after an admin is assigned to this student.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
