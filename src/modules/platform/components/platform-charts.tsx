"use client";

import React, { useMemo, useState } from "react";

export interface SignupChartPoint {
  date?: string;
  label: string;
  count: number;
}

export interface VerticalBarPoint {
  label: string;
  count: number;
}

export function PlatformVerticalBarChart({
  bars,
}: {
  bars: VerticalBarPoint[];
}) {
  const safeBars = useMemo(
    () => (bars.length > 0 ? bars.slice(0, 7) : [{ label: "No Data", count: 0 }]),
    [bars],
  );
  const maxCount = Math.max(4, ...safeBars.map((b) => b.count));

  return (
    <div className="w-full pt-2">
      <div className="flex h-48 items-end justify-between gap-2.5 sm:gap-4 border-b border-[#E5E8F8] px-1 sm:px-2 pb-2 dark:border-[#232746]">
        {safeBars.map((bar, idx) => {
          const heightPct = maxCount > 0 ? Math.max(bar.count > 0 ? 12 : 4, Math.round((bar.count / maxCount) * 100)) : 4;
          return (
            <div
              key={`${bar.label}-${idx}`}
              className="group flex-1 flex flex-col items-center justify-end h-full min-w-0"
            >
              <span className="mb-1.5 text-[11px] font-extrabold text-[#08093B] dark:text-[#F3F5FF]">
                {bar.count}
              </span>
              <div
                style={{ height: `${heightPct}%` }}
                className="w-full max-w-[42px] rounded-t-[10px] bg-gradient-to-b from-[#9B76FF] via-[#7C3AED] to-[#5B21B6] shadow-[0_6px_14px_rgba(102,60,246,0.22)] transition-all duration-300 group-hover:brightness-110 dark:from-[#A78BFA] dark:via-[#7C3AED] dark:to-[#4F27E8]"
                title={`${bar.label}: ${bar.count}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2.5 sm:gap-4 px-1 sm:px-2">
        {safeBars.map((bar, idx) => (
          <span
            key={`lbl-${bar.label}-${idx}`}
            className="flex-1 text-center text-[10px] sm:text-[11px] font-bold text-[#4D5072] truncate dark:text-[#9DA6CC]"
            title={bar.label}
          >
            {bar.label}
          </span>
        ))}
      </div>
    </div>
  );
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
  const padTop = 22;
  const padBottom = 30;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const { yTicks, coords, linePath, areaPath, xLabelIndices } = useMemo(() => {
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
      yTicks: ticks,
      coords: pts,
      linePath: d,
      areaPath: area,
      xLabelIndices: indices,
    };
  }, [points, plotH, plotW]);

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
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.02" />
          </linearGradient>
        </defs>

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

        <path d={areaPath} fill="url(#snxAreaGrad)" />
        <path
          d={linePath}
          fill="none"
          stroke="#663CF6"
          strokeWidth="2.75"
          strokeLinecap="round"
        />

        {coords.map((pt, idx) => {
          const isHovered = hoverIdx === idx;
          const showLabel = coords.length <= 12 && pt.count > 0;
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
              {showLabel && (
                <text
                  x={pt.x}
                  y={pt.y - 8}
                  textAnchor="middle"
                  className="fill-[#08093B] dark:fill-[#F3F5FF] text-[10px] font-extrabold"
                >
                  {pt.count}
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
  valueLabel?: string;
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
  const size = 136;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeFraction = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative h-34 w-34 shrink-0 flex items-center justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="h-34 w-34 -rotate-90 drop-shadow-xs">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-[#EFF1FC] dark:text-[#1F2447]"
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
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-3">
          <span className="text-lg font-black tracking-tight text-[#08093B] truncate max-w-full dark:text-[#F3F5FF]">
            {centerValue}
          </span>
          <span className="text-[10px] font-bold text-[#76799C] dark:text-[#9DA6CC]">
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
              {seg.valueLabel ?? seg.count}{" "}
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
