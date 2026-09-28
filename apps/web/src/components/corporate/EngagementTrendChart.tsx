"use client";

import React, { useState } from "react";
import { TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthDataPoint {
  month: string;
  eligible: number;
  members: number;
  active: number;
  visits: number;
}

interface EngagementTrendChartProps {
  data?: MonthDataPoint[];
  className?: string;
}

const DEFAULT_TREND_DATA: MonthDataPoint[] = [
  { month: "Apr", eligible: 1150, members: 320, active: 160, visits: 540 },
  { month: "May", eligible: 1180, members: 480, active: 250, visits: 890 },
  { month: "Jun", eligible: 1200, members: 590, active: 310, visits: 1120 },
  { month: "Jul", eligible: 1200, members: 670, active: 360, visits: 1280 },
  { month: "Aug", eligible: 1210, members: 735, active: 384, visits: 1390 },
  { month: "Sep", eligible: 1217, members: 789, active: 412, visits: 1480 },
];

export function EngagementTrendChart({
  data = DEFAULT_TREND_DATA,
  className,
}: EngagementTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG coordinate calculations
  const width = 600;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Max value calculation for scale (using 100% or absolute counts)
  const maxEligible = Math.max(...data.map((d) => d.eligible), 1250);

  // Coordinate mapping function
  const getCoordinates = (value: number, index: number) => {
    const x = paddingX + (index / (data.length - 1)) * chartWidth;
    const y = height - paddingY - (value / maxEligible) * chartHeight;
    return { x, y };
  };

  // Generate SVG path points
  const memberPoints = data.map((d, i) => getCoordinates(d.members, i));
  const activePoints = data.map((d, i) => getCoordinates(d.active, i));

  // Build curved or polyline SVG path strings
  const createPath = (points: { x: number; y: number }[]) => {
    return points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");
  };

  const memberPath = createPath(memberPoints);
  const activePath = createPath(activePoints);

  // Area paths for gradient fills
  const memberAreaPath = `${memberPath} L ${memberPoints[memberPoints.length - 1].x} ${height - paddingY} L ${memberPoints[0].x} ${height - paddingY} Z`;
  const activeAreaPath = `${activePath} L ${activePoints[activePoints.length - 1].x} ${height - paddingY} L ${activePoints[0].x} ${height - paddingY} Z`;

  const activePoint = hoveredIndex !== null ? data[hoveredIndex] : data[data.length - 1];
  const activeCoords = hoveredIndex !== null
    ? getCoordinates(activePoint.active, hoveredIndex)
    : getCoordinates(activePoint.active, data.length - 1);
  const memberCoords = hoveredIndex !== null
    ? getCoordinates(activePoint.members, hoveredIndex)
    : getCoordinates(activePoint.members, data.length - 1);

  return (
    <div className={cn("p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm", className)}>
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#0B1F33]">
              Engagement & Adoption Trends
            </h3>
            <span className="text-xs font-semibold text-[#28D17C] bg-[#E9FAF2] px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +64% Growth
            </span>
          </div>
          <p className="text-xs text-[#526173]">
            Track member registration adoption vs active monthly provider visits
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-[#00D2B4]" />
            <span className="text-[#526173]">Registered Members</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-[#28D17C]" />
            <span className="text-[#0B1F33] font-semibold">Active Beneficiaries</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Surface */}
      <div className="relative w-full aspect-[21/9] sm:aspect-[24/9]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="member-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00D2B4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#00D2B4" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="active-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#28D17C" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#28D17C" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const y = height - paddingY - ratio * chartHeight;
            const labelValue = Math.round(ratio * maxEligible);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#F1F4F8"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-[#8491A3] font-mono"
                >
                  {labelValue}
                </text>
              </g>
            );
          })}

          {/* Shaded Areas */}
          <path d={memberAreaPath} fill="url(#member-area)" />
          <path d={activeAreaPath} fill="url(#active-area)" />

          {/* Path Lines */}
          <path
            d={memberPath}
            fill="none"
            stroke="#00D2B4"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={activePath}
            fill="none"
            stroke="#28D17C"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* X Axis Labels & Interactive Vertical Hover Bars */}
          {data.map((d, i) => {
            const { x } = getCoordinates(0, i);
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={d.month}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Transparent hit area */}
                <rect
                  x={x - 20}
                  y={paddingY}
                  width="40"
                  height={chartHeight}
                  fill="transparent"
                />

                {/* Vertical hover indicator line */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={height - paddingY}
                    stroke="#0B1F33"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.4"
                  />
                )}

                {/* Month label */}
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  className={cn(
                    "text-[10px] font-semibold transition-colors",
                    isHovered ? "fill-[#0B1F33] font-bold" : "fill-[#8491A3]"
                  )}
                >
                  {d.month}
                </text>

                {/* Dots on line */}
                <circle
                  cx={getCoordinates(d.members, i).x}
                  cy={getCoordinates(d.members, i).y}
                  r={isHovered ? 5 : 3.5}
                  fill="#00D2B4"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all"
                />
                <circle
                  cx={getCoordinates(d.active, i).x}
                  cy={getCoordinates(d.active, i).y}
                  r={isHovered ? 6 : 4.5}
                  fill="#28D17C"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  className="transition-all"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activePoint && (
          <div className="absolute top-2 right-2 bg-[#0B1F33] text-white p-2.5 rounded-xl shadow-lg border border-[#21405A] text-xs pointer-events-none transition-all">
            <div className="font-bold text-[#28D17C] mb-1">
              {activePoint.month} 2026 Snapshot
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <span className="text-[#8491A3]">Active Users:</span>
              <span className="font-semibold text-right text-white">
                {activePoint.active}{" "}
                <span className="text-[#28D17C]">
                  ({Math.round((activePoint.active / activePoint.eligible) * 100)}%)
                </span>
              </span>
              <span className="text-[#8491A3]">Registered:</span>
              <span className="font-semibold text-right text-[#00D2B4]">
                {activePoint.members}{" "}
                <span className="text-[#8491A3]">
                  ({Math.round((activePoint.members / activePoint.eligible) * 100)}%)
                </span>
              </span>
              <span className="text-[#8491A3]">Verified Visits:</span>
              <span className="font-semibold text-right text-white">
                {activePoint.visits}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
