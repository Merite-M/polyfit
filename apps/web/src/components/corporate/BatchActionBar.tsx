"use client";

import React, { useState } from "react";
import {
  CheckSquare,
  PauseCircle,
  PlayCircle,
  Crown,
  Download,
  X,
  ChevronDown,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BatchActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBatchFreeze: () => Promise<void>;
  onBatchActivate: () => Promise<void>;
  onBatchChangeTier: (tier: "basic" | "standard" | "premium") => Promise<void>;
  onBatchExport: () => void;
  isLoading?: boolean;
}

export function BatchActionBar({
  selectedCount,
  onClearSelection,
  onBatchFreeze,
  onBatchActivate,
  onBatchChangeTier,
  onBatchExport,
  isLoading = false,
}: BatchActionBarProps) {
  const [isTierMenuOpen, setIsTierMenuOpen] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-auto max-w-4xl px-4 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center gap-3 bg-[#0B1F33]/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl border border-[#1E3A5F] shadow-2xl">
        {/* Counter Badge */}
        <div className="flex items-center gap-2 pr-3 border-r border-[#1E3A5F]">
          <div className="w-6 h-6 rounded-lg bg-[#28D17C] text-[#0B1F33] flex items-center justify-center font-bold text-xs">
            {selectedCount}
          </div>
          <span className="text-xs font-semibold whitespace-nowrap">
            Selected
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Bulk Freeze */}
          <button
            type="button"
            disabled={isLoading}
            onClick={onBatchFreeze}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E3A5F] hover:bg-[#F59E0B] hover:text-[#0B1F33] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Temporarily freeze mobile passes for all selected employees"
          >
            <PauseCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Bulk Freeze</span>
          </button>

          {/* Bulk Activate */}
          <button
            type="button"
            disabled={isLoading}
            onClick={onBatchActivate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E3A5F] hover:bg-[#28D17C] hover:text-[#0B1F33] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Reactivate full benefit coverage for all selected employees"
          >
            <PlayCircle className="w-3.5 h-3.5 text-[#28D17C]" />
            <span>Bulk Activate</span>
          </button>

          {/* Change Tier Dropdown */}
          <div className="relative">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => setIsTierMenuOpen(!isTierMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E3A5F] hover:bg-[#2A4D75] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <Crown className="w-3.5 h-3.5 text-[#00D2B4]" />
              <span>Change Tier</span>
              <ChevronDown className="w-3 h-3 text-[#8491A3]" />
            </button>

            {isTierMenuOpen && (
              <div className="absolute bottom-full mb-2 left-0 w-36 bg-[#0B1F33] border border-[#1E3A5F] rounded-xl shadow-xl p-1 z-50 animate-in fade-in zoom-in-95">
                {(["basic", "standard", "premium"] as const).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => {
                      setIsTierMenuOpen(false);
                      onBatchChangeTier(tier);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold capitalize text-white hover:bg-[#1E3A5F] transition-colors cursor-pointer"
                  >
                    {tier}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Selected CSV */}
          <button
            type="button"
            disabled={isLoading}
            onClick={onBatchExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E3A5F] hover:bg-[#2A4D75] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#00D2B4]" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Clear Selection */}
        <button
          type="button"
          onClick={onClearSelection}
          className="ml-2 p-1.5 rounded-lg text-[#8491A3] hover:text-white hover:bg-[#1E3A5F] transition-colors cursor-pointer"
          title="Deselect all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
