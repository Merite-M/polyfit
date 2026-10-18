"use client";

import React from "react";
import { useLeadModal, LeadFormType } from "@/lib/lead-modal";

interface LeadModalTriggerProps {
  type?: LeadFormType;
  intent?: boolean;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function LeadModalTrigger({
  type = "employer",
  intent = true,
  children,
  className,
  ariaLabel,
}: LeadModalTriggerProps) {
  const open = useLeadModal((state) => state.open);
  const openIntent = useLeadModal((state) => state.openIntent);

  const handleClick = () => {
    if (intent) {
      openIntent();
    } else {
      open(type);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </button>
  );
}

export default LeadModalTrigger;

