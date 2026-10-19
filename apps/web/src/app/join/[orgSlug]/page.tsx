import React from "react";
import Link from "next/link";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { PolyFitLogo } from "@/components/ui/polyfit-logo";
import { EmployeeJoinClient } from "@/components/corporate/EmployeeJoinClient";

export function generateStaticParams() {
  return [
    { orgSlug: "techcorp-rwanda" },
    { orgSlug: "bank-of-kigali" },
    { orgSlug: "irembo" },
    { orgSlug: "equity-bank" },
    { orgSlug: "mtn-rwanda" },
    { orgSlug: "airtel-rwanda" },
  ];
}

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function EmployeeJoinPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const slug = (orgSlug || "").toLowerCase();

  let orgConfig: {
    id: string;
    name: string;
    slug: string;
    domains: string[];
    domain: string;
    tierName: string;
    maxVisits: number;
    coPayPercent: number;
    venuesCount: number;
  } | null = null;

  try {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || "https://polyfit-backend.onrender.com";
    const res = await fetch(
      `${apiBase.replace(/\/$/, "")}/api/public/organizations/${slug}`,
      {
        next: { revalidate: 60 },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.organization) {
        orgConfig = {
          id: data.organization.id,
          name: data.organization.name,
          slug: data.organization.slug || slug,
          domains: data.organization.allowed_domains || [],
          domain: (data.organization.allowed_domains || [])[0] || `${slug}.rw`,
          tierName: data.default_plan?.name || "Standard Corporate Wellness Pass",
          maxVisits: data.default_plan?.max_visits_per_month || 8,
          coPayPercent: data.default_plan?.co_pay_percentage || 0,
          venuesCount: data.default_plan?.venues_count || 52,
        };
      }
    }
  } catch {
    // Handled by null check
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1F33] flex flex-col justify-between">
      {/* Top Simple Brand Navbar */}
      <header className="h-16 px-6 bg-white border-b border-[#E2E8F0] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <PolyFitLogo theme="light" iconSize={28} />
          <span className="text-[10px] font-semibold bg-[#E9FAF2] text-[#28D17C] px-2 py-0.5 rounded-full border border-[#28D17C]/20">
            Wellness Pass
          </span>
        </Link>

        <div className="flex items-center gap-2 text-xs text-[#526173]">
          <ShieldCheck className="w-4 h-4 text-[#28D17C]" />
          <span className="font-medium hidden sm:inline">
            Employer-Subsidized Benefit
          </span>
        </div>
      </header>

      {/* Main Registration Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {orgConfig ? (
          <EmployeeJoinClient orgConfig={orgConfig} />
        ) : (
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#0B1F33]">Corporate Link Not Recognized</h2>
            <p className="text-xs text-[#526173] mt-2 leading-relaxed">
              We could not find an active corporate wellness enrollment for <strong>{slug || "this employer"}</strong>. Please verify the enrollment link with your HR team or PolyFit support.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-[#0B1F33] text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Back to PolyFit
            </Link>
          </div>
        )}
      </main>

      {/* Simple Footer */}
      <footer className="py-4 px-6 text-center text-xs text-[#8491A3] border-t border-[#E2E8F0]">
        PolyFit Corporate Wellness Network &bull; Kigali, Rwanda &bull; Powered by PolyFit Infrastructure
      </footer>
    </div>
  );
}
