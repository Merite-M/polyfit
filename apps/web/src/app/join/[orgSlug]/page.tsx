import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { EmployeeJoinClient } from "@/components/corporate/EmployeeJoinClient";
import { TECHCORP_CANONICAL_DATA } from "@/lib/constants";

export function generateStaticParams() {
  return [
    { orgSlug: "techcorp-rwanda" },
    { orgSlug: "bank-of-kigali" },
  ];
}

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function EmployeeJoinPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const slug = (orgSlug || "techcorp-rwanda").toLowerCase();

  let orgConfig = {
    id: TECHCORP_CANONICAL_DATA.organization.id,
    name: TECHCORP_CANONICAL_DATA.organization.name,
    slug: TECHCORP_CANONICAL_DATA.organization.slug,
    domains: TECHCORP_CANONICAL_DATA.organization.allowed_domains,
    domain: TECHCORP_CANONICAL_DATA.organization.allowed_domains[0] || "techcorp.rw",
    tierName: "TechCorp Standard Wellness Plan",
    maxVisits: 8,
    coPayPercent: 0,
    venuesCount: 52,
  };

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
          domains: data.organization.allowed_domains || ["techcorp.rw"],
          domain: (data.organization.allowed_domains || ["techcorp.rw"])[0],
          tierName: data.default_plan?.name || "Standard Corporate Wellness Pass",
          maxVisits: data.default_plan?.max_visits_per_month || 8,
          coPayPercent: data.default_plan?.co_pay_percentage || 0,
          venuesCount: data.default_plan?.venues_count || 52,
        };
      }
    }
  } catch {
    // Graceful fallback to canonical data
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1F33] flex flex-col justify-between">
      {/* Top Simple Brand Navbar */}
      <header className="h-16 px-6 bg-white border-b border-[#E2E8F0] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0B1F33] text-white flex items-center justify-center font-bold text-sm">
            <span className="text-[#28D17C]">P</span>F
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-[#0B1F33] text-base tracking-tight">
              PolyFit
            </span>
            <span className="text-[10px] font-semibold bg-[#E9FAF2] text-[#28D17C] px-2 py-0.5 rounded-full border border-[#28D17C]/20">
              Wellness Pass
            </span>
          </div>
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
        <EmployeeJoinClient orgConfig={orgConfig} />
      </main>

      {/* Simple Footer */}
      <footer className="py-4 px-6 text-center text-xs text-[#8491A3] border-t border-[#E2E8F0]">
        PolyFit Corporate Wellness Network &bull; Kigali, Rwanda &bull; Powered by PolyFit Infrastructure
      </footer>
    </div>
  );
}
