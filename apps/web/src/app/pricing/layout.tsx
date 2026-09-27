import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing & Corporate Plan Tiers | PolyFit Corporate Wellness Network",
  description: "Transparent corporate wellness plans for employers in Rwanda and East Africa. Starter, Professional, and Enterprise tiers with consolidated RRA EBM invoicing, anti-passback security, and vetted facility networks.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
