"use client";

import React, { useMemo, useState } from "react";

export interface SignupChartPoint {
  date?: string;
  label: string;
  count: number;
}

export function PlatformSignupAreaChart({
  points,
}: {
  points: SignupChartPoint[];
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 680;
  const height = 210;
  const padLeft = 36;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 30;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const { maxVal, yTicks, coords, linePath, areaPath, xLabelIndices } = useMemo(() => {
    const safePts = points.length > 0 ? points : [{ label: "Today", count: 0 }];
    const rawMax = Math.max(4, ...safePts.map((p) => p.count));
    const step = rawMax <= 8 ? 2 : Math.ceil(rawMax / 4 / 2) * 2;
    const computedMax = Math.max(4, step * 4);
    const ticks = [0, step, step * 2, step * 3, computedMax];

    const pts = safePts.map((p, idx) => {
      const x =
        safePts.length === 1
          ? padLeft + plotW / 2
          : padLeft + (idx / (safePts.length - 1)) * plotW;
      const y = padTop + plotH - (p.count / computedMax) * plotH;
      return { x, y, ...p };
    });

    let d = "";
    pts.forEach((pt, idx) => {
      if (idx === 0) {
        d = `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      } else {
        const prev = pts[idx - 1]!;
        const cx = ((prev.x + pt.x) / 2).toFixed(1);
        d += ` C ${cx} ${prev.y.toFixed(1)}, ${cx} ${pt.y.toFixed(1)}, ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      }
    });

    const firstX = pts[0]!.x.toFixed(1);
    const lastX = pts[pts.length - 1]!.x.toFixed(1);
    const baseLineY = (padTop + plotH).toFixed(1);
    const area = `${d} L ${lastX} ${baseLineY} L ${firstX} ${baseLineY} Z`;

    const stride = safePts.length <= 7 ? 1 : safePts.length <= 15 ? 2 : Math.ceil(safePts.length / 8);
    const indices = new Set<number>();
    for (let i = 0; i < safePts.length; i += stride) indices.add(i);
    indices.add(safePts.length - 1);

    return {
      maxVal: computedMax,
      yTicks: ticks,
      coords: pts,
      linePath: d,
      areaPath: area,
      xLabelIndices: indices,
    };
  }, [points, plotH, plotW]);

  void maxVal;

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-52 overflow-visible"
        role="img"
        aria-label="New school signups trend chart"
      >
        <defs>
          <linearGradient id="snxAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal & vertical gridlines */}
        {yTicks.map((tick, idx) => {
          const y = padTop + plotH - (tick / yTicks[yTicks.length - 1]!) * plotH;
          return (
            <g key={tick + "-" + idx}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-[#E7E9F7] dark:text-[#232746]"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                className="fill-[#76799C] dark:fill-[#9DA6CC] text-[10px] font-semibold"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {coords.map((pt, idx) =>
          xLabelIndices.has(idx) ? (
            <line
              key={`v-${idx}`}
              x1={pt.x}
              x2={pt.x}
              y1={padTop}
              y2={padTop + plotH}
              stroke="currentColor"
              className="text-[#F0F1FA] dark:text-[#1B1F3F]"
              strokeWidth="1"
            />
          ) : null,
        )}

        {/* Area & Line */}
        <path d={areaPath} fill="url(#snxAreaGrad)" />
        <path
          d={linePath}
          fill="none"
          stroke="#663CF6"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Data points & X-axis labels */}
        {coords.map((pt, idx) => {
          const isHovered = hoverIdx === idx;
          return (
            <g key={`p-${idx}`}>
              {xLabelIndices.has(idx) && (
                <text
                  x={pt.x}
                  y={height - 6}
                  textAnchor="middle"
                  className="fill-[#76799C] dark:fill-[#9DA6CC] text-[10px] font-semibold"
                >
                  {pt.label}
                </text>
              )}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 5.5 : coords.length <= 16 ? 3.5 : 2.5}
                className={
                  isHovered
                    ? "fill-white stroke-[#663CF6] dark:fill-[#141731] dark:stroke-[#A78BFA]"
                    : "fill-[#663CF6] stroke-white dark:fill-[#A78BFA] dark:stroke-[#141731]"
                }
                strokeWidth={isHovered ? 2.5 : 1.5}
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r={12}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
              />
            </g>
          );
        })}
      </svg>

      {hoverIdx !== null && coords[hoverIdx] && (
        <div
          style={{
            left: `${Math.min(82, Math.max(8, (coords[hoverIdx]!.x / width) * 100))}%`,
          }}
          className="pointer-events-none absolute top-1 -translate-x-1/2 rounded-xl border border-[#D6DBF0] bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#08093B] shadow-md dark:border-[#343B6B] dark:bg-[#1B1F3F] dark:text-[#F3F5FF]"
        >
          <span>{coords[hoverIdx]!.label}: </span>
          <span className="text-[#663CF6] dark:text-[#C4B5FD]">
            {coords[hoverIdx]!.count} {coords[hoverIdx]!.count === 1 ? "school" : "schools"}
          </span>
        </div>
      )}
    </div>
  );
}

export interface DonutSegment {
  key: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export function PlatformDonutChart({
  centerValue,
  centerLabel,
  segments,
}: {
  centerValue: number | string;
  centerLabel: string;
  segments: DonutSegment[];
}) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  const size = 128;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeFraction = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative h-32 w-32 shrink-0 flex items-center justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-32 w-32 -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-[#F0F2FA] dark:text-[#1F2447]"
          />
          {total > 0 &&
            segments
              .filter((s) => s.count > 0)
              .map((seg) => {
                const fraction = seg.count / total;
                const dash = fraction * circumference;
                const offset = -cumulativeFraction * circumference;
                cumulativeFraction += fraction;
                return (
                  <circle
                    key={seg.key}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={offset}
                  />
                );
              })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-xl font-black tracking-tight text-[#08093B] dark:text-[#F3F5FF]">
            {centerValue}
          </span>
          <span className="text-[11px] font-bold text-[#76799C] dark:text-[#9DA6CC]">
            {centerLabel}
          </span>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2.5">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2 min-w-0 font-bold text-[#1B1D45] dark:text-[#DCE1F9]">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="truncate">{seg.label}</span>
            </span>
            <span className="font-extrabold text-[#08093B] whitespace-nowrap dark:text-[#F3F5FF]">
              {seg.count}{" "}
              <span className="font-semibold text-[#76799C] dark:text-[#9DA6CC]">
                ({seg.percentage}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
