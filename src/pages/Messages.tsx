import { useMemo, useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Bell,
  MessageSquare,
  Search,
  AlertCircle,
  Send,
  Plus,
  X,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useAppStore } from '../store/appStore';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

const pairKey = (a: string, b: string) => [a, b].sort().join('|');
const threadKeyFromMessage = (m: { userId: string; toUserId: string; applicationId?: string }) =>
  `${m.applicationId ?? 'direct'}|${pairKey(m.userId, m.toUserId)}`;

type ContactOption = { userId: string; name: string; applicationId?: string };
type VirtualThread = { key: string; otherUserId: string; applicationId?: string; name: string };

const Messages: React.FC = () => {
  const { user } = useAuth();
  const { notifications, users, applications, chatMessages, addChatMessage, chatThreadReadAt, markChatThreadRead } = useApp();
  const location = useLocation() as { state?: { openComplaint?: boolean; openThreadKey?: string } };
  const [activeTab, setActiveTab] = useState<'notifications' | 'chat'>(() =>
    location.state?.openComplaint || location.state?.openThreadKey ? 'chat' : 'notifications'
  );
  const [selectedThreadKey, setSelectedThreadKey] = useState<string | null>(null);
  const [virtualThread, setVirtualThread] = useState<VirtualThread | null>(null);
  const [draft, setDraft] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const newChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showNewChat) return;
    const handler = (e: MouseEvent) => {
      if (newChatRef.current && !newChatRef.current.contains(e.target as Node)) {
        setShowNewChat(false);
        setNewChatSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNewChat]);

  // Only show the current user's own notifications
  const myNotifications = notifications.filter(n => n.userId === user?.id);

  const handleMarkAllRead = () => {
    if (!user) return;
    useAppStore.setState(state => ({
      notifications: state.notifications.map(n => (n.userId === user.id ? { ...n, read: true } : n)),
    }));
  };

  const handleDismissNotification = (id: string) => {
    useAppStore.setState(state => ({
      notifications: state.notifications.map(n => (n.id === id ? { ...n, read: true } : n)),
    }));
  };

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
      const name = app
        ? `${app.name} • ${baseName}`
        : m.applicationId?.startsWith('complaint-') && user.role === 'student'
        ? 'CEO Support'
        : baseName;

      const readKey = `${user.id}|${key}`;
      const readAt = chatThreadReadAt?.[readKey] ?? '';
      const unreadInc = m.userId !== user.id && (!readAt || new Date(m.time).getTime() > new Date(readAt).getTime()) ? 1 : 0;

      const prev = byKey.get(key);
      if (!prev || new Date(m.time).getTime() >= new Date(prev.time || 0).getTime()) {
        byKey.set(key, { key, otherUserId, applicationId: m.applicationId, name, lastMessage: m.text, time: m.time, unread: (prev?.unread ?? 0) + unreadInc });
      } else if (unreadInc) {
        byKey.set(key, { ...prev, unread: (prev.unread ?? 0) + unreadInc });
      }
    });

    // Pre-populate student threads
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

    // Pre-populate staff/agency_staff threads
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

    // Pre-populate CEO threads
    if (user.role === 'ceo') {
      users.filter(u => u.role === 'student').forEach((stu) => {
        const complaintId = `complaint-${stu.id}`;
        const key = `${complaintId}|${pairKey(user.id, stu.id)}`;
        if (!byKey.has(key)) {
          byKey.set(key, { key, otherUserId: stu.id, applicationId: complaintId, name: `${stu.name} • Complaint`, lastMessage: '', time: '', unread: 0 });
        }
      });
    }

    // Pre-populate sales threads: approved public-source applications
    if (user.role === 'sales') {
      applications
        .filter(a => a.status === 'approved' && (a.source ?? 'public') === 'public' && a.studentId)
        .forEach((app) => {
          const key = `${app.id}|${pairKey(user.id, app.studentId!)}`;
          if (!byKey.has(key)) {
            const stu = users.find(u => u.id === app.studentId);
            byKey.set(key, { key, otherUserId: app.studentId!, applicationId: app.id, name: `${app.name} • ${stu?.name ?? 'Student'}`, lastMessage: '', time: '', unread: 0 });
          }
        });
    }

    // Pre-populate ops threads: approved agency applications
    if (user.role === 'ops') {
      applications
        .filter(a => a.status === 'approved' && a.source === 'agency' && a.agencyId)
        .forEach((app) => {
          const key = `${app.id}|${pairKey(user.id, app.agencyId!)}`;
          if (!byKey.has(key)) {
            const ag = users.find(u => u.id === app.agencyId);
            byKey.set(key, { key, otherUserId: app.agencyId!, applicationId: app.id, name: `${app.name} • ${ag?.name ?? 'Agency'}`, lastMessage: '', time: '', unread: 0 });
          }
        });
    }

    // Pre-populate agency threads: their applications with assigned staff
    if (user.role === 'agency') {
      applications
        .filter(a => a.agencyId === user.id && a.assignedStaffId)
        .forEach((app) => {
          const key = `${app.id}|${pairKey(user.id, app.assignedStaffId!)}`;
          if (!byKey.has(key)) {
            const staff = users.find(u => u.id === app.assignedStaffId);
            byKey.set(key, { key, otherUserId: app.assignedStaffId!, applicationId: app.id, name: `${app.name} • ${staff?.name ?? 'Admin'}`, lastMessage: '', time: '', unread: 0 });
          }
        });
    }

    return Array.from(byKey.values())
      .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());
  }, [user, chatMessages, users, applications, searchTerm, chatThreadReadAt]);

  // Include virtual (pending first message) thread in the displayed list
  const displayThreads = useMemo(() => {
    if (!virtualThread || threads.find(t => t.key === virtualThread.key)) return threads;
    return [{ ...virtualThread, lastMessage: '', time: '', unread: 0 }, ...threads];
  }, [threads, virtualThread]);

  const complaintThreadKey = useMemo(() => {
    if (!user || user.role !== 'student') return null;
    if (!location.state?.openComplaint) return null;
    const ceo = users.find(u => u.role === 'ceo');
    if (!ceo) return null;
    const complaintId = `complaint-${user.id}`;
    return `${complaintId}|${pairKey(user.id, ceo.id)}`;
  }, [user, users, location.state?.openComplaint]);

  const effectiveSelectedThreadKey = selectedThreadKey ?? location.state?.openThreadKey ?? complaintThreadKey;

  const activeThread = useMemo(
    () => (effectiveSelectedThreadKey ? displayThreads.find(t => t.key === effectiveSelectedThreadKey) ?? null : null),
    [displayThreads, effectiveSelectedThreadKey]
  );

  const currentThread = useMemo(() => {
    if (!user || !activeThread) return [];
    return chatMessages
      .filter(m => threadKeyFromMessage(m) === activeThread.key)
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [user, activeThread, chatMessages]);

  // Contacts available for new chat based on role
  const contactOptions = useMemo<ContactOption[]>(() => {
    if (!user) return [];
    const q = newChatSearch.toLowerCase();
    const match = (name: string) => name.toLowerCase().includes(q);

    if (user.role === 'ceo') {
      return users
        .filter(u => u.id !== user.id && match(u.name))
        .map(u => ({
          userId: u.id,
          name: `${u.name} (${u.role})`,
          applicationId: u.role === 'student' ? `complaint-${u.id}` : undefined,
        }));
    }
    if (user.role === 'sales') {
      return users
        .filter(u => ['student', 'staff', 'agency_staff', 'ops', 'ceo'].includes(u.role) && u.id !== user.id && match(u.name))
        .map(u => ({
          userId: u.id,
          name: `${u.name} (${u.role})`,
          applicationId: u.role === 'student'
            ? applications.find(a => a.studentId === u.id && (a.source ?? 'public') === 'public')?.id
            : undefined,
        }));
    }
    if (user.role === 'ops') {
      return users
        .filter(u => ['agency', 'staff', 'agency_staff', 'sales', 'ceo'].includes(u.role) && u.id !== user.id && match(u.name))
        .map(u => ({
          userId: u.id,
          name: `${u.name} (${u.role})`,
          applicationId: u.role === 'agency'
            ? applications.find(a => a.agencyId === u.id && a.source === 'agency')?.id
            : undefined,
        }));
    }
    if (user.role === 'agency') {
      return applications
        .filter(a => a.agencyId === user.id && a.assignedStaffId)
        .flatMap(a => {
          const staff = users.find(u => u.id === a.assignedStaffId);
          if (!staff || !match(staff.name)) return [];
          return [{ userId: staff.id, name: `${a.name} • ${staff.name}`, applicationId: a.id }];
        });
    }
    if (user.role === 'staff' || user.role === 'agency_staff') {
      return applications
        .filter(a => a.assignedStaffId === user.id && a.status === 'approved')
        .flatMap(a => {
          const results: ContactOption[] = [];
          if (a.studentId) {
            const stu = users.find(u => u.id === a.studentId);
            if (stu && match(stu.name)) results.push({ userId: stu.id, name: `${a.name} • ${stu.name}`, applicationId: a.id });
          }
          if ((a.source ?? 'public') === 'agency' && a.agencyId) {
            const ag = users.find(u => u.id === a.agencyId);
            if (ag && match(ag.name)) results.push({ userId: ag.id, name: `${a.name} • ${ag.name}`, applicationId: a.id });
          }
          return results;
        });
    }
    return [];
  }, [user, users, applications, newChatSearch]);

  const handleStartChat = (contact: ContactOption) => {
    if (!user) return;
    const appId = contact.applicationId ?? 'direct';
    const key = `${appId}|${pairKey(user.id, contact.userId)}`;
    const exists = threads.find(t => t.key === key);
    if (exists) {
      setSelectedThreadKey(key);
      markChatThreadRead(key);
      setVirtualThread(null);
    } else {
      setVirtualThread({ key, otherUserId: contact.userId, applicationId: contact.applicationId, name: contact.name });
      setSelectedThreadKey(key);
    }
    setShowNewChat(false);
    setNewChatSearch('');
    setActiveTab('chat');
  };

  const handleSendMessage = () => {
    if (!user || !draft.trim() || !activeThread) return;
    try {
      addChatMessage(activeThread.otherUserId, draft.trim(), activeThread.applicationId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to send message');
      return;
    }
    setDraft('');
    if (virtualThread) setVirtualThread(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedContacts = useMemo(() => {
    if (!user) return [];
    if (user.role === 'ceo') {
      const q = searchTerm.toLowerCase();
      return users
        .filter(u => u.role === 'student' && u.id !== user.id && u.name.toLowerCase().includes(q))
        .map(u => ({ key: `complaint-${u.id}|${pairKey(user.id, u.id)}`, name: `${u.name} • Complaint` }));
    }
    return [];
  }, [user, users, searchTerm]);

  const getNotifIcon = (type: string) => {
    if (type === 'alert') return <AlertCircle className="w-5 h-5" />;
    if (type === 'success') return <CheckCircle2 className="w-5 h-5" />;
    return <Info className="w-5 h-5" />;
  };

  const getNotifIconClass = (type: string) => {
    if (type === 'alert') return 'bg-red-50 text-red-500';
    if (type === 'success') return 'bg-green-50 text-green-500';
    return 'bg-blue-50 text-blue-500';
  };

  const getInitials = (name: string) =>
    name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="space-y-6 pb-12 bg-[#FAFAF9] min-h-screen">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Communication Hub</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage notifications and direct messages.</p>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'notifications'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notifications
            {myNotifications.filter(n => !n.read).length > 0 && (
              <span className="w-2 h-2 bg-amber-400 rounded-full inline-block" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'chat'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {activeTab === 'notifications' ? (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Notifications Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">System Notifications</h2>
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
              >
                Mark all as read
              </button>
            </div>

            <div className="divide-y divide-gray-50">
              {myNotifications.length === 0 ? (
                <div className="py-20 text-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-7 h-7 text-gray-300" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Inbox is empty</h3>
                  <p className="text-sm text-gray-400">You're all caught up. New updates will appear here.</p>
                </div>
              ) : (
                myNotifications.map((notif, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${
                      !notif.read ? 'border-l-2 border-amber-400 bg-amber-50/30' : ''
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getNotifIconClass(notif.type)}`}>
                      {getNotifIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{notif.title}</h3>
                        <span className="text-xs text-gray-400 shrink-0">{notif.time}</span>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed">{notif.message}</p>
                    </div>
                    {!notif.read && (
                      <button
                        onClick={() => handleDismissNotification(notif.id)}
                        className="p-1.5 text-gray-300 hover:text-gray-500 transition-colors rounded-lg hover:bg-gray-100 shrink-0"
                        title="Mark as read"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="flex gap-0 min-h-[60vh] lg:h-[700px] bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Thread List — 280px left panel */}
            <div
              className={`w-full lg:w-[280px] lg:min-w-[280px] border-r border-gray-100 flex flex-col bg-white ${
                activeThread ? 'hidden lg:flex' : 'flex'
              }`}
            >
              {/* Panel Header */}
              <div className="px-4 py-3 border-b border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">Messages</h2>
                  <div className="relative" ref={newChatRef}>
                    <button
                      onClick={() => { setShowNewChat(v => !v); setNewChatSearch(''); }}
                      className="w-7 h-7 bg-amber-600 text-white rounded-lg flex items-center justify-center hover:bg-amber-700 transition-colors"
                      title="New conversation"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    {showNewChat && (
                      <div className="absolute right-0 top-9 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 w-72 overflow-hidden">
                        <div className="p-3 border-b border-gray-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                              autoFocus
                              type="text"
                              placeholder="Search contacts..."
                              value={newChatSearch}
                              onChange={e => setNewChatSearch(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 outline-none"
                            />
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {contactOptions.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-gray-400">No contacts found</div>
                          ) : (
                            contactOptions.map((c, i) => (
                              <button
                                key={i}
                                onClick={() => handleStartChat(c)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                              >
                                <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center text-xs font-semibold shrink-0">
                                  {c.name.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-700 truncate">{c.name}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={user?.role === 'staff' ? 'Search students...' : 'Search conversations...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 outline-none"
                  />
                </div>
              </div>

              {/* Thread List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {displayThreads.map((chat) => {
                  const isActive = effectiveSelectedThreadKey === chat.key;
                  return (
                    <div
                      key={chat.key}
                      onClick={() => {
                        setSelectedThreadKey(chat.key);
                        if (chat.key !== virtualThread?.key) setVirtualThread(null);
                        if (user) markChatThreadRead(chat.key);
                        setActiveTab('chat');
                      }}
                      className={`py-3 px-4 cursor-pointer transition-colors relative flex items-center gap-3 ${
                        isActive
                          ? 'bg-amber-50 border-l-2 border-amber-500'
                          : 'hover:bg-gray-50 border-l-2 border-transparent'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 font-semibold flex items-center justify-center text-sm shrink-0">
                        {getInitials(chat.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-sm font-semibold truncate ${isActive ? 'text-amber-800' : 'text-gray-900'}`}>
                            {chat.name}
                          </span>
                          <span className="text-[11px] text-gray-400 shrink-0 ml-1">
                            {chat.time ? new Date(chat.time).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{chat.lastMessage || 'No messages yet'}</p>
                      </div>
                      {chat.unread > 0 && (
                        <span className="w-2 h-2 bg-amber-500 rounded-full shrink-0" />
                      )}
                    </div>
                  );
                })}
                {displayThreads.length === 0 && (
                  <div className="px-4 py-10 text-center">
                    <p className="text-sm text-gray-400">
                      No conversations yet.{' '}
                      <span
                        className="font-semibold text-amber-600 cursor-pointer hover:underline"
                        onClick={() => setShowNewChat(true)}
                      >
                        Start one
                      </span>.
                    </p>
                  </div>
                )}
              </div>

              {/* CEO Suggested Contacts */}
              {user?.role === 'ceo' && suggestedContacts.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Suggested</p>
                  <div className="space-y-1">
                    {suggestedContacts.map(c => (
                      <button
                        key={c.key}
                        onClick={() => {
                          setSelectedThreadKey(c.key);
                          if (user) markChatThreadRead(c.key);
                          setActiveTab('chat');
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                          effectiveSelectedThreadKey === c.key
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Chat Window — right panel */}
            <div className={`flex-1 flex flex-col bg-[#FAFAF9] ${activeThread ? 'flex' : 'hidden lg:flex'}`}>
              {activeThread ? (
                <>
                  {/* Chat Header */}
                  <div className="px-5 py-3 border-b border-gray-100 bg-white flex items-center gap-3">
                    <button
                      onClick={() => { setSelectedThreadKey(null); setVirtualThread(null); }}
                      className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                      aria-label="Back"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="w-9 h-9 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center text-sm font-semibold">
                      {getInitials(activeThread.name)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{activeThread.name}</h3>
                      <p className="text-xs text-green-500 font-medium">Active Now</p>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 custom-scrollbar">
                    {currentThread.length === 0 ? (
                      <div className="text-center py-16">
                        <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
                      </div>
                    ) : (
                      currentThread.map((m) => {
                        const isMine = m.userId === user?.id;
                        return (
                          <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`px-4 py-3 max-w-[75%] shadow-sm ${
                                isMine
                                  ? 'bg-amber-600 text-white rounded-2xl rounded-br-sm'
                                  : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-sm'
                              }`}
                            >
                              <p className="text-sm leading-relaxed">{m.text}</p>
                              <p className={`text-[11px] mt-1.5 ${isMine ? 'text-amber-200' : 'text-gray-400'}`}>
                                {new Date(m.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="px-5 py-4 bg-white border-t border-gray-100 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 outline-none"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="w-10 h-10 bg-amber-600 text-white rounded-lg flex items-center justify-center hover:bg-amber-700 transition-colors shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <MessageSquare className="w-7 h-7 text-gray-300" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Select a conversation</h3>
                  <p className="text-sm text-gray-400 max-w-xs">
                    Choose a thread from the left to start chatting.
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
