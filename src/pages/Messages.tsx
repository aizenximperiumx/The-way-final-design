import { useMemo, useState } from 'react';
import { 
  ArrowLeft,
  Bell, 
  MessageSquare, 
  Search, 
  MoreVertical, 
  AlertCircle,
  UserCircle,
  Send,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

const pairKey = (a: string, b: string) => [a, b].sort().join('|');
const threadKeyFromMessage = (m: { userId: string; toUserId: string; applicationId?: string }) => `${m.applicationId ?? 'direct'}|${pairKey(m.userId, m.toUserId)}`;

const Messages: React.FC = () => {
  const { user } = useAuth();
  const { notifications, users, applications, chatMessages, addChatMessage, chatThreadReadAt, markChatThreadRead } = useApp();
  const location = useLocation() as { state?: { openComplaint?: boolean; openThreadKey?: string } };
  const [activeTab, setActiveTab] = useState<'notifications' | 'chat'>(() => (location.state?.openComplaint || location.state?.openThreadKey) ? 'chat' : 'notifications');
  const [selectedThreadKey, setSelectedThreadKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const myNotifications = notifications.filter(n => n.userId === user?.id || user?.role !== 'student');

  const threads = useMemo(() => {
    if (!user) return [];

    const byKey = new Map<string, { key: string; otherUserId: string; applicationId?: string; name: string; lastMessage: string; time: string; unread: number }>();

    chatMessages.forEach((m) => {
      if (m.userId !== user.id && m.toUserId !== user.id) return;
      const key = threadKeyFromMessage(m);
      const otherUserId = m.userId === user.id ? m.toUserId : m.userId;
      const otherUser = users.find(u => u.id === otherUserId);
      const app = m.applicationId && !m.applicationId.startsWith('complaint-') ? applications.find(a => a.id === m.applicationId) : undefined;
      const baseName = otherUser?.name ?? 'Unknown';
      const name = app ? `${app.name} • ${baseName}` : (m.applicationId?.startsWith('complaint-') && user.role === 'student' ? 'CEO Support' : baseName);

      const readKey = `${user.id}|${key}`;
      const readAt = chatThreadReadAt?.[readKey] ?? '';
      const unreadInc = (m.userId !== user.id && (!readAt || new Date(m.time).getTime() > new Date(readAt).getTime())) ? 1 : 0;

      const prev = byKey.get(key);
      if (!prev || new Date(m.time).getTime() >= new Date(prev.time || 0).getTime()) {
        byKey.set(key, { key, otherUserId, applicationId: m.applicationId, name, lastMessage: m.text, time: m.time, unread: (prev?.unread ?? 0) + unreadInc });
      } else if (unreadInc) {
        byKey.set(key, { ...prev, unread: (prev.unread ?? 0) + unreadInc });
      }
    });

    if (user.role === 'student') {
      const app = applications.find(a => a.studentId === user.id) || null;
      const staffId = app?.assignedStaffId;
      if (app?.id && staffId) {
        const key = `${app.id}|${pairKey(user.id, staffId)}`;
        if (!byKey.has(key)) {
          const staff = users.find(u => u.id === staffId);
          byKey.set(key, { key, otherUserId: staffId, applicationId: app.id, name: staff?.name ?? 'Assigned Admin', lastMessage: '', time: '', unread: 0 });
        }
      }
      const ceo = users.find(u => u.role === 'ceo');
      if (ceo) {
        const complaintId = `complaint-${user.id}`;
        const key = `${complaintId}|${pairKey(user.id, ceo.id)}`;
        if (!byKey.has(key)) {
          byKey.set(key, { key, otherUserId: ceo.id, applicationId: complaintId, name: 'CEO Support', lastMessage: '', time: '', unread: 0 });
        }
      }
    }

    if (user.role === 'staff' || user.role === 'agency_staff') {
      const assignedApps = applications.filter(a => a.status === 'approved' && a.assignedStaffId === user.id);
      assignedApps.forEach((app) => {
        if (app.studentId) {
          const key = `${app.id}|${pairKey(user.id, app.studentId)}`;
          if (!byKey.has(key)) {
            const stu = users.find(u => u.id === app.studentId);
            byKey.set(key, { key, otherUserId: app.studentId, applicationId: app.id, name: `${app.name} • ${stu?.name ?? 'Student'}`, lastMessage: '', time: '', unread: 0 });
          }
        }
        if ((app.source ?? 'public') === 'agency' && app.agencyId) {
          const key = `${app.id}|${pairKey(user.id, app.agencyId)}`;
          if (!byKey.has(key)) {
            const ag = users.find(u => u.id === app.agencyId);
            byKey.set(key, { key, otherUserId: app.agencyId, applicationId: app.id, name: `${app.name} • ${ag?.name ?? 'Agency'}`, lastMessage: '', time: '', unread: 0 });
          }
        }
      });
    }

    if (user.role === 'ceo') {
      users.filter(u => u.role === 'student').forEach((stu) => {
        const complaintId = `complaint-${stu.id}`;
        const key = `${complaintId}|${pairKey(user.id, stu.id)}`;
        if (!byKey.has(key)) {
          byKey.set(key, { key, otherUserId: stu.id, applicationId: complaintId, name: `${stu.name} • Complaint`, lastMessage: '', time: '', unread: 0 });
        }
      });
    }

    return Array.from(byKey.values())
      .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());
  }, [user, chatMessages, users, applications, searchTerm, chatThreadReadAt]);

  const complaintThreadKey = useMemo(() => {
    if (!user || user.role !== 'student') return null;
    if (!location.state?.openComplaint) return null;
    const ceo = users.find(u => u.role === 'ceo');
    if (!ceo) return null;
    const complaintId = `complaint-${user.id}`;
    return `${complaintId}|${pairKey(user.id, ceo.id)}`;
  }, [user, users, location.state?.openComplaint]);

  const effectiveSelectedThreadKey = selectedThreadKey ?? location.state?.openThreadKey ?? complaintThreadKey;

  const selectedThread = useMemo(() => {
    if (!effectiveSelectedThreadKey) return null;
    return threads.find(t => t.key === effectiveSelectedThreadKey) ?? null;
  }, [threads, effectiveSelectedThreadKey]);

  const currentThread = useMemo(() => {
    if (!user || !selectedThread) return [];
    return chatMessages
      .filter(m => threadKeyFromMessage(m) === selectedThread.key)
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [user, selectedThread, chatMessages]);

  const suggestedContacts = useMemo(() => {
    if (!user) return [];
    if (user.role === 'ceo') {
      const q = searchTerm.toLowerCase();
      return users
        .filter(u => u.role === 'student' && u.id !== user.id)
        .filter(u => u.name.toLowerCase().includes(q))
        .map(u => ({ key: `complaint-${u.id}|${pairKey(user.id, u.id)}`, name: `${u.name} • Complaint` }));
    }
    return [];
  }, [user, users, searchTerm]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tight">Communication Hub</h1>
          <p className="text-gray-500 font-medium">Manage notifications and direct messages.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'notifications' 
                ? 'bg-black text-white shadow-lg' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'chat' 
                ? 'bg-black text-white shadow-lg' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Direct Chat
          </button>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {activeTab === 'notifications' ? (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="tw-card overflow-hidden"
          >
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-black text-black">System Notifications</h2>
              <button className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-lg uppercase tracking-widest hover:bg-amber-100 transition-all">
                Mark all as read
              </button>
            </div>
            
            <div className="divide-y divide-gray-50">
              {myNotifications.length === 0 ? (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-gray-200">
                    <Bell className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-black mb-2">Inbox is empty</h3>
                  <p className="text-gray-400 font-medium">You're all caught up! New updates will appear here.</p>
                </div>
              ) : (
                myNotifications.map((notif, idx) => (
                  <div key={idx} className={`p-8 hover:bg-gray-50/50 transition-colors group flex items-start gap-6 ${!notif.read ? 'bg-amber-50/20' : ''}`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      notif.type === 'alert' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {notif.type === 'alert' ? <AlertCircle className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-black text-black">{notif.title}</h3>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{notif.time}</span>
                      </div>
                      <p className="text-gray-500 font-medium leading-relaxed">{notif.message}</p>
                    </div>
                    <button className="p-2 text-gray-200 hover:text-black transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:grid lg:grid-cols-3 gap-6 lg:gap-8 min-h-[60vh] lg:h-[700px]"
          >
            {/* Chat List */}
            <div className={`lg:col-span-1 tw-card overflow-hidden flex flex-col ${selectedThread ? 'hidden lg:flex' : 'flex'}`}>
              <div className="p-6 border-b border-gray-50 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-black">Messages</h2>
                  <button className="p-2 bg-amber-500 text-black rounded-xl hover:shadow-lg transition-all">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={user?.role === 'staff' ? 'Search students by name...' : 'Search conversations...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
                {threads.map((chat) => (
                  <div
                    key={chat.key}
                    onClick={() => {
                      setSelectedThreadKey(chat.key);
                      if (user) markChatThreadRead(chat.key);
                      setActiveTab('chat');
                    }}
                    className={`p-6 hover:bg-gray-50 cursor-pointer transition-all relative group ${
                      effectiveSelectedThreadKey === chat.key ? 'bg-amber-50/50' : ''
                    }`}
                  >
                    {effectiveSelectedThreadKey === chat.key && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                        <UserCircle className="w-7 h-7" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-black truncate">{chat.name}</h3>
                          <span className="text-[10px] text-gray-400 font-bold">{chat.time ? new Date(chat.time).toLocaleString() : ''}</span>
                        </div>
                        <p className="text-xs text-gray-400 font-medium truncate">{chat.lastMessage}</p>
                      </div>
                      {chat.unread > 0 && (
                        <span className="w-2 h-2 bg-amber-500 rounded-full shadow-lg shadow-amber-500/20"></span>
                      )}
                    </div>
                  </div>
                ))}
                {threads.length === 0 && (
                  <div className="p-8 text-center text-gray-400 font-medium">No conversations yet</div>
                )}
              </div>

              {user?.role === 'ceo' && (
                <div className="p-6 border-t border-gray-50">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Suggested Contacts</p>
                  <div className="grid grid-cols-2 gap-3">
                    {suggestedContacts.map(c => (
                      <button
                        key={c.key}
                        onClick={() => {
                          setSelectedThreadKey(c.key);
                          if (user) markChatThreadRead(c.key);
                          setActiveTab('chat');
                        }}
                        className={`px-3 py-2 rounded-xl text-sm font-bold border ${
                          effectiveSelectedThreadKey === c.key ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chat Window */}
            <div className={`lg:col-span-2 tw-card overflow-hidden flex flex-col ${selectedThread ? 'flex' : 'hidden lg:flex'}`}>
              {selectedThread ? (
                <>
                  <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setSelectedThreadKey(null)}
                        className="lg:hidden p-2 rounded-xl hover:bg-gray-100 text-gray-500"
                        aria-label="Back"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                        <UserCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-black">
                          {selectedThread.name}
                        </h3>
                        <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Active Now</p>
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-black transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 custom-scrollbar bg-gray-50/30">
                    {currentThread.length === 0 ? (
                      <div className="text-center text-gray-400 font-medium">No messages yet. Say hello!</div>
                    ) : (
                      currentThread.map((m) => {
                        const isMine = m.userId === user?.id;
                        return (
                          <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`${isMine ? 'bg-black text-white rounded-2xl rounded-tr-none' : 'bg-white border border-gray-100 rounded-2xl rounded-tl-none'} p-4 max-w-[80%] shadow-sm`}>
                              <p className={`text-sm font-medium ${isMine ? '' : 'text-gray-700'} leading-relaxed`}>{m.text}</p>
                              <p className={`text-[10px] font-bold mt-2 ${isMine ? 'text-white/40' : 'text-gray-400'}`}>{new Date(m.time).toLocaleString()}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-4 sm:p-6 bg-white border-t border-gray-50 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="w-full pl-6 pr-14 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                      />
                      <button
                        onClick={() => {
                          if (!user || !selectedThread || !draft.trim()) return;
                          try {
                            addChatMessage(selectedThread.otherUserId, draft.trim(), selectedThread.applicationId);
                          } catch (e) {
                            const msg = e instanceof Error ? e.message : 'Unable to send message';
                            toast.error(msg);
                            return;
                          }
                          setDraft('');
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-amber-500 hover:text-black transition-all shadow-lg shadow-black/5"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                  <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center mb-8 text-gray-200">
                    <MessageSquare className="w-12 h-12" />
                  </div>
                  <h3 className="text-2xl font-black text-black mb-4">Start a conversation</h3>
                  <p className="text-gray-400 font-medium max-w-xs mx-auto">
                    Choose a contact on the left to begin chatting with our team.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Messages;
