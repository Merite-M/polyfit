"use client";

import React, { useState } from "react";
import { TrendingUp, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MonthDataPoint {
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

export function EngagementTrendChart({
  data = [],
  className,
}: EngagementTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className={cn("p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col justify-between", className)}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Engagement & Adoption Trends
            </h3>
            <p className="text-xs text-muted-foreground">
              Track member registration adoption vs active monthly provider visits
            </p>
          </div>
        </div>
        <div className="py-12 text-center text-xs text-muted-foreground">
          <Activity className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="font-semibold text-foreground">No verified engagement trends recorded yet</p>
          <p className="text-[11px] mt-0.5 text-muted-foreground">
            Monthly registration and check-in trends will populate as employees activate benefits.
          </p>
        </div>
      </div>
    );
  }

  // SVG coordinate calculations
  const width = 600;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Max value calculation for scale (using 100% or absolute counts)
  const maxEligible = Math.max(...data.map((d) => d.eligible), 10);

  // Coordinate mapping function
  const getCoordinates = (value: number, index: number) => {
    const divisor = data.length > 1 ? data.length - 1 : 1;
    const x = paddingX + (index / divisor) * chartWidth;
    const y = height - paddingY - (maxEligible > 0 ? (value / maxEligible) * chartHeight : 0);
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
  const memberAreaPath = memberPoints.length > 0
    ? `${memberPath} L ${memberPoints[memberPoints.length - 1].x} ${height - paddingY} L ${memberPoints[0].x} ${height - paddingY} Z`
    : "";
  const activeAreaPath = activePoints.length > 0
    ? `${activePath} L ${activePoints[activePoints.length - 1].x} ${height - paddingY} L ${activePoints[0].x} ${height - paddingY} Z`
    : "";

  const activePoint = hoveredIndex !== null ? data[hoveredIndex] : data[data.length - 1];

  return (
    <div className={cn("p-5 rounded-2xl bg-card border border-border shadow-xs", className)}>
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground">
              Engagement & Adoption Trends
            </h3>
            <span className="text-xs font-semibold text-accent bg-accent-subtle px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Track member registration adoption vs active monthly provider visits
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full bg-secondary" />
            <span className="text-muted-foreground">Registered Members</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-accent" />
            <span className="text-foreground font-semibold">Active Beneficiaries</span>
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
                  stroke="var(--color-border, #E2E8F0)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-muted-foreground font-mono"
                >
                  {labelValue}
                </text>
              </g>
            );
          })}

          {/* Shaded Areas */}
          {memberAreaPath && <path d={memberAreaPath} fill="url(#member-area)" />}
          {activeAreaPath && <path d={activeAreaPath} fill="url(#active-area)" />}

          {/* Path Lines */}
          {memberPath && (
            <path
              d={memberPath}
              fill="none"
              stroke="#00D2B4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {activePath && (
            <path
              d={activePath}
              fill="none"
              stroke="#28D17C"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

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
                    stroke="var(--color-foreground, #0B1F33)"
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
                    isHovered ? "fill-foreground font-bold" : "fill-muted-foreground"
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
          <div className="absolute top-2 right-2 bg-card text-card-foreground p-2.5 rounded-xl shadow-lg border border-border text-xs pointer-events-none transition-all">
            <div className="font-bold text-accent mb-1">
              {activePoint.month} Snapshot
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <span className="text-muted-foreground">Active Users:</span>
              <span className="font-semibold text-right text-foreground">
                {activePoint.active}{" "}
                <span className="text-accent">
                  ({activePoint.eligible > 0 ? Math.round((activePoint.active / activePoint.eligible) * 100) : 0}%)
                </span>
              </span>
              <span className="text-muted-foreground">Registered:</span>
              <span className="font-semibold text-right text-secondary">
                {activePoint.members}{" "}
                <span className="text-muted-foreground">
                  ({activePoint.eligible > 0 ? Math.round((activePoint.members / activePoint.eligible) * 100) : 0}%)
                </span>
              </span>
              <span className="text-muted-foreground">Verified Visits:</span>
              <span className="font-semibold text-right text-foreground">
                {activePoint.visits}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
