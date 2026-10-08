"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Search, 
  X, 
  Building2, 
  Network, 
  MapPin, 
  User, 
  Activity, 
  FileText,
  ArrowRight,
  Sparkles,
  Command
} from "lucide-react";
import { useOperationsDrawer, EntityType } from "@/contexts/OperationsDrawerContext";
import { apiFetch } from "@/lib/api-client";

interface SearchResultItem {
  id: string;
  type: EntityType;
  title: string;
  subtitle: string;
  badge: string;
  badgeVariant: "success" | "warning" | "error" | "info" | "neutral";
  metadata?: Record<string, any>;
}

interface SearchApiResponse {
  success: boolean;
  query: string;
  count: number;
  tookMs: number;
  results: SearchResultItem[];
}

interface UniversalOmnibarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UniversalOmnibar({ isOpen, onClose }: UniversalOmnibarProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchStats, setSearchStats] = useState<{ count: number; tookMs: number } | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { openDrawer } = useOperationsDrawer();

  // Control native <dialog>
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (dialogRef.current?.open) {
          onClose();
        } else {
          // Open trigger handled by parent or state
          dialogRef.current?.showModal();
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Debounced search query
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setSearchStats(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const data = await apiFetch<SearchApiResponse>(`/api/operations/search?q=${encodeURIComponent(query)}`);
        if (data && data.results) {
          setResults(data.results);
          setSearchStats({ count: data.count, tookMs: data.tookMs });
          setSelectedIndex(0);
        }
      } catch (err) {
        console.warn("[Omnibar] Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [query]);

  // Filter results by selected category tab
  const filteredResults = results.filter((item) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "clients") return item.type === "organization";
    if (activeCategory === "providers") return item.type === "provider";
    if (activeCategory === "locations") return item.type === "location";
    if (activeCategory === "employees") return item.type === "employee";
    if (activeCategory === "visits") return item.type === "visit";
    if (activeCategory === "invoices") return item.type === "invoice";
    return true;
  });

  const handleSelectResult = useCallback((item: SearchResultItem) => {
    openDrawer(item.type, item.id, item.metadata, item.title);
    onClose();
  }, [openDrawer, onClose]);

  // Keyboard navigation inside Omnibar
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === "Enter" && filteredResults[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(filteredResults[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const getIconForType = (type: EntityType) => {
    switch (type) {
      case "organization": return <Building2 className="w-4 h-4 text-indigo-500" />;
      case "provider": return <Network className="w-4 h-4 text-emerald-500" />;
      case "location": return <MapPin className="w-4 h-4 text-teal-500" />;
      case "employee": return <User className="w-4 h-4 text-blue-500" />;
      case "visit": return <Activity className="w-4 h-4 text-amber-500" />;
      case "invoice": return <FileText className="w-4 h-4 text-purple-500" />;
      default: return <Search className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="backdrop:bg-black/50 backdrop:backdrop-blur-xs bg-transparent p-0 m-auto w-full max-w-2xl border-none outline-none overflow-visible shadow-2xl"
    >
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a company, provider, location, staff name, or invoice #..."
            className="flex-1 text-sm bg-transparent border-none outline-none text-[#0B1F33] placeholder:text-slate-400 font-medium"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          {query && !loading && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 rounded-md font-mono"
          >
            ESC
          </button>
        </div>

        {/* Category Filters Bar */}
        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          {[
            { id: "all", label: "All Network" },
            { id: "clients", label: "Employers" },
            { id: "providers", label: "Providers" },
            { id: "locations", label: "Facilities" },
            { id: "employees", label: "Beneficiaries" },
            { id: "visits", label: "Visits" },
            { id: "invoices", label: "Invoices" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                activeCategory === cat.id
                  ? "bg-[#0B1F33] text-white shadow-2xs font-semibold"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 max-h-[420px]">
          {query.trim().length >= 2 && filteredResults.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-500 text-xs space-y-1">
              <p className="font-semibold text-slate-700">No matching network entities found</p>
              <p className="text-[11px] text-slate-400">
                Try searching by employer name, provider trade name, venue district, or staff email.
              </p>
            </div>
          )}

          {query.trim().length < 2 && (
            <div className="p-6 text-center text-slate-400 text-xs space-y-2">
              <div className="flex justify-center text-slate-300">
                <Command className="w-8 h-8" />
              </div>
              <p className="font-medium text-slate-600">PolyFit Universal Omnibar Search</p>
              <p className="text-[11px] max-w-sm mx-auto text-slate-400">
                Instantly index across corporate clients, wellness facilities, verified check-in records, and billing statements.
              </p>
            </div>
          )}

          {filteredResults.map((item, index) => {
            const isSelected = index === selectedIndex;

            return (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => handleSelectResult(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? "bg-[#E9FAF2] text-[#0B1F33] border border-[#B7F1D2] shadow-2xs"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shrink-0 shadow-2xs">
                    {getIconForType(item.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#0B1F33] truncate">
                        {item.title}
                      </span>
                      <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pl-3">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium capitalize">
                    {item.badge}
                  </span>
                  {isSelected && (
                    <ArrowRight className="w-4 h-4 text-[#28D17C] shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with Performance Benchmark & Navigation Instructions */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[9px]">↑↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[9px]">↵</kbd>
              <span>to open drawer</span>
            </span>
          </div>

          {searchStats && (
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
              <Sparkles className="w-3 h-3 text-[#28D17C]" />
              <span>{searchStats.count} hits in {searchStats.tookMs}ms</span>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
