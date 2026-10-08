"use client";

import React, { useState } from "react";
import { OperationsSidebar } from "@/components/operations/OperationsSidebar";
import { OperationsHeader } from "@/components/operations/OperationsHeader";
import { OperationsDrawerProvider } from "@/contexts/OperationsDrawerContext";
import { SlideOverDrawerHost } from "@/components/operations/drawers/SlideOverDrawerHost";
import { UniversalOmnibar } from "@/components/operations/UniversalOmnibar";

export default function OperationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [omnibarOpen, setOmnibarOpen] = useState(false);

  return (
    <OperationsDrawerProvider>
      <div className="flex h-screen overflow-hidden bg-[#F7F9FC]">
        {/* Desktop Persistent Sidebar (Fixed 260px) */}
        <div className="hidden lg:block w-64 flex-shrink-0 h-full">
          <OperationsSidebar />
        </div>

        {/* Mobile Drawer Backdrop & Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0B1F33] z-10 animate-in slide-in-from-left duration-200">
              <OperationsSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <OperationsHeader
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onOpenOmnibar={() => setOmnibarOpen(true)}
          />

          <main className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
            {children}
          </main>
        </div>

        {/* Universal Omnibar Modal Dialog */}
        <UniversalOmnibar
          isOpen={omnibarOpen}
          onClose={() => setOmnibarOpen(false)}
        />

        {/* Global Slide-Over Drawer Host */}
        <SlideOverDrawerHost />
      </div>
    </OperationsDrawerProvider>
  );
}
