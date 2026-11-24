import React from "react";

interface CampusIllustrationProps {
  schoolName: string;
  className?: string;
}

export function SchoolCampusIllustration({ schoolName, className = "" }: CampusIllustrationProps) {
  const displayName = schoolName.toUpperCase();

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-[20px] border border-[#CAD0EB]/70 bg-gradient-to-b from-[#F0F5FE] via-[#E6F0FA] to-[#DFEDF9] p-3 shadow-xs ${className}`}
    >
      {/* Background Soft Sky & Clouds */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/80 via-transparent to-transparent pointer-events-none" />

      <svg
        viewBox="0 0 540 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-h-[170px] drop-shadow-sm select-none"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="roofGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#172554" />
          </linearGradient>
          <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>
          <linearGradient id="lawnGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#86EFAC" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
          <linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#BAE6FD" />
            <stop offset="100%" stopColor="#7DD3FC" />
          </linearGradient>
        </defs>

        {/* Clouds */}
        <path
          d="M40 45 C45 35, 65 35, 75 45 C85 45, 95 55, 90 65 C85 70, 45 70, 40 65 Z"
          fill="#FFFFFF"
          opacity="0.85"
        />
        <path
          d="M450 35 C455 27, 470 27, 480 35 C490 35, 498 42, 495 50 C490 55, 455 55, 450 50 Z"
          fill="#FFFFFF"
          opacity="0.8"
        />

        {/* Lush Green Lawn / Ground */}
        <rect x="0" y="170" width="540" height="30" fill="url(#lawnGrad)" rx="6" />
        <ellipse cx="270" cy="180" rx="260" ry="16" fill="#15803D" opacity="0.3" />

        {/* Paved Walkway Pathway */}
        <path d="M230 170 L220 200 L320 200 L310 170 Z" fill="#E2E8F0" />
        <path d="M255 170 L250 200 L290 200 L285 170 Z" fill="#CBD5E1" opacity="0.6" />

        {/* Surrounding Trees (Left & Right) */}
        {/* Left Trees */}
        <circle cx="50" cy="145" r="28" fill="#16A34A" />
        <circle cx="75" cy="150" r="22" fill="#22C55E" />
        <circle cx="35" cy="155" r="18" fill="#15803D" />
        <rect x="47" y="155" width="6" height="20" fill="#78350F" rx="2" />
        <rect x="72" y="160" width="5" height="15" fill="#78350F" rx="2" />

        {/* Right Trees */}
        <circle cx="490" cy="145" r="28" fill="#16A34A" />
        <circle cx="465" cy="150" r="22" fill="#22C55E" />
        <circle cx="505" cy="155" r="18" fill="#15803D" />
        <rect x="487" y="155" width="6" height="20" fill="#78350F" rx="2" />
        <rect x="462" y="160" width="5" height="15" fill="#78350F" rx="2" />

        {/* Main Central Building Base */}
        <rect x="110" y="90" width="320" height="82" fill="url(#wallGrad)" rx="4" stroke="#CBD5E1" strokeWidth="2" />

        {/* Left Wing Roof */}
        <path d="M100 90 L180 90 L170 70 L110 70 Z" fill="url(#roofGrad)" />
        {/* Right Wing Roof */}
        <path d="M360 90 L440 90 L430 70 L370 70 Z" fill="url(#roofGrad)" />

        {/* Central Portico / Pediment */}
        <path d="M190 75 L270 30 L350 75 Z" fill="url(#roofGrad)" stroke="#1E293B" strokeWidth="1.5" />

        {/* Inner Pediment Face with School Name Banner */}
        <path d="M205 74 L270 38 L335 74 Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        <rect x="210" y="52" width="120" height="18" fill="#FFFFFF" rx="3" stroke="#CBD5E1" strokeWidth="1" />
        <text
          x="270"
          y="65"
          textAnchor="middle"
          fill="#1E3A8A"
          fontSize="8.5"
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.6"
        >
          {displayName.length > 28 ? displayName.slice(0, 26) + "..." : displayName}
        </text>

        {/* Classical Columns */}
        <rect x="210" y="75" width="10" height="97" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" />
        <rect x="245" y="75" width="10" height="97" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" />
        <rect x="285" y="75" width="10" height="97" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" />
        <rect x="320" y="75" width="10" height="97" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" />

        {/* Classical Capitals & Plinths */}
        <rect x="207" y="73" width="16" height="4" fill="#94A3B8" rx="1" />
        <rect x="242" y="73" width="16" height="4" fill="#94A3B8" rx="1" />
        <rect x="282" y="73" width="16" height="4" fill="#94A3B8" rx="1" />
        <rect x="317" y="73" width="16" height="4" fill="#94A3B8" rx="1" />

        <rect x="207" y="168" width="16" height="4" fill="#94A3B8" rx="1" />
        <rect x="242" y="168" width="16" height="4" fill="#94A3B8" rx="1" />
        <rect x="282" y="168" width="16" height="4" fill="#94A3B8" rx="1" />
        <rect x="317" y="168" width="16" height="4" fill="#94A3B8" rx="1" />

        {/* Central Entrance Double Doors */}
        <rect x="257" y="132" width="26" height="40" fill="#1E293B" rx="3" />
        <rect x="259" y="134" width="10" height="38" fill="#3B82F6" opacity="0.8" rx="1" />
        <rect x="271" y="134" width="10" height="38" fill="#3B82F6" opacity="0.8" rx="1" />
        <circle cx="268" cy="154" r="1.5" fill="#F59E0B" />
        <circle cx="272" cy="154" r="1.5" fill="#F59E0B" />

        {/* Left Wing Windows (Two Floors) */}
        {/* Upper Floor */}
        <rect x="125" y="100" width="14" height="20" fill="url(#glassGrad)" rx="2" stroke="#94A3B8" strokeWidth="1" />
        <rect x="145" y="100" width="14" height="20" fill="url(#glassGrad)" rx="2" stroke="#94A3B8" strokeWidth="1" />
        <rect x="165" y="100" width="14" height="20" fill="url(#glassGrad)" rx="2" stroke="#94A3B8" strokeWidth="1" />
        {/* Lower Floor */}
        <rect x="125" y="132" width="14" height="22" fill="url(#glassGrad)" rx="2" stroke="#94A3B8" strokeWidth="1" />
        <rect x="145" y="132" width="14" height="22" fill="url(#glassGrad)" rx="2" stroke="#94A3B8" strokeWidth="1" />
        <rect x="165" y="132" width="14" height="22" fill="url(#glassGrad)" rx="2" stroke="#94A3B8" strokeWidth="1" />

        {/* Right Wing Windows (Two Floors) */}
        {/* Upper Floor */}
        <rect x="360" y="100" width="14" height="20" fill="url(#glassGrad)" rx="2" stroke="#94A3B8" strokeWidth="1" />
        <rect x="380" y="100" width="14" height="20" fill="url(#glassGrad)" rx="2" stroke="#94A3B8" strokeWidth="1" />
        <rect x="400" y="100" width="14" height="20" fill="url(#glassGrad)" rx="2" stroke="#94A3B8" strokeWidth="1" />
        {/* Lower Floor */}
        <rect x="360" y="132" width="14" height="22" fill="url(#glassGrad)" rx="2" stroke="#94A3B8" strokeWidth="1" />
        <rect x="380" y="132" width="14" height="22" fill="url(#glassGrad)" rx="2" stroke="#94A3B8" strokeWidth="1" />
        <rect x="400" y="132" width="14" height="22" fill="url(#glassGrad)" rx="2" stroke="#94A3B8" strokeWidth="1" />

        {/* Clock Tower / Bell on Top of Portico */}
        <circle cx="270" cy="20" r="10" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />
        {/* Clock Hands */}
        <line x1="270" y1="20" x2="270" y2="14" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="270" y1="20" x2="275" y2="20" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
        {/* Flag Pole on top */}
        <line x1="270" y1="10" x2="270" y2="2" stroke="#475569" strokeWidth="1.5" />
        <path d="M270 2 L284 6 L270 10 Z" fill="#EF4444" />
      </svg>
    </div>
  );
}
