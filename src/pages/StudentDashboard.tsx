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
  Home,
  LogOut,
  Download
} from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { applications, documents, users } = useApp();
  const navigate = useNavigate();

  const myApplication = applications.find(app => app.studentId === user?.id) ?? null;
  const uniName = getUniversityName(user?.assignedUniversityId || myApplication?.university) || 'Not assigned';
  const firstName = user?.name?.split(' ')?.[0] ?? 'Student';

  const admissionSteps = [
    { id: 'translation', label: 'Documents', icon: FileText },
    { id: 'university-approval', label: 'Approval', icon: CheckCircle2 },
    { id: 'recognition-letter', label: 'Recognition', icon: ShieldCheck },
    { id: 'ministry-order', label: 'Ministry', icon: Building2 },
    { id: 'visa-documents', label: 'Visa', icon: MapPin },
  ] as const;

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

  const uploadedByName = (docUploadedBy?: string) => {
    if (!docUploadedBy) return '';
    const u = users.find(x => x.id === docUploadedBy);
    return u?.name ?? '';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black">
      {/* Header with quick actions */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-black text-white">Student Portal</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            >
              <Home className="w-4 h-4" />
              Home
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        {/* Welcome Hero */}
        <div className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-white bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 border border-amber-400/30 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 grid sm:grid-cols-2 gap-8">
            <div>
              <h2 className="text-4xl sm:text-5xl font-black mb-4">Welcome back, {firstName}!</h2>
              {myApplication ? (
                <p className="text-lg text-black/80 font-semibold mb-6">
                  Your application for <span className="font-black">{uniName}</span> is in the <span className="font-black">{myApplication.stage}</span> stage.
                </p>
              ) : (
                <p className="text-lg text-black/80 font-semibold mb-6">
                  Your account is ready. Your application will appear here once approved.
                </p>
              )}
              <button
                onClick={() => navigate('/messages')}
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
              >
                Contact Admin
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-center">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-center">
                <p className="text-white/80 text-sm font-semibold mb-2">Overall Progress</p>
                <div className="text-5xl font-black text-white mb-4">{progressPercent}%</div>
                <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-1000"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Timeline */}
        <div className="bg-gray-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
          <h3 className="text-2xl font-black text-white mb-8">Admission Journey</h3>
          <div className="relative">
            {/* Progress bar */}
            <div className="absolute top-6 left-0 w-full h-1 bg-gray-800 -translate-y-1/2"></div>
            <div 
              className="absolute top-6 left-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600 -translate-y-1/2 transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            ></div>

            {/* Steps */}
            <div className="relative flex justify-between items-start">
              {admissionSteps.map((step) => {
                const status = stepStatus(step.id);
                const isCompleted = status === 'verified';
                const Icon = step.icon;

                return (
                  <div key={step.id} className="flex flex-col items-center flex-1">
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all relative z-10 ${
                        isCompleted
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-black shadow-lg shadow-amber-500/50'
                          : 'bg-gray-800 border-2 border-gray-700 text-gray-400'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <p className={`text-xs font-black uppercase tracking-wide mt-3 text-center ${isCompleted ? 'text-amber-400' : 'text-gray-500'}`}>
                      {step.label}
                    </p>
                    <p className={`text-[10px] mt-1 ${
                      isCompleted ? 'text-green-400' : 
                      status === 'pending' ? 'text-amber-400' : 
                      status === 'rejected' ? 'text-red-400' : 
                      'text-gray-600'
                    }`}>
                      {isCompleted ? '✓ Done' : status === 'pending' ? 'Pending' : status === 'rejected' ? 'Rejected' : 'Pending'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Documents Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Checklist */}
            <div className="bg-gray-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <h3 className="text-2xl font-black text-white mb-6">Documents Checklist</h3>
              <div className="space-y-3">
                {admissionSteps.map((step) => {
                  const status = stepStatus(step.id);
                  return (
                    <div key={step.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700 transition-all">
                      <div className="flex items-center gap-3">
                        <step.icon className="w-5 h-5 text-amber-500" />
                        <p className="font-semibold text-white">{step.label}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        status === 'verified' ? 'bg-green-500/20 text-green-400' : 
                        status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 
                        status === 'rejected' ? 'bg-red-500/20 text-red-400' : 
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Documents Table */}
            <div className="bg-gray-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <h3 className="text-2xl font-black text-white mb-6">Your Documents</h3>
              {myDocs.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-400 font-semibold">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Document</th>
                        <th className="text-left py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Uploaded By</th>
                        <th className="text-left py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="text-left py-3 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                        <th className="py-3 px-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {myDocs.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-amber-400" />
                              </div>
                              <p className="font-semibold text-white">{doc.title}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-gray-400 text-sm">{uploadedByName(doc.uploadedBy) || '—'}</p>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              doc.status === 'verified' ? 'bg-green-500/20 text-green-400' : 
                              doc.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-400 text-sm">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-right">
                            {doc.file ? (
                              <button
                                type="button"
                                onClick={() => void openStorageUrl(doc.file!)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold hover:bg-amber-500/30 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Pending</span>
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
          <div className="space-y-8">
            {/* University Card */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 text-black border border-amber-400/30 shadow-2xl">
              <div className="w-12 h-12 bg-black/20 rounded-xl flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black mb-2">{uniName}</h3>
              {myApplication?.program && (
                <p className="font-semibold text-black/70 mb-6">{myApplication.program}</p>
              )}
              <div className="pt-6 border-t border-black/20 space-y-3">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-black/60">Duration</span>
                  <span>6 Years</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-black/60">Location</span>
                  <span>Tbilisi, Georgia</span>
                </div>
              </div>
            </div>

            {/* Status Cards */}
            <div className="space-y-3">
              <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Current Stage</p>
                <p className="text-2xl font-black text-white">{myApplication?.stage || 'Applied'}</p>
              </div>
              <div className="bg-gray-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Application Status</p>
                <p className="text-xl font-black text-amber-400">{myApplication?.status || 'Pending'}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <button
              onClick={() => navigate('/messages')}
              className="w-full px-6 py-4 rounded-2xl font-black text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all shadow-xl"
            >
              Contact Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;