import type { Metadata } from "next";
import PublicNavigation from "@/components/public-navigation";
import PricingHero from "@/components/pricing/pricing-hero";
import PricingTiers from "@/components/pricing/pricing-tiers";
import PricingRoiBanner from "@/components/pricing/pricing-roi-banner";
import FeatureComparison from "@/components/pricing/feature-comparison";
import PricingFaq from "@/components/pricing/pricing-faq";
import Footer from "@/components/landing/footer";
import LeadForms from "@/components/landing/lead-forms";

export const metadata: Metadata = {
  title: "Corporate Wellness Pricing & Plan Tiers | PolyFit Rwanda",
  description: "Transparent per-employee subscription plans for Rwandan employers. Full access to gyms, Olympic pools, yoga studios, and thermal recovery with consolidated RRA EBM 18% VAT invoicing.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/20 selection:text-foreground">
      <PublicNavigation />

      <main id="main-content">
        <PricingHero />
        <PricingTiers />
        <PricingRoiBanner />
        <FeatureComparison />
        <PricingFaq />
      </main>

      <Footer />
      <LeadForms />
    </div>
  );
}
