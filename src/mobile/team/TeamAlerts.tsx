import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellOff, UserPlus, FileText, ShieldAlert, MessageSquare, Megaphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAppStore, type Notification } from '../../store/appStore';
import { GOLD, dim } from '../ui';
import TeamLayout from './TeamLayout';
import { SectionLabel, Row, Square, Empty } from './parts';

/**
 * Alerts — the centre tab. Everything that pulls a team member into the app:
 * a new student assigned, a document uploaded for review, an SLA warning.
 * Opening this screen marks the list read, matching the portal's behaviour.
 */

const iconFor = (n: Notification): React.ElementType => {
  const t = `${n.title} ${n.message}`.toLowerCase();
  if (t.includes('assigned')) return UserPlus;
  if (t.includes('document')) return FileText;
  if (t.includes('deadline') || t.includes('sla') || t.includes('overdue')) return ShieldAlert;
  if (t.includes('message') || t.includes('chat')) return MessageSquare;
  return Megaphone;
};

const ago = (iso: string): string => {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return '';
  const m = Math.round(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d}d ago`;
};

const TeamAlerts: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const notifications = useAppStore(s => s.notifications);
  const markNotificationsRead = useAppStore(s => s.markNotificationsRead);

  const mine = useMemo(() => notifications
    .filter(n => n.userId === user?.id)
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 40), [notifications, user?.id]);

  const unreadIds = useMemo(() => mine.filter(n => !n.read).map(n => n.id), [mine]);

  // Mark read once, on open — the ids are captured before the store updates.
  useEffect(() => {
    if (unreadIds.length > 0) markNotificationsRead(unreadIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wasUnread = useMemo(() => new Set(unreadIds), []);

  return (
    <TeamLayout>
      <div style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}>
        <p className="text-[11px] tracking-[2px] uppercase font-semibold" style={{ color: GOLD }}>Alerts</p>
        <h1 className="v3-serif text-[28px] font-black leading-tight" style={{ color: '#fff' }}>
          What needs you
        </h1>
      </div>

      <SectionLabel right={mine.length ? `${mine.length}` : undefined}>Recent</SectionLabel>

      {mine.length === 0 ? (
        <Empty icon={BellOff} title="Nothing yet" sub="Assignments and document uploads will appear here." />
      ) : (
        mine.map(n => {
          const Icon = iconFor(n);
          const fresh = wasUnread.has(n.id);
          return (
            <Row
              key={n.id}
              tone={fresh ? 'gold' : 'plain'}
              onClick={() => navigate(n.link && n.link.startsWith('/app') ? n.link : '/app/desk')}
            >
              <div className="flex items-start gap-3">
                <Square tone={fresh ? 'gold' : 'plain'}><Icon className="w-5 h-5" /></Square>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold leading-snug" style={{ color: '#fff' }}>{n.title}</p>
                  {n.message && (
                    <p className="text-[12.5px] mt-1 leading-snug" style={{ color: dim(0.6) }}>{n.message}</p>
                  )}
                  <p className="text-[11px] mt-1.5 font-semibold" style={{ color: dim(0.4) }}>{ago(n.time)}</p>
                </div>
                {fresh && <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: GOLD }} />}
              </div>
            </Row>
          );
        })
      )}
    </TeamLayout>
  );
};

export default TeamAlerts;
