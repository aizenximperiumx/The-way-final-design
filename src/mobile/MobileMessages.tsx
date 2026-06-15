import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useAppStore } from '../store/appStore';
import MobileLayout from './MobileLayout';

const MobileMessages: React.FC = () => {
  const { user } = useAuth();
  const { applications, users, chatMessages } = useApp();
  const { addChatMessage } = useAppStore();
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const myApp = applications.find(a => a.studentId === user?.id) ?? null;
  const advisorId = myApp?.assignedStaffId || myApp?.salesOwnerId || myApp?.ownerId || '';
  const advisor = users.find(u => u.id === advisorId);

  const thread = useMemo(() => chatMessages
    .filter(m => (m.userId === user?.id && m.toUserId === advisorId) || (m.userId === advisorId && m.toUserId === user?.id))
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()),
    [chatMessages, user?.id, advisorId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread.length]);

  const send = () => {
    const t = text.trim();
    if (!t || !advisorId) return;
    addChatMessage(advisorId, t, myApp?.id);
    setText('');
  };

  return (
    <MobileLayout title="Advisor">
      {!advisorId ? (
        <div className="rounded-2xl py-14 text-center mt-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,168,0,0.14)' }}>
          <MessageSquare className="w-9 h-9 mx-auto mb-3" style={{ color: 'rgba(245,240,232,0.25)' }} />
          <p className="text-[14px] font-semibold" style={{ color: 'var(--v3-white)' }}>No advisor assigned yet</p>
          <p className="text-[12px] mt-1 px-8" style={{ color: 'rgba(245,240,232,0.5)' }}>Your advisor will be assigned shortly — check back soon.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 pb-3 mb-1" style={{ borderBottom: '1px solid rgba(245,168,0,0.12)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: 'rgba(245,168,0,0.15)', color: 'var(--v3-yellow)' }}>{(advisor?.name ?? 'A').charAt(0)}</div>
            <div>
              <p className="text-[14px] font-bold" style={{ color: 'var(--v3-white)' }}>{advisor?.name ?? 'Your advisor'}</p>
              <p className="text-[11px]" style={{ color: 'rgba(245,240,232,0.5)' }}>Your enrollment advisor</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2" style={{ paddingBottom: 80 }}>
            {thread.length === 0 && (
              <p className="text-center text-[13px] py-8" style={{ color: 'rgba(245,240,232,0.5)' }}>Say hello — ask anything about your enrollment.</p>
            )}
            {thread.map((m) => {
              const mine = m.userId === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[78%] px-4 py-2.5 text-[14px] leading-relaxed" style={{
                    background: mine ? 'var(--v3-yellow)' : 'rgba(255,255,255,0.07)',
                    color: mine ? 'var(--v3-navy)' : 'var(--v3-white)',
                    borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    border: mine ? 'none' : '1px solid rgba(245,168,0,0.12)',
                  }}>
                    {m.text}
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          {/* Composer */}
          <div className="fixed left-0 right-0 px-4" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 64px)' }}>
            <div className="flex items-center gap-2 rounded-2xl p-1.5" style={{ background: 'rgba(13,31,60,0.95)', border: '1px solid rgba(245,168,0,0.22)', backdropFilter: 'blur(12px)' }}>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                placeholder="Message your advisor…"
                className="flex-1 bg-transparent px-3 py-2.5 text-[14px] outline-none"
                style={{ color: 'var(--v3-white)' }}
              />
              <button onClick={send} disabled={!text.trim()} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40" style={{ background: 'var(--v3-yellow)', color: 'var(--v3-navy)' }}>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </MobileLayout>
  );
};

export default MobileMessages;
