"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface PolyFitLogoProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "full" | "icon" | "wordmark";
  theme?: "light" | "dark" | "auto";
  iconSize?: number;
  showWordmark?: boolean;
}

/**
 * Official PolyFit Brand Logo Component rendering the exact Stitch designed logo asset.
 */
export function PolyFitLogo({
  variant = "full",
  theme = "light",
  iconSize = 36,
  showWordmark = true,
  className,
  ...props
}: PolyFitLogoProps) {
  const isDark = theme === "dark";
  const wordmarkTextColor = isDark ? "text-white" : "text-navy-900";

  return (
    <div
      className={cn("inline-flex items-center gap-2.5 sm:gap-3 select-none group", className)}
      {...props}
    >
      {(variant === "full" || variant === "icon") && (
        <div
          className="relative flex-shrink-0 overflow-hidden rounded-lg transition-transform duration-200 group-hover:scale-105"
          style={{ width: iconSize, height: iconSize }}
        >
          <Image
            src="/polyfit-logo-stitch.png"
            alt="PolyFit Logo"
            width={iconSize}
            height={iconSize}
            className="w-full h-full object-contain"
            priority
          />
        </div>
      )}

      {(variant === "full" || variant === "wordmark") && showWordmark && (
        <span
          className={cn(
            "font-extrabold tracking-tight font-sans flex items-center leading-none",
            wordmarkTextColor
          )}
          style={{ fontSize: `${Math.max(18, Math.round(iconSize * 0.65))}px` }}
        >
          Poly<span className="text-emerald-500">Fit</span>
        </span>
      )}
    </div>
  );
}

export default PolyFitLogo;
