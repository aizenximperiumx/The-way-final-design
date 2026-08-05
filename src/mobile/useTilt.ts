import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Tilt in real space.
 *
 * On a phone the device gyroscope drives it; on anything with a pointer the
 * cursor does. The angles are eased toward their target so the surface has
 * weight rather than snapping. Reduced motion keeps the light response — it
 * drops the easing, not the material, so the surface never looks dead.
 */

export interface Tilt {
  /** Degrees. rx is pitch (front/back), ry is yaw (left/right). */
  rx: number;
  ry: number;
}

const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));

export const useTilt = (maxDeg = 14) => {
  const [tilt, setTilt] = useState<Tilt>({ rx: 0, ry: 0 });
  const target = useRef<Tilt>({ rx: 0, ry: 0 });
  const current = useRef<Tilt>({ rx: 0, ry: 0 });
  const raf = useRef<number | null>(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const step = useCallback(() => {
    const c = current.current, t = target.current;
    c.rx += (t.rx - c.rx) * 0.14;
    c.ry += (t.ry - c.ry) * 0.14;
    setTilt({ rx: c.rx, ry: c.ry });
    if (Math.abs(t.rx - c.rx) > 0.05 || Math.abs(t.ry - c.ry) > 0.05) {
      raf.current = requestAnimationFrame(step);
    } else {
      raf.current = null;
    }
  }, []);

  const aim = useCallback((rx: number, ry: number) => {
    target.current = { rx: clamp(rx, maxDeg), ry: clamp(ry, maxDeg + 2) };
    if (reduced.current) {
      current.current = { ...target.current };
      setTilt(target.current);
      return;
    }
    if (raf.current === null) raf.current = requestAnimationFrame(step);
  }, [maxDeg, step]);

  useEffect(() => () => { if (raf.current !== null) cancelAnimationFrame(raf.current); }, []);

  /** Follow the device. Silent when the platform withholds orientation. */
  useEffect(() => {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent) return;
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      // beta ~45° is a phone held comfortably; treat that as level.
      aim((e.beta - 45) / 2.4, e.gamma / 2.2);
    };
    window.addEventListener('deviceorientation', onOrient);
    return () => window.removeEventListener('deviceorientation', onOrient);
  }, [aim]);

  /** Pointer handlers for the element being tilted. */
  const bind = {
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      aim(-((e.clientY - r.top) / r.height - 0.5) * (maxDeg * 1.9),
          ((e.clientX - r.left) / r.width - 0.5) * (maxDeg * 2.1));
    },
    onPointerLeave: () => aim(0, 0),
  };

  return { tilt, bind, aim };
};

/**
 * iOS withholds orientation until a user gesture grants it. Call from a tap.
 * Resolves false where the permission model does not apply or is refused.
 */
export const requestTiltPermission = async (): Promise<boolean> => {
  const DOE = (typeof window !== 'undefined' ? window.DeviceOrientationEvent : undefined) as
    (typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> }) | undefined;
  if (!DOE || typeof DOE.requestPermission !== 'function') return false;
  try {
    return (await DOE.requestPermission()) === 'granted';
  } catch {
    return false;
  }
};
