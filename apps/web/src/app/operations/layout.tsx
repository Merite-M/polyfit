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
      <main className="min-h-screen bg-[#07131F] text-slate-100">
        {children}
      </main>
    );
  }

  // Loading security check
  if (authLoading || (!user && !isLoginPage)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07131F] text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-400">Verifying PolyFit Operations clearance...</p>
        </div>
      </div>
    );
  }

  // Staff Clearance Check
  const hasClearance = isSuperAdmin || isDemoMode || role === "super_admin" || role === "polyfit_ops";
  if (!hasClearance) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07131F] text-white p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
              403 Forbidden
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white mt-2">
              PolyFit Operations Clearance Required
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              Your account <span className="text-white font-medium">{user?.email}</span> is authenticated, but does not hold PolyFit Operations or Super Admin clearance.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => signOut("/operations/login")}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              Sign In with Authorized Staff Account
            </button>
            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
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
