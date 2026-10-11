'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PartnerProvider, usePartner } from '@/contexts/PartnerContext';
import { PartnerSidebar } from '@/components/partner/PartnerSidebar';
import { PartnerHeader } from '@/components/partner/PartnerHeader';
import { ManualCheckinModal } from '@/components/partner/ManualCheckinModal';
import { RetroactiveClaimModal } from '@/components/partner/RetroactiveClaimModal';
import { PayoutAccountModal } from '@/components/partner/settlements/PayoutAccountModal';

function PartnerLayoutShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileDrawerRef = useRef<HTMLDialogElement>(null);

  const {
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

  useEffect(() => {
    const dialog = mobileDrawerRef.current;
    if (!dialog) return;
    if (mobileMenuOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [mobileMenuOpen]);

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
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
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
  return (
    <PartnerProvider>
      <PartnerLayoutShell>{children}</PartnerLayoutShell>
    </PartnerProvider>
  );
}
