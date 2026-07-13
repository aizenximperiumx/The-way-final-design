import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Send, MessageSquare, Mic, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useAppStore } from '../store/appStore';
import { uploadFileToStorage } from '../lib/upload';
import { tap, thud } from '../lib/native';
import { useVoiceRecorder, canRecordVoice, fmtSec, AudioBubble } from './VoiceNote';
import MobileLayout from './MobileLayout';

const MobileMessages: React.FC = () => {
  const { user } = useAuth();
  const { applications, users, chatMessages } = useApp();
  const { addChatMessage } = useAppStore();
  const [text, setText] = useState('');
  const [sendingVoice, setSendingVoice] = useState(false);
  const recorder = useVoiceRecorder();
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

  const startVoice = async () => {
    tap();
    if (!(await recorder.start())) toast.error('Microphone unavailable');
  };

  const sendVoice = async () => {
    const rec = await recorder.stop();
    if (!rec || !advisorId) return;
    setSendingVoice(true);
    try {
      const url = await uploadFileToStorage(rec.file);
      addChatMessage(advisorId, '', myApp?.id, { audioUrl: url, audioSec: rec.seconds });
      thud();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not send voice note');
    } finally {
      setSendingVoice(false);
    }
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
                    {m.audioUrl ? (
                      <AudioBubble
                        url={m.audioUrl}
                        sec={m.audioSec}
                        accent={mine ? '#0A1628' : '#F5A800'}
                        faint={mine ? 'rgba(10,22,40,0.30)' : 'rgba(245,240,232,0.25)'}
                      />
                    ) : m.text}
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          {/* Composer */}
          <div className="fixed left-0 right-0 px-4" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 64px)' }}>
            <div className="flex items-center gap-2 rounded-2xl p-1.5" style={{ background: 'rgba(13,31,60,0.95)', border: '1px solid rgba(245,168,0,0.22)', backdropFilter: 'blur(12px)' }}>
              {recorder.recording || sendingVoice ? (
                <>
                  <button onClick={() => { tap(); recorder.cancel(); }} disabled={sendingVoice} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40" style={{ background: 'rgba(255,99,99,0.14)' }} aria-label="Cancel recording">
                    <Trash2 className="w-4 h-4" style={{ color: '#FF9B9B' }} />
                  </button>
                  <div className="flex-1 flex items-center gap-2 px-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#FF6363', animation: 'twpulse 1.1s infinite' }} />
                    <span className="text-[14px] font-bold tabular-nums" style={{ color: 'var(--v3-white)' }}>
                      {sendingVoice ? 'Sending…' : fmtSec(recorder.seconds)}
                    </span>
                    <span className="text-[11px]" style={{ color: 'rgba(245,240,232,0.45)' }}>
                      {sendingVoice ? '' : 'Recording voice note'}
                    </span>
                  </div>
                  <button onClick={() => void sendVoice()} disabled={sendingVoice} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-60" style={{ background: 'var(--v3-yellow)', color: 'var(--v3-navy)' }} aria-label="Send voice note">
                    {sendingVoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                  <style>{`@keyframes twpulse { 0%,100%{opacity:1} 50%{opacity:0.25} }`}</style>
                </>
              ) : (
                <>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                    placeholder="Message your advisor…"
                    className="flex-1 bg-transparent px-3 py-2.5 text-[14px] outline-none"
                    style={{ color: 'var(--v3-white)' }}
                  />
                  {!text.trim() && canRecordVoice() ? (
                    <button onClick={() => void startVoice()} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,168,0,0.15)', color: 'var(--v3-yellow)' }} aria-label="Record voice note">
                      <Mic className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={send} disabled={!text.trim()} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40" style={{ background: 'var(--v3-yellow)', color: 'var(--v3-navy)' }}>
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </MobileLayout>
  );
};

export default MobileMessages;
