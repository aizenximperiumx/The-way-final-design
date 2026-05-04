import React, { useMemo, useState } from 'react';
import { 
  Search, 
  CheckCircle2, 
  Clock,
  XCircle, 
  Mail, 
  Globe, 
  GraduationCap, 
  Filter,
  ArrowUpRight,
  UserPlus,
  FileText
} from 'lucide-react';
import { useAppStore, type Application } from '../store/appStore';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { UNIVERSITY_OPTIONS, getUniversityName } from '../lib/universities';
import { getSupabase } from '../lib/supabase';

const SalesDashboard: React.FC = () => {
  const { applications, users, salesApproveApplication, salesRejectApplication, assignUniversity, salesClaimLead, salesAddExtraDocs, salesAssignAdmin, requestMoreInfo } = useAppStore();
  const { user } = useAuth();
  const location = useLocation();
  const mode: 'sales' | 'ops' = location.pathname.startsWith('/ops') ? 'ops' : 'sales';
  const allowedSource: 'public' | 'agency' = mode === 'ops' ? 'agency' : 'public';
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<string>('all');
  const [assigning, setAssigning] = useState<{ studentId: string; university: string } | null>(null);
  const [intakeModal, setIntakeModal] = useState<{ open: boolean; app?: Application }>({ open: false });
  const [previewModal, setPreviewModal] = useState<{ open: boolean; app?: Application }>({ open: false });
  const [assignModal, setAssignModal] = useState<{ open: boolean; stuId?: string; staffId?: string }>({ open: false });
  const [requestModal, setRequestModal] = useState<{ open: boolean; app?: Application; message: string }>({ open: false, message: '' });
  type IntakeForm = {
    fullName: string;
    age: string;
    country: string;
    phone: string;
    email: string;
    passportNumber: string;
    dob: string;
    nationality: string;
    secondNationality: string;
    homeAddress: string;
    university: string;
    videoUrl: string;
    passportCopyUrl: string;
    highSchoolCertificateUrl: string;
    pdfs: string[];
  };
  const [intake, setIntake] = useState<IntakeForm>({
    fullName: '',
    age: '',
    country: '',
    phone: '',
    email: '',
    passportNumber: '',
    dob: '',
    nationality: '',
    secondNationality: '',
    homeAddress: '',
    university: '',
    videoUrl: '',
    passportCopyUrl: '',
    highSchoolCertificateUrl: '',
    pdfs: [] as string[],
  });

  const pendingApplications = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const hasOpsMissingDocs = (a: Application) =>
      !a.studentEmail ||
      !a.university ||
      !a.intakeVideoUrl ||
      !a.intakePassportCopy ||
      !a.intakeHighSchoolCertificate ||
      !((a.intakeAttachments?.length ?? 0) > 0);
    return applications
      .filter(app => app.status === 'submitted' && (app.source ?? 'public') === allowedSource)
      .filter(app => {
        if (quickFilter === 'all') return true;
        if (quickFilter === 'today') return new Date(app.createdAt).getTime() >= startOfToday;
        if (quickFilter === 'week') return new Date(app.createdAt).getTime() >= weekAgo;
        if (quickFilter === 'unclaimed') return !((app.ownerId ?? app.salesOwnerId) ?? '').trim();
        if (quickFilter === 'needs_info') return Boolean(app.hold);
        if (quickFilter === 'missing_email') return !app.studentEmail;
        if (quickFilter === 'missing_docs') return hasOpsMissingDocs(app);
        if (quickFilter === 'missing_intake') return !app.intakeDetails;
        return true;
      });
  }, [applications, allowedSource, quickFilter]);
  
  const handleApprove = async (application: Application) => {
    try {
      const creds = await salesApproveApplication(application.id);
      if (creds.emailSent === false) {
        toast.success(`Account created. Email not sent. Username: ${creds.username}  Password: ${creds.password}`, { duration: 12_000 });
      } else {
        toast.success('Account created. Credentials were emailed to the student.', { duration: 6000 });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to approve application');
    }
  };

  const handleReject = (applicationId: string) => {
    try {
      salesRejectApplication(applicationId);
      toast.success('Application rejected');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reject application');
    }
  };

  const filteredApplications = pendingApplications.filter(app => {
    const q = searchTerm.toLowerCase();
    return app.name.toLowerCase().includes(q) || app.email.toLowerCase().includes(q);
  });

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

  const opsChecklist = (application: Application) => {
    const missing: string[] = [];
    if (!application.studentEmail) missing.push('Student Email');
    if (!application.university) missing.push('University');
    if (!application.intakeVideoUrl) missing.push('Video');
    if (!application.intakePassportCopy) missing.push('Passport');
    if (!application.intakeHighSchoolCertificate) missing.push('HS Certificate');
    if (!((application.intakeAttachments?.length ?? 0) > 0)) missing.push('PDFs');
    return missing;
  };

  const onVideo = (f?: File) => {
    if (!f) return;
    (async () => {
      try {
        const url = await uploadFile(f);
        setIntake((prev) => ({ ...prev, videoUrl: url }));
      } catch {
        setIntake((prev) => ({ ...prev, videoUrl: URL.createObjectURL(f) }));
      }
    })();
  };
  const onPassportCopy = (f?: File) => {
    if (!f) return;
    (async () => {
      try {
        const url = await uploadFile(f);
        setIntake((prev) => ({ ...prev, passportCopyUrl: url }));
      } catch {
        setIntake((prev) => ({ ...prev, passportCopyUrl: URL.createObjectURL(f) }));
      }
    })();
  };
  const onHighSchool = (f?: File) => {
    if (!f) return;
    (async () => {
      try {
        const url = await uploadFile(f);
        setIntake((prev) => ({ ...prev, highSchoolCertificateUrl: url }));
      } catch {
        setIntake((prev) => ({ ...prev, highSchoolCertificateUrl: URL.createObjectURL(f) }));
      }
    })();
  };
  const onPdfs = (files: FileList | null) => {
    if (!files) return;
    (async () => {
      try {
        const urls = await Promise.all(Array.from(files).map(async (f) => uploadFile(f)));
        setIntake((prev) => ({ ...prev, pdfs: urls }));
      } catch {
        const urls: string[] = [];
        Array.from(files).forEach((f) => urls.push(URL.createObjectURL(f)));
        setIntake((prev) => ({ ...prev, pdfs: urls }));
      }
    })();
  };
  const onExtraDocs = (files: FileList | null) => {
    if (!files) return;
    (async () => {
      try {
        const urls = await Promise.all(Array.from(files).map(async (f) => uploadFile(f)));
        if (intakeModal.app) salesAddExtraDocs(intakeModal.app.id, urls);
        toast.success('Extra documents added');
      } catch {
        const urls: string[] = [];
        Array.from(files).forEach((f) => urls.push(URL.createObjectURL(f)));
        if (intakeModal.app) salesAddExtraDocs(intakeModal.app.id, urls);
        toast.success('Extra documents added');
      }
    })();
  };
  const submitIntake = () => {
    if (!intakeModal.app) return;
    const details = `Full name: ${intake.fullName}
Age: ${intake.age}
Country: ${intake.country}
Phone: ${intake.phone}
Email: ${intake.email}
Passport: ${intake.passportNumber}
DOB: ${intake.dob}
Nationality: ${intake.nationality}
Second nationality: ${intake.secondNationality}
Address: ${intake.homeAddress}
University: ${intake.university}
Video: ${intake.videoUrl}`;
    try {
      // assign university if student is already created (optional)
      if (intakeModal.app.studentId && intake.university) {
        assignUniversity(intakeModal.app.studentId, intake.university);
      }
      useAppStore.getState().salesAddIntakeDetails(intakeModal.app.id, details, intake.pdfs);
      useAppStore.getState().salesSetIntakeMedia(intakeModal.app.id, {
        videoUrl: intake.videoUrl,
        passportCopy: intake.passportCopyUrl,
        highSchoolCertificate: intake.highSchoolCertificateUrl,
        pdfs: intake.pdfs,
      });
      toast.success('Intake details saved');
      setIntakeModal({ open: false });
      setIntake({ fullName: '', age: '', country: '', phone: '', email: '', passportNumber: '', dob: '', nationality: '', secondNationality: '', homeAddress: '', university: '', videoUrl: '', passportCopyUrl: '', highSchoolCertificateUrl: '', pdfs: [] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save intake');
    }
  };

  const stats = [
    { label: 'Pending Reviews', value: pendingApplications.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Total Applications', value: applications.filter(a => (a.source ?? 'public') === allowedSource).length, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Successful Enrollments', value: applications.filter(a => a.status === 'approved' && (a.source ?? 'public') === allowedSource).length, icon: UserPlus, color: 'text-green-500', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tight">{mode === 'ops' ? 'Agency Applications' : 'Application Pipeline'}</h1>
          <p className="text-gray-500 font-medium">Review and manage incoming student applications.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-white border border-gray-100 px-3 py-2.5 rounded-xl">
            {[
              { id: 'all', label: 'All' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              ...(mode === 'ops'
                ? [
                  { id: 'unclaimed', label: 'Unclaimed' },
                  { id: 'needs_info', label: 'Needs Info' },
                  { id: 'missing_email', label: 'Missing Email' },
                  { id: 'missing_docs', label: 'Missing Docs' },
                ]
                : [
                  { id: 'missing_intake', label: 'Missing Intake' },
                ]),
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setQuickFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                  quickFilter === f.id ? 'bg-black text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 bg-white border border-gray-100 px-4 py-2.5 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-50 transition-all">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-500 hover:text-black transition-all">
            <ArrowUpRight className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </section>
      <section className="tw-card overflow-hidden mt-8">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-xl font-black text-black">My Approved Students</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {applications.filter(a => a.status === 'approved' && (a.source ?? 'public') === allowedSource && (a.ownerId ?? a.salesOwnerId) === user?.id).map((a) => (() => {
            const staff = users.find(u => u.id === a.assignedStaffId);
            const initial = staff?.name?.charAt(0) ?? 'A';
            return (
              <div key={a.id} className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-black text-black">{a.name}</p>
                  <p className="text-xs font-bold text-gray-500">{a.university ? getUniversityName(a.university) : 'University not set'}</p>
                </div>
                <div className="flex items-center gap-4">
                  {staff ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">
                        {initial}
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-gray-700 leading-none">Assigned Admin</p>
                        <p className="text-sm font-bold text-black leading-none">{staff.name}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">No admin assigned</span>
                  )}
                  <button
                    onClick={() => setAssignModal({ open: true, stuId: a.studentId })}
                    className="px-4 py-2 rounded-xl bg-black text-white text-sm font-bold hover:bg-amber-500 hover:text-black transition-all"
                  >
                    Assign Admin
                  </button>
                </div>
              </div>
            );
          })())}
          {applications.filter(a => a.status === 'approved' && (a.source ?? 'public') === allowedSource && a.salesOwnerId === user?.id).length === 0 && (
            <div className="p-8 text-sm font-medium text-gray-500">No approved students yet</div>
          )}
        </div>
      </section>

      {/* Stats Cards */}
      <section className="grid md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="tw-card tw-card-hover p-6 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="bg-gray-50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400">
                Live Update
              </div>
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-black">{stat.value}</p>
          </motion.div>
        ))}
      </section>

      {/* Search and Filters */}
      <section className="tw-panel p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student name, email, or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
          />
        </div>
      </section>

      {/* My Accepted Students */}
      <section className="tw-card overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-xl font-black text-black">My Accepted Students</h2>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            {applications.filter(a => a.status === 'approved' && (a.source ?? 'public') === allowedSource && (a.ownerId ?? a.salesOwnerId) === user?.id).length} Students
          </span>
        </div>
        <div className="divide-y divide-gray-50">
          {(applications.filter(a => a.status === 'approved' && (a.source ?? 'public') === allowedSource && (a.ownerId ?? a.salesOwnerId) === user?.id)).map((a) => {
            const staff = users.find(u => u.id === a.assignedStaffId);
            const initial = staff?.name?.charAt(0) ?? 'A';
            return (
            <div key={a.id} className="p-6 flex items-center justify-between gap-6">
              <div>
                <p className="font-black text-black">{a.name}</p>
                <p className="text-gray-400 text-sm font-medium">{a.university ? `(${getUniversityName(a.university)})` : '(No university assigned)'}</p>
              </div>
              <div className="flex items-center gap-3">
                {staff ? (
                  <div className="flex items-center gap-2 mr-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold">
                      {initial}
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black text-gray-700 leading-none uppercase tracking-widest">Assigned Admin</p>
                      <p className="text-sm font-bold text-black leading-none">{staff.name}</p>
                    </div>
                  </div>
                ) : null}
                <select
                  className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium"
                  value={assigning?.studentId === a.studentId ? (assigning?.university ?? '') : ''}
                  onChange={(e) => setAssigning({ studentId: a.studentId!, university: e.target.value })}
                >
                  <option value="" disabled>Select university</option>
                  {UNIVERSITY_OPTIONS.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    if (!assigning || !assigning.university || assigning.studentId !== a.studentId) return;
                    try {
                      assignUniversity(assigning.studentId, assigning.university);
                      toast.success('University assigned');
                      setAssigning(null);
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Failed to assign');
                    }
                  }}
                  className="px-4 py-2 bg-black text-white rounded-xl font-bold text-sm hover:bg-amber-500 hover:text-black transition-all"
                >
                  Save
                </button>
              </div>
            </div>
            );
          })}
        </div>
      </section>

      {/* Applications List */}
      <section className="tw-card overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-xl font-black text-black">Incoming Applications</h2>
          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            {filteredApplications.length} New Leads
          </span>
        </div>
        
        <div className="divide-y divide-gray-50">
          <AnimatePresence mode="popLayout">
            {filteredApplications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-16 text-center"
              >
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                  <Search className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-black mb-2">No Applications Found</h3>
                <p className="text-gray-400 font-medium">Try adjusting your search terms or filters.</p>
              </motion.div>
            ) : (
              filteredApplications.map((application, idx) => (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-8 hover:bg-gray-50/50 transition-colors group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black font-black text-lg">
                          {application.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xl font-black text-black group-hover:text-amber-600 transition-colors truncate leading-tight">
                            {application.name}
                          </h3>
                          <p className="text-gray-400 text-sm font-medium">Applied on {new Date(application.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 text-sm font-bold text-gray-600 bg-white border border-gray-100 px-4 py-2 rounded-xl">
                          <Mail className="w-4 h-4 text-amber-500" />
                          <span className="min-w-0 truncate">{application.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-bold text-gray-600 bg-white border border-gray-100 px-4 py-2 rounded-xl">
                          <Globe className="w-4 h-4 text-amber-500" />
                          <span className="min-w-0 truncate">{application.country}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm font-bold text-gray-600 bg-white border border-gray-100 px-4 py-2 rounded-xl">
                          <GraduationCap className="w-4 h-4 text-amber-500" />
                          <span className="min-w-0 truncate">{application.program}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <div className="hidden md:flex flex-wrap items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Intake Verified</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${application.intakeVideoUrl ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>Video</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${application.intakePassportCopy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>Passport</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${application.intakeHighSchoolCertificate ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>HS Cert</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${(application.intakeAttachments && application.intakeAttachments.length>0) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>PDFs</span>
                      </div>
                      {mode === 'ops' && opsChecklist(application).length > 0 && (
                        <div className="hidden md:flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100">
                          <span className="text-[10px] font-black uppercase tracking-widest text-red-700">Missing</span>
                          <span className="text-[10px] font-black text-red-700">{opsChecklist(application).join(' • ')}</span>
                        </div>
                      )}
                      {mode === 'sales' && (
                        <button
                          onClick={() => setIntakeModal({ open: true, app: application })}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-gray-100 px-6 py-3 rounded-2xl font-black text-sm hover:bg-gray-50 transition-all"
                        >
                          Fill Intake
                          {!application.intakeDetails && (
                            <span className="ml-2 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-700 uppercase tracking-widest">
                              Required
                            </span>
                          )}
                        </button>
                      )}
                      {(application.intakeDetails || application.intakeVideoUrl || (application.intakeAttachments && application.intakeAttachments.length > 0)) && (
                        <button
                          onClick={() => setPreviewModal({ open: true, app: application })}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-amber-500 hover:text-black transition-all"
                        >
                          View Intake
                        </button>
                      )}
                      {mode === 'ops' && application.hold && (
                        <span className="px-3 py-2 rounded-2xl bg-red-50 text-red-700 text-xs font-black border border-red-100">
                          Needs Info
                        </span>
                      )}
                      {mode === 'ops' && !application.salesOwnerId && (
                        <button
                          onClick={() => {
                            try { salesClaimLead(application.id); toast.success('Lead claimed'); } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed to claim'); }
                          }}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-50 text-amber-700 px-6 py-3 rounded-2xl font-black text-sm hover:bg-amber-100 transition-all border border-amber-200"
                        >
                          Claim Lead
                        </button>
                      )}
                      {mode === 'ops' && (
                        <button
                          onClick={() => setRequestModal({ open: true, app: application, message: application.hold?.message ?? '' })}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-gray-100 px-6 py-3 rounded-2xl font-black text-sm hover:bg-gray-50 transition-all"
                        >
                          Request Info
                        </button>
                      )}
                      <button
                        onClick={() => handleReject(application.id)}
                        className="w-full sm:w-auto min-w-[170px] flex-1 lg:flex-none flex items-center justify-center gap-2 bg-gray-50 text-gray-500 px-6 py-3 rounded-2xl font-black text-sm hover:bg-red-50 hover:text-red-600 transition-all border border-transparent hover:border-red-100"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(application)}
                        disabled={(mode === 'sales' && !application.intakeDetails) || (mode === 'ops' && opsChecklist(application).length > 0)}
                        className={`w-full sm:w-auto min-w-[220px] flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-black/5 ${
                          (mode === 'sales' && !application.intakeDetails) || (mode === 'ops' && opsChecklist(application).length > 0)
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-amber-500 hover:text-black'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve & Create Account
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </section>
      {intakeModal.open && (
        <div className="fixed inset-0 z-[100] p-4 flex items-start justify-center overflow-y-auto">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIntakeModal({ open: false })} />
          <div className="relative tw-card w-full max-w-2xl max-h-[90vh] flex flex-col my-10">
            <div className="p-6 border-b border-gray-50">
              <h3 className="text-xl font-black text-black">Student Intake</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Short form</p>
            </div>
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
              {(
                [
                  { key: 'fullName', label: 'Full name' },
                  { key: 'age', label: 'Age' },
                  { key: 'country', label: 'Country' },
                  { key: 'phone', label: 'Phone number' },
                  { key: 'email', label: 'Email' },
                  { key: 'passportNumber', label: 'Passport number' },
                  { key: 'dob', label: 'Date of birth' },
                  { key: 'nationality', label: 'Nationality' },
                  { key: 'secondNationality', label: 'Second nationality (optional)' },
                    { key: 'homeAddress', label: 'Home address' },
                  { key: 'university', label: 'University to enroll' },
                ] as Array<{ key: keyof IntakeForm; label: string }>
              ).map((f, i) => (
                <div key={i} className={f.key === 'homeAddress' || f.key === 'university' ? 'md:col-span-2' : ''}>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{f.label}</label>
                      {f.key === 'university' ? (
                        <select
                          value={intake.university || ''}
                          onChange={(e) => setIntake((prev) => ({ ...prev, university: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border-none"
                        >
                          <option value="" disabled>Select university</option>
                          {UNIVERSITY_OPTIONS.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          value={intake[f.key] || ''}
                          onChange={(e) => setIntake((prev) => ({ ...prev, [f.key]: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border-none"
                        />
                      )}
                </div>
              ))}
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Upload video (≥40s)</label>
                <input type="file" accept="video/*" capture onChange={(e) => onVideo(e.target.files?.[0])} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border-none" />
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">Tip: If your video is in iCloud/OneDrive, mark it “Always keep on this device” or copy it to Downloads before uploading.</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Passport Copy</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => onPassportCopy(e.target.files?.[0])} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">High School Certificate</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => onHighSchool(e.target.files?.[0])} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Upload PDFs</label>
                <input multiple type="file" accept="application/pdf" onChange={(e) => onPdfs(e.target.files)} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Extra Documents (optional)</label>
                <input multiple type="file" accept="application/pdf,image/*" onChange={(e) => onExtraDocs(e.target.files)} className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border-none" />
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">Use for unique cases requiring additional files.</p>
              </div>
            </div>
            <div className="p-4 bg-white border-t border-gray-50 flex flex-col sm:flex-row justify-end gap-3">
              <button onClick={() => setIntakeModal({ open: false })} className="px-4 py-2 rounded-xl font-bold text-sm bg-gray-100 text-gray-600">Cancel</button>
              <button onClick={submitIntake} className="px-6 py-2.5 rounded-xl font-black text-sm bg-black text-white hover:bg-amber-500 hover:text-black transition-all">Save Intake</button>
            </div>
          </div>
        </div>
      )}
      {previewModal.open && previewModal.app && (
        <div className="fixed inset-0 z-[100] p-4 flex items-start justify-center overflow-y-auto">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPreviewModal({ open: false })} />
          <div className="relative tw-card w-full max-w-3xl p-8 my-10">
            <h3 className="text-2xl font-black text-black mb-6">Intake Preview</h3>
            <div className="space-y-6">
              {previewModal.app.intakeVideoUrl && (
                <video controls className="w-full rounded-2xl border border-gray-100" src={previewModal.app.intakeVideoUrl} />
              )}
              <pre className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium whitespace-pre-wrap">
                {previewModal.app.intakeDetails || previewModal.app.internalNotes?.[0]?.text || 'No intake summary'}
              </pre>
              <div className="grid sm:grid-cols-2 gap-3">
                {previewModal.app.intakePassportCopy && (
                  <a href={previewModal.app.intakePassportCopy} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100">Passport Copy</a>
                )}
                {previewModal.app.intakeHighSchoolCertificate && (
                  <a href={previewModal.app.intakeHighSchoolCertificate} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 text-sm font-bold border border-purple-100">High School Certificate</a>
                )}
              </div>
              {previewModal.app.intakeAttachments && previewModal.app.intakeAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {previewModal.app.intakeAttachments.map((p, i) => (
                    <a key={i} href={p} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black">PDF {i + 1}</a>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setPreviewModal({ open: false })} className="px-6 py-3 rounded-2xl font-black text-sm bg-black text-white hover:bg-amber-500 hover:text-black transition-all">Close</button>
            </div>
          </div>
        </div>
      )}
      {assignModal.open && (
        <div className="fixed inset-0 z-[100] p-4 flex items-start justify-center overflow-y-auto">
          <div className="absolute inset-0 bg-black/60" onClick={() => setAssignModal({ open: false })} />
          <div className="relative tw-card w-full max-w-lg p-8 my-10">
            <h3 className="text-2xl font-black text-black mb-6">Assign Admin</h3>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Select Admin</label>
              <select
                value={assignModal.staffId || ''}
                onChange={(e) => setAssignModal((m) => ({ ...m, staffId: e.target.value }))}
                className="w-full px-5 py-3 bg-gray-50 rounded-2xl border-none appearance-none"
              >
                <option value="">Choose staff...</option>
                {users.filter(u=>u.role==='staff').map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
              <button onClick={() => setAssignModal({ open: false })} className="px-4 py-2 rounded-xl font-bold text-sm bg-gray-100 text-gray-600">Cancel</button>
              <button
                onClick={() => {
                  if (!assignModal.stuId || !assignModal.staffId) return;
                  try {
                    salesAssignAdmin(assignModal.stuId, assignModal.staffId);
                    setAssignModal({ open: false });
                    toast.success('Admin assigned');
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Failed to assign');
                  }
                }}
                className="px-6 py-3 rounded-2xl font-black text-sm bg-black text-white hover:bg-amber-500 hover:text-black transition-all"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
      {requestModal.open && requestModal.app && (
        <div className="fixed inset-0 z-[110] p-4 flex items-start justify-center overflow-y-auto">
          <div className="absolute inset-0 bg-black/60" onClick={() => setRequestModal({ open: false, message: '' })} />
          <div className="relative tw-card p-8 w-full max-w-2xl my-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-2xl font-black text-black mb-2">Request More Info</h3>
            <p className="text-sm font-medium text-gray-500 mb-6">{requestModal.app.name}</p>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Message to agency</label>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { label: 'Student Email', text: 'Please add the Student Email.' },
                { label: 'Passport', text: 'Please upload a clear Passport copy (photo/scan).' },
                { label: 'HS Cert', text: 'Please upload the High School certificate.' },
                { label: 'PDFs', text: 'Please upload the required PDFs.' },
                { label: 'University', text: 'Please select the target University.' },
                { label: 'Phone', text: 'Please confirm the student phone number and country.' },
              ].map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setRequestModal((m) => ({ ...m, message: t.text }))}
                  className="tw-chip bg-gray-50 text-gray-700 border border-gray-100 hover:bg-amber-50 hover:border-amber-200 transition-all"
                >
                  {t.label}
                </button>
              ))}
            </div>
            <textarea
              value={requestModal.message}
              onChange={(e) => setRequestModal((m) => ({ ...m, message: e.target.value }))}
              className="w-full mt-2 px-5 py-3 bg-gray-50 rounded-2xl border-none min-h-[140px] font-medium"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setRequestModal({ open: false, message: '' })} className="px-4 py-2 rounded-xl font-bold text-sm bg-gray-100 text-gray-600">Cancel</button>
              <button
                onClick={() => {
                  const msg = requestModal.message.trim();
                  if (!requestModal.app) return;
                  if (!msg) return;
                  try {
                    requestMoreInfo(requestModal.app.id, msg);
                    toast.success('Request sent to agency');
                    setRequestModal({ open: false, message: '' });
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : 'Failed to send request');
                  }
                }}
                className="px-6 py-3 rounded-2xl font-black text-sm bg-black text-white hover:bg-amber-500 hover:text-black transition-all"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesDashboard;
