import React, { useEffect, useState } from 'react';
import { Lock, Delete } from 'lucide-react';
import { GOLD, NAVY, dim, goldA } from './ui';
import { tap, thud } from '../lib/native';

/**
 * App Lock — a 4-digit PIN gate over the student app. The PIN is stored as a
 * SHA-256 hash per user on the device; unlocking lasts for the session (the
 * app re-locks when it is fully restarted). Biometric unlock can be layered
 * on later; the PIN is the universal fallback.
 */

const pinKey = (userId: string) => `tw_applock_pin_${userId}`;
const sessionKey = (userId: string) => `tw_applock_ok_${userId}`;

const sha256Hex = async (text: string): Promise<string> => {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
};

export const isAppLockEnabled = (userId?: string): boolean =>
  Boolean(userId && localStorage.getItem(pinKey(userId)));

export const setAppLockPin = async (userId: string, pin: string): Promise<void> => {
  localStorage.setItem(pinKey(userId), await sha256Hex(pin));
  sessionStorage.setItem(sessionKey(userId), '1');
};

export const verifyAppLockPin = async (userId: string, pin: string): Promise<boolean> => {
  const stored = localStorage.getItem(pinKey(userId));
  if (!stored) return true;
  return (await sha256Hex(pin)) === stored;
};

export const clearAppLock = (userId: string): void => {
  localStorage.removeItem(pinKey(userId));
  sessionStorage.removeItem(sessionKey(userId));
};

export const isUnlockedThisSession = (userId?: string): boolean =>
  Boolean(userId && sessionStorage.getItem(sessionKey(userId)));

/** Shared PIN pad (used by the gate and by the Profile setup flow). */
export const PinPad: React.FC<{
  value: string;
  onDigit: (d: string) => void;
  onBackspace: () => void;
}> = ({ value, onDigit, onBackspace }) => (
  <>
    <div className="flex items-center justify-center gap-3 my-6">
      {[0, 1, 2, 3].map(i => (
        <span key={i} className="rounded-full transition-all" style={{
          width: 14, height: 14,
          background: i < value.length ? GOLD : 'rgba(255,255,255,0.12)',
          border: `1px solid ${i < value.length ? GOLD : 'rgba(255,255,255,0.2)'}`,
        }} />
      ))}
    </div>
    <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] mx-auto">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => (
        k === '' ? <span key={i} />
          : (
            <button
              key={i}
              onClick={() => { tap(); k === '⌫' ? onBackspace() : onDigit(k); }}
              className="rounded-2xl py-4 text-[22px] font-bold transition-transform active:scale-90 flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {k === '⌫' ? <Delete className="w-5 h-5" style={{ color: dim(0.7) }} /> : k}
            </button>
          )
      ))}
    </div>
  </>
);

/** Fullscreen unlock gate shown when App Lock is enabled and locked. */
export const AppLockGate: React.FC<{ userId: string; userName?: string; onUnlock: () => void }> = ({ userId, userName, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (pin.length !== 4) return;
    void (async () => {
      if (await verifyAppLockPin(userId, pin)) {
        sessionStorage.setItem(sessionKey(userId), '1');
        thud();
        onUnlock();
      } else {
        setShake(true);
        setTimeout(() => { setShake(false); setPin(''); }, 450);
      }
    })();
  }, [pin, userId, onUnlock]);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-8"
      style={{ background: `linear-gradient(180deg, ${NAVY}, #0D1F3C)` }}
    >
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: goldA(0.14), border: `1px solid ${goldA(0.3)}` }}>
        <Lock className="w-7 h-7" style={{ color: GOLD }} />
      </div>
      <p className="v3-serif text-[22px] font-black" style={{ color: '#fff' }}>App locked</p>
      <p className="text-[13px] mt-1" style={{ color: dim(0.55) }}>
        {userName ? `Welcome back, ${userName.split(' ')[0]} — ` : ''}enter your PIN
      </p>
      <div style={{ animation: shake ? 'twshake 0.4s' : undefined }}>
        <PinPad value={pin} onDigit={(d) => setPin(p => (p + d).slice(0, 4))} onBackspace={() => setPin(p => p.slice(0, -1))} />
      </div>
      <style>{`@keyframes twshake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-10px)} 40%,80%{transform:translateX(10px)} }`}</style>
    </div>
  );
};
