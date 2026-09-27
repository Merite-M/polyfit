"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface PricingFaqProps {
  onOpenLeadForm?: (type: 'employer' | 'provider') => void;
}

export default function PricingFaq({ onOpenLeadForm }: PricingFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does PolyFit's consolidated billing and RRA EBM 18% VAT invoicing work?",
      answer:
        "Instead of your accounting department managing dozens of vendor agreements, receipts, and invoices with individual gyms, swimming pools, and yoga studios, PolyFit consolidates all network activity into a single monthly statement. We issue a certified Rwanda Revenue Authority (RRA) Electronic Billing Machine (EBM) invoice with 18% VAT itemized, making your corporate wellness expenditure 100% compliant and tax-deductible as an allowable business expense.",
    },
    {
      question: "What is PolyFit's anti-passback technology and how does it prevent pass sharing?",
      answer:
        "PolyFit eliminates pass-sharing fraud using dynamic cryptographic QR passes that refresh every 60 seconds on the employee's phone, preventing screenshots or unauthorized forwarding. When scanned at a partner facility, our backend verification engine performs instant geo-proximity and mandatory cooldown checks, guaranteeing that corporate benefits are solely enjoyed by verified active employees.",
    },
    {
      question: "Can our organization subsidize 50% or 100% of the employee benefit?",
      answer:
        "Yes, absolutely. PolyFit supports fully employer-funded packages (100% company-paid benefit), structured co-pay arrangements (e.g., employer contributes 50–70% and employees cover the rest through voluntary payroll deduction), or pre-tax elective wellness pools. We configure the exact subsidy model that aligns with your HR budget.",
    },
    {
      question: "How quickly can we roll out PolyFit to our employees?",
      answer:
        "Implementation takes less than 48 hours. Your HR administrator simply uploads the active employee roster using our bulk CSV template or connects via HRIS. Employees instantly receive an automated welcome link via SMS or email to activate their digital wallet pass on any smartphone without downloading bloated software.",
    },
    {
      question: "What is the minimum contract commitment or pilot duration?",
      answer:
        "We offer a 90-day pilot agreement for corporate teams with 50+ staff so HR leadership can observe real-world engagement, employee sentiment, and health analytics before making a full annual commitment. For organizations ready for annual enrollment, we provide a 15% upfront discount and locked partner pricing.",
    },
    {
      question: "How are independent wellness providers vetted, monitored, and compensated?",
      answer:
        "Every wellness partner—from luxury fitness centers and heated lap pools to boutique yoga studios—undergoes rigorous inspection for hygiene standards, certified trainers, and safety equipment. PolyFit acts as the trusted infrastructure layer, tracking verified employee check-ins and executing automated settlement payouts directly to providers every month.",
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-12 sm:py-16 bg-[#F8FAFC] border-t border-[#E2E8F0]" aria-labelledby="pricing-faq-heading">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8FBF1] text-[#0E6245] text-xs font-bold uppercase tracking-wider mb-3">
            Common Inquiries
          </div>
          <h2 id="pricing-faq-heading" className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33] tracking-tight">
            Frequently Asked Questions by Employers
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#64748B]">
            Everything HR, procurement, and finance leaders need to know before onboarding their team.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white border border-[#E2E8F0] rounded-[14px] overflow-hidden transition-all duration-150 shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28D17C]"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-[#0B1F33]">
                    {faq.question}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full bg-[#F1F5F9] flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 bg-[#E8FBF1] text-[#28D17C]" : "text-[#64748B]"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-[#475569] leading-relaxed border-t border-[#F1F5F9]">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Still Have Questions Box */}
        <div className="mt-10 text-center bg-white border border-[#E2E8F0] rounded-[14px] p-6 sm:p-8">
          <h3 className="text-base font-bold text-[#0B1F33]">
            Have custom contract requirements or regional office branches?
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B] max-w-xl mx-auto mt-1 mb-4">
            Our enterprise advisory team will design a customized multi-city benefit package matching your specific headcount and wellness objectives.
          </p>
          <button
            type="button"
            onClick={() => onOpenLeadForm?.('employer')}
            className="inline-flex items-center justify-center px-6 py-2.5 bg-[#28D17C] hover:bg-[#22C55E] text-[#0B1F33] text-xs sm:text-sm font-bold rounded-[10px] shadow-sm transition-all"
          >
            Speak With Our Corporate Team
          </button>
        </div>
      </div>
    </section>
  );
}
