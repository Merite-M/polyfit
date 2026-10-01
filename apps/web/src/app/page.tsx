import PublicNavigation from "@/components/public-navigation";
import Hero from "@/components/landing/hero";
import CredibilityStrip from "@/components/landing/credibility-strip";
import ProblemSection from "@/components/landing/problem-section";
import SolutionSection from "@/components/landing/solution-section";
import HowItWorks from "@/components/landing/how-it-works";
import ForCompanies from "@/components/landing/for-companies";
import ForProviders from "@/components/landing/for-providers";
import NetworkPreview from "@/components/landing/network-preview";
import RoiCalculator from "@/components/landing/roi-calculator";
import AboutSection from "@/components/landing/about-section";
import FAQSection from "@/components/landing/faq-section";
import EarlyAccessCTA from "@/components/landing/early-access-cta";
import Footer from "@/components/landing/footer";
import LeadForms from "@/components/landing/lead-forms";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0B1F33] selection:bg-[#28D17C]/20 selection:text-[#0B1F33]">
      <PublicNavigation />
      
      <main id="main-content">
        <Hero />
        <CredibilityStrip />
        <ProblemSection />
        <SolutionSection />
        <HowItWorks />
        <RoiCalculator />
        <NetworkPreview />
        <ForCompanies />
        <ForProviders />
        <AboutSection />
        <FAQSection />
        <EarlyAccessCTA />
      </main>
      
      <Footer />
      
      <LeadForms />
    </div>
  );
}
