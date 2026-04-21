import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  Users, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import type { Appointment } from '../store/appStore';

const Appointments: React.FC = () => {
  const { user } = useAuth();
  const { appointments, addAppointment } = useApp();
  const [showBookingModal, setShowBookingModal] = useState(false);

  const myAppointments = appointments.filter(appt => appt.userId === user?.id || user?.role !== 'student');

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const title = String(formData.get('title') ?? '');
    const type = String(formData.get('type') ?? 'video') as 'video' | 'in-person';
    const date = String(formData.get('date') ?? '');
    const time = String(formData.get('time') ?? '');

    const appt = {
      userId: user?.id ?? '',
      userName: user?.name,
      title,
      type,
      date,
      time,
      status: 'pending',
      createdAt: new Date().toISOString(),
    } satisfies Omit<Appointment, 'id'>;
    
    addAppointment(appt);
    toast.success('Appointment request sent! Waiting for confirmation.');
    setShowBookingModal(false);
  };

  return (
    <div className="space-y-8 pb-12">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tight">Appointments</h1>
          <p className="text-gray-500 font-medium">Manage your consultations and university meetings.</p>
        </div>
        {user?.role === 'student' && (
          <button 
            onClick={() => setShowBookingModal(true)}
            className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-2xl font-black hover:bg-amber-500 hover:text-black transition-all shadow-xl shadow-black/5"
          >
            <Plus className="w-5 h-5" />
            Book New Session
          </button>
        )}
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Calendar View (Simplified) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-black">Calendar</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-400"><ChevronLeft className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-gray-50 rounded-xl text-gray-400"><ChevronRight className="w-5 h-5" /></button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2 text-center mb-4">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <span key={d} className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{d}</span>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 31 }).map((_, i) => (
                <button 
                  key={i}
                  className={`h-10 rounded-xl text-sm font-bold transition-all ${
                    i + 1 === 26 ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-50 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-black">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-black">Today at 4:00 PM</p>
                  <p className="text-xs text-amber-700 font-bold">Visa Interview Prep</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-black text-black">Scheduled Sessions</h2>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Requests</span>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {myAppointments.length === 0 ? (
                <div className="p-20 text-center">
                  <CalendarIcon className="w-16 h-16 text-gray-100 mx-auto mb-6" />
                  <h3 className="text-xl font-black text-black mb-2">No appointments yet</h3>
                  <p className="text-gray-400 font-medium">Book a session to get started with your application guidance.</p>
                </div>
              ) : (
                myAppointments.map((appt, idx) => (
                  <div key={idx} className="p-8 hover:bg-gray-50/50 transition-colors group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                          appt.type === 'video' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                        }`}>
                          {appt.type === 'video' ? <Video className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-black">{appt.title}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm font-bold text-gray-400">
                            <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> {appt.date}</span>
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {appt.time}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          appt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {appt.status}
                        </span>
                        {user?.role !== 'student' && appt.status === 'pending' && (
                          <div className="flex gap-2">
                            <button className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all">
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all">
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                        <button className="p-2 text-gray-300 hover:text-black transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <div className="fixed inset-0 flex items-start justify-center overflow-y-auto z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBookingModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-[40px] p-10 max-w-lg w-full shadow-2xl overflow-hidden my-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              
              <h3 className="text-2xl font-black text-black mb-8 flex items-center gap-3">
                <CalendarIcon className="w-6 h-6 text-amber-500" />
                Book Consultation
              </h3>

              <form onSubmit={handleBook} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Meeting Purpose</label>
                  <input
                    name="title"
                    type="text"
                    required
                    placeholder="e.g. Visa Application Review"
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Date</label>
                    <input
                      name="date"
                      type="date"
                      required
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Time</label>
                    <input
                      name="time"
                      type="time"
                      required
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Meeting Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="relative cursor-pointer group">
                      <input type="radio" name="type" value="video" className="peer sr-only" defaultChecked />
                      <div className="p-4 bg-gray-50 border-2 border-transparent peer-checked:border-amber-500 peer-checked:bg-amber-50 rounded-2xl flex items-center gap-3 transition-all">
                        <Video className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
                        <span className="text-sm font-bold text-gray-600">Video Call</span>
                      </div>
                    </label>
                    <label className="relative cursor-pointer group">
                      <input type="radio" name="type" value="in-person" className="peer sr-only" />
                      <div className="p-4 bg-gray-50 border-2 border-transparent peer-checked:border-amber-500 peer-checked:bg-amber-50 rounded-2xl flex items-center gap-3 transition-all">
                        <Users className="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" />
                        <span className="text-sm font-bold text-gray-600">In Person</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg hover:bg-amber-500 hover:text-black transition-all shadow-xl shadow-black/5"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Appointments;
