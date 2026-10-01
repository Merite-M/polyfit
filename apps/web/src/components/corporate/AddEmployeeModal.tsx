"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  UserPlus,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  onEmployeeAdded: () => void;
  corporateDomain?: string;
}

export function AddEmployeeModal({
  isOpen,
  onClose,
  orgId,
  onEmployeeAdded,
  corporateDomain = "techcorp.rw",
}: AddEmployeeModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeIdExternal, setEmployeeIdExternal] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [tier, setTier] = useState<"basic" | "standard" | "premium" | "executive">("standard");
  const [status, setStatus] = useState<"active" | "frozen">("active");
  const [sendInvite, setSendInvite] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modern Web Guidance: Native <dialog> lifecycle synchronization
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Light dismiss when clicking backdrop
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  // Synchronize native Escape key cancel event
  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
    e.preventDefault();
    onClose();
  };

  const emailDomain = email.includes("@") ? email.split("@")[1].toLowerCase() : "";
  const isCorporateDomain = emailDomain === corporateDomain.toLowerCase();
  const isPersonalDomain = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com"].includes(emailDomain);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://polyfit-backend.onrender.com";

    try {
      await apiFetch(`${apiUrl}/api/organizations/${orgId}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          employee_id_external: employeeIdExternal.trim() || null,
          department: department.trim() || null,
          tier,
          status,
          send_invite: sendInvite,
        }),
      });

      onEmployeeAdded();
      onClose();
      // Reset form
      setFullName("");
      setEmail("");
      setEmployeeIdExternal("");
      setDepartment("Engineering");
      setTier("standard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to add employee. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      onCancel={handleCancel}
      className="pf-native-dialog p-0 bg-transparent text-[var(--text-primary,#0B1F33)]"
      aria-labelledby="add-employee-title"
    >
      <div className="relative w-full max-w-lg bg-[var(--surface,#FFFFFF)] rounded-2xl shadow-2xl border border-[var(--border,#E2E8F0)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--border,#E2E8F0)] flex items-center justify-between bg-[var(--surface-dim,#F7F9FC)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary,#0B1F33)] text-[var(--accent,#28D17C)] flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 id="add-employee-title" className="text-base font-bold text-[var(--primary,#0B1F33)]">
                Add Covered Employee
              </h2>
              <p className="text-xs text-[var(--text-secondary,#526173)]">
                Enroll employee into company wellness benefit plan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-[var(--text-muted,#8491A3)] hover:text-[var(--primary,#0B1F33)] hover:bg-[var(--surface,#FFFFFF)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FECACA] flex items-center gap-2 text-xs text-[#991B1B]"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="pf-form-field">
            <label htmlFor="employee-full-name" className="block text-xs font-semibold text-[var(--primary,#0B1F33)] mb-1.5">
              Full Name <span className="text-[var(--error,#EF4444)]">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted,#8491A3)]" />
              <input
                id="employee-full-name"
                name="fullName"
                type="text"
                required
                minLength={2}
                placeholder="e.g. Diane Gisa"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                aria-required="true"
                aria-describedby="name-error-hint"
                className="pf-form-input w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--border,#E2E8F0)] bg-[var(--surface,#FFFFFF)] text-xs font-medium text-[var(--text-primary,#0B1F33)] placeholder:text-[var(--text-muted,#8491A3)] focus:outline-none focus:border-[var(--accent,#28D17C)] focus:ring-1 focus:ring-[var(--accent,#28D17C)] transition-colors"
              />
            </div>
            <div id="name-error-hint" className="pf-form-hint-error text-[11px] font-medium text-[var(--error,#EF4444)] mt-1.5 items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>Please enter a valid employee name (at least 2 characters)</span>
            </div>
          </div>

          {/* Work Email */}
          <div className="pf-form-field">
            <label htmlFor="employee-work-email" className="block text-xs font-semibold text-[var(--primary,#0B1F33)] mb-1.5">
              Corporate Work Email <span className="text-[var(--error,#EF4444)]">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted,#8491A3)]" />
              <input
                id="employee-work-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={`e.g. diane.gisa@${corporateDomain}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-required="true"
                aria-describedby="email-feedback"
                className="pf-form-input w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[var(--border,#E2E8F0)] bg-[var(--surface,#FFFFFF)] text-xs font-medium text-[var(--text-primary,#0B1F33)] placeholder:text-[var(--text-muted,#8491A3)] focus:outline-none focus:border-[var(--accent,#28D17C)] focus:ring-1 focus:ring-[var(--accent,#28D17C)] transition-colors"
              />
            </div>

            {/* Error hint on :user-invalid */}
            <div id="email-error-hint" className="pf-form-hint-error text-[11px] font-medium text-[var(--error,#EF4444)] mt-1.5 items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>Please enter a valid email address (e.g. name@{corporateDomain})</span>
            </div>

            {/* Domain validation hints */}
            {email.includes("@") && (
              <div id="email-feedback" className="mt-1.5">
                {isCorporateDomain && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#006D3C]">
                    <CheckCircle2 className="w-3 h-3 text-[var(--accent,#28D17C)]" />
                    Verified company domain (@{corporateDomain})
                  </span>
                )}
                {isPersonalDomain && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B45309]">
                    <AlertTriangle className="w-3 h-3 text-[#F59E0B]" />
                    Warning: Personal email used instead of @{corporateDomain}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Employee ID External & Department */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="employee-external-id" className="block text-xs font-semibold text-[var(--primary,#0B1F33)] mb-1.5">
                Employee / Staff ID
              </label>
              <input
                id="employee-external-id"
                name="employeeIdExternal"
                type="text"
                placeholder="e.g. TC-890"
                value={employeeIdExternal}
                onChange={(e) => setEmployeeIdExternal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border,#E2E8F0)] bg-[var(--surface,#FFFFFF)] text-xs font-medium text-[var(--text-primary,#0B1F33)] placeholder:text-[var(--text-muted,#8491A3)] focus:outline-none focus:border-[var(--accent,#28D17C)] focus:ring-1 focus:ring-[var(--accent,#28D17C)] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="employee-department" className="block text-xs font-semibold text-[var(--primary,#0B1F33)] mb-1.5">
                Department
              </label>
              <select
                id="employee-department"
                name="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border,#E2E8F0)] bg-[var(--surface,#FFFFFF)] text-xs font-medium text-[var(--text-primary,#0B1F33)] focus:outline-none focus:border-[var(--accent,#28D17C)] focus:ring-1 focus:ring-[var(--accent,#28D17C)]"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="HR">HR / People</option>
                <option value="Legal">Legal & Compliance</option>
              </select>
            </div>
          </div>

          {/* Tier & Initial Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="employee-benefit-tier" className="block text-xs font-semibold text-[var(--primary,#0B1F33)] mb-1.5">
                Benefit Tier
              </label>
              <select
                id="employee-benefit-tier"
                name="tier"
                value={tier}
                onChange={(e) => setTier(e.target.value as "basic" | "standard" | "premium" | "executive")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border,#E2E8F0)] bg-[var(--surface,#FFFFFF)] text-xs font-medium text-[var(--text-primary,#0B1F33)] focus:outline-none focus:border-[var(--accent,#28D17C)] focus:ring-1 focus:ring-[var(--accent,#28D17C)]"
              >
                <option value="basic">Basic (4 visits/mo • 20% co-pay)</option>
                <option value="standard">Standard (8 visits/mo • 15% co-pay)</option>
                <option value="premium">Premium (20 visits/mo • 100% funded)</option>
                <option value="executive">Executive (16 visits/mo • 100% funded • All Venues)</option>
              </select>
            </div>

            <div>
              <label htmlFor="employee-initial-status" className="block text-xs font-semibold text-[var(--primary,#0B1F33)] mb-1.5">
                Initial Status
              </label>
              <select
                id="employee-initial-status"
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "frozen")}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border,#E2E8F0)] bg-[var(--surface,#FFFFFF)] text-xs font-medium text-[var(--text-primary,#0B1F33)] focus:outline-none focus:border-[var(--accent,#28D17C)] focus:ring-1 focus:ring-[var(--accent,#28D17C)]"
              >
                <option value="active">Active (Immediate network pass)</option>
                <option value="frozen">Frozen (Hold access)</option>
              </select>
            </div>
          </div>

          {/* Send Invite Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="sendInvite"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
                className="rounded border-[var(--border,#CBD5E1)] text-[var(--accent,#28D17C)] focus:ring-[var(--accent,#28D17C)]"
              />
              <span className="text-xs text-[var(--text-secondary,#526173)]">
                Send welcome email invitation with mobile pass setup instructions
              </span>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[var(--border,#E2E8F0)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary,#526173)] hover:text-[var(--primary,#0B1F33)] cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[var(--primary,#0B1F33)] text-white text-xs font-semibold hover:bg-[var(--primary-container,#142C44)] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Enrolling...</span>
                </>
              ) : (
                <>
                  <span>Enroll Employee</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
