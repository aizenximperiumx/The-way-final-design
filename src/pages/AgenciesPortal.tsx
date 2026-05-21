import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Shield, Video, FileText, Send, User, Award, TrendingUp, Building2, LogOut, ChevronRight } from 'lucide-react';
import logoUrl from '../../1776590293988-019da507-f581-77e9-8281-8d60b280ccd6-removebg-preview.png';
import toast from 'react-hot-toast';
import { UNIVERSITY_OPTIONS, getUniversityName } from '../lib/universities';
import { getSupabase } from '../lib/supabase';

export default function AgenciesPortal() {
  const { user, logout } = useAuth();
  const { addApplication, applications, documents, users, chatMessages, addChatMessage, agencyAddExtraDocs } = useAppStore();
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

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <header className="bg-black text-white sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src={logoUrl} alt="The Way" className="h-10 w-auto object-contain" />
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'dashboard' ? 'profile' : 'dashboard')}
              className="md:hidden px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white/80"
            >
              {activeTab === 'dashboard' ? 'Agency Profile' : 'Student Management'}
            </button>
            <div className="hidden md:flex items-center gap-1">
              {[
                { id: 'dashboard', label: 'Student Management', icon: Building2 },
                { id: 'profile', label: 'Agency Profile', icon: User },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'dashboard' | 'profile')}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                    activeTab === tab.id ? 'bg-amber-500 text-black' : 'text-white/40 hover:text-white'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
              <Award className="w-4 h-4 text-amber-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
                {user?.points ?? 0} Points
              </p>
            </div>
            <button 
              onClick={() => logout()}
              className="p-2.5 bg-white/5 text-white/60 hover:text-white hover:bg-red-500/10 rounded-xl transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                {[
                  { label: 'Total Students', value: applications.filter(a => (a.source ?? 'public') === 'agency' && a.agencyId === user?.id).length, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { label: 'Approved', value: applications.filter(a => (a.source ?? 'public') === 'agency' && a.agencyId === user?.id && a.status === 'approved').length, icon: Shield, color: 'text-green-500', bg: 'bg-green-50' },
                  { label: 'Pending', value: applications.filter(a => (a.source ?? 'public') === 'agency' && a.agencyId === user?.id && a.status === 'submitted').length, icon: Upload, color: 'text-amber-500', bg: 'bg-amber-50' },
                  { label: 'Documents', value: documents.filter(d => applications.some(a => a.studentId === d.studentId && a.agencyId === user?.id)).length, icon: Send, color: 'text-purple-500', bg: 'bg-purple-50' },
                ].map((stat, i) => (
                  <div key={i} className="tw-card p-6 flex items-center gap-4">
                    <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                      <p className="text-2xl font-black text-black">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </section>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="tw-card tw-card-hover p-8">
                <h1 className="text-2xl font-black text-black mb-6">Submit New Student</h1>
                <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Full name</label>
                    <input className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Age</label>
                    <input
                      className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-gray-500"
                      value={form.dob ? (calculateAge(form.dob) == null ? '' : String(calculateAge(form.dob)!)) : ''}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Country</label>
                    <input className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Phone number</label>
                    <input className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Contact Email</label>
                    <input type="email" className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Student Email</label>
                    <input type="email" className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black" value={form.studentEmail} onChange={(e) => setForm({ ...form, studentEmail: e.target.value })} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Passport number</label>
                    <input className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black" value={form.passportNumber} onChange={(e) => setForm({ ...form, passportNumber: e.target.value })} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Date of birth</label>
                    <input
                      type="date"
                      className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black"
                      value={form.dob}
                      onChange={(e) => setForm({ ...form, dob: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nationality</label>
                    <input className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Second nationality (optional)</label>
                    <input className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black" value={form.secondNationality} onChange={(e) => setForm({ ...form, secondNationality: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Home address</label>
                    <input className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black" value={form.homeAddress} onChange={(e) => setForm({ ...form, homeAddress: e.target.value })} required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">University to enroll</label>
                    <select className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black" value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} required>
                      <option value="" disabled>Select university</option>
                      {UNIVERSITY_OPTIONS.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Study Level</label>
                    <select className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black" value={form.studyLevel} onChange={(e) => setForm({ ...form, studyLevel: e.target.value })} required>
                      <option value="" disabled>Select level</option>
                      <option value="bachelor">Bachelor's</option>
                      <option value="master">Master's</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Aviation Degree (if applicable)</label>
                    <select className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black" value={form.aviationDegree} onChange={(e) => setForm({ ...form, aviationDegree: e.target.value })}>
                      <option value="">None / Not Aviation</option>
                      <option value="pilot">Commercial Pilot License (CPL)</option>
                      <option value="atpl">Airline Transport Pilot License (ATPL)</option>
                      <option value="engineering">Aviation Engineering</option>
                      <option value="management">Aviation Management</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Upload video (&gt;=40s)</label>
                    <div className="flex items-center gap-3">
                    <input type="file" accept="video/*" capture onChange={(e) => onFileVideo(e.target.files?.[0])} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black" />
                      {videoUrl && <Video className="w-5 h-5 text-amber-500" />}
                    </div>
                  </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Passport Copy</label>
                  <div className="flex items-center gap-3">
                    <input type="file" accept="image/*,.pdf" onChange={(e) => onPassportCopy(e.target.files?.[0])} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">High School Certificate</label>
                  <div className="flex items-center gap-3">
                    {!noHighSchoolCertificate ? (
                      <input type="file" accept="image/*,.pdf" onChange={(e) => onHighSchool(e.target.files?.[0])} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black" />
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={noHighSchoolCertificate}
                      onChange={(e) => {
                        setNoHighSchoolCertificate(e.target.checked);
                        if (!e.target.checked) setHighSchoolMissingNote('');
                      }}
                      className="h-4 w-4"
                    />
                    <p className="text-xs font-bold text-gray-600">Student does not have high school certificate</p>
                  </div>
                  {noHighSchoolCertificate ? (
                    <textarea
                      value={highSchoolMissingNote}
                      onChange={(e) => setHighSchoolMissingNote(e.target.value)}
                      className="w-full mt-2 px-5 py-3 bg-gray-50 rounded-2xl border-none text-black min-h-[100px] font-medium"
                      placeholder="Write the reason / comment..."
                    />
                  ) : null}
                </div>
                {(() => {
                  const age = form.dob ? calculateAge(form.dob) : null;
                  const underage = age != null && age < 18;
                  if (!underage) return null;
                  return (
                    <>
                      <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Birth Certificate</label>
                        <div className="flex items-center gap-3">
                          <input type="file" accept="image/*,.pdf" onChange={(e) => onBirthCertificate(e.target.files?.[0])} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Mother's Passport</label>
                        <div className="flex items-center gap-3">
                          <input type="file" accept="image/*,.pdf" onChange={(e) => onMotherPassport(e.target.files?.[0])} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Father's Passport</label>
                        <div className="flex items-center gap-3">
                          <input type="file" accept="image/*,.pdf" onChange={(e) => onFatherPassport(e.target.files?.[0])} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black" />
                        </div>
                      </div>
                    </>
                  );
                })()}
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Upload PDFs</label>
                    <div className="flex items-center gap-3">
                      <input multiple type="file" accept="application/pdf" onChange={(e) => onFilePdf(e.target.files)} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black" />
                      {pdfs.length > 0 && <FileText className="w-5 h-5 text-amber-500" />}
                    </div>
                  </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Extra Documents (optional)</label>
                  <div className="flex items-center gap-3">
                    <input multiple type="file" accept="application/pdf,image/*" onChange={(e) => onFileExtra(e.target.files)} className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none text-black" />
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

              <section className="mt-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-black">My Students</h2>
                  <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm text-xs font-bold text-gray-500">
                    Showing {applications.filter(a => a.agencyId === user?.id).length} results
                  </div>
                </div>
                <div className="grid gap-4">
                  {applications.filter(a => a.agencyId === user?.id).length > 0 ? (
                    applications.filter(a => a.agencyId === user?.id).map((app) => (
                      <div key={app.id} className="tw-card p-6 flex flex-wrap items-center justify-between gap-6 hover:border-amber-200 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-400">
                            {app.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-black text-black">{app.name}</h3>
                            <p className="text-xs font-medium text-gray-500">{app.studentEmail || app.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-8">
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Program</p>
                            <p className="text-sm font-bold text-black">{app.program}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              app.status === 'approved' ? 'bg-green-100 text-green-600' :
                              app.status === 'rejected' ? 'bg-red-100 text-red-600' :
                              'bg-amber-100 text-amber-600'
                            }`}>
                              {app.status}
                            </span>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Stage</p>
                            <p className="text-sm font-bold text-black capitalize">{app.stage}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setViewApp({ open: true, id: app.id })}
                          className="px-6 py-2.5 bg-black text-white rounded-xl text-xs font-black hover:bg-amber-500 hover:text-black transition-all"
                        >
                          View Details
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="tw-card p-12 text-center border-dashed">
                      <p className="text-gray-400 font-medium">No students found. Submit your first student above!</p>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <section className="tw-card p-8">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-20 h-20 bg-black text-amber-500 rounded-[32px] flex items-center justify-center text-3xl font-black">
                        {user?.name.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-black">{user?.name}</h2>
                        <p className="text-sm font-medium text-gray-500">Official Partner Agency</p>
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                            <Award className="w-3.5 h-3.5" />
                            Tier 1 Partner
                          </div>
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '-'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 pt-8 border-t border-gray-50">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agency ID</p>
                        <p className="font-bold text-black">{user?.id.slice(0, 8)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</p>
                        <p className="font-bold text-black">{user?.email}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Portal Username</p>
                        <p className="font-bold text-black">@{user?.username}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Points</p>
                        <p className="font-bold text-amber-600">{user?.points ?? 0} PTS</p>
                      </div>
                    </div>
                  </section>

                  <section className="tw-card p-8">
                    <h3 className="text-xl font-black text-black mb-6 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-500" />
                      Agency Performance
                    </h3>
                    <div className="space-y-6">
                      {(() => {
                        const myApps = applications.filter(a => a.agencyId === user?.id);
                        const approved = myApps.filter(a => a.status === 'approved').length;
                        const total = myApps.length;
                        const rate = total > 0 ? Math.round((approved / total) * 100) : 0;
                        return (
                          <>
                            <div className="grid sm:grid-cols-3 gap-6">
                              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Success Rate</p>
                                <p className="text-2xl font-black text-black">{rate}%</p>
                              </div>
                              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Students</p>
                                <p className="text-2xl font-black text-black">{myApps.filter(a => a.status === 'approved' && a.stage !== 'enrolled').length}</p>
                              </div>
                              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Earned</p>
                                <p className="text-2xl font-black text-black">{user?.points ?? 0}</p>
                              </div>
                            </div>
                            <div className="pt-4">
                              <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Next Tier Progress</p>
                              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min((user?.points ?? 0) / 10, 100)}%` }} />
                              </div>
                              <div className="flex justify-between mt-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tier 1</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tier 2 (1000 PTS)</p>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  <section className="tw-card p-8">
                    <h3 className="text-xl font-black text-black mb-6">Top Agencies</h3>
                    <div className="space-y-4">
                      {users
                        .filter(u => u.role === 'agency')
                        .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
                        .slice(0, 5)
                        .map((u, i) => (
                          <div key={u.id} className={`flex items-center justify-between p-4 rounded-2xl border ${u.id === user?.id ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center gap-3">
                              <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-amber-500 text-black' : 'bg-black text-white'}`}>
                                {i + 1}
                              </span>
                              <div>
                                <p className="text-sm font-black text-black">{u.name}</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{u.points ?? 0} PTS</p>
                              </div>
                            </div>
                            {u.id === user?.id && <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />}
                          </div>
                        ))}
                    </div>
                  </section>

                  <section className="tw-card p-8 bg-black text-white">
                    <h3 className="text-lg font-black mb-4">Partner Support</h3>
                    <p className="text-sm text-white/60 mb-6 font-medium">Need help with a student application or have a special request?</p>
                    <a href="mailto:partners@theway.ge" className="flex items-center justify-between p-4 bg-white/10 rounded-2xl hover:bg-white hover:text-black transition-all group">
                      <span className="text-sm font-black">Contact Manager</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </section>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
