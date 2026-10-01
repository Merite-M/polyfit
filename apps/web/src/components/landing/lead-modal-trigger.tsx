"use client";

import React from "react";
import { useLeadModal, LeadFormType } from "@/lib/lead-modal";

interface LeadModalTriggerProps {
  type?: LeadFormType;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function LeadModalTrigger({
  type = "employer",
  children,
  className,
  ariaLabel,
}: LeadModalTriggerProps) {
  const open = useLeadModal((state) => state.open);

  return (
    <button
      type="button"
      onClick={() => open(type)}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </button>
  );
}

export default LeadModalTrigger;
