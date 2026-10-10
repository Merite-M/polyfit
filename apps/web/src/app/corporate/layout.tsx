"use client";

import React from "react";
import { CorporateSidebar } from "@/components/corporate/CorporateSidebar";
import { CorporateProvider, useCorporate } from "@/contexts/CorporateContext";
import { CheckCircle2 } from "lucide-react";

function CorporateLayoutContent({ children }: { children: React.ReactNode }) {
  const { mobileMenuOpen, setMobileMenuOpen, notification } = useCorporate();

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop Persistent Sidebar (Fixed 260px) */}
      <div className="hidden lg:block w-64 flex-shrink-0 h-full">
        <CorporateSidebar />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close mobile menu backdrop"
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-10 animate-in slide-in-from-left duration-200">
            <CorporateSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Global Reactive Portal Notification Toast */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 max-w-md animate-in fade-in-50 slide-in-from-top-2 duration-200 shadow-xl rounded-2xl bg-slate-900 text-white border border-slate-700 p-3.5 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-xs font-semibold">{notification}</p>
          </div>
        )}

        <main
          className="flex-1 pb-16"
          style={{ viewTransitionName: "corporate-main-content" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default function CorporateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CorporateProvider>
      <CorporateLayoutContent>{children}</CorporateLayoutContent>
    </CorporateProvider>
  );
}
