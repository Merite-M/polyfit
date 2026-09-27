import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partner Network & Facility Directory | PolyFit Corporate Wellness",
  description: "Explore PolyFit's verified network of gyms, Olympic swimming pools, yoga studios, and wellness centers across Kigali and Rwanda. One corporate benefit, nationwide access.",
  openGraph: {
    title: "PolyFit Partner Network — Explore Verified Facilities in Rwanda",
    description: "Browse 15+ corporate fitness and wellness locations in Kigali. Filter by category, neighborhood, and amenities.",
    type: "website",
  },
};

export default function NetworkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
