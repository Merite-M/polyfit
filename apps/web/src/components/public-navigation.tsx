"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Sparkles } from "lucide-react";
import { PolyFitLogo } from "@/components/ui/polyfit-logo";
import { useLeadModal } from "@/lib/lead-modal";
import { VisitorIntentModal } from "@/components/ui/VisitorIntentModal";

interface PublicNavigationProps {
  onOpenLeadForm?: (type: 'employer' | 'provider') => void;
}

export default function PublicNavigation({ onOpenLeadForm }: PublicNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openLeadModal = useLeadModal((s) => s.open);
  const isIntentOpen = useLeadModal((s) => s.isIntentOpen);
  const openIntent = useLeadModal((s) => s.openIntent);
  const closeIntent = useLeadModal((s) => s.closeIntent);

  const navLinks = [
    { name: "Network", href: "/network" },
    { name: "Pricing", href: "/pricing" },
    { name: "How it Works", href: "/#how-it-works" },
    { name: "For Companies", href: "/#for-companies" },
    { name: "For Providers", href: "/#for-providers" },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-white/10" aria-label="Main Navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 group rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900">
                <PolyFitLogo theme="dark" iconSize={36} />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-5 lg:space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-xs font-semibold text-gray-300 hover:text-white transition-colors rounded-md py-1 px-1.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                  {link.name}
                </Link>
              ))}

              {/* Activate Benefit Pill for Corporate Employees */}
              <Link
                href="/join"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Activate Benefit</span>
              </Link>

              {/* Primary Get Started CTA Button */}
              <button 
                type="button"
                onClick={openIntent}
                aria-label="Get Started with PolyFit"
                className="bg-accent hover:bg-accent-hover text-accent-foreground px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 shadow-xs hover:shadow-sm cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                Get Started
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center gap-2">
              <Link
                href="/join"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                <Sparkles className="w-3 h-3" />
                <span>Activate</span>
              </Link>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-[10px] text-gray-300 hover:text-white hover:bg-white/10 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 min-h-[44px] min-w-[44px]"
                aria-expanded={isMenuOpen}
                aria-label="Toggle mobile menu"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-white/10 px-4 pt-3 pb-6 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block px-3 py-2.5 rounded-[10px] text-sm font-medium text-gray-200 hover:text-white hover:bg-white/5 transition-colors active:bg-white/10 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/join"
                className="block px-3 py-2.5 rounded-[10px] text-sm font-bold text-emerald-400 hover:bg-white/5 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                onClick={() => setIsMenuOpen(false)}
              >
                Activate Corporate Benefit
              </Link>
            </div>

            <div className="pt-2">
              <button 
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  openIntent();
                }}
                aria-label="Get Started with PolyFit"
                className="w-full bg-accent hover:bg-accent-hover text-accent-foreground px-5 py-3 rounded-xl text-sm font-bold transition-colors min-h-[44px] flex items-center justify-center cursor-pointer shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Global 3-Actor Intent Gateway Modal */}
      <VisitorIntentModal isOpen={isIntentOpen} onClose={closeIntent} />
    </>
  );
}
