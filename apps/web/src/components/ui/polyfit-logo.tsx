import React from "react";
import { cn } from "@/lib/utils";

export interface PolyFitLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "full" | "icon" | "constellation" | "wordmark";
  theme?: "light" | "dark" | "auto";
  iconSize?: number;
  showWordmark?: boolean;
  showSubtitle?: boolean;
}

/**
 * Clean 3D Isometric Hexagonal 'P' Logo Mark
 * True 30° axonometric projection with the clean open counter (no internal clutter)
 * Facet mapping:
 * - Top planes: Radiant PolyFit Green (#28D17C)
 * - Front-left outer planes: Dynamic Emerald (#22C55E / #10B981)
 * - Front-right outer planes: Deep Emerald (#00A86B)
 * - Inner drop plane: Midnight Navy (#0B1F33)
 */
export function IsometricHexMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0 transition-transform duration-200 group-hover:scale-105", className)}
      aria-label="PolyFit 3D Isometric Hexagonal Logo"
    >
      <defs>
        <linearGradient id="pf-facet-top" x1="20" y1="12" x2="80" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34E58C" />
          <stop offset="100%" stopColor="#28D17C" />
        </linearGradient>
        <linearGradient id="pf-facet-left" x1="16" y1="28" x2="52" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#28D17C" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="pf-facet-right" x1="48" y1="28" x2="84" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="pf-facet-inner" x1="36" y1="36" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0B1F33" />
          <stop offset="100%" stopColor="#142C44" />
        </linearGradient>
      </defs>

      {/* Outer Hexagon Letter 'P' Top Plane */}
      <path
        d="M50 10L82 28.5L68 36.5L50 26L32 36.5L18 28.5L50 10Z"
        fill="url(#pf-facet-top)"
      />

      {/* Upper Loop Outer Right Facet */}
      <path
        d="M82 28.5V56.5L68 64.5V36.5L82 28.5Z"
        fill="url(#pf-facet-right)"
      />

      {/* Loop Bottom Horizontal Plane */}
      <path
        d="M68 64.5L50 54V46L68 36.5V64.5Z"
        fill="url(#pf-facet-inner)"
      />

      {/* Main Left Vertical Stem (Full height down to base) */}
      <path
        d="M18 28.5V75.5L32 83.5V36.5L18 28.5Z"
        fill="url(#pf-facet-left)"
      />

      {/* Stem Bottom Base & Inner Return */}
      <path
        d="M18 75.5L50 94V86L32 75.5L18 75.5Z"
        fill="url(#pf-facet-left)"
      />

      {/* Lower Stem Face Facing Right */}
      <path
        d="M32 83.5L50 94V66L32 55.5V83.5Z"
        fill="url(#pf-facet-right)"
      />

      {/* Middle Loop Crossbar (connecting to left stem) */}
      <path
        d="M32 55.5L50 66L68 55.5L50 45L32 55.5Z"
        fill="url(#pf-facet-top)"
      />

      {/* Clean Hexagonal Center Counter (Hole of 'P') */}
      {/* Defined inherently by the spatial negative cutout formed by planes at (50, 26), (68, 36.5), (68, 55.5), (50, 45), (32, 36.5) */}
    </svg>
  );
}

/**
 * Constellation Connected Nodes 'P' Mark
 * Digital network motif from "PolyFit Primary Logo" (14 connected vertices)
 */
export function ConstellationNetworkMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0 transition-transform duration-200 group-hover:scale-105", className)}
      aria-label="PolyFit Constellation Network Logo"
    >
      <defs>
        <filter id="pf-node-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Constellation Network Edges */}
      <g stroke="#28D17C" strokeWidth="2" strokeOpacity="0.85" strokeLinecap="round">
        {/* Stem Lines */}
        <line x1="22" y1="22" x2="22" y2="48" />
        <line x1="22" y1="48" x2="22" y2="78" />
        <line x1="22" y1="22" x2="42" y2="35" />
        <line x1="22" y1="48" x2="42" y2="35" />
        <line x1="22" y1="48" x2="38" y2="60" />
        <line x1="22" y1="78" x2="38" y2="70" />
        <line x1="38" y1="60" x2="38" y2="70" />

        {/* Top Loop Outer Lines */}
        <line x1="22" y1="22" x2="58" y2="22" />
        <line x1="58" y1="22" x2="78" y2="35" />
        <line x1="78" y1="35" x2="78" y2="55" />
        <line x1="78" y1="55" x2="58" y2="68" />
        <line x1="58" y1="68" x2="38" y2="60" />

        {/* Diagonal Cross-braces (Network Mesh) */}
        <line x1="42" y1="35" x2="58" y2="22" />
        <line x1="42" y1="35" x2="62" y2="45" />
        <line x1="62" y1="45" x2="78" y2="35" />
        <line x1="62" y1="45" x2="78" y2="55" />
        <line x1="62" y1="45" x2="58" y2="68" />
        <line x1="42" y1="35" x2="58" y2="68" />
        <line x1="22" y1="48" x2="58" y2="68" />
      </g>

      {/* Constellation Nodes (14 Glowing Vertices) */}
      <g fill="#28D17C" filter="url(#pf-node-glow)">
        <circle cx="22" cy="22" r="4.5" />
        <circle cx="22" cy="48" r="4.5" />
        <circle cx="22" cy="78" r="4.5" />
        <circle cx="38" cy="70" r="4" />
        <circle cx="38" cy="60" r="4" />
        <circle cx="42" cy="35" r="4.5" />
        <circle cx="58" cy="22" r="4.5" />
        <circle cx="78" cy="35" r="4.5" />
        <circle cx="78" cy="55" r="4.5" />
        <circle cx="58" cy="68" r="4.5" />
        <circle cx="62" cy="45" r="4.5" />
      </g>
    </svg>
  );
}

/**
 * Master PolyFit Logo Component with theme, sizing, and lockup options
 */
export function PolyFitLogo({
  variant = "full",
  theme = "light",
  iconSize = 36,
  showWordmark = true,
  showSubtitle = false,
  className,
  ...props
}: PolyFitLogoProps) {
  const isDark = theme === "dark";
  const wordmarkTextColor = isDark ? "text-white" : "text-[#0B1F33]";
  const subtitleColor = isDark ? "text-slate-400" : "text-[#526173]";

  return (
    <div
      className={cn("inline-flex items-center gap-3 select-none group", className)}
      {...props}
    >
      {/* Icon Marks */}
      {(variant === "full" || variant === "icon") && (
        <IsometricHexMark size={iconSize} />
      )}

      {variant === "constellation" && (
        <ConstellationNetworkMark size={iconSize} />
      )}

      {/* Typography Lockup */}
      {(variant === "full" || variant === "wordmark") && showWordmark && (
        <div className="flex flex-col justify-center">
          <span
            className={cn(
              "font-bold tracking-tight font-sans flex items-center leading-none",
              wordmarkTextColor
            )}
            style={{ fontSize: `${Math.max(20, Math.round(iconSize * 0.7))}px` }}
          >
            Poly<span className="text-[#28D17C] ml-[1px]">Fit</span>
          </span>

          {showSubtitle && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-[1px] w-3 bg-[#28D17C]/40" />
              <span
                className={cn(
                  "font-semibold tracking-[0.14em] uppercase text-[9px] leading-none",
                  subtitleColor
                )}
              >
                Corporate Wellness Network
              </span>
              <span className="h-[1px] w-3 bg-[#28D17C]/40" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PolyFitLogo;
