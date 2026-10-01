import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/error-boundary";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "PolyFit — Corporate Fitness & Wellness Network",
  description: "PolyFit connects companies and employees to a network of wellness providers, making corporate fitness benefits more accessible, flexible and measurable.",
  openGraph: {
    title: "PolyFit — Corporate Fitness & Wellness Network",
    description: "PolyFit connects companies and employees to a network of wellness providers, making corporate fitness benefits more accessible, flexible and measurable.",
    siteName: "PolyFit",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`marketing-theme ${inter.variable} antialiased`}>
      <head>
        <link rel="preconnect" href="https://meszhexftehllnsyhbha.supabase.co" />
        <link rel="dns-prefetch" href="https://meszhexftehllnsyhbha.supabase.co" />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        <ErrorBoundary>
          <AuthProvider>
              <a href="#main-content" className="skip-to-main">
                Skip to main content
              </a>
              {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
