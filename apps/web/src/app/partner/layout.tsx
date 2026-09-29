'use client';

import React, { useState } from 'react';
import { PartnerProvider } from '@/contexts/PartnerContext';
import { PartnerSidebar } from '@/components/partner/PartnerSidebar';
import { PartnerHeader } from '@/components/partner/PartnerHeader';
import { ManualCheckinModal } from '@/components/partner/ManualCheckinModal';
import { RetroactiveClaimModal } from '@/components/partner/RetroactiveClaimModal';

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [manualCheckinOpen, setManualCheckinOpen] = useState(false);
  const [retroactiveClaimOpen, setRetroactiveClaimOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleGlobalRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <PartnerProvider>
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col antialiased">
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="fixed top-0 bottom-0 w-64">
              <PartnerSidebar />
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <div
                className="fixed inset-0 bg-[#0B1F33]/70 backdrop-blur-xs transition-opacity"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="relative w-64 max-w-xs bg-[#0B1F33] h-full shadow-2xl z-10">
                <PartnerSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
            <PartnerHeader
              onOpenManualCheckin={() => setManualCheckinOpen(true)}
              onOpenRetroactiveClaim={() => setRetroactiveClaimOpen(true)}
              onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
            />

            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>

        {/* Global Modals */}
        <ManualCheckinModal
          isOpen={manualCheckinOpen}
          onClose={() => setManualCheckinOpen(false)}
          onSuccess={handleGlobalRefresh}
        />

        <RetroactiveClaimModal
          isOpen={retroactiveClaimOpen}
          onClose={() => setRetroactiveClaimOpen(false)}
          onSuccess={handleGlobalRefresh}
        />
      </div>
    </PartnerProvider>
  );
}
