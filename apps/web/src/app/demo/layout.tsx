import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request an Employer Demo & Custom Proposal | PolyFit Corporate Wellness Network",
  description: "Schedule a 15-minute corporate wellness consultation. Get an itemized network proposal, RRA EBM 18% VAT invoicing structure, and tailored multi-venue employee pricing.",
  openGraph: {
    title: "Request a PolyFit Employer Demo",
    description: "Connect your team to Rwanda's leading corporate wellness network with one consolidated monthly invoice.",
    url: "https://polyfit.onrender.com/demo",
    siteName: "PolyFit",
    type: "website",
  },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PolyFit",
    "url": "https://polyfit.onrender.com",
    "logo": "https://polyfit.onrender.com/brand/primary_logo.png",
    "description": "B2B2C Corporate Wellness Aggregator Network connecting employers with independent fitness and wellness facilities across East Africa.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Kigali",
      "addressCountry": "RW"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+250-788-000-000",
      "contactType": "corporate sales",
      "areaServed": ["RW", "KE"],
      "availableLanguage": ["English", "French", "Kinyarwanda"]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
