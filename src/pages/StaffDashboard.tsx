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
import { openStorageUrl } from '../lib/storage';

const StaffDashboard: FC = () => {
  const { applications, documents, users, staffUploadDocument, staffAddInternalNote, staffUpdateStudentProfile, staffVerifyDocument, assignUniversity, staffRequestDocument } = useAppStore();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [newDocument, setNewDocument] = useState<{ title: string; type: string; file?: string; fileObject?: File }>({ title: '', type: '' });
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestDoc, setRequestDoc] = useState({ title: '', description: '' });
  const [noteText, setNoteText] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileUniversity, setProfileUniversity] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');
  const [visaExpiry, setVisaExpiry] = useState('');
  const [residenceExpiry, setResidenceExpiry] = useState('');

  const [filter, setFilter] = useState<'all'|'processing'|'enrolled'|'closed'>('all');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const approvedStudents = useMemo(() => {
    const base = applications.filter(app => app.status === 'approved');
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

  const studentDocStatus = (studentId?: string): 'complete' | 'rejected' | 'processing' | 'none' => {
    if (!studentId) return 'none';
    const docs = documents.filter(d => d.studentId === studentId);
    if (docs.some(d => d.status === 'rejected')) return 'rejected';
    if (isComplete(studentId)) return 'complete';
    if (docs.length > 0) return 'processing';
    return 'none';
  };

  const statusBarClass = (s: 'complete' | 'rejected' | 'processing' | 'none') => {
    if (s === 'complete') return 'bg-green-500';
    if (s === 'rejected') return 'bg-red-500';
    if (s === 'processing') return 'bg-amber-500';
    return 'bg-gray-200';
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
    setUploadingDoc(true);
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
    } finally {
      setUploadingDoc(false);
    }
  };

  const openRemoteFile = async (fileUrl: string) => {
    if (!fileUrl) {
      toast.error('No file URL available');
      return;
    }
    try {
      await openStorageUrl(fileUrl);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to open file');
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
    const emailValue = (app.studentEmail ?? app.email ?? '').toLowerCase();
    const matchesText = (
      (app.name ?? '').toLowerCase().includes(term) ||
      emailValue.includes(term) ||
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
  const filterCounts = {
    all: approvedStudents.length,
    processing: processingCount,
    enrolled: enrolledCount,
    closed: closedCount,
  };
  const stats = [
    { label: 'Processing', value: processingCount, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Enrolled', value: enrolledCount, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Closed Cases', value: closedCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-6 pb-12 bg-[#FAFAF9]">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Student Operations</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage student records, documents, and progress.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 self-start md:self-auto">
          Staff Portal
        </span>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className={`w-9 h-9 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-0.5">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Student List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[60vh] lg:h-[720px]">
            {/* List header */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-gray-900">Students</h2>
                {(currentUser?.role === 'staff' || currentUser?.role === 'agency_staff') && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500 font-semibold">Points:</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{currentUser.points ?? 0}</span>
                  </div>
                )}
              </div>
              {/* Filter tabs */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(['all', 'processing', 'enrolled', 'closed'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      filter === f
                        ? 'bg-amber-600 text-white'
                        : f === 'processing' ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                        : f === 'enrolled' ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : f === 'closed' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)} ({filterCounts[f]})
                  </button>
                ))}
              </div>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
              {filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="font-semibold text-gray-500 text-sm">No students yet</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-[180px]">Approve an application from the Sales tab to see students here.</p>
                </div>
              ) : filteredStudents.map((app) => {
                const docStatus = studentDocStatus(app.studentId);
                const isSelected = selectedStudent?.id === app.id;
                return (
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
                    className={`px-4 py-3 cursor-pointer transition-colors relative ${isSelected ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                  >
                    {/* Left color bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${isSelected ? 'bg-amber-500' : statusBarClass(docStatus)}`} />
                    <div className="flex items-center gap-3 pl-1">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${isSelected ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {app.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-sm">{app.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${app.stage === 'enrolled' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {app.stage || 'Applied'}
                          </span>
                          {(app.source ?? 'public') === 'agency' ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Agency</span>
                          ) : (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Direct</span>
                          )}
                        </div>
                        {app.university && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{getUniversityName(app.university)}</p>
                        )}
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-colors ${isSelected ? 'text-amber-500' : 'text-gray-300'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Detailed View */}
        <div className="lg:col-span-2 space-y-5 hidden lg:block">
          <AnimatePresence mode="wait">
            {selectedStudent ? (
              <motion.div
                key={selectedStudent.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="space-y-5"
              >
                {/* Profile Header Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 text-base font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700 font-bold text-lg">
                      {selectedStudent.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{selectedStudent.name}</p>
                      <p className="text-xs text-gray-500 font-normal">{selectedStudent.email}</p>
                    </div>
                  </div>
                  <div className="p-5 space-y-5">
                    {/* Identity row */}
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Full Name</label>
                        <input disabled={currentUser?.role !== 'ceo'} value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none disabled:opacity-60 disabled:cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Email</label>
                        <input disabled={currentUser?.role !== 'ceo'} value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none disabled:opacity-60 disabled:cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Phone</label>
                        <input disabled={currentUser?.role !== 'ceo'} value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none disabled:opacity-60 disabled:cursor-not-allowed" />
                      </div>
                    </div>
                    {/* University + Source row */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">University</label>
                        <select value={profileUniversity} onChange={(e) => setProfileUniversity(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none">
                          <option value="">Select university</option>
                          {UNIVERSITY_OPTIONS.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Source</label>
                        <div className="flex items-center gap-2 pt-1">
                          {(selectedStudent.source ?? 'public') === 'agency' ? (
                            <span className="rounded-full text-xs font-semibold px-2.5 py-0.5 bg-amber-100 text-amber-700">Agency Referral</span>
                          ) : (
                            <span className="rounded-full text-xs font-semibold px-2.5 py-0.5 bg-blue-100 text-blue-700">Direct Application</span>
                          )}
                          {selectedStudent.assignedStaffId && (
                            <span className="rounded-full text-xs font-semibold px-2.5 py-0.5 bg-gray-100 text-gray-600">
                              {users.find(u => u.id === selectedStudent.assignedStaffId)?.name ?? 'Assigned'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Expiry dates */}
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex items-center gap-1.5 mb-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Passport Expiry</p>
                        </div>
                        <input type="date" value={passportExpiry} onChange={(e) => setPassportExpiry(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none bg-white" />
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Visa Expiry</p>
                        </div>
                        <input type="date" value={visaExpiry} onChange={(e) => setVisaExpiry(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none bg-white" />
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Residence Permit</p>
                        </div>
                        <input type="date" value={residenceExpiry} onChange={(e) => setResidenceExpiry(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none bg-white" />
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button onClick={handleSaveProfile} className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors">Save Profile</button>
                      {selectedStudent.studentId && currentUser && (currentUser.role === 'staff' || currentUser.role === 'agency_staff') && (
                        <button
                          onClick={() => navigate('/messages', { state: { openThreadKey: `${selectedStudent.id}|${[currentUser.id, selectedStudent.studentId].sort().join('|')}` } })}
                          className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors"
                        >
                          Student Chat
                        </button>
                      )}
                      {selectedStudent.agencyId && currentUser && (currentUser.role === 'staff' || currentUser.role === 'agency_staff') && (
                        <button
                          onClick={() => navigate('/messages', { state: { openThreadKey: `${selectedStudent.id}|${[currentUser.id, selectedStudent.agencyId!].sort().join('|')}` } })}
                          className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors"
                        >
                          Agency Chat
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (!selectedStudent) return;
                          useAppStore.getState().setArrivalStatus(selectedStudent.id, !selectedStudent.arrived);
                          toast.success(!selectedStudent.arrived ? 'Marked as Arrived' : 'Marked as Not Arrived');
                        }}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${selectedStudent.arrived ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {selectedStudent.arrived ? 'Unmark Arrived' : 'Mark Arrived'}
                      </button>
                      <button onClick={() => setShowDocumentModal(true)} className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Doc
                      </button>
                      <button onClick={() => setShowRequestModal(true)} className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Request Doc
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  {/* Admission Steps */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <p className="text-base font-bold text-gray-900">Admission Steps</p>
                      <p className="text-xs text-gray-500 mt-0.5">Upload a document to complete each step.</p>
                    </div>
                    <div className="p-4 space-y-2">
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
                            className={`flex items-center justify-between px-4 py-3 rounded-xl border ${has ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${has ? 'bg-green-500' : 'bg-amber-400'}`} />
                              <p className="text-sm font-medium text-gray-800">{step.label}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full text-xs font-semibold px-2.5 py-0.5 ${has ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {has ? 'Uploaded' : 'Missing'}
                              </span>
                              <button
                                onClick={() => {
                                  setNewDocument({ title: step.label, type: step.id });
                                  setShowDocumentModal(true);
                                }}
                                className="bg-white border border-gray-200 text-gray-700 rounded-lg px-3 py-1 text-xs font-semibold hover:bg-gray-50 transition-colors"
                              >
                                Upload
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sales Intake */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <p className="text-base font-bold text-gray-900">Sales Intake</p>
                    </div>
                    <div className="p-5">
                    {selectedStudent.intakeDetails ? (
                      <div className="space-y-4">
                        {(() => {
                          const videoUrl = selectedStudent.intakeVideoUrl ||
                            (selectedStudent.intakeDetails?.match(/Video:\s*(https?:\/\/\S+)/i)?.[1] ?? '');
                          return videoUrl ? (
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Intro Video</p>
                              <button
                                type="button"
                                onClick={() => void openRemoteFile(videoUrl)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                              >
                                ▶ Open Video
                              </button>
                            </div>
                          ) : null;
                        })()}
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">Form Summary</p>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedStudent.intakeDetails.split('\n').filter(Boolean).map((line, i) => {
                              const colonIdx = line.indexOf(':');
                              if (colonIdx === -1) return null;
                              const key = line.slice(0, colonIdx).trim();
                              const val = line.slice(colonIdx + 1).trim();
                              if (!key) return null;
                              return (
                                <div key={i} className="bg-gray-50 border border-gray-100 rounded-lg p-2.5">
                                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-0.5">{key}</p>
                                  <p className="text-sm font-semibold text-gray-900 break-words">{val || '—'}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedStudent.intakePassportCopy && (
                            <button type="button" onClick={() => void openRemoteFile(selectedStudent.intakePassportCopy!)} className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 hover:bg-blue-100 transition-colors">
                              Passport Copy
                            </button>
                          )}
                          {selectedStudent.intakeHighSchoolCertificate && (
                            <button type="button" onClick={() => void openRemoteFile(selectedStudent.intakeHighSchoolCertificate!)} className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-100 hover:bg-purple-100 transition-colors">
                              High School Certificate
                            </button>
                          )}
                          {selectedStudent.intakeAttachments?.map((p, i) => (
                            <button key={i} type="button" onClick={() => void openRemoteFile(p)} className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-100 hover:bg-amber-100 transition-colors">
                              PDF {i + 1}
                            </button>
                          ))}
                          {selectedStudent.intakeExtraDocs?.map((p, i) => (
                            <button key={i} type="button" onClick={() => void openRemoteFile(p)} className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 text-xs font-semibold border border-gray-200 hover:bg-gray-100 transition-colors">
                              Extra {i + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No intake details submitted yet.</p>
                    )}
                    </div>
                  </div>

                  {/* Activity Timeline */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <p className="text-base font-bold text-gray-900">Activity Timeline</p>
                    </div>
                    <div className="p-4">
                    {(selectedStudent.events ?? []).length === 0 ? (
                      <p className="text-sm text-gray-400 py-4 text-center">No activity yet.</p>
                    ) : (
                      <div className="space-y-2.5 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
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
                              <div key={ev.id} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                  <div className="w-px flex-1 bg-gray-100 mt-1" />
                                </div>
                                <div className="pb-3 min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-semibold text-gray-900">{label}</p>
                                    <p className="text-xs text-gray-400 shrink-0">{new Date(ev.time).toLocaleDateString()}</p>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">{ev.byName}</p>
                                  {details && <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{details}</p>}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                    </div>
                  </div>

                  {/* Internal Notes */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[340px] sm:h-[400px]">
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-amber-500" />
                      <p className="text-base font-bold text-gray-900">Internal Notes</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      {(selectedStudent.internalNotes ?? []).length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                          <MessageSquare className="w-7 h-7 mb-2 opacity-20" />
                          <p className="text-xs font-semibold text-gray-400">No notes yet</p>
                        </div>
                      ) : (
                        (selectedStudent.internalNotes ?? []).map((note, idx) => (
                          <div key={idx} className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                            <div className="flex justify-between items-center mb-1.5">
                              <p className="text-xs font-bold text-amber-700">{note.authorName}</p>
                              <p className="text-xs text-gray-400">{new Date(note.createdAt).toLocaleDateString()}</p>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{note.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-100">
                      <div className="relative">
                        <input
                          type="text"
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addNote()}
                          placeholder="Type an internal note..."
                          className="w-full pl-3 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 outline-none"
                        />
                        <button
                          onClick={() => addNote()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-amber-600 hover:bg-amber-100 rounded-md transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents Table */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <p className="text-base font-bold text-gray-900">Student Documents</p>
                  </div>
                  <div className="overflow-x-auto hidden sm:block">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Document</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedDocs.map((doc, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 text-sm">{doc.title}</p>
                                  <p className="text-xs text-gray-400 uppercase tracking-wider">{doc.type}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-gray-500">
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {doc.file ? (
                                  <button
                                    type="button"
                                    onClick={() => doc.file && void openRemoteFile(doc.file)}
                                    className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                    title="Open file"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-400">No file</span>
                                )}
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
                                    className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200 transition-colors"
                                  >
                                    Verify
                                  </button>
                                )}
                                {doc.status === 'verified' && (
                                  <span className="rounded-full text-xs font-semibold px-2.5 py-0.5 bg-green-100 text-green-700">Verified</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {selectedDocs.length === 0 && (
                      <div className="py-10 text-center text-gray-400">
                        <FileText className="w-10 h-10 mx-auto mb-3 opacity-10" />
                        <p className="text-sm font-semibold text-gray-400">No documents uploaded yet</p>
                      </div>
                    )}
                  </div>
                  <div className="sm:hidden p-4 space-y-3">
                    {selectedDocs.map((doc, idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate text-sm">{doc.title}</p>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">{doc.type}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button type="button" onClick={() => doc.file && void openRemoteFile(doc.file)} className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg">
                              <Download className="w-4 h-4" />
                            </button>
                            {doc.status !== 'verified' && (
                              <button onClick={() => { try { staffVerifyDocument(doc.id); toast.success('Document verified'); } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed to verify'); } }} className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200">
                                Verify
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedDocs.length === 0 && (
                      <div className="py-8 text-center">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                        <p className="text-sm text-gray-400">No documents uploaded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-[600px] flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm text-center p-12">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-5">
                  <UserCircle className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Select a student</h3>
                <p className="text-sm text-gray-400 max-w-xs mx-auto">
                  Select a student from the list to view their profile, manage documents, and update application progress.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile details modal */}
      <AnimatePresence>
        {mobileDetailsOpen && selectedStudent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] p-4 flex items-start justify-center overflow-y-auto lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileDetailsOpen(false)} />
            <motion.div initial={{ y: 12, opacity: 0.98 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0.98 }} className="relative bg-white rounded-2xl border border-gray-100 shadow-lg w-full max-w-2xl my-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Student</p>
                  <p className="text-lg font-bold text-gray-900 truncate">{selectedStudent.name}</p>
                </div>
                <button onClick={() => setMobileDetailsOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Close">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-5 space-y-5">
                <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Full Name</label>
                      <input disabled={currentUser?.role !== 'ceo'} value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none disabled:opacity-60" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Phone</label>
                      <input disabled={currentUser?.role !== 'ceo'} value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none disabled:opacity-60" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">Email</label>
                    <input disabled={currentUser?.role !== 'ceo'} value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none disabled:opacity-60" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1">University</label>
                    <select value={profileUniversity} onChange={(e) => setProfileUniversity(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none">
                      <option value="">Select university</option>
                      {UNIVERSITY_OPTIONS.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    {[
                      { icon: ShieldCheck, label: 'Passport Expiry', value: passportExpiry, setter: setPassportExpiry },
                      { icon: Calendar, label: 'Visa Expiry', value: visaExpiry, setter: setVisaExpiry },
                      { icon: Calendar, label: 'Residence Permit', value: residenceExpiry, setter: setResidenceExpiry },
                    ].map(({ icon: Icon, label, value, setter }) => (
                      <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Icon className="w-3.5 h-3.5 text-amber-500" />
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{label}</p>
                        </div>
                        <input type="date" value={value} onChange={(e) => setter(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none bg-white" />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleSaveProfile} className="bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors">Save Profile</button>
                    <button onClick={() => setShowDocumentModal(true)} className="bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload Doc
                    </button>
                    <button
                      onClick={() => {
                        useAppStore.getState().setArrivalStatus(selectedStudent.id, !selectedStudent.arrived);
                        toast.success(!selectedStudent.arrived ? 'Marked as Arrived' : 'Marked as Not Arrived');
                      }}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${selectedStudent.arrived ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
                    >
                      {selectedStudent.arrived ? 'Unmark Arrived' : 'Mark Arrived'}
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <p className="text-sm font-bold text-gray-900">Student Documents</p>
                  </div>
                  <div className="p-3 space-y-2">
                    {selectedDocs.map((doc, idx) => (
                      <div key={idx} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate text-sm">{doc.title}</p>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">{doc.type}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button type="button" onClick={() => doc.file && void openRemoteFile(doc.file)} className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg">
                              <Download className="w-4 h-4" />
                            </button>
                            {doc.status !== 'verified' && (
                              <button onClick={() => { try { staffVerifyDocument(doc.id); toast.success('Document verified'); } catch (e) { toast.error(e instanceof Error ? e.message : 'Failed to verify'); } }} className="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold hover:bg-green-200">
                                Verify
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedDocs.length === 0 && (
                      <div className="py-6 text-center">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                        <p className="text-xs text-gray-400 font-semibold">No documents uploaded yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Document Modal */}
      <AnimatePresence>
        {showDocumentModal && (
          <div className="fixed inset-0 flex items-start justify-center overflow-y-auto z-[100] p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDocumentModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full my-10 overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                    <Upload className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Upload Document</h3>
                </div>
                <button onClick={() => setShowDocumentModal(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Document Title</label>
                  <input
                    type="text"
                    value={newDocument.title}
                    onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                    placeholder="e.g. Acceptance Letter"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Document Type</label>
                  <select
                    value={newDocument.type}
                    onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none"
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
                  <label className="block text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1.5">Attach File</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-amber-300 transition-colors">
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setNewDocument({ ...newDocument, fileObject: file, title: newDocument.title || file.name });
                      }}
                      className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                    />
                    {newDocument.fileObject ? (
                      <p className="mt-2 text-xs text-gray-600">Selected: <span className="font-semibold">{newDocument.fileObject.name}</span></p>
                    ) : (
                      <p className="mt-2 text-xs text-gray-400">PDF or image accepted</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => void handleAddDocument()}
                  disabled={uploadingDoc}
                  className="w-full bg-amber-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadingDoc ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Uploading…
                    </>
                  ) : 'Upload Now'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Request Document Modal */}
      <AnimatePresence>
        {showRequestModal && selectedStudent && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setShowRequestModal(false)} />
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} className="relative bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-md overflow-hidden z-10">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">Request a Document</h3>
                <button onClick={() => setShowRequestModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500">
                  The student will receive a notification asking them to upload this document.
                </p>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1.5">Document Name</label>
                  <input
                    type="text"
                    value={requestDoc.title}
                    onChange={(e) => setRequestDoc(d => ({ ...d, title: e.target.value }))}
                    placeholder="e.g. Bank statement, Proof of address..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold block mb-1.5">Instructions (optional)</label>
                  <textarea
                    value={requestDoc.description}
                    onChange={(e) => setRequestDoc(d => ({ ...d, description: e.target.value }))}
                    placeholder="Any specific requirements..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none resize-none"
                  />
                </div>
                <button
                  onClick={() => {
                    if (!requestDoc.title.trim()) { toast.error('Enter a document name'); return; }
                    try {
                      staffRequestDocument(selectedStudent.studentId!, selectedStudent.id, requestDoc.title, requestDoc.description);
                      toast.success('Document request sent to student');
                      setShowRequestModal(false);
                      setRequestDoc({ title: '', description: '' });
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Failed');
                    }
                  }}
                  className="w-full bg-amber-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-amber-700 transition-colors"
                >
                  Send Request
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffDashboard;
