"use client";

import React, { useState } from "react";
import { CorporateSidebar } from "@/components/corporate/CorporateSidebar";
import { useAuth } from "@/contexts/AuthContext";

export default function CorporateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Persistent Sidebar (Fixed 260px) */}
      <div className="hidden lg:block w-64 flex-shrink-0 h-full">
        <CorporateSidebar
          organizationName="TechCorp Rwanda"
          organizationSlug="techcorp-rwanda"
        />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0B1F33] z-10 animate-in slide-in-from-left duration-200">
            <CorporateSidebar
              organizationName="TechCorp Rwanda"
              organizationSlug="techcorp-rwanda"
              onCloseMobile={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area with View Transition Name */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
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
