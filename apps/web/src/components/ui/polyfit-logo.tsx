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
 * 3D Isometric Hexagonal 'P' Logo Mark
 * Precise 6-Facet Axonometric Projection matching logo Partner.jpg, logo.jpg, and image.png
 *
 * Facet Breakdown:
 * 1. Top Roof Planes: Vibrant Emerald (#34E58C -> #28D17C)
 * 2. Front Left Stem & Loop Planes: Radiant Emerald (#28D17C -> #10B981)
 * 3. Front Right Outer Loop Facet: Medium Emerald (#10B981 -> #059669)
 * 4. Inner Stem Vertical Wall: Deep Teal (#0A5C43 -> #084331) [Dark Block 1]
 * 5. Upper Loop Inner Ceiling & Wall: Midnight Navy (#0B1F33 -> #08131F) [Dark Block 2]
 * 6. Outer Contour: Dark Tech Navy Stroke (#08131F)
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
        {/* Roof Facet Gradient */}
        <linearGradient id="pf-facet-top" x1="20" y1="12" x2="80" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34E58C" />
          <stop offset="100%" stopColor="#28D17C" />
        </linearGradient>

        {/* Front Left Facet Gradient */}
        <linearGradient id="pf-facet-left" x1="16" y1="28" x2="52" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#28D17C" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>

        {/* Outer Right Facet Gradient */}
        <linearGradient id="pf-facet-right" x1="48" y1="28" x2="84" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Dark Teal Inner Stem Shadow Wall [Dark Block 1] */}
        <linearGradient id="pf-facet-teal-wall" x1="32" y1="36" x2="50" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0B6B4F" />
          <stop offset="100%" stopColor="#074835" />
        </linearGradient>

        {/* Midnight Navy Inner Ceiling & Wall [Dark Block 2] */}
        <linearGradient id="pf-facet-navy-wall" x1="36" y1="26" x2="68" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F2840" />
          <stop offset="100%" stopColor="#08131F" />
        </linearGradient>
      </defs>

      <g stroke="#08131F" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round">
        {/* 1. Outer Hexagon Roof Plane */}
        <path
          d="M50 10L82 28.5L68 36.5L50 26L32 36.5L18 28.5L50 10Z"
          fill="url(#pf-facet-top)"
        />

        {/* 2. Upper Loop Outer Right Facet */}
        <path
          d="M82 28.5V56.5L68 64.5V36.5L82 28.5Z"
          fill="url(#pf-facet-right)"
        />

        {/* 3. Midnight Navy Loop Inner Ceiling & Wall [Dark Block 2] */}
        <path
          d="M50 26L68 36.5V64.5L50 54V26Z"
          fill="url(#pf-facet-navy-wall)"
        />

        {/* 4. Main Left Vertical Stem Front Face */}
        <path
          d="M18 28.5V75.5L32 83.5V36.5L18 28.5Z"
          fill="url(#pf-facet-left)"
        />

        {/* 5. Deep Teal Inner Stem Vertical Wall [Dark Block 1] */}
        <path
          d="M32 36.5V83.5L50 94V66L32 55.5V36.5Z"
          fill="url(#pf-facet-teal-wall)"
        />

        {/* 6. Stem Bottom Base Return */}
        <path
          d="M18 75.5L50 94V86L32 75.5L18 75.5Z"
          fill="url(#pf-facet-left)"
        />

        {/* 7. Middle Loop Return Crossbar */}
        <path
          d="M32 55.5L50 66L68 55.5L50 45L32 55.5Z"
          fill="url(#pf-facet-top)"
        />
      </g>
    </svg>
  );
}

/**
 * Constellation Connected Nodes 'P' Mark
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

      <g stroke="#28D17C" strokeWidth="2" strokeOpacity="0.85" strokeLinecap="round">
        <line x1="22" y1="22" x2="22" y2="48" />
        <line x1="22" y1="48" x2="22" y2="78" />
        <line x1="22" y1="22" x2="42" y2="35" />
        <line x1="22" y1="48" x2="42" y2="35" />
        <line x1="22" y1="48" x2="38" y2="60" />
        <line x1="22" y1="78" x2="38" y2="70" />
        <line x1="38" y1="60" x2="38" y2="70" />

        <line x1="22" y1="22" x2="58" y2="22" />
        <line x1="58" y1="22" x2="78" y2="35" />
        <line x1="78" y1="35" x2="78" y2="55" />
        <line x1="78" y1="55" x2="58" y2="68" />
        <line x1="58" y1="68" x2="38" y2="60" />

        <line x1="42" y1="35" x2="58" y2="22" />
        <line x1="42" y1="35" x2="62" y2="45" />
        <line x1="62" y1="45" x2="78" y2="35" />
        <line x1="62" y1="45" x2="78" y2="55" />
        <line x1="62" y1="45" x2="58" y2="68" />
        <line x1="42" y1="35" x2="58" y2="68" />
        <line x1="22" y1="48" x2="58" y2="68" />
      </g>

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
 * Explicitly matches image.png ('Poly' in dark navy / white, 'Fit' in vibrant emerald green)
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
  const isAuto = theme === "auto";
  const polyTextColor = isDark
    ? "text-white" 
    : isAuto 
    ? "text-navy dark:text-white"
    : "text-navy";
  const subtitleColor = isDark 
    ? "text-slate-400" 
    : isAuto 
    ? "text-subdued dark:text-slate-400"
    : "text-subdued";

  return (
    <div
      className={cn("inline-flex items-center gap-2.5 select-none group", className)}
      {...props}
    >
      {/* Icon Marks */}
      {(variant === "full" || variant === "icon") && (
        <IsometricHexMark size={iconSize} />
      )}

      {variant === "constellation" && (
        <ConstellationNetworkMark size={iconSize} />
      )}

      {/* Typography Lockup matching image.png */}
      {(variant === "full" || variant === "wordmark") && showWordmark && (
        <div className="flex flex-col justify-center">
          <span
            className="font-extrabold tracking-tight font-sans flex items-center leading-none"
            style={{ fontSize: `${Math.max(20, Math.round(iconSize * 0.72))}px` }}
          >
            <span className={polyTextColor}>Poly</span>
            <span className="text-accent ml-[0.5px]">Fit</span>
          </span>

          {showSubtitle && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-[1px] w-3 bg-accent/40" />
              <span
                className={cn(
                  "font-semibold tracking-[0.14em] uppercase text-[9px] leading-none",
                  subtitleColor
                )}
              >
                Corporate Wellness Network
              </span>
              <span className="h-[1px] w-3 bg-accent/40" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PolyFitLogo;
