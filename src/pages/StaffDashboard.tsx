import { useMemo, useState } from 'react';
import type { FC } from 'react';
import { 
  Search, 
  FileText, 
  Plus, 
  MessageSquare, 
  UserCircle, 
  ChevronRight, 
  Download, 
  Clock,
  CheckCircle2,
  X,
  Upload,
  Users,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UNIVERSITY_OPTIONS, getUniversityName } from '../lib/universities';
import { getSupabase } from '../lib/supabase';

const StaffDashboard: FC = () => {
  const { applications, documents, users, staffUploadDocument, staffAddInternalNote, staffUpdateStudentProfile, staffVerifyDocument, assignUniversity } = useAppStore();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [newDocument, setNewDocument] = useState<{ title: string; type: string; file?: string; fileObject?: File }>({ title: '', type: '' });
  const [noteText, setNoteText] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileUniversity, setProfileUniversity] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');
  const [visaExpiry, setVisaExpiry] = useState('');
  const [residenceExpiry, setResidenceExpiry] = useState('');

  const [filter, setFilter] = useState<'all'|'processing'|'enrolled'|'closed'>('all');
  const approvedStudents = useMemo(() => {
    const base = applications.filter(app => app.status === 'approved');
    if (currentUser?.role === 'staff') {
      return base.filter(app => app.assignedStaffId === currentUser.id);
    }
    if (currentUser?.role === 'agency_staff') {
      return base.filter(app => (app.source ?? 'public') === 'agency');
    }
    return base;
  }, [applications, currentUser]);
  const stepIds = ['translation','university-approval','recognition-letter','ministry-order','visa-documents'] as const;
  const isComplete = (studentId?: string) => {
    if (!studentId) return false;
    return stepIds.every(id => documents.some(d => d.studentId === studentId && d.type === id && d.status === 'verified'));
  };
  const selectedStudent = useMemo(
    () => approvedStudents.find(app => app.id === selectedStudentId) ?? null,
    [approvedStudents, selectedStudentId]
  );

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

  const handleSaveProfile = () => {
    if (!selectedStudent?.studentId) {
      toast.error('Student account not linked to this application yet.');
      return;
    }
    try {
      const isCeo = currentUser?.role === 'ceo';
      staffUpdateStudentProfile(selectedStudent.studentId, isCeo ? {
        name: profileName.trim(),
        email: profileEmail.trim(),
        phone: profilePhone.trim(),
        passportExpiry,
        visaExpiry,
        residenceExpiry,
      } : {
        passportExpiry,
        visaExpiry,
        residenceExpiry,
      });
      if (profileUniversity.trim()) {
        assignUniversity(selectedStudent.studentId, profileUniversity.trim());
      }
      toast.success('Student profile updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update profile');
    }
  };

  const handleAddDocument = async () => {
    if (!selectedStudent || !selectedStudent.studentId) {
      toast.error('Student account not linked to this application yet.');
      return;
    }
    if (!newDocument.title || !newDocument.type) return;
    if (!newDocument.fileObject) {
      toast.error('Please attach a file');
      return;
    }

    try {
      const fileUrl = await uploadFile(newDocument.fileObject);
      staffUploadDocument({
        ...newDocument,
        studentId: selectedStudent.studentId,
        title: newDocument.title,
        type: newDocument.type,
        file: fileUrl,
      });
      toast.success('Document uploaded successfully');
      setShowDocumentModal(false);
      setNewDocument({ title: '', type: '' });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to upload document');
    }
  };

  const addNote = () => {
    if (!selectedStudent) return;
    if (!noteText.trim()) return;

    try {
      staffAddInternalNote(selectedStudent.id, noteText);
      setNoteText('');
      toast.success('Internal note added');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add note');
    }
  };

  // Stage controls are replaced by admission steps with quick upload

  const filteredStudents = approvedStudents.filter(app => {
    const term = searchTerm.toLowerCase();
    const uniRaw = app.university ?? '';
    const uniName = getUniversityName(uniRaw);
    const matchesText = (
      (app.name ?? '').toLowerCase().includes(term) ||
      (app.email ?? '').toLowerCase().includes(term) ||
      uniRaw.toLowerCase().includes(term) ||
      uniName.toLowerCase().includes(term)
    );
    const statusOk =
      filter === 'all' ? true :
      filter === 'processing' ? !isComplete(app.studentId) :
      filter === 'enrolled' ? isComplete(app.studentId) :
      filter === 'closed' ? (app.stage === 'enrolled' && app.arrived) :
      true;
    return matchesText && statusOk;
  });
  const selectedDocs = selectedStudent?.studentId ? documents.filter(d => d.studentId === selectedStudent.studentId) : [];

  // reuse isComplete above
  const enrolledCount = approvedStudents.filter(a => isComplete(a.studentId)).length;
  const processingCount = approvedStudents.filter(a => !isComplete(a.studentId)).length;
  const closedCount = approvedStudents.filter(a => a.stage === 'enrolled' && a.arrived).length;
  const stats = [
    { label: 'Processing', value: processingCount, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Enrolled', value: enrolledCount, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Closed Cases', value: closedCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tight">Student Operations</h1>
          <p className="text-gray-500 font-medium">Manage student records, documents, and progress.</p>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-black">{stat.value}</p>
          </div>
        ))}
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Student List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[36px] border border-gray-100 shadow-[0_18px_60px_-45px_rgba(0,0,0,0.22)] overflow-hidden flex flex-col h-[60vh] lg:h-[700px]">
            <div className="p-6 border-b border-gray-50 space-y-4">
              <h2 className="text-xl font-black text-black">Students</h2>
              {(currentUser?.role === 'staff' || currentUser?.role === 'agency_staff') && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">My Points</span>
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black">{currentUser.points ?? 0}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Filter:</span>
                <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-xl text-xs font-bold ${filter === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}>All</button>
                <button onClick={() => setFilter('processing')} className={`px-3 py-1 rounded-xl text-xs font-bold ${filter === 'processing' ? 'bg-black text-white' : 'bg-purple-100 text-purple-700'}`}>Processing</button>
                <button onClick={() => setFilter('enrolled')} className={`px-3 py-1 rounded-xl text-xs font-bold ${filter === 'enrolled' ? 'bg-black text-white' : 'bg-green-100 text-green-700'}`}>Enrolled</button>
                <button onClick={() => setFilter('closed')} className={`px-3 py-1 rounded-xl text-xs font-bold ${filter === 'closed' ? 'bg-black text-white' : 'bg-blue-100 text-blue-700'}`}>Closed</button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
              {filteredStudents.map((app) => (
                <div
                  key={app.id}
                  onClick={() => {
                    setSelectedStudentId(app.id);
                    setMobileDetailsOpen(true);
                    setProfileName(app.name ?? '');
                    setProfileEmail(app.email ?? '');
                    setProfilePhone(app.phone ?? '');
                    setProfileUniversity(app.university ?? '');
                    const stu = app.studentId ? users.find(u => u.id === app.studentId) : null;
                    setPassportExpiry(stu?.passportExpiry ?? '');
                    setVisaExpiry(stu?.visaExpiry ?? '');
                    setResidenceExpiry(stu?.residenceExpiry ?? '');
                  }}
                  className={`p-6 hover:bg-gray-50/70 cursor-pointer transition-all relative group ${
                    selectedStudent?.id === app.id ? 'bg-amber-50/50' : ''
                  }`}
                >
                  {selectedStudent?.id === app.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-bold group-hover:bg-amber-500 group-hover:text-black transition-colors">
                      {app.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-black truncate">{app.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          app.stage === 'enrolled' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {app.stage || 'Applied'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400">
                          {app.university ? `(${getUniversityName(app.university)})` : ''}
                        </span>
                        {(app.source ?? 'public') === 'agency' && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">Agency</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${selectedStudent?.id === app.id ? 'translate-x-1 text-amber-500' : ''}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {currentUser?.role === 'ceo' && (
            <div className="bg-white rounded-[36px] border border-gray-100 shadow-[0_18px_60px_-45px_rgba(0,0,0,0.22)] overflow-hidden flex flex-col h-[500px]">
              <div className="p-6 border-b border-gray-50">
                <h2 className="text-xl font-black text-black">Agency Students</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Approved via /agencies</p>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
                {applications.filter(a => (a.source ?? 'public') === 'agency' && a.status === 'approved').map((app) => (
                  <div
                    key={app.id}
                    onClick={() => {
                      setSelectedStudentId(app.id);
                      setMobileDetailsOpen(true);
                      setProfileName(app.name ?? '');
                      setProfileEmail(app.email ?? '');
                      setProfilePhone(app.phone ?? '');
                      setProfileUniversity(app.university ?? '');
                      const stu = app.studentId ? users.find(u => u.id === app.studentId) : null;
                      setPassportExpiry(stu?.passportExpiry ?? '');
                      setVisaExpiry(stu?.visaExpiry ?? '');
                      setResidenceExpiry(stu?.residenceExpiry ?? '');
                    }}
                    className="p-6 hover:bg-gray-50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-bold">
                        {app.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-black truncate">{app.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-gray-400">{app.university ? getUniversityName(app.university) : ''}</span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">Agency</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {applications.filter(a => (a.source ?? 'public') === 'agency' && a.status === 'approved').length === 0 && (
                  <div className="p-6 text-sm font-medium text-gray-500">No agency students</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Detailed View */}
        <div className="lg:col-span-2 space-y-6 hidden lg:block">
          <AnimatePresence mode="wait">
            {selectedStudent ? (
              <motion.div
                key={selectedStudent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Profile Header Card */}
                <div className="bg-white rounded-[36px] p-8 border border-gray-100 shadow-[0_18px_60px_-45px_rgba(0,0,0,0.22)]">
                  <div className="grid lg:grid-cols-3 gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700 font-black text-2xl">
                        {selectedStudent.name.charAt(0)}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Student name</label>
                          <input disabled={currentUser?.role !== 'ceo'} value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email</label>
                            <input disabled={currentUser?.role !== 'ceo'} value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed" />
                          </div>
                          <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phone</label>
                            <input disabled={currentUser?.role !== 'ceo'} value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">University</label>
                      <select value={profileUniversity} onChange={(e) => setProfileUniversity(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 font-bold outline-none focus:ring-2 focus:ring-amber-500/20">
                        <option value="">Select university</option>
                        {UNIVERSITY_OPTIONS.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Assigned by Sales/Staff</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldCheck className="w-4 h-4 text-amber-500" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Passport Expiry</p>
                        </div>
                        <input type="date" value={passportExpiry} onChange={(e) => setPassportExpiry(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-2 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/20" />
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-amber-500" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Visa Expiry</p>
                        </div>
                        <input type="date" value={visaExpiry} onChange={(e) => setVisaExpiry(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-2 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/20" />
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-amber-500" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Residence Permit</p>
                        </div>
                        <input type="date" value={residenceExpiry} onChange={(e) => setResidenceExpiry(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-2 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/20" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <button onClick={handleSaveProfile} className="bg-black text-white px-6 py-2.5 rounded-2xl font-black text-sm hover:bg-amber-500 hover:text-black transition-all shadow-sm">Save Profile</button>
                    {selectedStudent.studentId && currentUser && (currentUser.role === 'staff' || currentUser.role === 'agency_staff') && (
                      <button
                        onClick={() => navigate('/messages', { state: { openThreadKey: `${selectedStudent.id}|${[currentUser.id, selectedStudent.studentId].sort().join('|')}` } })}
                        className="bg-white border border-gray-200 text-black px-6 py-2.5 rounded-2xl font-black text-sm hover:bg-gray-50 transition-all"
                      >
                        Open Student Chat
                      </button>
                    )}
                    {selectedStudent.agencyId && currentUser && (currentUser.role === 'staff' || currentUser.role === 'agency_staff') && (
                      <button
                        onClick={() => navigate('/messages', { state: { openThreadKey: `${selectedStudent.id}|${[currentUser.id, selectedStudent.agencyId!].sort().join('|')}` } })}
                        className="bg-white border border-gray-200 text-black px-6 py-2.5 rounded-2xl font-black text-sm hover:bg-gray-50 transition-all"
                      >
                        Open Agency Chat
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (!selectedStudent) return;
                        useAppStore.getState().setArrivalStatus(selectedStudent.id, !selectedStudent.arrived);
                        toast.success(!selectedStudent.arrived ? 'Marked as Arrived' : 'Marked as Not Arrived');
                      }}
                      className={`px-6 py-2.5 rounded-2xl font-black text-sm ${selectedStudent.arrived ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'} hover:bg-blue-200 transition-all`}
                    >
                      {selectedStudent.arrived ? 'Unmark Arrived' : 'Mark Arrived'}
                    </button>
                    <button onClick={() => setShowDocumentModal(true)} className="bg-white border border-gray-200 text-black px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-amber-50 transition-all flex items-center gap-2 shadow-sm">
                      <Upload className="w-4 h-4" />
                      Upload Document
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Progress Control replaced with Admission Steps */}
                  <div className="bg-white rounded-[36px] p-8 border border-gray-100 shadow-[0_18px_60px_-45px_rgba(0,0,0,0.22)]">
                    <h3 className="text-xl font-black text-black mb-2">Student Admission Steps</h3>
                    <p className="text-gray-500 font-medium mb-6">
                      Upload the required document for each step to mark it complete for the student.
                    </p>
                    <div className="space-y-3">
                      {[
                        { id: 'translation', label: 'Documents translation' },
                        { id: 'university-approval', label: 'University initial approval' },
                        { id: 'recognition-letter', label: 'Recognition letter' },
                        { id: 'ministry-order', label: 'Ministry order' },
                        { id: 'visa-documents', label: 'Visa required documents' },
                      ].map(step => {
                        const has = selectedDocs.some(d => d.type === step.id);
                        return (
                          <div
                            key={step.id}
                            className={`flex items-center justify-between px-5 py-4 rounded-2xl border ${
                              has ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'
                            }`}
                          >
                            <p className="font-bold text-black">{step.label}</p>
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  has ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'
                                }`}
                              >
                                {has ? 'Uploaded' : 'Missing'}
                              </span>
                              <button
                                onClick={() => {
                                  setNewDocument({ title: step.label, type: step.id });
                                  setShowDocumentModal(true);
                                }}
                                className="px-4 py-2 rounded-xl font-bold text-sm bg-white border border-gray-100 hover:bg-amber-100 transition-all"
                              >
                                Upload
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-[36px] p-8 border border-gray-100 shadow-[0_18px_60px_-45px_rgba(0,0,0,0.22)]">
                    <h3 className="text-xl font-black text-black mb-2">Sales Intake</h3>
                    {selectedStudent.intakeDetails ? (
                      <div className="space-y-6">
                        {selectedStudent.intakeVideoUrl && (
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Intro Video</p>
                            <video controls className="w-full rounded-2xl border border-gray-100" src={selectedStudent.intakeVideoUrl} />
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Form Summary</p>
                          <pre className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium whitespace-pre-wrap">{selectedStudent.intakeDetails}</pre>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {selectedStudent.intakePassportCopy && (
                            <a href={selectedStudent.intakePassportCopy} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100">Passport Copy</a>
                          )}
                          {selectedStudent.intakeHighSchoolCertificate && (
                            <a href={selectedStudent.intakeHighSchoolCertificate} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 text-sm font-bold border border-purple-100">High School Certificate</a>
                          )}
                        </div>
                        {selectedStudent.intakeAttachments && selectedStudent.intakeAttachments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedStudent.intakeAttachments.map((p, i) => (
                              <a key={i} href={p} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black">PDF {i + 1}</a>
                            ))}
                          </div>
                        )}
                        {selectedStudent.intakeExtraDocs && selectedStudent.intakeExtraDocs.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedStudent.intakeExtraDocs.map((p, i) => (
                              <a key={i} href={p} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-full bg-gray-50 text-gray-700 text-[10px] font-black">Extra {i + 1}</a>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 font-medium">No intake details submitted yet.</p>
                    )}
                  </div>
                  <div className="bg-white rounded-[36px] p-8 border border-gray-100 shadow-[0_18px_60px_-45px_rgba(0,0,0,0.22)]">
                    <h3 className="text-xl font-black text-black mb-6">Activity Timeline</h3>
                    {(selectedStudent.events ?? []).length === 0 ? (
                      <p className="text-gray-500 font-medium">No activity yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-2">
                        {(selectedStudent.events ?? [])
                          .slice()
                          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                          .map((ev) => {
                            const label =
                              ev.type === 'submitted' ? 'Submitted' :
                              ev.type === 'approved' ? 'Approved' :
                              ev.type === 'rejected' ? 'Rejected' :
                              ev.type === 'claimed' ? 'Claimed' :
                              ev.type === 'needs_info' ? 'Needs Info Requested' :
                              ev.type === 'extra_docs_added' ? 'Extra Documents Added' :
                              ev.type === 'identity_updated' ? 'Identity Updated' :
                              ev.type === 'university_set' ? 'University Set' :
                              ev.type === 'assigned_staff' ? 'Assigned Staff' :
                              ev.type === 'arrival_set' ? 'Arrival Updated' :
                              ev.type === 'document_uploaded' ? 'Document Uploaded' :
                              'Document Verified';
                            const details = ev.type === 'university_set' ? getUniversityName(ev.details) : ev.details;
                            return (
                              <div key={ev.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-black text-black">{label}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{ev.byName}</p>
                                  </div>
                                  <p className="text-[10px] font-bold text-gray-400">{new Date(ev.time).toLocaleString()}</p>
                                </div>
                                {details && <p className="text-sm font-medium text-gray-600 mt-2 whitespace-pre-wrap">{details}</p>}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                  {/* Internal Notes */}
                  <div className="bg-white rounded-[36px] p-8 border border-gray-100 shadow-[0_18px_60px_-45px_rgba(0,0,0,0.22)] flex flex-col h-[360px] sm:h-[480px]">
                    <h3 className="text-xl font-black text-black mb-6 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-amber-500" />
                      Internal Notes
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
                      {(selectedStudent.internalNotes ?? []).length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                          <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                          <p className="text-xs font-bold uppercase tracking-widest">No notes yet</p>
                        </div>
                      ) : (
                        (selectedStudent.internalNotes ?? []).map((note, idx) => (
                          <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">{note.authorName}</p>
                              <p className="text-[10px] text-gray-400 font-medium">{new Date(note.createdAt).toLocaleDateString()}</p>
                            </div>
                            <p className="text-sm font-medium text-gray-700 leading-relaxed">{note.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addNote()}
                        placeholder="Type an internal note..."
                        className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                      />
                      <button 
                        onClick={() => addNote()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-amber-600 hover:bg-amber-100 rounded-xl transition-all"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Documents Table */}
                <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-black flex items-center gap-2">
                      <FileText className="w-5 h-5 text-amber-500" />
                      Student Documents
                    </h3>
                  </div>
                  <div className="overflow-x-auto hidden sm:block">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b border-gray-100">
                          <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Title</th>
                          <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                          <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedDocs.map((doc, idx) => (
                          <tr key={idx} className="group">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="font-bold text-black text-sm">{doc.title}</p>
                                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{doc.type}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 text-sm font-bold text-gray-500">
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 text-right">
                              <button className="p-2 text-gray-400 hover:text-amber-500 transition-colors" title="Download">
                                <Download className="w-4 h-4" />
                              </button>
                              {doc.status !== 'verified' && (
                                <button
                                  onClick={() => {
                                    try {
                                      staffVerifyDocument(doc.id);
                                      toast.success('Document verified');
                                    } catch (e) {
                                      toast.error(e instanceof Error ? e.message : 'Failed to verify');
                                    }
                                  }}
                                  className="ml-2 px-3 py-2 bg-green-100 text-green-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-200 transition-all"
                                >
                                  Verify
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {selectedDocs.length === 0 && (
                      <div className="py-12 text-center text-gray-400">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        <p className="text-sm font-bold uppercase tracking-widest">No documents uploaded yet</p>
                      </div>
                    )}
                  </div>
                  <div className="sm:hidden space-y-3">
                    {selectedDocs.map((doc, idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-black text-black truncate">{doc.title}</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{doc.type}</p>
                            <p className="text-xs font-bold text-gray-500 mt-2">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button className="p-2 text-gray-500 hover:text-amber-600 transition-colors" title="Download">
                              <Download className="w-5 h-5" />
                            </button>
                            {doc.status !== 'verified' && (
                              <button
                                onClick={() => {
                                  try {
                                    staffVerifyDocument(doc.id);
                                    toast.success('Document verified');
                                  } catch (e) {
                                    toast.error(e instanceof Error ? e.message : 'Failed to verify');
                                  }
                                }}
                                className="px-3 py-2 bg-green-100 text-green-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-200 transition-all"
                              >
                                Verify
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedDocs.length === 0 && (
                      <div className="py-8 text-center text-gray-400">
                        <FileText className="w-10 h-10 mx-auto mb-3 opacity-10" />
                        <p className="text-sm font-bold uppercase tracking-widest">No documents uploaded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-[700px] flex flex-col items-center justify-center bg-white rounded-[32px] border border-gray-100 shadow-sm text-center p-12">
                <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center mb-8 text-gray-200">
                  <UserCircle className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-black text-black mb-4">Select a student</h3>
                <p className="text-gray-400 font-medium max-w-xs mx-auto">
                  Select a student from the list to view their profile, manage documents, and update application progress.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {mobileDetailsOpen && selectedStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] p-4 flex items-start justify-center overflow-y-auto lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setMobileDetailsOpen(false)} />
            <motion.div initial={{ y: 12, opacity: 0.98 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0.98 }} className="relative tw-card w-full max-w-2xl my-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Student</p>
                  <p className="text-xl font-black text-black truncate">{selectedStudent.name}</p>
                </div>
                <button onClick={() => setMobileDetailsOpen(false)} className="p-2 rounded-xl hover:bg-gray-50" aria-label="Close">
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Student name</label>
                        <input disabled={currentUser?.role !== 'ceo'} value={profileName} onChange={(e) => setProfileName(e.target.value)} className="mt-2 w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phone</label>
                        <input disabled={currentUser?.role !== 'ceo'} value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className="mt-2 w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email</label>
                      <input disabled={currentUser?.role !== 'ceo'} value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="mt-2 w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">University</label>
                      <select value={profileUniversity} onChange={(e) => setProfileUniversity(e.target.value)} className="mt-2 w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-amber-500/20 appearance-none">
                        <option value="">Select university</option>
                        {UNIVERSITY_OPTIONS.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldCheck className="w-4 h-4 text-amber-500" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Passport Expiry</p>
                        </div>
                        <input type="date" value={passportExpiry} onChange={(e) => setPassportExpiry(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/20" />
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-amber-500" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Visa Expiry</p>
                        </div>
                        <input type="date" value={visaExpiry} onChange={(e) => setVisaExpiry(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/20" />
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-amber-500" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Residence Permit</p>
                        </div>
                        <input type="date" value={residenceExpiry} onChange={(e) => setResidenceExpiry(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500/20" />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button onClick={handleSaveProfile} className="bg-black text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-amber-500 hover:text-black transition-all">Save Profile</button>
                      <button onClick={() => setShowDocumentModal(true)} className="bg-white border border-gray-200 text-black px-6 py-3 rounded-2xl font-black text-sm hover:bg-amber-50 transition-all flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Document
                      </button>
                      <button
                        onClick={() => {
                          useAppStore.getState().setArrivalStatus(selectedStudent.id, !selectedStudent.arrived);
                          toast.success(!selectedStudent.arrived ? 'Marked as Arrived' : 'Marked as Not Arrived');
                        }}
                        className={`px-6 py-3 rounded-2xl font-black text-sm ${selectedStudent.arrived ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'} hover:bg-blue-200 transition-all`}
                      >
                        {selectedStudent.arrived ? 'Unmark Arrived' : 'Mark Arrived'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-black text-black flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-500" />
                    Student Documents
                  </h3>
                  <div className="mt-4 space-y-3">
                    {selectedDocs.map((doc, idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-black text-black truncate">{doc.title}</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{doc.type}</p>
                            <p className="text-xs font-bold text-gray-500 mt-2">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button className="p-2 text-gray-500 hover:text-amber-600 transition-colors" title="Download">
                              <Download className="w-5 h-5" />
                            </button>
                            {doc.status !== 'verified' && (
                              <button
                                onClick={() => {
                                  try {
                                    staffVerifyDocument(doc.id);
                                    toast.success('Document verified');
                                  } catch (e) {
                                    toast.error(e instanceof Error ? e.message : 'Failed to verify');
                                  }
                                }}
                                className="px-3 py-2 bg-green-100 text-green-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-200 transition-all"
                              >
                                Verify
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedDocs.length === 0 && (
                      <div className="py-8 text-center text-gray-400">
                        <FileText className="w-10 h-10 mx-auto mb-3 opacity-10" />
                        <p className="text-sm font-bold uppercase tracking-widest">No documents uploaded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Modal */}
      <AnimatePresence>
        {showDocumentModal && (
          <div className="fixed inset-0 flex items-start justify-center overflow-y-auto z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDocumentModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl my-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setShowDocumentModal(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-2xl font-black text-black mb-8 flex items-center gap-3">
                <Upload className="w-6 h-6 text-amber-500" />
                Upload Document
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Document Title</label>
                  <input
                    type="text"
                    value={newDocument.title}
                    onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                    placeholder="e.g. Acceptance Letter"
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Document Type</label>
                  <select
                    value={newDocument.type}
                    onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-amber-500/20 transition-all outline-none appearance-none"
                  >
                    <option value="">Select step...</option>
                    <option value="translation">Documents translation</option>
                    <option value="university-approval">University initial approval</option>
                    <option value="recognition-letter">Recognition letter</option>
                    <option value="ministry-order">Ministry order</option>
                    <option value="visa-documents">Visa required documents</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Attach File</label>
                  <input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = URL.createObjectURL(file);
                      setNewDocument({ ...newDocument, file: url, fileObject: file, title: newDocument.title || file.name });
                    }}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-medium transition-all outline-none"
                  />
                </div>
                
                <div className="pt-4">
                  <button
                    onClick={handleAddDocument}
                    className="w-full bg-black text-white py-4 rounded-2xl font-black text-lg hover:bg-amber-500 hover:text-black transition-all shadow-xl shadow-black/5"
                  >
                    Upload Now
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffDashboard;
