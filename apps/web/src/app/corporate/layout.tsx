"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { CorporateSidebar } from "@/components/corporate/CorporateSidebar";
import { CorporateProvider, useCorporate } from "@/contexts/CorporateContext";
import { useAuth } from "@/contexts/AuthContext";
import { CorporatePendingReviewScreen } from "@/components/corporate/CorporatePendingReviewScreen";
import { CheckCircle2, Building2, ShieldAlert, LogOut, ArrowRight } from "lucide-react";

function CorporateLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const {
    organization,
    organizationStatus,
    mobileMenuOpen,
    setMobileMenuOpen,
    notification,
  } = useCorporate();

  const isAuthPage =
    pathname?.startsWith("/corporate/register") ||
    pathname?.startsWith("/corporate/login") ||
    pathname?.startsWith("/corporate/activate");

  // Redirect to login if unauthenticated on protected routes
  useEffect(() => {
    if (!authLoading && !user && !isAuthPage) {
      const returnUrl = encodeURIComponent(pathname || "/corporate");
      router.replace(`/corporate/login?returnUrl=${returnUrl}`);
    }
  }, [user, authLoading, isAuthPage, pathname, router]);

  // Auth/onboarding pages render without the dashboard sidebar
  if (isAuthPage) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        {children}
      </main>
    );
  }

  // Loading indicator while verifying authentication or fetching organization state
  if (authLoading || (!user && !isAuthPage) || organizationStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC] text-[#0B1F33]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#28D17C] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Verifying corporate workspace access...</p>
        </div>
      </div>
    );
  }

  // Pending PolyFit Review / Post-Registration Agreement State
  if (organizationStatus === "pending_review") {
    return (
      <CorporatePendingReviewScreen
        organizationName={organization?.name}
        organizationSlug={organization?.slug}
        adminEmail={organization?.contact_email || user?.email}
        headcount={organization?.contracted_seats}
      />
    );
  }

  // No Corporate Account Linked
  if (organizationStatus === "not_found" || !organization || !organization.id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC] text-[#0B1F33] p-6 relative overflow-x-hidden">
        {/* Ambient Longevity Glow */}
        <div className="absolute top-0 inset-x-0 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(245,158,11,0.08),rgba(247,249,252,0)_70%)] pointer-events-none" />

        <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 text-center space-y-5 shadow-[0_4px_24px_-4px_rgba(11,31,51,0.08),0_1px_3px_rgba(11,31,51,0.04)] relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-[#0B1F33]">No Corporate Account Linked</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              We couldn&apos;t find an active corporate employer account linked to{" "}
              <span className="text-[#0B1F33] font-semibold">{user?.email}</span>.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/corporate/activate"
              className="w-full py-2.5 px-4 rounded-xl bg-[#28D17C] hover:bg-[#22bf6f] text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/15 flex items-center justify-center gap-2 cursor-pointer"
            >
              Enter Corporate Activation Token
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/corporate/register"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B1F33] font-semibold text-xs transition-all border border-slate-200/80"
            >
              Register New Organization
            </Link>
            <button
              onClick={() => signOut("/corporate/login")}
              className="w-full py-2 text-xs text-slate-500 hover:text-[#0B1F33] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
