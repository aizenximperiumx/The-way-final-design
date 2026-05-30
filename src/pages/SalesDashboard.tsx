import React, { useMemo, useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  X,
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
import { openStorageUrl } from '../lib/storage';

const SalesDashboard: React.FC = () => {
  const { applications, users, salesApproveApplication, salesRejectApplication, assignUniversity, salesClaimLead, salesAddExtraDocs, salesAssignAdmin, requestMoreInfo, setApplicationUniversity, setApplicationMeta } = useAppStore();
  const { user } = useAuth();
  const location = useLocation();
  const mode: 'sales' | 'ops' = location.pathname.startsWith('/ops') ? 'ops' : 'sales';
  const allowedSource: 'public' | 'agency' = mode === 'ops' ? 'agency' : 'public';
  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<string>('all');
  const [assigning, setAssigning] = useState<{ studentId: string; university: string } | null>(null);
  const [assigningStaff, setAssigningStaff] = useState<{ studentId: string; staffId: string } | null>(null);
  const [intakeModal, setIntakeModal] = useState<{ open: boolean; app?: Application }>({ open: false });
  const [previewModal, setPreviewModal] = useState<{ open: boolean; app?: Application }>({ open: false });
  const [assignModal, setAssignModal] = useState<{ open: boolean; stuId?: string; staffId?: string }>({ open: false });
  const [requestModal, setRequestModal] = useState<{ open: boolean; app?: Application; message: string }>({ open: false, message: '' });
  const [credentialsModal, setCredentialsModal] = useState<{ open: boolean; username?: string; password?: string; emailSent?: boolean }>({ open: false });
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
    aviationDegree: string;
    studyLevel: string;
    videoUrl: string;
    passportCopyUrl: string;
    highSchoolCertificateUrl: string;
    noHighSchoolCertificate: boolean;
    highSchoolMissingNote: string;
    birthCertificateUrl: string;
    motherPassportUrl: string;
    fatherPassportUrl: string;
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
    aviationDegree: '',
    studyLevel: '',
    videoUrl: '',
    passportCopyUrl: '',
    highSchoolCertificateUrl: '',
    noHighSchoolCertificate: false,
    highSchoolMissingNote: '',
    birthCertificateUrl: '',
    motherPassportUrl: '',
    fatherPassportUrl: '',
    pdfs: [] as string[],
  });

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

  const openIntake = (application: Application) => {
    setIntake({
      fullName: application.name ?? '',
      age: application.dob ? String(calculateAge(application.dob) ?? '') : '',
      country: application.country ?? '',
      phone: application.phone ?? '',
      email: application.studentEmail ?? application.email ?? '',
      passportNumber: '',
      dob: application.dob ?? '',
      nationality: '',
      secondNationality: '',
      homeAddress: '',
      university: application.university ?? '',
      aviationDegree: application.aviationDegree ?? '',
      studyLevel: application.studyLevel ?? '',
      videoUrl: application.intakeVideoUrl ?? '',
      passportCopyUrl: application.intakePassportCopy ?? '',
      highSchoolCertificateUrl: application.intakeHighSchoolCertificate ?? '',
      noHighSchoolCertificate: Boolean(application.intakeHighSchoolMissingNote) && !application.intakeHighSchoolCertificate,
      highSchoolMissingNote: application.intakeHighSchoolMissingNote ?? '',
      birthCertificateUrl: application.intakeBirthCertificate ?? '',
      motherPassportUrl: application.intakeMotherPassport ?? '',
      fatherPassportUrl: application.intakeFatherPassport ?? '',
      pdfs: application.intakeAttachments ?? [],
    });
    setIntakeModal({ open: true, app: application });
  };

  const pendingApplications = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const hasOpsMissingDocs = (a: Application) => {
      const age = a.dob ? calculateAge(a.dob) : null;
      const underage = age != null && age < 18;
      const hsOk = Boolean(a.intakeHighSchoolCertificate || a.intakeHighSchoolMissingNote);
      return (
        !a.studentEmail ||
        (!a.university && !a.intakeDetails?.includes('Aviation')) ||
        !a.dob ||
        !a.intakeVideoUrl ||
        !a.intakePassportCopy ||
        !hsOk ||
        (underage && (!a.intakeBirthCertificate || !a.intakeMotherPassport || !a.intakeFatherPassport)) ||
        !((a.intakeAttachments?.length ?? 0) > 0)
      );
    };
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

  const quickFilterCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: 0,
      today: 0,
      week: 0,
      unclaimed: 0,
      needs_info: 0,
      missing_email: 0,
      missing_docs: 0,
      missing_intake: 0,
    };
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const hasOpsMissingDocs = (a: Application) => {
      const age = a.dob ? calculateAge(a.dob) : null;
      const underage = age != null && age < 18;
      const hsOk = Boolean(a.intakeHighSchoolCertificate || a.intakeHighSchoolMissingNote);
      return (
        !a.studentEmail ||
        (!a.university && !a.intakeDetails?.includes('Aviation')) ||
        !a.dob ||
        !a.intakeVideoUrl ||
        !a.intakePassportCopy ||
        !hsOk ||
        (underage && (!a.intakeBirthCertificate || !a.intakeMotherPassport || !a.intakeFatherPassport)) ||
        !((a.intakeAttachments?.length ?? 0) > 0)
      );
    };
    applications
      .filter(app => app.status === 'submitted' && (app.source ?? 'public') === allowedSource)
      .forEach(app => {
        counts.all += 1;
        const createdAt = new Date(app.createdAt).getTime();
        if (createdAt >= startOfToday) counts.today += 1;
        if (createdAt >= weekAgo) counts.week += 1;
        if (!((app.ownerId ?? app.salesOwnerId) ?? '').trim()) counts.unclaimed += 1;
        if (Boolean(app.hold)) counts.needs_info += 1;
        if (!app.studentEmail) counts.missing_email += 1;
        if (hasOpsMissingDocs(app)) counts.missing_docs += 1;
        if (!app.intakeDetails) counts.missing_intake += 1;
      });
    return counts;
  }, [applications, allowedSource]);

  const handleApprove = async (application: Application) => {
    try {
      const creds = await salesApproveApplication(application.id);
      setCredentialsModal({
        open: true,
        username: creds.username,
        password: creds.password,
        emailSent: creds.emailSent !== false
      });
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
    if (!application.university && !application.intakeDetails?.includes('Aviation')) missing.push('University');
    if (!application.dob) missing.push('DOB');
    if (!application.intakeVideoUrl) missing.push('Video');
    if (!application.intakePassportCopy) missing.push('Passport');
    if (!(application.intakeHighSchoolCertificate || application.intakeHighSchoolMissingNote)) missing.push('HS Certificate / Note');
    const age = application.dob ? calculateAge(application.dob) : null;
    if (age != null && age < 18) {
      if (!application.intakeBirthCertificate) missing.push('Birth Certificate');
      if (!application.intakeMotherPassport) missing.push("Mother's Passport");
      if (!application.intakeFatherPassport) missing.push("Father's Passport");
    }
    if (!((application.intakeAttachments?.length ?? 0) > 0)) missing.push('PDFs');
    return missing;
  };

  const onVideo = (f?: File) => {
    if (!f) return;
    (async () => {
      try {
        const url = await uploadFile(f);
        setIntake((prev) => ({ ...prev, videoUrl: url }));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Video upload failed');
      }
    })();
  };
  const onPassportCopy = (f?: File) => {
    if (!f) return;
    (async () => {
      try {
        const url = await uploadFile(f);
        setIntake((prev) => ({ ...prev, passportCopyUrl: url }));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Passport upload failed');
      }
    })();
  };
  const onHighSchool = (f?: File) => {
    if (!f) return;
    (async () => {
      try {
        const url = await uploadFile(f);
        setIntake((prev) => ({ ...prev, highSchoolCertificateUrl: url }));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'High school certificate upload failed');
      }
    })();
  };
  const onBirthCertificate = (f?: File) => {
    if (!f) return;
    (async () => {
      try {
        const url = await uploadFile(f);
        setIntake((prev) => ({ ...prev, birthCertificateUrl: url }));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Birth certificate upload failed');
      }
    })();
  };
  const onMotherPassport = (f?: File) => {
    if (!f) return;
    (async () => {
      try {
        const url = await uploadFile(f);
        setIntake((prev) => ({ ...prev, motherPassportUrl: url }));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Mother's passport upload failed");
      }
    })();
  };
  const onFatherPassport = (f?: File) => {
    if (!f) return;
    (async () => {
      try {
        const url = await uploadFile(f);
        setIntake((prev) => ({ ...prev, fatherPassportUrl: url }));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Father's passport upload failed");
      }
    })();
  };
  const onPdfs = (files: FileList | null) => {
    if (!files) return;
    (async () => {
      try {
        const urls = await Promise.all(Array.from(files).map(async (f) => uploadFile(f)));
        setIntake((prev) => ({ ...prev, pdfs: urls }));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'PDF upload failed');
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
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Extra documents upload failed');
      }
    })();
  };
  const submitIntake = () => {
    if (!intakeModal.app) return;
    if (intake.university) {
      try {
        setApplicationUniversity(intakeModal.app.id, intake.university);
      } catch {
        // ignored
      }
    }
    try {
      setApplicationMeta(intakeModal.app.id, {
        dob: intake.dob || undefined,
        aviationDegree: intake.aviationDegree || undefined,
        studyLevel: intake.studyLevel || undefined,
        name: intake.fullName || undefined,
        email: intake.email || undefined,
        phone: intake.phone || undefined,
        country: intake.country || undefined,
        studentEmail: intake.email || undefined,
      } as any);
    } catch {
      // ignored
    }
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
Aviation Degree: ${intake.aviationDegree}
Study Level: ${intake.studyLevel}
High School Note: ${intake.noHighSchoolCertificate ? intake.highSchoolMissingNote : ''}
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
        highSchoolCertificate: intake.noHighSchoolCertificate ? undefined : intake.highSchoolCertificateUrl,
        highSchoolMissingNote: intake.noHighSchoolCertificate ? intake.highSchoolMissingNote : undefined,
        birthCertificate: intake.birthCertificateUrl,
        motherPassport: intake.motherPassportUrl,
        fatherPassport: intake.fatherPassportUrl,
        pdfs: intake.pdfs,
      });
      toast.success('Intake details saved');
      setIntakeModal({ open: false });
      setIntake({ fullName: '', age: '', country: '', phone: '', email: '', passportNumber: '', dob: '', nationality: '', secondNationality: '', homeAddress: '', university: '', aviationDegree: '', studyLevel: '', videoUrl: '', passportCopyUrl: '', highSchoolCertificateUrl: '', noHighSchoolCertificate: false, highSchoolMissingNote: '', birthCertificateUrl: '', motherPassportUrl: '', fatherPassportUrl: '', pdfs: [] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save intake');
    }
  };

  const thisWeekStart = new Date(); thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  const stats = [
    {
      label: 'New This Week',
      value: applications.filter(a => (a.source ?? 'public') === allowedSource && new Date(a.createdAt) >= thisWeekStart).length,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      label: 'Total Pipeline',
      value: applications.filter(a => (a.source ?? 'public') === allowedSource).length,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Pending Review',
      value: pendingApplications.length,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
    },
    {
      label: 'Approved',
      value: applications.filter(a => a.status === 'approved' && (a.source ?? 'public') === allowedSource).length,
      icon: UserPlus,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-100',
    },
  ];

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none bg-white';

  return (
    <div className="min-h-screen bg-[#FAFAF9] space-y-6 pb-12 px-4 md:px-6">

      {/* Page Header */}
      <div className="pt-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {mode === 'ops' ? 'Agency Applications' : 'Application Pipeline'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and manage incoming student applications.</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-100 px-3 py-1 text-[10px] text-amber-700 uppercase tracking-wider font-semibold">
          {mode === 'ops' ? 'Agency Portal' : 'Sales Portal'}
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center shrink-0`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-none">{s.value}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter + Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl px-2 py-1.5 overflow-x-auto">
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
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                quickFilter === f.id
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              {f.label}
              <span className={`ml-1.5 text-[10px] font-semibold ${quickFilter === f.id ? 'text-amber-100' : 'text-gray-400'}`}>
                {quickFilterCounts[f.id] ?? 0}
              </span>
            </button>
          ))}
        </div>
        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 flex items-center gap-2 transition-colors">
            <ArrowUpRight className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-4 py-3 flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by student name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
        />
      </div>

      {/* My Accepted Students */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">My Accepted Students</h2>
          <span className="rounded-full bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-0.5 border border-green-100">
            {applications.filter(a => a.status === 'approved' && (a.source ?? 'public') === allowedSource && (a.ownerId ?? a.salesOwnerId) === user?.id).length} students
          </span>
        </div>
        <div className="divide-y divide-gray-50">
          {applications
            .filter(a => a.status === 'approved' && (a.source ?? 'public') === allowedSource && (a.ownerId ?? a.salesOwnerId) === user?.id)
            .map((a) => {
              const staff = users.find(u => u.id === a.assignedStaffId);
              const initial = staff?.name?.charAt(0)?.toUpperCase() ?? 'A';
              return (
                <div key={a.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                  {/* Student info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 font-bold flex items-center justify-center text-sm shrink-0">
                      {a.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{a.name}</p>
                      <p className="text-xs text-gray-400 truncate">{a.university ? getUniversityName(a.university) : 'University not set'}</p>
                    </div>
                  </div>
                  {/* Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    {staff && (
                      <div className="flex items-center gap-2 mr-1">
                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold">
                          {initial}
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold leading-none">Admin</p>
                          <p className="text-xs font-semibold text-gray-700 leading-tight">{staff.name}</p>
                        </div>
                      </div>
                    )}
                    <select
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white"
                      value={assigning?.studentId === a.studentId ? (assigning?.university ?? '') : (a.university ?? '')}
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
                      className="bg-amber-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-amber-700 transition-colors"
                    >
                      Set Uni
                    </button>
                    <select
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 bg-white"
                      value={assigningStaff?.studentId === a.studentId ? (assigningStaff?.staffId ?? '') : (a.assignedStaffId ?? '')}
                      onChange={(e) => setAssigningStaff({ studentId: a.studentId!, staffId: e.target.value })}
                    >
                      <option value="" disabled>Assign staff</option>
                      {users.filter(u => u.role === 'staff').map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        if (!assigningStaff || !assigningStaff.staffId || assigningStaff.studentId !== a.studentId) return;
                        try {
                          salesAssignAdmin(assigningStaff.studentId, assigningStaff.staffId);
                          toast.success('Staff assigned');
                          setAssigningStaff(null);
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : 'Failed to assign staff');
                        }
                      }}
                      className="bg-amber-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-amber-700 transition-colors"
                    >
                      Set Staff
                    </button>
                    <button
                      onClick={() => setAssignModal({ open: true, stuId: a.studentId })}
                      className="bg-white border border-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Assign Admin
                    </button>
                  </div>
                </div>
              );
            })}
          {applications.filter(a => a.status === 'approved' && (a.source ?? 'public') === allowedSource && (a.ownerId ?? a.salesOwnerId) === user?.id).length === 0 && (
            <div className="py-12 flex flex-col items-center gap-3 text-center">
              <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                <UserPlus className="w-5 h-5" />
              </div>
              <p className="text-sm text-gray-400">No accepted students yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Incoming Applications */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Incoming Applications</h2>
          <span className="rounded-full bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-0.5 border border-amber-100">
            {filteredApplications.length} leads
          </span>
        </div>

        <div className="divide-y divide-gray-50">
          <AnimatePresence mode="popLayout">
            {filteredApplications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 flex flex-col items-center gap-4 text-center"
              >
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">No applications found</p>
                  <p className="text-sm text-gray-400 mt-0.5">Try adjusting your search or filter.</p>
                </div>
              </motion.div>
            ) : (
              filteredApplications.map((application, idx) => (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.04 }}
                  className="px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Left: identity */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 font-bold text-base flex items-center justify-center shrink-0">
                        {application.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{application.name}</h3>
                        <p className="text-xs text-gray-400">Applied {new Date(application.createdAt).toLocaleDateString()}</p>
                        {/* Info chips */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-md px-2 py-0.5">
                            <Mail className="w-3 h-3 text-amber-500" />
                            {application.email}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-md px-2 py-0.5">
                            <Globe className="w-3 h-3 text-amber-500" />
                            {application.country}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-md px-2 py-0.5">
                            <GraduationCap className="w-3 h-3 text-amber-500" />
                            {application.program}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: status badges + actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Intake doc status badges */}
                      <div className="hidden md:flex items-center gap-1">
                        {[
                          { label: 'Video', ok: Boolean(application.intakeVideoUrl) },
                          { label: 'Passport', ok: Boolean(application.intakePassportCopy) },
                          { label: 'HS Cert', ok: Boolean(application.intakeHighSchoolCertificate) },
                          { label: 'PDFs', ok: Boolean(application.intakeAttachments && application.intakeAttachments.length > 0) },
                        ].map(b => (
                          <span
                            key={b.label}
                            className={`rounded-full text-xs font-semibold px-2.5 py-0.5 ${
                              b.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                            }`}
                          >
                            {b.label}
                          </span>
                        ))}
                      </div>

                      {/* Ops missing checklist */}
                      {mode === 'ops' && opsChecklist(application).length > 0 && (
                        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 border border-red-100">
                          <span className="text-[10px] text-red-600 uppercase tracking-wider font-semibold">Missing:</span>
                          <span className="text-[10px] text-red-600 font-semibold">{opsChecklist(application).join(' · ')}</span>
                        </div>
                      )}

                      {/* Needs Info badge */}
                      {mode === 'ops' && application.hold && (
                        <span className="rounded-full text-xs font-semibold px-2.5 py-0.5 bg-orange-50 text-orange-600 border border-orange-100">
                          Needs Info
                        </span>
                      )}

                      {/* Fill Intake (sales) */}
                      {mode === 'sales' && (
                        <button
                          onClick={() => openIntake(application)}
                          className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                        >
                          Fill Intake
                          {!application.intakeDetails && (
                            <span className="rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold px-2 py-0.5">
                              Required
                            </span>
                          )}
                        </button>
                      )}

                      {/* View Intake */}
                      {(application.intakeDetails || application.intakeVideoUrl || (application.intakeAttachments && application.intakeAttachments.length > 0)) && (
                        <button
                          onClick={() => setPreviewModal({ open: true, app: application })}
                          className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors"
                        >
                          View Intake
                        </button>
                      )}

                      {/* Claim Lead (ops) */}
                      {mode === 'ops' && !application.salesOwnerId && (
                        <button
                          onClick={() => {
                            try { salesClaimLead(application.id); toast.success('Lead claimed'); } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed to claim'); }
                          }}
                          className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors"
                        >
                          Claim Lead
                        </button>
                      )}

                      {/* Request Info (ops) */}
                      {mode === 'ops' && (
                        <button
                          onClick={() => setRequestModal({ open: true, app: application, message: application.hold?.message ?? '' })}
                          className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors"
                        >
                          Request Info
                        </button>
                      )}

                      {/* Reject */}
                      <button
                        onClick={() => handleReject(application.id)}
                        className="bg-white border border-gray-200 text-gray-500 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>

                      {/* Approve */}
                      <button
                        onClick={() => {
                          if (mode === 'sales' && !application.intakeDetails) {
                            openIntake(application);
                            return;
                          }
                          handleApprove(application);
                        }}
                        disabled={mode === 'ops' && opsChecklist(application).length > 0}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                          mode === 'ops' && opsChecklist(application).length > 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-amber-600 text-white hover:bg-amber-700'
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
      </div>

      {/* ── Intake Modal ── */}
      {intakeModal.open && (
        <div className="fixed inset-0 z-[100] p-4 flex items-start justify-center overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIntakeModal({ open: false })} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl shadow-xl my-10 flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Student Intake</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5">Short form</p>
              </div>
              <button onClick={() => setIntakeModal({ open: false })} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-5">
              <p className="text-xs text-gray-500">Complete the student profile, then upload documents and save.</p>

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
                    { key: 'aviationDegree', label: 'Aviation Degree (if applicable)' },
                    { key: 'studyLevel', label: 'Study Level' },
                  ] as Array<{ key: Exclude<keyof IntakeForm, 'pdfs' | 'noHighSchoolCertificate'>; label: string }>
                ).map((f, i) => (
                  <div key={i} className={f.key === 'homeAddress' || f.key === 'university' || f.key === 'aviationDegree' || f.key === 'studyLevel' ? 'md:col-span-2' : ''}>
                    <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">{f.label}</label>
                    {f.key === 'university' ? (
                      <select
                        value={intake.university || ''}
                        onChange={(e) => setIntake((prev) => ({ ...prev, university: e.target.value }))}
                        className={inputCls}
                      >
                        <option value="" disabled>Select university</option>
                        {UNIVERSITY_OPTIONS.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    ) : f.key === 'aviationDegree' ? (
                      <select
                        value={intake.aviationDegree || ''}
                        onChange={(e) => setIntake((prev) => ({ ...prev, aviationDegree: e.target.value }))}
                        className={inputCls}
                      >
                        <option value="">None / Not Aviation</option>
                        <option value="pilot">Commercial Pilot License (CPL)</option>
                        <option value="atpl">Airline Transport Pilot License (ATPL)</option>
                        <option value="engineering">Aviation Engineering</option>
                        <option value="management">Aviation Management</option>
                      </select>
                    ) : f.key === 'studyLevel' ? (
                      <select
                        value={intake.studyLevel || ''}
                        onChange={(e) => setIntake((prev) => ({ ...prev, studyLevel: e.target.value }))}
                        className={inputCls}
                      >
                        <option value="" disabled>Select level</option>
                        <option value="bachelor">Bachelor's</option>
                        <option value="master">Master's</option>
                      </select>
                    ) : f.key === 'dob' ? (
                      <input
                        type="date"
                        value={intake.dob || ''}
                        onChange={(e) => {
                          const dob = e.target.value;
                          const computed = dob ? calculateAge(dob) : null;
                          setIntake((prev) => ({
                            ...prev,
                            dob,
                            age: computed == null ? '' : String(computed),
                            ...(computed != null && computed >= 18
                              ? { birthCertificateUrl: '', motherPassportUrl: '', fatherPassportUrl: '' }
                              : {}),
                          }));
                        }}
                        className={inputCls}
                      />
                    ) : f.key === 'age' ? (
                      <input
                        value={(intake.dob && calculateAge(intake.dob) != null) ? String(calculateAge(intake.dob)!) : (intake.age || '')}
                        readOnly
                        className={`${inputCls} text-gray-400 bg-gray-50`}
                      />
                    ) : (
                      <input
                        value={intake[f.key] || ''}
                        onChange={(e) => setIntake((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        className={inputCls}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Documents section */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Required Documents</p>
                  <p className="text-sm font-semibold text-gray-700 mt-0.5">Upload intake media and supporting files.</p>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Video (min. 40 seconds)</label>
                  <input type="file" accept="video/*" capture onChange={(e) => onVideo(e.target.files?.[0])} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none" />
                  <p className="text-[10px] text-gray-400 font-semibold mt-1">If video is in iCloud/OneDrive, keep it on this device before uploading.</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Passport Copy</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => onPassportCopy(e.target.files?.[0])} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none" />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">High School Certificate</label>
                {!intake.noHighSchoolCertificate ? (
                  <input type="file" accept="image/*,.pdf" onChange={(e) => onHighSchool(e.target.files?.[0])} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none" />
                ) : null}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={intake.noHighSchoolCertificate}
                    onChange={(e) => setIntake((prev) => ({ ...prev, noHighSchoolCertificate: e.target.checked, ...(e.target.checked ? { highSchoolMissingNote: prev.highSchoolMissingNote } : { highSchoolMissingNote: '' }) }))}
                    className="h-4 w-4 accent-amber-600"
                  />
                  <p className="text-xs text-gray-600 font-semibold">Student does not have high school certificate</p>
                </div>
                {intake.noHighSchoolCertificate ? (
                  <textarea
                    value={intake.highSchoolMissingNote}
                    onChange={(e) => setIntake((prev) => ({ ...prev, highSchoolMissingNote: e.target.value }))}
                    className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none min-h-[80px]"
                    placeholder="Write the reason / note..."
                  />
                ) : null}
              </div>

              {(() => {
                const age = intake.dob ? calculateAge(intake.dob) : null;
                const underage = age != null && age < 18;
                if (!underage) return null;
                return (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Birth Certificate</label>
                      <input type="file" accept="image/*,.pdf" onChange={(e) => onBirthCertificate(e.target.files?.[0])} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Mother's Passport</label>
                      <input type="file" accept="image/*,.pdf" onChange={(e) => onMotherPassport(e.target.files?.[0])} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Father's Passport</label>
                      <input type="file" accept="image/*,.pdf" onChange={(e) => onFatherPassport(e.target.files?.[0])} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none" />
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Upload PDFs</label>
                <input multiple type="file" accept="application/pdf" onChange={(e) => onPdfs(e.target.files)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none" />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Extra Documents (optional)</label>
                <input multiple type="file" accept="application/pdf,image/*" onChange={(e) => onExtraDocs(e.target.files)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none" />
                <p className="text-[10px] text-gray-400 font-semibold mt-1">Use for unique cases requiring additional files.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setIntakeModal({ open: false })} className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={submitIntake} className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors">Save Intake</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Modal ── */}
      {previewModal.open && previewModal.app && (
        <div className="fixed inset-0 z-[100] p-4 flex items-start justify-center overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPreviewModal({ open: false })} />
          <div className="relative bg-white rounded-2xl w-full max-w-3xl shadow-xl my-10">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Intake Preview</h3>
              <button onClick={() => setPreviewModal({ open: false })} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {previewModal.app.intakeVideoUrl && (
                <video controls className="w-full rounded-xl border border-gray-100" src={previewModal.app.intakeVideoUrl} />
              )}
              <pre className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {previewModal.app.intakeDetails || previewModal.app.internalNotes?.[0]?.text || 'No intake summary'}
              </pre>
              <div className="grid sm:grid-cols-2 gap-2">
                {previewModal.app.intakePassportCopy && (
                  <button onClick={() => previewModal.app?.intakePassportCopy && openStorageUrl(previewModal.app.intakePassportCopy)} className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-100 hover:bg-blue-100 transition-colors">Passport Copy</button>
                )}
                {previewModal.app.intakeHighSchoolCertificate && (
                  <button onClick={() => previewModal.app?.intakeHighSchoolCertificate && openStorageUrl(previewModal.app.intakeHighSchoolCertificate)} className="px-4 py-2 rounded-lg bg-purple-50 text-purple-700 text-sm font-semibold border border-purple-100 hover:bg-purple-100 transition-colors">High School Certificate</button>
                )}
                {previewModal.app.intakeHighSchoolMissingNote && !previewModal.app.intakeHighSchoolCertificate && (
                  <div className="px-4 py-2 rounded-lg bg-purple-50 text-purple-700 text-sm font-semibold border border-purple-100">
                    HS Note: {previewModal.app.intakeHighSchoolMissingNote}
                  </div>
                )}
                {previewModal.app.intakeBirthCertificate && (
                  <button onClick={() => previewModal.app?.intakeBirthCertificate && openStorageUrl(previewModal.app.intakeBirthCertificate)} className="px-4 py-2 rounded-lg bg-amber-50 text-amber-700 text-sm font-semibold border border-amber-100 hover:bg-amber-100 transition-colors">Birth Certificate</button>
                )}
                {previewModal.app.intakeMotherPassport && (
                  <button onClick={() => previewModal.app?.intakeMotherPassport && openStorageUrl(previewModal.app.intakeMotherPassport)} className="px-4 py-2 rounded-lg bg-amber-50 text-amber-700 text-sm font-semibold border border-amber-100 hover:bg-amber-100 transition-colors">Mother Passport</button>
                )}
                {previewModal.app.intakeFatherPassport && (
                  <button onClick={() => previewModal.app?.intakeFatherPassport && openStorageUrl(previewModal.app.intakeFatherPassport)} className="px-4 py-2 rounded-lg bg-amber-50 text-amber-700 text-sm font-semibold border border-amber-100 hover:bg-amber-100 transition-colors">Father Passport</button>
                )}
              </div>
              {previewModal.app.intakeAttachments && previewModal.app.intakeAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {previewModal.app.intakeAttachments.map((p, i) => (
                    <button key={i} onClick={() => openStorageUrl(p)} className="rounded-full bg-amber-50 text-amber-700 text-xs font-semibold px-2.5 py-0.5 border border-amber-100 hover:bg-amber-100 transition-colors">PDF {i + 1}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50 rounded-b-2xl">
              <button onClick={() => setPreviewModal({ open: false })} className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Admin Modal ── */}
      {assignModal.open && (
        <div className="fixed inset-0 z-[100] p-4 flex items-start justify-center overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAssignModal({ open: false })} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg shadow-xl my-10">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Assign Admin</h3>
              <button onClick={() => setAssignModal({ open: false })} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Select Admin</label>
                <select
                  value={assignModal.staffId || ''}
                  onChange={(e) => setAssignModal((m) => ({ ...m, staffId: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Choose staff...</option>
                  {users.filter(u => u.role === 'staff').map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setAssignModal({ open: false })} className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
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
                className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Request More Info Modal ── */}
      {requestModal.open && requestModal.app && (
        <div className="fixed inset-0 z-[110] p-4 flex items-start justify-center overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRequestModal({ open: false, message: '' })} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl shadow-xl my-10">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Request More Info</h3>
                <p className="text-xs text-gray-400 mt-0.5">{requestModal.app.name}</p>
              </div>
              <button onClick={() => setRequestModal({ open: false, message: '' })} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">Quick templates</label>
                <div className="flex flex-wrap gap-1.5">
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
                      className="rounded-full text-xs font-semibold px-2.5 py-0.5 bg-gray-50 text-gray-700 border border-gray-200 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-colors"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Message to agency</label>
                <textarea
                  value={requestModal.message}
                  onChange={(e) => setRequestModal((m) => ({ ...m, message: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none min-h-[120px]"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setRequestModal({ open: false, message: '' })} className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
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
                className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Credentials Modal ── */}
      {credentialsModal.open && (
        <div className="fixed inset-0 z-[150] p-4 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100"
          >
            {/* Close */}
            <button
              onClick={() => setCredentialsModal({ open: false })}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 text-center">
              {/* Success icon */}
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Account Created</h3>
              <p className="text-sm text-gray-500 mb-6">
                {credentialsModal.emailSent
                  ? 'Credentials have been emailed to the student.'
                  : 'Account created. Copy the credentials below and share them manually.'}
              </p>

              <div className="space-y-3 text-left">
                {/* Username box */}
                <div className="border border-gray-200 rounded-xl p-4 relative group hover:border-amber-300 transition-colors">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Username / Email</p>
                  <p className="font-mono text-sm font-semibold text-gray-900 break-all pr-16">{credentialsModal.username}</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(credentialsModal.username || ''); toast.success('Username copied'); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-colors"
                  >
                    Copy
                  </button>
                </div>

                {/* Password box */}
                <div className="border border-gray-200 rounded-xl p-4 relative group hover:border-amber-300 transition-colors">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Temporary Password</p>
                  <p className="font-mono text-sm font-semibold text-gray-900 pr-16">{credentialsModal.password}</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(credentialsModal.password || ''); toast.success('Password copied'); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <button
                onClick={() => setCredentialsModal({ open: false })}
                className="mt-6 w-full bg-amber-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-amber-700 transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SalesDashboard;
