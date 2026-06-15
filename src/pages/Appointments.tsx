import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Users,
  Plus,
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

  // Real current-month calendar + next upcoming appointment (no placeholder data)
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const todayDate = today.getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = today.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(todayDate).padStart(2, '0')}`;
  const upcoming = [...myAppointments]
    .filter(a => a.status !== 'cancelled' && a.date >= todayStr)
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))[0];

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

  const statusBadge = (status: string) => {
    if (status === 'confirmed') return 'bg-green-50 text-green-700 border border-green-100';
    if (status === 'cancelled') return 'bg-gray-100 text-gray-500 border border-gray-200';
    return 'bg-amber-50 text-amber-700 border border-amber-100';
  };

  return (
    <div className="space-y-6 pb-12 bg-[#FAFAF9] min-h-screen">
      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Appointments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your consultations and university meetings.</p>
        </div>
        {user?.role === 'student' && (
          <button
            onClick={() => setShowBookingModal(true)}
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Book Appointment
          </button>
        )}
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">{monthLabel}</h3>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5 uppercase tracking-wider">This month</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <span key={i} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-1">{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstWeekday }).map((_, i) => <span key={`pad-${i}`} className="h-8" />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = day === todayDate;
                const hasAppt = myAppointments.some(a => a.date === dayStr && a.status !== 'cancelled');
                return (
                  <div
                    key={day}
                    className={`relative h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                      isToday ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {day}
                    {hasAppt && !isToday && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-500" />}
                    {hasAppt && isToday && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white" />}
                  </div>
                );
              })}
            </div>

            {/* Next upcoming appointment (real data) */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              {upcoming ? (
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="w-9 h-9 bg-amber-600 rounded-lg flex items-center justify-center text-white shrink-0">
                    {upcoming.type === 'video' ? <Video className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{upcoming.title}</p>
                    <p className="text-xs text-amber-700">{upcoming.date} · {upcoming.time}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-9 h-9 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-gray-300 shrink-0">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-medium text-gray-400">No upcoming appointments</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Scheduled Sessions</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className="text-xs text-gray-400 font-medium">Active Requests</span>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {myAppointments.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center px-8">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-7 h-7 text-gray-300" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">No appointments yet</h3>
                  <p className="text-sm text-gray-400 max-w-xs">
                    Book a session to get started with your application guidance.
                  </p>
                  {user?.role === 'student' && (
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="mt-5 flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Book Appointment
                    </button>
                  )}
                </div>
              ) : (
                myAppointments.map((appt, idx) => (
                  <div key={idx} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          appt.type === 'video' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'
                        }`}>
                          {appt.type === 'video' ? <Video className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{appt.title}</h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              {appt.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {appt.time}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${statusBadge(appt.status)}`}>
                          {appt.status}
                        </span>
                        {user?.role !== 'student' && appt.status === 'pending' && (
                          <div className="flex gap-1">
                            <button className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <button className="p-1.5 text-gray-300 hover:text-gray-500 transition-colors rounded-lg hover:bg-gray-100">
                          <MoreVertical className="w-4 h-4" />
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
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBookingModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              {/* Modal Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Book Consultation</h3>
              </div>

              <form onSubmit={handleBook} className="space-y-5">
                {/* Meeting Purpose */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Meeting Purpose</label>
                  <input
                    name="title"
                    type="text"
                    required
                    placeholder="e.g. Visa Application Review"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date</label>
                    <input
                      name="date"
                      type="date"
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Time</label>
                    <input
                      name="time"
                      type="time"
                      required
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/20 outline-none"
                    />
                  </div>
                </div>

                {/* Meeting Type */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Meeting Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="relative cursor-pointer group">
                      <input type="radio" name="type" value="video" className="peer sr-only" defaultChecked />
                      <div className="p-3 bg-gray-50 border border-gray-200 peer-checked:border-amber-500 peer-checked:bg-amber-50 rounded-lg flex items-center gap-2.5 transition-all">
                        <Video className="w-4 h-4 text-gray-400 peer-checked:text-amber-600 group-hover:text-amber-500 transition-colors" />
                        <span className="text-sm font-medium text-gray-700">Video Call</span>
                      </div>
                    </label>
                    <label className="relative cursor-pointer group">
                      <input type="radio" name="type" value="in-person" className="peer sr-only" />
                      <div className="p-3 bg-gray-50 border border-gray-200 peer-checked:border-amber-500 peer-checked:bg-amber-50 rounded-lg flex items-center gap-2.5 transition-all">
                        <Users className="w-4 h-4 text-gray-400 peer-checked:text-amber-600 group-hover:text-amber-500 transition-colors" />
                        <span className="text-sm font-medium text-gray-700">In Person</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 bg-white border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-amber-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-amber-700 transition-colors"
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
