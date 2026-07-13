import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

/**
 * Voice notes for the advisor chat: a MediaRecorder hook (records
 * webm/opus on Android & desktop, mp4/aac on iOS) and a WhatsApp-style
 * bubble player with a decorative waveform. Shared by the mobile app and
 * the staff web Messages page.
 */

const REC_MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
export const MAX_VOICE_SECONDS = 120;

export const canRecordVoice = (): boolean =>
  typeof window !== 'undefined'
  && typeof MediaRecorder !== 'undefined'
  && Boolean(navigator.mediaDevices?.getUserMedia);

export interface VoiceRecording { file: File; seconds: number }

export const useVoiceRecorder = () => {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const resolveRef = useRef<((r: VoiceRecording | null) => void) | null>(null);
  const discardRef = useRef(false);

  const cleanup = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    recorderRef.current?.stream.getTracks().forEach(t => t.stop());
    recorderRef.current = null;
    setRecording(false);
    setSeconds(0);
  };

  const start = async (): Promise<boolean> => {
    if (recording || !canRecordVoice()) return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = REC_MIME_CANDIDATES.find(m => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      discardRef.current = false;
      rec.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const elapsed = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        const resolve = resolveRef.current;
        resolveRef.current = null;
        if (discardRef.current || !chunksRef.current.length) { cleanup(); resolve?.(null); return; }
        const type = rec.mimeType || 'audio/webm';
        const ext = type.includes('mp4') ? 'm4a' : 'webm';
        const blob = new Blob(chunksRef.current, { type });
        cleanup();
        resolve?.({ file: new File([blob], `voice-${Date.now()}.${ext}`, { type }), seconds: Math.min(elapsed, MAX_VOICE_SECONDS) });
      };
      recorderRef.current = rec;
      startedAtRef.current = Date.now();
      rec.start(250);
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        const s = Math.round((Date.now() - startedAtRef.current) / 1000);
        setSeconds(s);
        if (s >= MAX_VOICE_SECONDS) recorderRef.current?.stop();
      }, 500);
      return true;
    } catch {
      cleanup();
      return false;
    }
  };

  /** Stops and resolves with the finished recording (null if cancelled). */
  const stop = (): Promise<VoiceRecording | null> =>
    new Promise(resolve => {
      if (!recorderRef.current || recorderRef.current.state === 'inactive') { resolve(null); return; }
      resolveRef.current = resolve;
      recorderRef.current.stop();
    });

  const cancel = () => {
    discardRef.current = true;
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    else cleanup();
  };

  useEffect(() => () => { discardRef.current = true; recorderRef.current?.stop(); cleanup(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { recording, seconds, start, stop, cancel };
};

export const fmtSec = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// Deterministic decorative waveform bars from the audio URL.
const waveHeights = (seed: string, bars: number): number[] => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  const out: number[] = [];
  for (let i = 0; i < bars; i += 1) {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    out.push(0.28 + (Math.abs(h) % 1000) / 1000 * 0.72);
  }
  return out;
};

/** Chat-bubble audio player. Colors adapt via `accent` (bars/button) + `faint`. */
export const AudioBubble: React.FC<{
  url: string;
  sec?: number;
  accent: string;
  faint: string;
  /** Icon color inside the play button (defaults to white). */
  buttonFg?: string;
}> = ({ url, sec, accent, faint, buttonFg = '#fff' }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [dur, setDur] = useState(sec ?? 0);
  const bars = React.useMemo(() => waveHeights(url, 24), [url]);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const toggle = () => {
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio(url);
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => { if (Number.isFinite(audio!.duration) && audio!.duration > 0) setDur(audio!.duration); };
      audio.ontimeupdate = () => {
        const d = Number.isFinite(audio!.duration) && audio!.duration > 0 ? audio!.duration : (sec || 1);
        setProgress(Math.min(1, audio!.currentTime / d));
      };
      audio.onended = () => { setPlaying(false); setProgress(0); };
      audio.onpause = () => setPlaying(false);
      audio.onplay = () => setPlaying(true);
      audioRef.current = audio;
    }
    if (audio.paused) void audio.play().catch(() => {});
    else audio.pause();
  };

  const played = Math.round(progress * bars.length);

  return (
    <div className="flex items-center gap-2.5" style={{ minWidth: 190 }}>
      <button
        onClick={toggle}
        aria-label={playing ? 'Pause voice note' : 'Play voice note'}
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ background: accent, color: buttonFg }}
      >
        {playing ? <Pause className="w-4 h-4" fill="currentColor" /> : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />}
      </button>
      <div className="flex items-center gap-[2px] flex-1" style={{ height: 30 }}>
        {bars.map((b, i) => (
          <span key={i} className="rounded-full" style={{
            width: 3,
            height: `${Math.round(b * 100)}%`,
            background: i < played ? accent : faint,
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      <span className="text-[11px] font-bold tabular-nums shrink-0" style={{ opacity: 0.75 }}>
        {fmtSec(playing || progress > 0 ? Math.round(progress * (dur || sec || 0)) : (dur || sec || 0))}
      </span>
    </div>
  );
};
