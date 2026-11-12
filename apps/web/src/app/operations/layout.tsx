"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { OperationsSidebar } from "@/components/operations/OperationsSidebar";
import { OperationsHeader } from "@/components/operations/OperationsHeader";
import { OperationsDrawerProvider } from "@/contexts/OperationsDrawerContext";
import { SlideOverDrawerHost } from "@/components/operations/drawers/SlideOverDrawerHost";
import { UniversalOmnibar } from "@/components/operations/UniversalOmnibar";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, LogOut, ArrowRight, Lock } from "lucide-react";

export default function OperationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname?.startsWith("/operations/login");
  const { user, role, isSuperAdmin, isDemoMode, isLoading: authLoading, signOut } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [omnibarOpen, setOmnibarOpen] = useState(false);

  // Auth Redirect Guard
  useEffect(() => {
    if (!authLoading && !user && !isLoginPage) {
      const returnUrl = encodeURIComponent(pathname || "/operations");
      router.replace(`/operations/login?returnUrl=${returnUrl}`);
    }
  }, [user, authLoading, isLoginPage, pathname, router]);

  // Login page renders without the operations navigation frame
  if (isLoginPage) {
    return (
      <main className="min-h-screen bg-[#F7F9FC] text-[#0B1F33]">
        {children}
      </main>
    );
  }

  // Loading security check
  if (authLoading || (!user && !isLoginPage)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC] text-[#0B1F33]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#28D17C] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Verifying PolyFit Operations clearance...</p>
        </div>
      </div>
    );
  }

  // Staff Clearance Check
  const hasClearance = isSuperAdmin || isDemoMode || role === "super_admin" || role === "polyfit_ops";
  if (!hasClearance) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC] text-[#0B1F33] p-6 relative overflow-x-hidden">
        {/* Ambient Longevity & Security Glow */}
        <div className="absolute top-0 inset-x-0 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(239,68,68,0.08),rgba(247,249,252,0)_70%)] pointer-events-none" />

        <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 text-center space-y-5 shadow-[0_4px_24px_-4px_rgba(11,31,51,0.08),0_1px_3px_rgba(11,31,51,0.04)] relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              403 Forbidden
            </span>
            <h2 className="text-xl font-extrabold tracking-tight text-[#0B1F33] mt-2">
              PolyFit Operations Clearance Required
            </h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Your account <span className="text-[#0B1F33] font-semibold">{user?.email}</span> is authenticated, but does not hold PolyFit Operations or Super Admin clearance.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => signOut("/operations/login")}
              className="w-full py-2.5 px-4 rounded-xl bg-[#28D17C] hover:bg-[#22bf6f] text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/15 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign In with Authorized Staff Account
            </button>
            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F33] font-semibold text-xs transition-all border border-slate-200/80"
            >
              Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
