'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PartnerProvider, usePartner } from '@/contexts/PartnerContext';
import { useAuth } from '@/contexts/AuthContext';
import { PartnerSidebar } from '@/components/partner/PartnerSidebar';
import { PartnerHeader } from '@/components/partner/PartnerHeader';
import { ManualCheckinModal } from '@/components/partner/ManualCheckinModal';
import { RetroactiveClaimModal } from '@/components/partner/RetroactiveClaimModal';
import { PayoutAccountModal } from '@/components/partner/settlements/PayoutAccountModal';
import { PartnerPendingReviewScreen } from '@/components/partner/PartnerPendingReviewScreen';
import { Building2, LogOut, ArrowRight, ShieldAlert } from 'lucide-react';

function PartnerLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const isStandaloneAuth =
    pathname?.startsWith('/partner/register') ||
    pathname?.startsWith('/partner/login') ||
    pathname?.startsWith('/partner/activate');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileDrawerRef = useRef<HTMLDialogElement>(null);

  const {
    provider,
    providerStatus,
    manualCheckinOpen,
    closeManualCheckin,
    retroactiveClaimOpen,
    closeRetroactiveClaim,
    payoutModalOpen,
    closePayoutModal,
    openManualCheckin,
    openRetroactiveClaim,
    refreshAll,
    refreshSummary
  } = usePartner();

  // Auth Redirect Guard
  useEffect(() => {
    if (!authLoading && !user && !isStandaloneAuth) {
      const returnUrl = encodeURIComponent(pathname || '/partner');
      router.replace(`/partner/login?returnUrl=${returnUrl}`);
    }
  }, [user, authLoading, isStandaloneAuth, pathname, router]);

  useEffect(() => {
    const dialog = mobileDrawerRef.current;
    if (!dialog) return;
    if (mobileMenuOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [mobileMenuOpen]);

  if (isStandaloneAuth) {
    return (
      <main className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </main>
    );
  }

  // Loading state
  if (authLoading || (!user && !isStandaloneAuth) || providerStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07131F] text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#28D17C] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-400">Verifying wellness partner credentials...</p>
        </div>
      </div>
    );
  }

  // Partner Facility Under Review State (24h SLA)
  if (providerStatus === 'pending_review') {
    return (
      <PartnerPendingReviewScreen
        providerName={provider?.name}
        providerCategory={provider?.category}
        contactEmail={provider?.contact_email || user?.email}
      />
    );
  }

  // No Provider Account Linked
  if (providerStatus === 'not_found' || !provider || !provider.id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07131F] text-white p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">No Partner Facility Linked</h2>
            <p className="text-sm text-slate-400 mt-2">
              We couldn&apos;t find an active wellness provider account linked to{' '}
              <span className="text-[#28D17C] font-medium">{user?.email}</span>.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/partner/activate"
              className="w-full py-2.5 px-4 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-slate-950 font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              Enter Partner Activation Token
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/partner/register"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all"
            >
              Register New Wellness Facility
            </Link>
            <button
              onClick={() => signOut('/partner/login')}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-background flex flex-col antialiased text-foreground">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="fixed top-0 bottom-0 w-64">
            <PartnerSidebar />
          </div>
        </div>

        {/* Mobile Drawer using Native Dialog */}
        <dialog
          ref={mobileDrawerRef}
          onClose={() => setMobileMenuOpen(false)}
          className="fixed inset-0 m-0 p-0 max-w-none max-h-none w-screen h-screen bg-transparent backdrop:bg-slate-900/60 backdrop:backdrop-blur-xs z-50 lg:hidden open:flex flex-row"
        >
          <div
            className="fixed inset-0"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-xs bg-[#0B1F33] text-white h-full shadow-2xl z-10 flex flex-col">
            <PartnerSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </dialog>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <PartnerHeader
            onOpenManualCheckin={openManualCheckin}
            onOpenRetroactiveClaim={openRetroactiveClaim}
            onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Global Orchestrated Modals */}
      <ManualCheckinModal
        isOpen={manualCheckinOpen}
        onClose={closeManualCheckin}
        onSuccess={() => {
          closeManualCheckin();
          refreshSummary();
        }}
      />

      <RetroactiveClaimModal
        isOpen={retroactiveClaimOpen}
        onClose={closeRetroactiveClaim}
        onSuccess={() => {
          closeRetroactiveClaim();
          refreshAll();
        }}
      />

      <PayoutAccountModal
        isOpen={payoutModalOpen}
        onClose={closePayoutModal}
        onSuccess={() => {
          closePayoutModal();
          refreshAll();
        }}
      />
    </div>
  );
}

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandaloneAuth =
    pathname?.startsWith('/partner/register') ||
    pathname?.startsWith('/partner/login') ||
    pathname?.startsWith('/partner/activate');

  if (isStandaloneAuth) {
    return (
      <main className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </main>
    );
  }

  return (
    <PartnerProvider>
      <PartnerLayoutShell>{children}</PartnerLayoutShell>
    </PartnerProvider>
  );
}
