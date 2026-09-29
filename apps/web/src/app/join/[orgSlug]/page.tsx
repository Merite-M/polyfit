import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { EmployeeJoinClient } from "@/components/corporate/EmployeeJoinClient";

const ORGANIZATIONS_DIRECTORY: Record<
  string,
  {
    id: string;
    name: string;
    slug: string;
    domain: string;
    tierName: string;
    maxVisits: number;
    coPayPercent: number;
    venuesCount: number;
  }
> = {
  "techcorp-rwanda": {
    id: "c79a9982-4477-4336-a24b-561419f6c43b",
    name: "TechCorp Rwanda",
    slug: "techcorp-rwanda",
    domain: "techcorp.rw",
    tierName: "TechCorp Standard Wellness Plan",
    maxVisits: 8,
    coPayPercent: 15,
    venuesCount: 52,
  },
  "bank-of-kigali": {
    id: "bok-rwanda-001",
    name: "Bank of Kigali",
    slug: "bank-of-kigali",
    domain: "bk.rw",
    tierName: "BK Corporate Fitness Pass",
    maxVisits: 12,
    coPayPercent: 0,
    venuesCount: 52,
  },
  default: {
    id: "c79a9982-4477-4336-a24b-561419f6c43b",
    name: "TechCorp Rwanda",
    slug: "techcorp-rwanda",
    domain: "techcorp.rw",
    tierName: "Standard Corporate Wellness Pass",
    maxVisits: 8,
    coPayPercent: 15,
    venuesCount: 52,
  },
};

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

  const orgConfig =
    ORGANIZATIONS_DIRECTORY[slug] || {
      ...ORGANIZATIONS_DIRECTORY.default,
      name: slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      slug,
      domain: `${slug.replace(/-/g, "")}.rw`,
    };

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
