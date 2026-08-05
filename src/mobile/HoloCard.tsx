import React from 'react';
import { useTilt } from './useTilt';
import { goldA } from './ui';

/**
 * A card that behaves like a physical one: it turns toward you, iridescent
 * foil travels across it, and a specular highlight tracks the tilt. The
 * member card is the object every student carries, so in the app it is an
 * object rather than a panel.
 */

const HoloCard: React.FC<{
  children: React.ReactNode;
  /** Dim, unlit variant — used before a card belongs to anyone. */
  inactive?: boolean;
  radius?: number;
  /** Credit-card proportions by default; pass null to size to the content. */
  aspect?: string | null;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}> = ({ children, inactive = false, radius = 22, aspect = '1.62 / 1', className, onClick, style }) => {
  const { tilt, bind } = useTilt(14);
  const { rx, ry } = tilt;
  const lit = Math.min(0.72, 0.34 + (Math.abs(rx) + Math.abs(ry)) / 26);

  return (
    <div style={{ perspective: 900 }} className={className}>
      <div
        {...bind}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        style={{
          position: 'relative',
          ...(aspect ? { aspectRatio: aspect } : null),
          borderRadius: radius,
          overflow: 'hidden',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          transform: `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`,
          transition: 'transform .12s cubic-bezier(.2,.7,.3,1)',
          background: inactive
            ? 'linear-gradient(145deg,#101B2C 0%,#0A1628 50%,#0E1D33 100%)'
            : 'linear-gradient(145deg,#12233F 0%,#0A1628 46%,#132B4C 100%)',
          boxShadow: `0 26px 44px rgba(0,0,0,.55), inset 0 2px 0 rgba(255,255,255,.06),
            0 0 0 1px ${goldA(inactive ? 0.12 : 0.26)}`,
          cursor: onClick ? 'pointer' : undefined,
          ...style,
        }}
      >
        {/* iridescent foil — travels with the tilt */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            mixBlendMode: 'color-dodge',
            opacity: inactive ? 0.14 : 0.5,
            background: `linear-gradient(115deg, transparent 18%, rgba(255,120,200,.42) 30%,
              rgba(120,220,255,.42) 40%, rgba(180,255,170,.36) 50%,
              rgba(255,220,120,.44) 60%, transparent 74%)`,
            backgroundSize: '260% 260%',
            backgroundPosition: `${(50 + ry * 3.4).toFixed(1)}% ${(50 - rx * 3.4).toFixed(1)}%`,
          }}
        />
        {/* fine holographic ruling */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            opacity: inactive ? 0.06 : 0.16, mixBlendMode: 'overlay',
            background: `repeating-linear-gradient(103deg, rgba(255,255,255,.6) 0px,
              rgba(255,255,255,0) 3px, rgba(255,255,255,.5) 6px)`,
          }}
        />
        {/* specular highlight */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: '-40%', pointerEvents: 'none',
            opacity: inactive ? lit * 0.35 : lit,
            transform: `translate(${(ry * 1.5).toFixed(1)}%, ${(-rx * 1.5).toFixed(1)}%)`,
            background: 'radial-gradient(closest-side, rgba(255,255,255,.55), rgba(255,255,255,0) 70%)',
          }}
        />
        <div style={aspect
          ? { position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }
          : { position: 'relative', transformStyle: 'preserve-3d' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default HoloCard;
