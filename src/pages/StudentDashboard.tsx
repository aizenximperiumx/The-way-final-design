import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { getUniversityName } from '../lib/universities';
import { openStorageUrl } from '../lib/storage';
import {
  CheckCircle2,
  FileText,
  Building2,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Download,
  Clock,
  AlertCircle,
  Info
} from 'lucide-react';

const admissionSteps = [
  { id: 'translation', label: 'Documents', icon: FileText },
  { id: 'university-approval', label: 'Approval', icon: CheckCircle2 },
  { id: 'recognition-letter', label: 'Recognition', icon: ShieldCheck },
  { id: 'ministry-order', label: 'Ministry', icon: Building2 },
  { id: 'visa-documents', label: 'Visa', icon: MapPin },
] as const;

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { applications, documents, users } = useApp();
  const navigate = useNavigate();

  const myApplication = applications.find(app => app.studentId === user?.id) ?? null;
  const uniName = getUniversityName(user?.assignedUniversityId || myApplication?.university) || 'Not assigned';
  const firstName = user?.name?.split(' ')?.[0] ?? 'Student';
  const myDocs = documents.filter(d => d.studentId === user?.id);

  const stepStatus = (stepId: string): 'verified' | 'pending' | 'rejected' | 'missing' => {
    const stepDocs = myDocs.filter(d => d.type === stepId);
    if (stepDocs.some(d => d.status === 'verified')) return 'verified';
    if (stepDocs.some(d => d.status === 'pending')) return 'pending';
    if (stepDocs.some(d => d.status === 'rejected')) return 'rejected';
    return 'missing';
  };

  const completedCount = admissionSteps.filter(s => stepStatus(s.id) === 'verified').length;
  const progressPercent = Math.round((completedCount / admissionSteps.length) * 100);

  const uploadedByName = (id?: string) => users.find(x => x.id === id)?.name ?? '';

  const badgeClass = (status: string) => {
    if (status === 'verified') return 'bg-green-100 text-green-700';
    if (status === 'pending') return 'bg-amber-100 text-amber-700';
    if (status === 'rejected') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-500';
  };

  return (
    <div className="space-y-8 pb-12">

      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 shadow-xl shadow-amber-200">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-black/60 font-bold text-sm uppercase tracking-widest mb-1">Welcome back</p>
            <h1 className="text-3xl sm:text-4xl font-black text-black mb-3">{firstName}!</h1>
            {myApplication ? (
              <p className="text-black/70 font-semibold text-sm">
                Application for <span className="font-black text-black">{uniName}</span> · Stage: <span className="font-black text-black capitalize">{myApplication.stage}</span>
              </p>
            ) : (
              <p className="text-black/70 font-semibold text-sm">Your account is ready. Your application will appear once approved.</p>
            )}
            <button
              onClick={() => navigate('/messages')}
              className="mt-5 inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
            >
              Message Advisor <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-white/25 backdrop-blur-md border border-white/30 rounded-2xl p-6 text-center shrink-0 min-w-[140px]">
            <p className="text-black/60 text-[10px] font-black uppercase tracking-widest mb-1">Progress</p>
            <div className="text-5xl font-black text-black mb-3">{progressPercent}%</div>
            <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-black transition-all duration-700" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="text-black/50 text-[10px] font-bold mt-2">{completedCount} / {admissionSteps.length} steps</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Admission Journey */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-black text-black mb-6">Admission Journey</h2>

            {/* Desktop: horizontal timeline */}
            <div className="hidden sm:block relative">
              <div className="absolute top-6 left-0 w-full h-1 bg-gray-100 -translate-y-1/2" />
              <div
                className="absolute top-6 left-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500 -translate-y-1/2 transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
              <div className="relative flex justify-between items-start">
                {admissionSteps.map((step) => {
                  const status = stepStatus(step.id);
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="flex flex-col items-center flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center relative z-10 transition-all ${
                        status === 'verified' ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-black shadow-lg shadow-amber-200' :
                        status === 'pending' ? 'bg-amber-50 text-amber-500 border-2 border-amber-200' :
                        status === 'rejected' ? 'bg-red-50 text-red-500 border-2 border-red-200' :
                        'bg-gray-100 text-gray-400 border-2 border-gray-200'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <p className={`text-xs font-black uppercase tracking-wide mt-3 text-center ${status === 'verified' ? 'text-amber-600' : 'text-gray-400'}`}>{step.label}</p>
                      <p className={`text-[10px] mt-1 font-bold ${
                        status === 'verified' ? 'text-green-600' : status === 'pending' ? 'text-amber-500' : status === 'rejected' ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {status === 'verified' ? '✓ Done' : status === 'pending' ? 'Pending' : status === 'rejected' ? 'Rejected' : 'Awaiting'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile: vertical stepper */}
            <div className="sm:hidden space-y-0">
              {admissionSteps.map((step, idx) => {
                const status = stepStatus(step.id);
                const Icon = step.icon;
                const isLast = idx === admissionSteps.length - 1;
                return (
                  <div key={step.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        status === 'verified' ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-black' :
                        status === 'pending' ? 'bg-amber-50 text-amber-500 border-2 border-amber-200' :
                        status === 'rejected' ? 'bg-red-50 text-red-500 border-2 border-red-200' :
                        'bg-gray-100 text-gray-400 border-2 border-gray-200'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {!isLast && <div className="w-0.5 flex-1 min-h-[24px] bg-gray-100 my-1" />}
                    </div>
                    <div className="pb-5 pt-1.5">
                      <p className="font-black text-black text-sm leading-none">{step.label}</p>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full mt-1.5 inline-block ${badgeClass(status)}`}>
                        {status === 'verified' ? 'Done' : status === 'pending' ? 'Pending' : status === 'rejected' ? 'Rejected' : 'Awaiting'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Documents Checklist */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-black text-black mb-6">Documents Checklist</h2>
            <div className="space-y-2">
              {admissionSteps.map((step) => {
                const status = stepStatus(step.id);
                return (
                  <div key={step.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100/70 transition-all">
                    <div className="flex items-center gap-3">
                      <step.icon className="w-4 h-4 text-amber-500" />
                      <p className="font-semibold text-black text-sm">{step.label}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${badgeClass(status)}`}>
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-blue-700 text-xs font-semibold leading-relaxed">
                Your advisor uploads and verifies all documents on your behalf. Contact them via Messages if you have questions.
              </p>
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-black text-black mb-6">Your Documents</h2>
            {myDocs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-200" />
                </div>
                <p className="font-bold text-gray-500">No documents yet</p>
                <p className="text-sm text-gray-400 mt-1">Documents uploaded by your advisor will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Document</th>
                      <th className="text-left pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:table-cell">Uploaded By</th>
                      <th className="text-left pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="text-left pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:table-cell">Date</th>
                      <th className="pb-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {myDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-amber-500" />
                            </div>
                            <p className="font-semibold text-black text-sm">{doc.title}</p>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-500 hidden sm:table-cell">{uploadedByName(doc.uploadedBy) || '—'}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${badgeClass(doc.status)}`}>{doc.status}</span>
                        </td>
                        <td className="py-4 text-sm text-gray-400 hidden sm:table-cell">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                        <td className="py-4 text-right">
                          {doc.file ? (
                            <button
                              type="button"
                              onClick={() => void openStorageUrl(doc.file!)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors border border-amber-100"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Download</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* University Card */}
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-7 shadow-xl shadow-amber-200">
            <div className="w-10 h-10 bg-black/15 rounded-xl flex items-center justify-center mb-5">
              <Building2 className="w-5 h-5 text-black" />
            </div>
            <h3 className="text-xl font-black text-black mb-1">{uniName}</h3>
            {myApplication?.program && <p className="text-black/60 font-semibold text-sm mb-4">{myApplication.program}</p>}
            <div className="pt-4 border-t border-black/15 space-y-2">
              <div className="flex justify-between text-sm font-bold"><span className="text-black/60">Duration</span><span className="text-black">6 Years</span></div>
              <div className="flex justify-between text-sm font-bold"><span className="text-black/60">Location</span><span className="text-black">Tbilisi, Georgia</span></div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Current Stage</p>
              <p className="text-2xl font-black text-black capitalize">{myApplication?.stage ?? 'Applied'}</p>
            </div>
            <div className="border-t border-gray-50 pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Application Status</p>
              <div className="flex items-center gap-2">
                {myApplication?.status === 'approved' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                 myApplication?.status === 'rejected' ? <AlertCircle className="w-4 h-4 text-red-500" /> :
                 <Clock className="w-4 h-4 text-amber-500" />}
                <p className="text-lg font-black text-black capitalize">{myApplication?.status ?? 'Pending'}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/messages')}
            className="w-full px-6 py-4 rounded-2xl font-black text-black bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 transition-all shadow-lg shadow-amber-200 flex items-center justify-center gap-2 text-sm"
          >
            Message Advisor <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
