// SVG icon components matching the sports-editorial design
import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
}

export const IconGlobe: React.FC<IconProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6" />
    <ellipse cx="12" cy="12" rx="4" ry="9" stroke={color} strokeWidth="1.6" />
    <path d="M3 12h18" stroke={color} strokeWidth="1.6" />
  </svg>
);

export const IconClock: React.FC<IconProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6" />
    <path d="M12 7v5l3 2" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const IconShield: React.FC<IconProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"
          stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

export const IconMissing: React.FC<IconProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="8" cy="8" r="3" stroke={color} strokeWidth="1.6" />
    <path d="M3 19c0-3 2-5 5-5s5 2 5 5" stroke={color} strokeWidth="1.6" />
    <path d="M16 7h5M16 11h5M16 15h5" stroke={color} strokeWidth="1.6" strokeDasharray="2 2" />
  </svg>
);

export const IconPlayer: React.FC<IconProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="7" r="3.2" stroke={color} strokeWidth="1.6" />
    <path d="M5 21c0-4 3-7 7-7s7 3 7 7" stroke={color} strokeWidth="1.6" />
  </svg>
);

export const IconArrow: React.FC<IconProps> = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconBolt: React.FC<IconProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill="none"/>
  </svg>
);

export const IconTarget: React.FC<IconProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.6"/>
    <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.6"/>
    <circle cx="12" cy="12" r="1.5" fill={color}/>
  </svg>
);

export const IconCheck: React.FC<IconProps> = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 12l5 5 11-12" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const IconCross: React.FC<IconProps> = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 5l14 14M19 5L5 19" stroke={color} strokeWidth="2.4" strokeLinecap="round"/>
  </svg>
);

export const IconTrophy: React.FC<IconProps> = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M7 4h10v5a5 5 0 11-10 0V4z" stroke={color} strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M7 6H3v2a3 3 0 003 3M17 6h4v2a3 3 0 01-3 3" stroke={color} strokeWidth="1.6"/>
    <path d="M9 19h6M12 14v5" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

export const IconBasketball: React.FC<IconProps> = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.6" />
    <path d="M2 12h20M12 2v20M4.9 5a14 14 0 010 14M19.1 5a14 14 0 000 14"
          stroke={color} strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// Map category IDs to icon components
export const CATEGORY_ICONS: Record<string, React.FC<IconProps>> = {
  'geography': IconGlobe,
  'history': IconClock,
  'logo': IconShield,
  'guess-whos-missing': IconMissing,
  'guess-the-player': IconPlayer,
};

// Decorative court arc SVG
export const CourtArc: React.FC<{ stroke?: string; opacity?: number; style?: React.CSSProperties }> = ({
  stroke = '#111',
  opacity = 0.08,
  style,
}) => (
  <svg viewBox="0 0 400 400" style={style}>
    <circle cx="200" cy="200" r="180" stroke={stroke} strokeWidth="1.2" fill="none" opacity={opacity}/>
    <circle cx="200" cy="200" r="120" stroke={stroke} strokeWidth="1.2" fill="none" opacity={opacity}/>
    <circle cx="200" cy="200" r="60"  stroke={stroke} strokeWidth="1.2" fill="none" opacity={opacity}/>
    <line x1="0" y1="200" x2="400" y2="200" stroke={stroke} strokeWidth="1.2" opacity={opacity * 0.6}/>
  </svg>
);

// Wordmark logo
export const Wordmark: React.FC<{ light?: boolean }> = ({ light = false }) => (
  <div className="ht-wordmark" style={light ? { color: '#fff' } : undefined}>
    <span className="dot" />
    <span>Hoops Trivia</span>
  </div>
);
