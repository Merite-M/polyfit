"use client";

import React, { useState } from "react";
import { Check, Minus, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

interface FeatureRow {
  name: string;
  tooltip?: string;
  starter: string | boolean;
  pro: string | boolean;
  enterprise: string | boolean;
}

interface FeatureCategory {
  category: string;
  rows: FeatureRow[];
}

export default function FeatureComparison() {
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);

  const categories: FeatureCategory[] = [
    {
      category: "Provider Network & Facility Access",
      rows: [
        {
          name: "Vetted Fitness & Wellness Locations",
          tooltip: "All facilities meet strict sanitation, equipment, and staff accreditation standards.",
          starter: "25+ Core Gyms",
          pro: "50+ Multi-Category Venues",
          enterprise: "50+ & Custom Commissioning",
        },
        {
          name: "Olympic Swimming Pools & Aquatics",
          tooltip: "Full access to partner pools including Cercle Sportif and luxury aquatic facilities.",
          starter: false,
          pro: true,
          enterprise: true,
        },
        {
          name: "Yoga, Pilates & Barre Studios",
          tooltip: "Specialized boutique studios offering group classes and mindfulness sessions.",
          starter: false,
          pro: true,
          enterprise: true,
        },
        {
          name: "Nationwide Geographic Roaming",
          tooltip: "Beneficiaries can check into facilities across Kigali, Musanze, Rubavu, and secondary cities.",
          starter: "Kigali Only",
          pro: "Nationwide (Rwanda)",
          enterprise: "Regional (East Africa)",
        },
        {
          name: "Custom Venue Commissioning",
          tooltip: "If your executive team or staff has a favorite facility not yet in the network, we contract it for you.",
          starter: false,
          pro: false,
          enterprise: true,
        },
      ],
    },
    {
      category: "Digital Passes & Security Telemetry",
      rows: [
        {
          name: "Dynamic Time-Expiring QR Passes",
          tooltip: "Pass refreshes every 60 seconds on the employee's phone to prevent screenshots.",
          starter: true,
          pro: true,
          enterprise: true,
        },
        {
          name: "Anti-Passback Lockout Engine",
          tooltip: "Prevents pass sharing by enforcing mandatory cooldowns and cross-location physical travel limits.",
          starter: "Standard (2h Cooldown)",
          pro: "Instant Biometric / Geo Lock",
          enterprise: "Multi-Factor Device Bound",
        },
        {
          name: "Employee Self-Activation",
          tooltip: "Employees receive an automated SMS or magic link to claim their corporate benefit in 30 seconds.",
          starter: true,
          pro: true,
          enterprise: true,
        },
        {
          name: "Family / Dependent Subsidies",
          tooltip: "Ability for employees to enroll spouses and children at negotiated corporate rates.",
          starter: false,
          pro: "Optional Add-on",
          enterprise: "Fully Customizable Policy",
        },
      ],
    },
    {
      category: "Billing, Accounting & RRA Compliance",
      rows: [
        {
          name: "Consolidated Monthly Invoicing",
          tooltip: "One single clean invoice replaces dealing with 20+ different gym vendor invoices.",
          starter: true,
          pro: true,
          enterprise: true,
        },
        {
          name: "RRA EBM 18% VAT Invoicing",
          tooltip: "Officially certified Rwanda Revenue Authority electronic billing machine invoice for 100% tax deduction.",
          starter: true,
          pro: true,
          enterprise: "Custom ERP Tax Mapping",
        },
        {
          name: "Automated Provider Settlement",
          tooltip: "PolyFit verifies check-ins and executes payouts to gyms directly. Zero admin work for your finance team.",
          starter: true,
          pro: true,
          enterprise: "Full Settlement Audit Trail",
        },
        {
          name: "Payment Terms",
          tooltip: "Credit and payment terms available to certified corporate clients.",
          starter: "Prepaid / Net 15",
          pro: "Net 30 Days",
          enterprise: "Net 30/60 Days + Custom PO",
        },
      ],
    },
    {
      category: "Analytics, Administration & Integrations",
      rows: [
        {
          name: "HR Corporate Admin Portal",
          tooltip: "Central dashboard to manage employee rosters, eligibility, and track wellness engagement.",
          starter: "Basic Dashboard",
          pro: "Advanced Telemetry Hub",
          enterprise: "Role-Based Multi-Org Admin",
        },
        {
          name: "Bulk Roster Upload & Sync",
          tooltip: "Effortlessly import hundreds of employees using simple CSV templates or spreadsheets.",
          starter: "Manual CSV Upload",
          pro: "Automated CSV & Magic Links",
          enterprise: "Direct HRIS API & SFTP",
        },
        {
          name: "Real-time Check-In Telemetry",
          tooltip: "Live dashboard showing active employee visits, peak hours, and popular wellness categories.",
          starter: "Monthly Summary",
          pro: "Live Real-Time Feed",
          enterprise: "Live Feed + BI Webhooks",
        },
        {
          name: "Department Utilization Heatmaps",
          tooltip: "Analyze engagement across Engineering, Sales, Operations, and Regional Branches.",
          starter: false,
          pro: true,
          enterprise: true,
        },
        {
          name: "Single Sign-On (SAML / Okta / Azure AD)",
          tooltip: "Corporate enterprise authentication for seamless employee access with work credentials.",
          starter: false,
          pro: false,
          enterprise: true,
        },
      ],
    },
    {
      category: "Support & Account Management",
      rows: [
        {
          name: "Support Response SLA",
          tooltip: "Guaranteed initial response time from our dedicated operations team.",
          starter: "24-Hour Email",
          pro: "4-Hour WhatsApp & Email",
          enterprise: "1-Hour Dedicated Hotline",
        },
        {
          name: "Dedicated Customer Success Manager",
          tooltip: "An assigned PolyFit account director to ensure high employee activation and program success.",
          starter: false,
          pro: "Assigned Specialist",
          enterprise: "Senior Executive CSM",
        },
        {
          name: "Onsite Wellness Kickoff Days",
          tooltip: "PolyFit staff visits your office for physical wellness assessments, demos, and employee onboarding.",
          starter: false,
          pro: "1 Session / Year",
          enterprise: "Quarterly Wellness Days",
        },
        {
          name: "Platform Availability SLA",
          tooltip: "Contractual uptime guarantee for our verification infrastructure.",
          starter: "99.5%",
          pro: "99.8%",
          enterprise: "99.9% Financial-Backed",
        },
      ],
    },
  ];

  const renderValue = (val: string | boolean) => {
    if (typeof val === "boolean") {
      return val ? (
        <div className="w-5 h-5 rounded-full bg-accent-subtle text-accent flex items-center justify-center mx-auto border border-accent/20">
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      ) : (
        <div className="w-5 h-5 flex items-center justify-center mx-auto text-muted-foreground/60">
          <Minus className="w-3.5 h-3.5" />
        </div>
      );
    }
    return <span className="text-xs sm:text-sm font-semibold text-foreground">{val}</span>;
  };

  return (
    <section className="py-12 sm:py-16 bg-card border-t border-border" aria-labelledby="feature-comparison-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3 border border-accent/20">
            In-Depth Analysis
          </div>
          <h2 id="feature-comparison-heading" className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
            Compare Plan Features & Capabilities
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground">
            From emerging startups to 5,000+ employee enterprises, evaluate which tier best powers your corporate wellness strategy.
          </p>
        </div>

        {/* Comparison Matrix Container */}
        <div className="pf-comparison-container overflow-hidden rounded-[14px] border border-border shadow-xs bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px]">
              {/* Table Header */}
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th scope="col" className="p-4 sm:p-5 text-sm font-bold text-foreground w-2/5">
                    Plan Feature
                  </th>
                  <th scope="col" className="p-4 sm:p-5 text-center text-sm font-bold text-foreground w-1/5">
                    Starter
                  </th>
                  <th scope="col" className="p-4 sm:p-5 text-center text-sm font-bold text-foreground w-1/5 bg-accent-subtle/50 border-x border-accent/30">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Professional</span>
                      <span className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded font-extrabold shadow-2xs">
                        Popular
                      </span>
                    </div>
                  </th>
                  <th scope="col" className="p-4 sm:p-5 text-center text-sm font-bold text-foreground w-1/5">
                    Enterprise
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-border">
                {categories.map((cat, catIdx) => (
                  <React.Fragment key={catIdx}>
                    {/* Category Header Row */}
                    <tr className="bg-muted/70">
                      <td
                        colSpan={4}
                        className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-foreground"
                      >
                        {cat.category}
                      </td>
                    </tr>

                    {/* Feature Rows */}
                    {cat.rows.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4 sm:p-4 text-xs sm:text-sm font-medium text-foreground">
                          <div className="flex items-center gap-1.5">
                            <span>{row.name}</span>
                            {row.tooltip && (
                              <div className="relative inline-block group">
                                <button
                                  type="button"
                                  onClick={() => setOpenTooltip(openTooltip === row.name ? null : row.name)}
                                  className="text-muted-foreground/70 hover:text-foreground focus:outline-none cursor-help"
                                  aria-label={`More info on ${row.name}`}
                                >
                                  <HelpCircle className="w-3.5 h-3.5" />
                                </button>
                                {/* Hover tooltip for desktop */}
                                <div className="hidden group-hover:block absolute bottom-full left-0 mb-1.5 w-64 p-2 bg-primary text-primary-foreground text-[11px] rounded-[6px] shadow-lg z-20 pointer-events-none leading-relaxed">
                                  {row.tooltip}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 sm:p-4 text-center">
                          {renderValue(row.starter)}
                        </td>
                        <td className="p-4 sm:p-4 text-center bg-accent-subtle/20 border-x border-accent/20">
                          {renderValue(row.pro)}
                        </td>
                        <td className="p-4 sm:p-4 text-center">
                          {renderValue(row.enterprise)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
