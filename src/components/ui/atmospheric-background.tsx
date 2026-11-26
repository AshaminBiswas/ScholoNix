import React from "react";

export function AtmosphericBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* 1. Base Gradient Canvas (adapts between Royal Violet/Ice Blue Light and Cosmic Midnight Dark) */}
      <div
        className="absolute inset-0 opacity-100 dark:opacity-0 transition-opacity duration-300"
        style={{
          background: "linear-gradient(120deg, #F3E8FE 0%, #E8F1FE 55%, #DDF5FE 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-300"
        style={{
          background: "linear-gradient(125deg, #070917 0%, #0D1027 52%, #0B192E 100%)",
        }}
      />

      {/* 2. Top-Left Soft Lavender & Royal Violet Ambient Aurora Glow */}
      <div className="absolute -top-36 -left-36 h-[680px] w-[680px] rounded-full bg-gradient-to-br from-[#E2D4FF]/80 via-[#EDE7FF]/60 to-transparent blur-[120px] dark:from-[#5B35E5]/25 dark:via-[#4C1D95]/15 dark:to-transparent" />

      {/* 3. Top-Right Soft Ice-Blue Ambient Aurora Glow */}
      <div className="absolute -top-36 right-[-10%] h-[740px] w-[740px] rounded-full bg-gradient-to-bl from-[#D5F2FE]/85 via-[#E6F3FE]/65 to-[#EDE7FF]/40 blur-[130px] dark:from-[#0EA5E9]/20 dark:via-[#1E295E]/25 dark:to-[#3B1F7A]/15" />

      {/* 4. Mid-Left Subtle Lavender Ambient Light */}
      <div className="absolute top-[35%] -left-36 h-[580px] w-[580px] rounded-full bg-gradient-to-r from-[#EDE4FE]/70 to-transparent blur-[120px] dark:from-[#6D28D9]/18 dark:to-transparent" />

      {/* 5. Mid-Right Subtle Ice-Blue Ambient Light */}
      <div className="absolute top-[48%] -right-24 h-[620px] w-[620px] rounded-full bg-gradient-to-l from-[#D8F3FE]/75 to-transparent blur-[130px] dark:from-[#0284C7]/16 dark:to-transparent" />

      {/* 6. Lower Center Purple Ambient Radial Light */}
      <div className="absolute bottom-[-10%] left-[20%] h-[580px] w-[780px] rounded-full bg-gradient-to-t from-[#E6DAFE]/60 via-[#F3EDFE]/40 to-transparent blur-[120px] dark:from-[#4F27E8]/18 dark:via-[#1E1B4B]/20 dark:to-transparent" />

      {/* 7. Layered Landscape Rolling Wave Ribbons */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full max-w-full overflow-hidden opacity-90 drop-shadow-sm dark:opacity-55"
        viewBox="0 0 1440 360"
        fill="none"
        preserveAspectRatio="none"
        style={{ height: "300px" }}
      >
        <defs>
          <linearGradient id="waveCyanDesign" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C9EFFF" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#DCF5FE" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#EAF6FE" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="wavePurpleDesign" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E5DBFE" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#EEE5FE" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#F9F7FE" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="waveWhiteDesign" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#F5F7FD" stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id="waveCyanDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0C3559" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#12274B" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0D152E" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="wavePurpleDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2A1B5E" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#1B1842" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0F122B" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="waveSurfaceDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#111530" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#090B1A" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Light Mode Waves */}
        <g className="dark:hidden">
          <path
            d="M0 160C200 110 380 200 560 165C740 130 920 70 1100 110C1280 150 1360 130 1440 120V360H0V160Z"
            fill="url(#waveCyanDesign)"
          />
          <path
            d="M0 215C180 160 340 250 510 200C680 150 860 190 1020 170C1200 150 1340 220 1440 190V360H0V215Z"
            fill="url(#wavePurpleDesign)"
          />
          <path
            d="M0 275C240 225 460 310 690 260C920 210 1140 280 1440 245V360H0V275Z"
            fill="url(#waveWhiteDesign)"
          />
        </g>

        {/* Dark Mode Waves */}
        <g className="hidden dark:inline">
          <path
            d="M0 160C200 110 380 200 560 165C740 130 920 70 1100 110C1280 150 1360 130 1440 120V360H0V160Z"
            fill="url(#waveCyanDark)"
          />
          <path
            d="M0 215C180 160 340 250 510 200C680 150 860 190 1020 170C1200 150 1340 220 1440 190V360H0V215Z"
            fill="url(#wavePurpleDark)"
          />
          <path
            d="M0 275C240 225 460 310 690 260C920 210 1140 280 1440 245V360H0V275Z"
            fill="url(#waveSurfaceDark)"
          />
        </g>
      </svg>
    </div>
  );
}
