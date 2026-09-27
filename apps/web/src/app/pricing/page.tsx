"use client";

import { useState } from "react";
import PublicNavigation from "@/components/public-navigation";
import PricingHero from "@/components/pricing/pricing-hero";
import PricingTiers from "@/components/pricing/pricing-tiers";
import PricingRoiBanner from "@/components/pricing/pricing-roi-banner";
import FeatureComparison from "@/components/pricing/feature-comparison";
import PricingFaq from "@/components/pricing/pricing-faq";
import Footer from "@/components/landing/footer";
import LeadForms from "@/components/landing/lead-forms";

export default function PricingPage() {
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [leadFormType, setLeadFormType] = useState<'employer' | 'provider'>('employer');

  const openLeadForm = (type: 'employer' | 'provider') => {
    setLeadFormType(type);
    setIsLeadFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1F33] selection:bg-[#28D17C]/20 selection:text-[#0B1F33]">
      <PublicNavigation onOpenLeadForm={openLeadForm} />

      <main id="main-content">
        <PricingHero />
        <PricingTiers onOpenLeadForm={openLeadForm} />
        <PricingRoiBanner onOpenLeadForm={openLeadForm} />
        <FeatureComparison />
        <PricingFaq onOpenLeadForm={openLeadForm} />
      </main>

      <Footer onOpenLeadForm={openLeadForm} />

      <LeadForms
        isOpen={isLeadFormOpen}
        onClose={() => setIsLeadFormOpen(false)}
        defaultType={leadFormType}
      />
    </div>
  );
}
