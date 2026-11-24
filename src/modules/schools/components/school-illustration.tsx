import React from "react";

export function SchoolIllustration() {
  return (
    <div className="relative mx-auto flex w-full max-w-md items-center justify-center overflow-visible">
      <svg
        viewBox="0 0 500 420"
        className="h-auto w-full overflow-visible drop-shadow-xl"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Hill Gradients */}
          <linearGradient id="hillCyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#a5f3fc" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="hillPurple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ede9fe" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="hillFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.6" />
          </linearGradient>

          {/* Roof Gradients */}
          <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="wingRoofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          {/* Wall Gradients */}
          <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>

          {/* Door Gradients */}
          <linearGradient id="doorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>

          {/* Glass Window Gradients */}
          <linearGradient id="windowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          {/* Tree Canopy 3D Gradient */}
          <radialGradient id="treeCanopy" cx="35%" cy="35%" r="65%" fx="30%" fy="30%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="45%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </radialGradient>
          <radialGradient id="treeCanopyAlt" cx="35%" cy="35%" r="65%" fx="30%" fy="30%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="55%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#14532d" />
          </radialGradient>

          {/* Pathway Gradient */}
          <linearGradient id="pathwayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="40%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>

          {/* Ambient Drop Shadow for Building */}
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="10"
              stdDeviation="12"
              floodColor="#4338ca"
              floodOpacity="0.12"
            />
          </filter>
        </defs>

        {/* =========================================================================
            1. BACKGROUND ROLLING HILLS
            ========================================================================= */}
        {/* Far Left Cyan Hill */}
        <path
          d="M-40 280C20 220 120 230 180 250C240 270 300 290 350 280C420 270 480 240 540 260V420H-40V280Z"
          fill="url(#hillCyan)"
        />
        {/* Far Right Soft Violet Hill */}
        <path
          d="M100 300C180 250 260 270 340 260C420 250 480 230 540 250V420H100V300Z"
          fill="url(#hillPurple)"
        />
        {/* Foreground Rolling Wave Hill */}
        <path
          d="M-40 330C60 290 180 320 280 300C380 280 460 310 540 300V420H-40V330Z"
          fill="url(#hillFront)"
        />

        {/* =========================================================================
            2. WINDING S-CURVED ROAD / PATHWAY TO SCHOOL
            ========================================================================= */}
        {/* Path shadow / border underneath */}
        <path
          d="M225 255 C225 285, 275 305, 260 335 C240 375, 140 370, 90 420 H20 C70 365, 175 370, 195 335 C210 310, 175 285, 175 255 Z"
          fill="#cbd5e1"
          opacity="0.3"
        />
        {/* Main winding path */}
        <path
          d="M230 255 C230 280, 270 300, 255 330 C235 370, 135 365, 80 420 H0 C55 360, 170 365, 190 330 C205 305, 170 280, 170 255 Z"
          fill="url(#pathwayGrad)"
          stroke="#e2e8f0"
          strokeWidth="1.5"
        />
        {/* Subtle path center dash reflection */}
        <path
          d="M200 260 C200 280, 230 300, 222 330 C212 360, 135 365, 40 420"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* =========================================================================
            3. TREES & VEGETATION (Surrounding the School)
            ========================================================================= */}
        {/* Left Tree Cluster */}
        <g filter="url(#softShadow)">
          {/* Trunk */}
          <rect x="76" y="240" width="8" height="28" rx="4" fill="#92400e" />
          <ellipse cx="80" cy="225" rx="26" ry="26" fill="url(#treeCanopy)" />
          {/* Smaller overlapping shrub */}
          <rect x="52" y="250" width="6" height="20" rx="3" fill="#78350f" />
          <ellipse cx="55" cy="242" rx="18" ry="18" fill="url(#treeCanopyAlt)" />
        </g>

        {/* Right Tree Cluster */}
        <g filter="url(#softShadow)">
          {/* Trunk */}
          <rect x="336" y="240" width="8" height="28" rx="4" fill="#92400e" />
          <ellipse cx="340" cy="225" rx="26" ry="26" fill="url(#treeCanopy)" />
          {/* Smaller overlapping shrub */}
          <rect x="362" y="250" width="6" height="20" rx="3" fill="#78350f" />
          <ellipse cx="365" cy="242" rx="18" ry="18" fill="url(#treeCanopyAlt)" />
        </g>

        {/* Small foreground bushes along the path */}
        <circle cx="115" cy="335" r="10" fill="#22c55e" opacity="0.9" />
        <circle cx="122" cy="338" r="8" fill="#16a34a" />
        <circle cx="280" cy="315" r="11" fill="#22c55e" opacity="0.9" />
        <circle cx="272" cy="318" r="9" fill="#16a34a" />

        {/* =========================================================================
            4. MAIN SCHOOL BUILDING (With 3D Facade & Shadows)
            ========================================================================= */}
        <g filter="url(#softShadow)">
          {/* Base Foundation Plinth */}
          <rect
            x="105"
            y="250"
            width="210"
            height="8"
            rx="3"
            fill="#94a3b8"
            opacity="0.8"
          />

          {/* Left Wing */}
          <rect
            x="110"
            y="158"
            width="62"
            height="94"
            rx="6"
            fill="url(#wallGrad)"
            stroke="#e2e8f0"
            strokeWidth="1.5"
          />
          {/* Left Wing Roof Cap */}
          <rect x="107" y="150" width="68" height="12" rx="3" fill="url(#wingRoofGrad)" />

          {/* Left Wing Windows (Top Row) */}
          <rect x="120" y="172" width="16" height="22" rx="3" fill="url(#windowGrad)" />
          <line
            x1="128"
            y1="172"
            x2="128"
            y2="194"
            stroke="#ffffff"
            strokeWidth="1"
            opacity="0.7"
          />
          <rect x="146" y="172" width="16" height="22" rx="3" fill="url(#windowGrad)" />
          <line
            x1="154"
            y1="172"
            x2="154"
            y2="194"
            stroke="#ffffff"
            strokeWidth="1"
            opacity="0.7"
          />

          {/* Left Wing Windows (Bottom Row) */}
          <rect x="120" y="208" width="16" height="22" rx="3" fill="url(#windowGrad)" />
          <line
            x1="128"
            y1="208"
            x2="128"
            y2="230"
            stroke="#ffffff"
            strokeWidth="1"
            opacity="0.7"
          />
          <rect x="146" y="208" width="16" height="22" rx="3" fill="url(#windowGrad)" />
          <line
            x1="154"
            y1="208"
            x2="154"
            y2="230"
            stroke="#ffffff"
            strokeWidth="1"
            opacity="0.7"
          />

          {/* Right Wing */}
          <rect
            x="248"
            y="158"
            width="62"
            height="94"
            rx="6"
            fill="url(#wallGrad)"
            stroke="#e2e8f0"
            strokeWidth="1.5"
          />
          {/* Right Wing Roof Cap */}
          <rect x="245" y="150" width="68" height="12" rx="3" fill="url(#wingRoofGrad)" />

          {/* Right Wing Windows (Top Row) */}
          <rect x="258" y="172" width="16" height="22" rx="3" fill="url(#windowGrad)" />
          <line
            x1="266"
            y1="172"
            x2="266"
            y2="194"
            stroke="#ffffff"
            strokeWidth="1"
            opacity="0.7"
          />
          <rect x="284" y="172" width="16" height="22" rx="3" fill="url(#windowGrad)" />
          <line
            x1="292"
            y1="172"
            x2="292"
            y2="194"
            stroke="#ffffff"
            strokeWidth="1"
            opacity="0.7"
          />

          {/* Right Wing Windows (Bottom Row) */}
          <rect x="258" y="208" width="16" height="22" rx="3" fill="url(#windowGrad)" />
          <line
            x1="266"
            y1="208"
            x2="266"
            y2="230"
            stroke="#ffffff"
            strokeWidth="1"
            opacity="0.7"
          />
          <rect x="284" y="208" width="16" height="22" rx="3" fill="url(#windowGrad)" />
          <line
            x1="292"
            y1="208"
            x2="292"
            y2="230"
            stroke="#ffffff"
            strokeWidth="1"
            opacity="0.7"
          />

          {/* Central Main Building Body */}
          <rect
            x="160"
            y="126"
            width="100"
            height="126"
            rx="8"
            fill="#ffffff"
            stroke="#e2e8f0"
            strokeWidth="1.5"
          />

          {/* Triangular Roof Pediment */}
          <polygon
            points="210,80 148,130 272,130"
            fill="url(#roofGrad)"
            stroke="#4338ca"
            strokeWidth="1"
          />

          {/* Flagpole & Flag */}
          <line
            x1="210"
            y1="80"
            x2="210"
            y2="38"
            stroke="#64748b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M210 40 C220 37, 230 46, 242 42 L242 56 C230 60, 220 51, 210 54 Z"
            fill="#0284c7"
          />

          {/* Clock / Academy Seal on Pediment Base */}
          <circle
            cx="210"
            cy="110"
            r="11"
            fill="#ffffff"
            stroke="#6366f1"
            strokeWidth="2"
          />
          <line
            x1="210"
            y1="110"
            x2="210"
            y2="103"
            stroke="#4338ca"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="210"
            y1="110"
            x2="216"
            y2="110"
            stroke="#4338ca"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* "SCHOOL" Header Plaque */}
          <rect
            x="172"
            y="136"
            width="76"
            height="18"
            rx="4"
            fill="#f1f5f9"
            stroke="#cbd5e1"
            strokeWidth="1"
          />
          <text
            x="210"
            y="149"
            textAnchor="middle"
            fontSize="9"
            fontWeight="900"
            fill="#1e293b"
            letterSpacing="2.5"
          >
            SCHOOL
          </text>

          {/* Classical Entrance Columns */}
          <rect x="176" y="166" width="7" height="84" rx="2" fill="#e2e8f0" />
          <rect x="174" y="164" width="11" height="4" rx="1" fill="#cbd5e1" />
          <rect x="174" y="248" width="11" height="4" rx="1" fill="#cbd5e1" />

          <rect x="237" y="166" width="7" height="84" rx="2" fill="#e2e8f0" />
          <rect x="235" y="164" width="11" height="4" rx="1" fill="#cbd5e1" />
          <rect x="235" y="248" width="11" height="4" rx="1" fill="#cbd5e1" />

          {/* Central Double Door */}
          <rect x="188" y="185" width="44" height="66" rx="4" fill="url(#doorGrad)" />
          {/* Door Panels */}
          <rect
            x="192"
            y="190"
            width="16"
            height="26"
            rx="2"
            fill="#1d4ed8"
            opacity="0.8"
          />
          <rect
            x="212"
            y="190"
            width="16"
            height="26"
            rx="2"
            fill="#1d4ed8"
            opacity="0.8"
          />
          <rect
            x="192"
            y="222"
            width="16"
            height="24"
            rx="2"
            fill="#1d4ed8"
            opacity="0.8"
          />
          <rect
            x="212"
            y="222"
            width="16"
            height="24"
            rx="2"
            fill="#1d4ed8"
            opacity="0.8"
          />
          {/* Door Center Line */}
          <line x1="210" y1="185" x2="210" y2="251" stroke="#0f172a" strokeWidth="1.5" />
          {/* Golden Handles */}
          <circle cx="206" cy="218" r="2.5" fill="#facc15" />
          <circle cx="214" cy="218" r="2.5" fill="#facc15" />

          {/* Entrance Steps */}
          <rect x="172" y="251" width="76" height="4" rx="1.5" fill="#cbd5e1" />
          <rect x="166" y="255" width="88" height="4" rx="1.5" fill="#94a3b8" />
        </g>
      </svg>
    </div>
  );
}
