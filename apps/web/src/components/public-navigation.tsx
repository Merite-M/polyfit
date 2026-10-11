"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, Building2, Dumbbell, ShieldCheck, UserCheck } from "lucide-react";
import { PolyFitLogo } from "@/components/ui/polyfit-logo";
import { useLeadModal } from "@/lib/lead-modal";
import { PlatformSuiteLauncher } from "@/components/ui/PlatformSuiteLauncher";
import { LivePassVirtualizationModal } from "@/components/ui/LivePassVirtualizationModal";

interface PublicNavigationProps {
  onOpenLeadForm?: (type: 'employer' | 'provider') => void;
}

export default function PublicNavigation({ onOpenLeadForm }: PublicNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPassPreviewOpen, setIsPassPreviewOpen] = useState(false);
  const openLeadModal = useLeadModal((s) => s.open);

  const handleOpenLead = (type: 'employer' | 'provider' = 'employer') => {
    if (onOpenLeadForm) {
      onOpenLeadForm(type);
    } else {
      openLeadModal(type);
    }
  };


  const navLinks = [
    { name: "Network", href: "/network" },
    { name: "Pricing", href: "/pricing" },
    { name: "How it Works", href: "/#how-it-works" },
    { name: "For Companies", href: "/#for-companies" },
    { name: "For Providers", href: "/#for-providers" },
    { name: "About", href: "/#about" },
  ];

  const portalLinks = [
    {
      title: "Employer HR Portal",
      desc: "Manage roster, benefits & view invoices",
      href: "/corporate",
      icon: Building2,
      badge: "Corporate",
    },
    {
      title: "Wellness Partner Portal",
      desc: "Front-desk verify, locations & payouts",
      href: "/partner",
      icon: Dumbbell,
      badge: "Partners",
    },
    {
      title: "Operations Console",
      desc: "Network clearinghouse & admin",
      href: "/operations",
      icon: ShieldCheck,
      badge: "Staff",
    },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-white/10" aria-label="Main Navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 group">
              <PolyFitLogo theme="dark" iconSize={38} />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-5 lg:space-x-7">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            ))}

            {/* Unified PolyFit Platform Suite Launcher */}
            <PlatformSuiteLauncher
              variant="dark"
              onOpenMobilePreview={() => setIsPassPreviewOpen(true)}
            />

            {/* Talk to Us Lead CTA */}
            <button 
              onClick={() => handleOpenLead('employer')}
              aria-label="Talk to us - Request employer demo"
              className="bg-accent hover:bg-accent-hover text-accent-foreground px-5 py-2.5 rounded-[10px] text-sm font-bold transition-all duration-150 shadow-xs hover:shadow-sm cursor-pointer active:scale-95"
            >
              Talk to us
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-[10px] text-gray-300 hover:text-white hover:bg-white/10 focus:outline-none min-h-[44px] min-w-[44px]"
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
                className="block px-3 py-2.5 rounded-[10px] text-base font-medium text-gray-200 hover:text-white hover:bg-white/5 transition-colors active:bg-white/10"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobile Portals Section */}
          <div className="pt-3 border-t border-white/10">
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Portal Sign In</p>
            <div className="space-y-1">
              {portalLinks.map((portal) => (
                <Link
                  key={portal.title}
                  href={portal.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-[8px] bg-white/5 text-sm font-medium text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <portal.icon className="w-4 h-4 text-accent" />
                    <span>{portal.title}</span>
                  </span>
                  <span className="text-[10px] font-semibold text-gray-400 bg-white/10 px-2 py-0.5 rounded">{portal.badge}</span>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="pt-2">
            <button 
              onClick={() => {
                setIsMenuOpen(false);
                handleOpenLead('employer');
              }}
              aria-label="Talk to us - Request employer demo"
              className="w-full bg-accent hover:bg-accent-hover text-accent-foreground px-5 py-3 rounded-[10px] text-sm font-bold transition-colors min-h-[44px] flex items-center justify-center cursor-pointer"
            >
              Talk to us
            </button>
          </div>
        </div>
      )}

      {/* Interactive Mobile Pass Virtualization Modal */}
      <LivePassVirtualizationModal
        isOpen={isPassPreviewOpen}
        onClose={() => setIsPassPreviewOpen(false)}
      />
    </nav>
  );
}
