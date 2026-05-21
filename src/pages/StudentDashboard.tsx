import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { getUniversityName } from '../lib/universities';
import { 
  CheckCircle2, 
  FileText, 
  Download,
  AlertCircle,
  Building2,
  MapPin,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { applications, documents, users } = useApp();
  const navigate = useNavigate();

  const myApplication = applications.find(app => app.studentId === user?.id) ?? null;
  const uniName = getUniversityName(user?.assignedUniversityId || myApplication?.university) || 'Not assigned';
  const firstName = user?.name?.split(' ')?.[0] ?? 'Student';

  const admissionSteps = [
    { id: 'translation', label: 'Documents translation', icon: FileText },
    { id: 'university-approval', label: 'University initial approval', icon: CheckCircle2 },
    { id: 'recognition-letter', label: 'Recognition letter', icon: ShieldCheck },
    { id: 'ministry-order', label: 'Ministry order', icon: Building2 },
    { id: 'visa-documents', label: 'Visa required documents', icon: MapPin },
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
  const nextStep = admissionSteps.find(s => stepStatus(s.id) !== 'verified') ?? null;
  const nextStatus = nextStep ? stepStatus(nextStep.id) : 'verified';
  const nextMessage = (() => {
    if (!myApplication) return 'Your account is ready. Your timeline and documents will appear once your application is approved.';
    if (!nextStep) return 'All required steps are completed. Your case is ready for final processing.';
    if (nextStatus === 'pending') return 'This document was uploaded and is waiting for verification.';
    if (nextStatus === 'rejected') return 'This document was rejected. Please contact your assigned admin to re-upload.';
    return 'This document has not been uploaded yet. Contact your assigned admin if you already have it.';
  })();
  const stepLabelById = Object.fromEntries(admissionSteps.map(s => [s.id, s.label])) as Record<string, string>;
  const uploadedByName = (docUploadedBy?: string) => {
    if (!docUploadedBy) return '';
    const u = users.find(x => x.id === docUploadedBy);
    return u?.name ?? '';
  };


  return (
    <div className="space-y-8 pb-12">
      {/* Welcome & Status Hero */}
      <section className="relative overflow-hidden rounded-[36px] p-10 text-white bg-gradient-to-br from-black via-zinc-950 to-black border border-white/10 shadow-[0_28px_80px_-48px_rgba(0,0,0,0.55)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/5"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-500 text-black px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest mb-6">
              <TrendingUp className="w-3.5 h-3.5" />
              {myApplication ? 'Application Active' : 'No Application'}
            </div>
            <h1 className="text-4xl lg:text-5xl font-black mb-4">Welcome back, {firstName}!</h1>
            {myApplication ? (
              <p className="text-gray-400 text-lg max-w-xl font-medium">
                Your application for <span className="text-white">{uniName}</span> is moving smoothly through the <span className="text-amber-500 font-bold">{myApplication.stage || 'Applied'}</span> stage.
              </p>
            ) : (
              <p className="text-gray-400 text-lg max-w-xl font-medium">
                Your student portal is ready. Once your application is approved, your timeline and documents will appear here.
              </p>
            )}
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl text-center min-w-[140px] shadow-[0_16px_60px_-40px_rgba(0,0,0,0.7)] hover:bg-white/10 transition-all">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Overall Progress</p>
              <div className="text-3xl font-black text-amber-500">{Math.round((completedCount / admissionSteps.length) * 100)}%</div>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl text-center min-w-[140px] shadow-[0_16px_60px_-40px_rgba(0,0,0,0.7)] hover:bg-white/10 transition-all">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Current Stage</p>
              <div className="text-3xl font-black text-white">{myApplication?.stage || 'Applied'}</div>
            </div>
            <button
              onClick={() => navigate('/messages', { state: { openComplaint: true } })}
              className="bg-amber-500 text-black px-6 py-4 rounded-2xl font-black text-sm hover:bg-white transition-all min-w-[160px] shadow-[0_18px_60px_-35px_rgba(245,158,11,0.55)] hover:shadow-[0_20px_70px_-35px_rgba(255,255,255,0.35)]"
            >
              Contact CEO
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[36px] p-8 border border-gray-100 shadow-[0_18px_60px_-45px_rgba(0,0,0,0.22)] hover:shadow-[0_22px_70px_-45px_rgba(0,0,0,0.26)] transition-shadow">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Next Required Step</p>
            <h2 className="text-2xl font-black text-black mt-2 truncate">
              {nextStep ? nextStep.label : 'Complete'}
            </h2>
            <p className="text-sm font-medium text-gray-500 mt-2">
              {nextMessage}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                nextStep
                  ? (nextStatus === 'verified'
                    ? 'bg-green-100 text-green-700'
                    : nextStatus === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : nextStatus === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600')
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {nextStep ? nextStatus : 'verified'}
            </span>
            <button
              onClick={() => navigate('/messages')}
              className="bg-black text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-amber-500 hover:text-black transition-all"
            >
              Contact Admin
            </button>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content: Timeline & Documents */}
        <div className="lg:col-span-2 space-y-8">
          {/* Visual Timeline */}
          <section className="bg-white rounded-[36px] p-8 border border-gray-100 shadow-[0_18px_60px_-45px_rgba(0,0,0,0.22)] hover:shadow-[0_22px_70px_-45px_rgba(0,0,0,0.26)] transition-shadow">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black text-black">Admission Journey</h2>
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                Next: {nextStep?.label || 'Done'}
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2"></div>
              <div 
                className="absolute top-1/2 left-0 h-1 bg-amber-500 -translate-y-1/2 transition-all duration-1000"
                style={{ width: `${(completedCount / admissionSteps.length) * 100}%` }}
              ></div>

              <div className="relative flex justify-between items-center">
                {admissionSteps.map((stage, idx) => {
                  const status = stepStatus(stage.id);
                  const isCompleted = status === 'verified';
                  const isCurrent = status !== 'verified' && idx === completedCount;
                  const Icon = stage.icon;

                  return (
                    <div key={stage.id} className="flex flex-col items-center group">
                      <div 
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 relative z-10 ${
                          isCompleted
                            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-110'
                            : status === 'pending'
                              ? 'bg-amber-50 border-2 border-amber-100 text-amber-700'
                              : status === 'rejected'
                                ? 'bg-red-50 border-2 border-red-100 text-red-700'
                                : 'bg-white border-2 border-gray-100 text-gray-300'
                        } ${isCurrent ? 'ring-4 ring-amber-100' : ''}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="mt-4 text-center">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-black' : 'text-gray-400'}`}>
                          {stage.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Document Portal */}
          <section className="bg-white rounded-[36px] p-8 border border-gray-100 shadow-[0_18px_60px_-45px_rgba(0,0,0,0.22)] hover:shadow-[0_22px_70px_-45px_rgba(0,0,0,0.26)] transition-shadow">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-black">Document Portal</h2>
              <button className="text-amber-600 font-black text-sm flex items-center gap-2 hover:bg-amber-50 px-4 py-2 rounded-xl transition-all">
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Document Name</th>
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Uploaded By</th>
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {myDocs.map((doc) => (
                    <tr key={doc.id} className="group hover:bg-gray-50/60 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 border border-amber-100 shadow-sm">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-black text-sm">{doc.title}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{stepLabelById[doc.type] ?? doc.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <p className="text-sm font-bold text-black">{uploadedByName(doc.uploadedBy) || '—'}</p>
                          {doc.uploadedBy && users.find(u => u.id === doc.uploadedBy)?.role && (
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                              {users.find(u => u.id === doc.uploadedBy)?.role}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          doc.status === 'verified' ? 'bg-green-100 text-green-700' : doc.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-4">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-right space-x-2">
                        {doc.file ? (
                          <>
                            <a
                              href={doc.file}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black text-white text-xs font-black hover:bg-amber-500 hover:text-black transition-all shadow-sm"
                            >
                              <Download className="w-4 h-4" />
                              Open
                            </a>
                            <a
                              href={doc.file}
                              download
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-black hover:bg-gray-200 transition-all"
                            >
                              Download
                            </a>
                          </>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-bold">No file</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {myDocs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">
                        No documents uploaded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Intake Summary */}
          <section className="bg-white rounded-[36px] p-8 border border-gray-100 shadow-[0_18px_60px_-45px_rgba(0,0,0,0.22)] hover:shadow-[0_22px_70px_-45px_rgba(0,0,0,0.26)] transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-black">Your Intake</h2>
              <button
                onClick={() => {
                  const docs = documents.filter(d => d.studentId === user?.id && d.file);
                  docs.forEach(d => {
                    if (d.file) window.open(d.file, '_blank');
                  });
                }}
                className="text-amber-600 font-black text-sm flex items-center gap-2 hover:bg-amber-50 px-4 py-2 rounded-xl transition-all"
              >
                Download All
                <Download className="w-4 h-4" />
              </button>
            </div>
            {myApplication?.intakeDetails ? (
              <div className="space-y-6">
                {myApplication.intakeVideoUrl && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Intro Video</p>
                    <video controls className="w-full rounded-2xl border border-gray-100" src={myApplication.intakeVideoUrl} />
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Summary</p>
                  <pre className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium whitespace-pre-wrap">{myApplication.intakeDetails}</pre>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {myApplication.intakePassportCopy && (
                    <a href={myApplication.intakePassportCopy} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100">Passport Copy</a>
                  )}
                  {myApplication.intakeHighSchoolCertificate && (
                    <a href={myApplication.intakeHighSchoolCertificate} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 text-sm font-bold border border-purple-100">High School Certificate</a>
                  )}
                </div>
                {myApplication.intakeAttachments && myApplication.intakeAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {myApplication.intakeAttachments.map((p, i) => (
                      <a key={i} href={p} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black">PDF {i + 1}</a>
                    ))}
                  </div>
                )}
                {myApplication.intakeExtraDocs && myApplication.intakeExtraDocs.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {myApplication.intakeExtraDocs.map((p, i) => (
                      <a key={i} href={p} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-full bg-gray-50 text-gray-700 text-[10px] font-black">Extra {i + 1}</a>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 font-medium">No intake information available yet.</p>
            )}
          </section>
        </div>

        {/* Sidebar: Details & Alerts */}
        <div className="space-y-8">
          {/* University Card */}
          <section className="relative overflow-hidden bg-amber-500 rounded-[36px] p-8 text-black shadow-[0_26px_80px_-50px_rgba(245,158,11,0.6)] border border-amber-300/30">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
            <div className="relative w-14 h-14 bg-black/10 rounded-2xl flex items-center justify-center mb-6 border border-black/10">
              <Building2 className="w-7 h-7 text-black" />
            </div>
            <h3 className="relative text-2xl font-black mb-2">{uniName}</h3>
            <p className="relative font-bold text-black/60 mb-8">{myApplication?.program || ''}</p>
            
            <div className="relative space-y-4 pt-6 border-t border-black/10">
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="text-black/60">Duration</span>
                <span>6 Years</span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="text-black/60">Location</span>
                <span>Tbilisi, Georgia</span>
              </div>
            </div>
          </section>

          {/* Expiry Alerts */}
          <section className="bg-white rounded-[36px] p-8 border border-gray-100 shadow-[0_18px_60px_-45px_rgba(0,0,0,0.22)] hover:shadow-[0_22px_70px_-45px_rgba(0,0,0,0.26)] transition-shadow">
            <h3 className="text-xl font-black text-black mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Expiry Tracking
            </h3>
            <div className="space-y-4">
              {(() => {
                const items: Array<{ label: string; date: string; daysLeft: number }> = [];
                const today = new Date().getTime();
                const pushItem = (label: string, dateStr?: string) => {
                  if (!dateStr) return;
                  const t = new Date(dateStr).getTime();
                  const days = Math.ceil((t - today) / (1000 * 60 * 60 * 24));
                  if (days <= 60) items.push({ label, date: new Date(t).toLocaleDateString(), daysLeft: days });
                };
                pushItem('Passport Expiry', user?.passportExpiry);
                pushItem('Visa Expiry', user?.visaExpiry);
                pushItem('Residence Permit Expiry', user?.residenceExpiry);
                if (items.length === 0) {
                  return (
                    <div className="p-4 rounded-2xl border bg-gray-50 border-gray-100">
                      <p className="text-sm font-bold text-gray-600">No upcoming expiries</p>
                    </div>
                  );
                }
                return items.map((it, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border bg-amber-50 border-amber-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-black text-sm text-amber-700">{it.label}</p>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-200 text-amber-800">{it.daysLeft} days left</span>
                    </div>
                    <p className="text-xs font-bold text-gray-500">Due: {it.date}</p>
                  </div>
                ));
              })()}
            </div>
          </section>

          {/* Quick Support */}
          <section className="bg-gradient-to-b from-gray-50 to-white rounded-[36px] p-8 border border-gray-100 shadow-[0_18px_60px_-45px_rgba(0,0,0,0.18)] hover:shadow-[0_22px_70px_-45px_rgba(0,0,0,0.22)] transition-shadow">
            <h3 className="text-xl font-black text-black mb-2">Need Support?</h3>
            <p className="text-gray-500 text-sm font-medium mb-6">Your dedicated agent is available for any questions.</p>
            <button className="w-full bg-black text-white py-4 rounded-2xl font-black hover:bg-amber-500 hover:text-black transition-all shadow-sm">
              Contact Agent
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
