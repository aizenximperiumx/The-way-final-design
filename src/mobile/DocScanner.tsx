import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Camera, RefreshCcw, Check, ImageUp } from 'lucide-react';
import { GOLD, NAVY, dim, goldA } from './ui';
import { useI18n } from '../lib/i18n';
import { tap, thud } from '../lib/native';

/**
 * Document scanner — an in-app camera with a document frame overlay.
 * The capture is cropped to the frame and given a gentle "scanned" look
 * (contrast + brightness lift), so passports and certificates come out
 * clean instead of as skewed room photos.
 *
 * Uses getUserMedia (works in the Capacitor WebView with the CAMERA
 * permission and in normal browsers). If the camera can't start, the
 * caller's file picker is offered as the fallback.
 */

// Frame proportions of the visible camera area (portrait document).
const FRAME_W = 0.86; // fraction of container width
const FRAME_AR = 1.35; // height = width * ratio (passport/A4-ish)

const DocScanner: React.FC<{
  title?: string;
  onCapture: (file: File) => void;
  onFallback: () => void;
  onClose: () => void;
}> = ({ title, onCapture, onFallback, onClose }) => {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState(false);
  const [preview, setPreview] = useState<{ url: string; blob: Blob } | null>(null);
  // The frame geometry needs the container's measured size — retick after
  // mount (and on rotation/resize) so the overlay actually renders.
  const [, setMeasureTick] = useState(0);
  useEffect(() => {
    const retick = () => setMeasureTick(t => t + 1);
    retick();
    window.addEventListener('resize', retick);
    return () => window.removeEventListener('resize', retick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1920 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t0 => t0.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t0 => t0.stop());
      streamRef.current = null;
    };
  }, []);

  const frameRect = useCallback(() => {
    const box = boxRef.current;
    if (!box) return null;
    const cw = box.clientWidth;
    const ch = box.clientHeight;
    const fw = cw * FRAME_W;
    const fh = Math.min(fw * FRAME_AR, ch * 0.72);
    return { cw, ch, fx: (cw - fw) / 2, fy: (ch - fh) / 2 - ch * 0.04, fw, fh };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    const rect = frameRect();
    if (!video || !rect || !video.videoWidth) return;
    tap();
    const { cw, ch, fx, fy, fw, fh } = rect;
    // Map the on-screen frame back to source pixels (object-fit: cover).
    const scale = Math.max(cw / video.videoWidth, ch / video.videoHeight);
    const offX = (video.videoWidth * scale - cw) / 2;
    const offY = (video.videoHeight * scale - ch) / 2;
    const sx = (fx + offX) / scale;
    const sy = (fy + offY) / scale;
    const sw = fw / scale;
    const sh = fh / scale;

    const outW = Math.min(1600, Math.round(sw));
    const outH = Math.round(outW * (sh / sw));
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // The "scan" look: lift brightness/contrast, calm the colors.
    ctx.filter = 'grayscale(0.12) contrast(1.22) brightness(1.08) saturate(0.92)';
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, outW, outH);
    canvas.toBlob(blob => {
      if (!blob) return;
      thud();
      setPreview({ url: URL.createObjectURL(blob), blob });
    }, 'image/jpeg', 0.92);
  };

  const usePhoto = () => {
    if (!preview) return;
    const file = new File([preview.blob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
    URL.revokeObjectURL(preview.url);
    onCapture(file);
  };

  const rect = frameRect();

  return (
    <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: NAVY }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: 12 }}>
        <button onClick={() => { tap(); onClose(); }} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <X className="w-5 h-5" style={{ color: '#fff' }} />
        </button>
        <p className="text-[13px] font-bold" style={{ color: '#fff' }}>{title || t('Scan document', 'مسح المستند')}</p>
        <span className="w-10" />
      </div>

      {/* Camera area */}
      <div ref={boxRef} className="relative flex-1 overflow-hidden">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
            <Camera className="w-10 h-10 mb-4" style={{ color: dim(0.35) }} />
            <p className="text-[15px] font-bold" style={{ color: '#fff' }}>{t('Camera unavailable', 'الكاميرا غير متاحة')}</p>
            <p className="text-[13px] mt-1" style={{ color: dim(0.55) }}>
              {t('Allow camera access, or pick the file from your gallery instead.', 'اسمح بالوصول إلى الكاميرا أو اختر الملف من المعرض.')}
            </p>
            <button onClick={() => { tap(); onFallback(); }} className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-full text-[12px] font-black uppercase tracking-wider" style={{ background: GOLD, color: NAVY }}>
              <ImageUp className="w-4 h-4" /> {t('Choose a file', 'اختر ملفاً')}
            </button>
          </div>
        ) : preview ? (
          <img src={preview.url} alt="Scanned document" className="absolute inset-0 w-full h-full object-contain" style={{ background: '#06101f' }} />
        ) : (
          <>
            <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover" />
            {/* Dark mask with a document window */}
            {rect && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${rect.cw} ${rect.ch}`} preserveAspectRatio="none">
                <defs>
                  <mask id="doc-window">
                    <rect width={rect.cw} height={rect.ch} fill="#fff" />
                    <rect x={rect.fx} y={rect.fy} width={rect.fw} height={rect.fh} rx="18" fill="#000" />
                  </mask>
                </defs>
                <rect width={rect.cw} height={rect.ch} fill="rgba(6,14,27,0.72)" mask="url(#doc-window)" />
                <rect x={rect.fx} y={rect.fy} width={rect.fw} height={rect.fh} rx="18" fill="none" stroke={GOLD} strokeWidth="2.5" strokeDasharray="14 10" />
              </svg>
            )}
            <p className="absolute left-0 right-0 text-center text-[12px] font-semibold px-10" style={{ bottom: 24, color: dim(0.75), textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
              {t('Fit the document inside the frame — flat, no shadows', 'ضع المستند داخل الإطار — مستوٍ وبدون ظلال')}
            </p>
          </>
        )}
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-8 px-6" style={{ paddingTop: 18, paddingBottom: 'calc(env(safe-area-inset-bottom) + 26px)' }}>
        {preview ? (
          <>
            <button onClick={() => { tap(); URL.revokeObjectURL(preview.url); setPreview(null); }} className="flex flex-col items-center gap-1.5">
              <span className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <RefreshCcw className="w-5 h-5" style={{ color: '#fff' }} />
              </span>
              <span className="text-[11px] font-bold" style={{ color: dim(0.6) }}>{t('Retake', 'إعادة')}</span>
            </button>
            <button onClick={usePhoto} className="flex flex-col items-center gap-1.5">
              <span className="w-[72px] h-[72px] rounded-full flex items-center justify-center" style={{ background: GOLD, boxShadow: `0 8px 26px ${goldA(0.45)}` }}>
                <Check className="w-7 h-7" style={{ color: NAVY }} />
              </span>
              <span className="text-[11px] font-black uppercase tracking-wide" style={{ color: GOLD }}>{t('Use scan', 'استخدام')}</span>
            </button>
            <span className="w-14" />
          </>
        ) : !error && (
          <>
            <button onClick={() => { tap(); onFallback(); }} className="flex flex-col items-center gap-1.5">
              <span className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <ImageUp className="w-5 h-5" style={{ color: '#fff' }} />
              </span>
              <span className="text-[11px] font-bold" style={{ color: dim(0.6) }}>{t('File', 'ملف')}</span>
            </button>
            <button onClick={capture} aria-label="Capture" className="w-[76px] h-[76px] rounded-full flex items-center justify-center active:scale-95 transition-transform" style={{ background: GOLD, border: `5px solid ${NAVY}`, boxShadow: `0 0 0 3px ${GOLD}, 0 10px 30px ${goldA(0.4)}` }}>
              <Camera className="w-7 h-7" style={{ color: NAVY }} />
            </button>
            <span className="w-12" />
          </>
        )}
      </div>
    </div>
  );
};

export default DocScanner;
