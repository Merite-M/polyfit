import type { Metadata } from "next";
import PublicNavigation from "@/components/public-navigation";
import FacilityDirectory from "@/components/landing/facility-directory";
import Footer from "@/components/landing/footer";
import LeadForms from "@/components/landing/lead-forms";
import { MapPin, ShieldCheck, Building2, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Partner Wellness Network Map & Discovery | PolyFit Rwanda",
  description: "Explore 50+ vetted wellness facilities across Kigali and East Africa. One corporate pass unlocks verified gyms, Olympic pools, boutique yoga studios, and recovery spas.",
};

export default function NetworkPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/20 selection:text-foreground">
      <PublicNavigation />

      <main id="main-content" className="pt-20 sm:pt-24">
        {/* Dedicated Network Hero Header */}
        <section className="bg-primary text-primary-foreground py-12 sm:py-16 border-b border-white/10 relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(var(--accent)_1px,transparent_1px)] [background-size:24px_24px]"
            aria-hidden="true"
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-accent mb-4">
                <MapPin className="w-3.5 h-3.5" />
                <span>Rwanda & East Africa Partner Network</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                One Benefit. <br />
                <span className="text-accent">15+ Premier Locations Across Kigali.</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed">
                Explore verified gyms, Olympic swimming pools, yoga studios, and recovery clinics. Filter by district, search by amenities, or inspect facilities on our live interactive map.
              </p>

              <div className="mt-6 flex flex-wrap gap-4 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span>100% Vetted Equipment & Sanitation</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                  <span>Dynamic TOTP Access at Front Desk</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-highlight" />
                  <span>Kimihurura, Rugunga, Nyarutarama & Beyond</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Full Interactive Facility Directory & Geo-Map */}
        <FacilityDirectory />
      </main>

      <Footer />
      <LeadForms />
    </div>
  );
}
