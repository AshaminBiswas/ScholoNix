import React from "react";

export function AtmosphericBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* 1. Base Gradient Canvas matching the Royal Violet / Ice Blue / Pearl White palette with enhanced contrast */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(120deg, #F3E8FE 0%, #E8F1FE 55%, #DDF5FE 100%)",
        }}
      />

      {/* 2. Top-Left Soft Lavender & Royal Violet Ambient Aurora Glow (Deeper contrast) */}
      <div className="absolute -top-36 -left-36 h-[680px] w-[680px] rounded-full bg-gradient-to-br from-[#E2D4FF]/80 via-[#EDE7FF]/60 to-transparent blur-[120px]" />

      {/* 3. Top-Right Soft Ice-Blue Ambient Aurora Glow (Crisper contrast) */}
      <div className="absolute -top-36 right-[-10%] h-[740px] w-[740px] rounded-full bg-gradient-to-bl from-[#D5F2FE]/85 via-[#E6F3FE]/65 to-[#EDE7FF]/40 blur-[130px]" />

      {/* 4. Mid-Left Subtle Lavender Ambient Light */}
      <div className="absolute top-[35%] -left-36 h-[580px] w-[580px] rounded-full bg-gradient-to-r from-[#EDE4FE]/70 to-transparent blur-[120px]" />

      {/* 5. Mid-Right Subtle Ice-Blue Ambient Light */}
      <div className="absolute top-[48%] -right-24 h-[620px] w-[620px] rounded-full bg-gradient-to-l from-[#D8F3FE]/75 to-transparent blur-[130px]" />

      {/* 6. Lower Center Purple Ambient Radial Light */}
      <div className="absolute bottom-[-10%] left-[20%] h-[580px] w-[780px] rounded-full bg-gradient-to-t from-[#E6DAFE]/60 via-[#F3EDFE]/40 to-transparent blur-[120px]" />

      {/* 7. Layered Landscape Rolling Wave Ribbons (Flowing Curves with distinct drop shadow) */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full max-w-full overflow-hidden opacity-90 drop-shadow-sm"
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
        </defs>

        {/* Back Wave: Gentle rolling ice-blue curve */}
        <path
          d="M0 160C200 110 380 200 560 165C740 130 920 70 1100 110C1280 150 1360 130 1440 120V360H0V160Z"
          fill="url(#waveCyanDesign)"
        />

        {/* Mid Wave: Flowing lavender curve */}
        <path
          d="M0 215C180 160 340 250 510 200C680 150 860 190 1020 170C1200 150 1340 220 1440 190V360H0V215Z"
          fill="url(#wavePurpleDesign)"
        />

        {/* Front Wave: Pearl white hill */}
        <path
          d="M0 275C240 225 460 310 690 260C920 210 1140 280 1440 245V360H0V275Z"
          fill="url(#waveWhiteDesign)"
        />
      </svg>
    </div>
  );
}
