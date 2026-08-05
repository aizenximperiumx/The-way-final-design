import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, MessagesSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore } from '../../store/appStore';
import { getUniversityName } from '../../lib/universities';
import { GOLD, NAVY, dim, goldA, card } from '../ui';
import TeamLayout from './TeamLayout';
import { SectionLabel, Row, Square, Empty, initialsOf } from './parts';
import { deskOf } from './roles';

/**
 * Messages for the team.
 *
 * The student app's Messages screen finds the signed-in user's own
 * application and talks to their advisor — which is meaningless for staff.
 * This is the other side of that conversation: the people this team member is
 * responsible for, newest first, and a thread for each.
 */

const timeLabel = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const sameDay = new Date().toDateString() === d.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

const TeamMessages: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const desk = deskOf(user?.role);
  const applications = useAppStore(s => s.applications);
  const users = useAppStore(s => s.users);
  const chatMessages = useAppStore(s => s.chatMessages);
  const addChatMessage = useAppStore(s => s.addChatMessage);

  const [openWith, setOpenWith] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // Who this person is responsible for.
  const mine = useMemo(() => applications.filter(a => {
    if (desk.kind === 'advisor') return a.assignedStaffId === user?.id;
    if (desk.kind === 'sales') return ((a.ownerId ?? a.salesOwnerId) ?? '') === user?.id;
    if (desk.kind === 'ceo') return Boolean(a.studentId);
    return false;
  }), [applications, desk.kind, user?.id]);

  const threads = useMemo(() => mine
    .filter(a => a.studentId)
    .map(a => {
      const msgs = chatMessages.filter(m =>
        (m.userId === user?.id && m.toUserId === a.studentId) ||
        (m.userId === a.studentId && m.toUserId === user?.id));
      const last = msgs[msgs.length - 1];
      return { app: a, last, count: msgs.length };
    })
    .sort((x, y) => (y.last?.time ?? '').localeCompare(x.last?.time ?? ''))
    .slice(0, 40), [mine, chatMessages, user?.id]);

  const active = openWith ? mine.find(a => a.studentId === openWith) : undefined;
  const conversation = useMemo(() => !openWith ? [] : chatMessages
    .filter(m => (m.userId === user?.id && m.toUserId === openWith) || (m.userId === openWith && m.toUserId === user?.id))
    .sort((a, b) => a.time.localeCompare(b.time)), [chatMessages, openWith, user?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conversation.length]);

  const send = () => {
    const t = draft.trim();
    if (!t || !openWith) return;
    addChatMessage(openWith, t, active?.id);
    setDraft('');
  };

  // ── One conversation ──
  if (openWith && active) {
    const student = users.find(u => u.id === openWith);
    return (
      <TeamLayout>
        <div style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4px)' }}>
          <button
            onClick={() => setOpenWith(null)}
            className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider mb-3"
            style={{ color: dim(0.55) }}
          >
            <ChevronLeft className="w-4 h-4" /> All messages
          </button>
          <button onClick={() => navigate(`/app/case/${active.id}`)} className="flex items-center gap-3 w-full text-left">
            <Square tone="gold">{initialsOf(active.name)}</Square>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-bold truncate" style={{ color: '#fff' }}>{active.name}</p>
              <p className="text-[12px] truncate" style={{ color: dim(0.5) }}>
                {getUniversityName(active.university) || student?.email || 'Open the case'}
              </p>
            </div>
          </button>
        </div>

        <div className="mt-5">
          {conversation.length === 0 ? (
            <Empty icon={MessagesSquare} title="No messages yet" sub={`Start the conversation with ${active.name?.split(' ')[0]}.`} />
          ) : conversation.map(m => {
            const mineMsg = m.userId === user?.id;
            return (
              <div key={m.id} className={`flex mb-2.5 ${mineMsg ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[78%] px-3.5 py-2.5 rounded-2xl"
                  style={mineMsg
                    ? { background: goldA(0.18), border: `1px solid ${goldA(0.28)}` }
                    : { background: 'rgba(255,255,255,0.05)', border: `1px solid ${goldA(0.12)}` }}
                >
                  {m.text && <p className="text-[14px] leading-snug" style={{ color: '#fff' }}>{m.text}</p>}
                  {m.audioUrl && (
                    <audio controls src={m.audioUrl} className="mt-1 w-full" style={{ height: 34 }} />
                  )}
                  <p className="text-[10px] mt-1 text-right" style={{ color: dim(0.4) }}>{timeLabel(m.time)}</p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        <div
          className="fixed left-0 right-0 flex items-center gap-2 px-5 py-3"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom) + 78px)',
            background: 'rgba(10,22,40,0.96)',
            borderTop: `1px solid ${goldA(0.12)}`,
            backdropFilter: 'blur(12px)',
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            placeholder="Write a message"
            className="flex-1 px-4 rounded-2xl outline-none text-[14.5px]"
            style={{ ...card, height: 44, color: '#fff' }}
          />
          <button
            onClick={send}
            disabled={!draft.trim()}
            aria-label="Send"
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-40"
            style={{ background: GOLD, color: NAVY }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </TeamLayout>
    );
  }

  // ── Thread list ──
  return (
    <TeamLayout>
      <div style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}>
        <p className="text-[11px] tracking-[2px] uppercase font-semibold" style={{ color: GOLD }}>Messages</p>
        <h1 className="v3-serif text-[28px] font-black leading-tight" style={{ color: '#fff' }}>
          {desk.kind === 'advisor' ? 'My students' : desk.kind === 'sales' ? 'My applicants' : 'Conversations'}
        </h1>
      </div>

      <SectionLabel right={threads.length ? String(threads.length) : undefined}>Threads</SectionLabel>

      {threads.length === 0 ? (
        <Empty icon={MessagesSquare} title="Nobody to message yet" sub="Students you are responsible for appear here." />
      ) : (
        threads.map(t => (
          <Row key={t.app.id} onClick={() => setOpenWith(t.app.studentId ?? null)}>
            <div className="flex items-center gap-3">
              <Square tone={t.last ? 'gold' : 'plain'}>{initialsOf(t.app.name)}</Square>
              <div className="flex-1 min-w-0">
                <p className="text-[14.5px] font-bold truncate" style={{ color: '#fff' }}>{t.app.name}</p>
                <p className="text-[12px] truncate mt-0.5" style={{ color: dim(0.55) }}>
                  {t.last
                    ? `${t.last.userId === user?.id ? 'You: ' : ''}${t.last.text || 'Voice note'}`
                    : 'No messages yet'}
                </p>
              </div>
              {t.last && (
                <span className="text-[11px] font-semibold shrink-0" style={{ color: dim(0.4) }}>
                  {timeLabel(t.last.time)}
                </span>
              )}
            </div>
          </Row>
        ))
      )}
    </TeamLayout>
  );
};

export default TeamMessages;
