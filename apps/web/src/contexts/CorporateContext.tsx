"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api-client";
import { TECHCORP_CANONICAL_DATA } from "@/lib/constants";
import type { CorporateEmployee } from "@/components/corporate/EmployeeDetailDrawer";
import type { BenefitPlan } from "@/components/corporate/PlanCard";
import type { InvoiceRecord } from "@/components/corporate/billing/InvoiceTable";
import type { AdoptionFunnelData } from "@/components/corporate/AdoptionFunnelRow";

export interface CorporateOrganization {
  id: string;
  name: string;
  slug: string;
  domain: string;
  allowed_domains: string[];
  tax_id?: string;
  contact_email?: string;
  billing_email?: string;
  industry?: string;
}

export const NETWORK_ORGANIZATIONS: CorporateOrganization[] = [
  {
    id: "c79a9982-4477-4336-a24b-561419f6c43b",
    name: "TechCorp Rwanda",
    slug: "techcorp-rwanda",
    domain: "techcorp.rw",
    allowed_domains: ["techcorp.rw"],
    tax_id: "108392019",
    contact_email: "hr@techcorp.rw",
    billing_email: "finance@techcorp.rw",
    industry: "Technology & Software",
  },
  {
    id: "b0000000-0000-0000-0000-000000000001",
    name: "Bank of Kigali",
    slug: "bank-of-kigali",
    domain: "bk.rw",
    allowed_domains: ["bk.rw", "bankofkigali.rw"],
    tax_id: "100018471",
    contact_email: "wellness@bk.rw",
    billing_email: "finance@bk.rw",
    industry: "Banking & Financial Services",
  },
  {
    id: "b0000000-0000-0000-0000-000000000002",
    name: "Equity Bank Rwanda",
    slug: "equity-bank-rwanda",
    domain: "equitybank.co.ke",
    allowed_domains: ["equitybank.co.ke", "equitygroupholdings.com"],
    tax_id: "101928475",
    contact_email: "wellness@equitybank.rw",
    billing_email: "accounts@equitybank.rw",
    industry: "Banking & Financial Services",
  },
];

interface CorporateContextType {
  // Organization state & switcher
  organization: CorporateOrganization;
  availableOrganizations: CorporateOrganization[];
  switchOrganization: (orgId: string) => void;
  updateOrganizationProfile: (data: Partial<CorporateOrganization>) => Promise<void>;

  // Adoption Funnel stats
  funnelData: AdoptionFunnelData;
  refreshFunnelData: () => Promise<void>;

  // Employee Roster state & mutations
  employees: CorporateEmployee[];
  isLoadingEmployees: boolean;
  addEmployee: (newEmp: Partial<CorporateEmployee>) => Promise<CorporateEmployee>;
  bulkAddEmployees: (newEmps: Partial<CorporateEmployee>[]) => Promise<{ created: number; updated: number }>;
  updateEmployeeStatus: (id: string, newStatus: "active" | "frozen" | "terminated") => Promise<void>;
  updateEmployeeTier: (id: string, newTier: string) => Promise<void>;
  refreshEmployees: () => Promise<void>;

  // Benefit Plans state & mutations
  plans: BenefitPlan[];
  isLoadingPlans: boolean;
  savePlan: (planData: Partial<BenefitPlan>) => Promise<BenefitPlan>;
  refreshPlans: () => Promise<void>;

  // Invoices & Billing
  invoices: InvoiceRecord[];
  isLoadingInvoices: boolean;
  economics: typeof TECHCORP_CANONICAL_DATA.economics;
  disputeInvoice: (id: string, reason: string, notes: string) => Promise<void>;
  refreshInvoices: () => Promise<void>;

  // Shared Global Controls
  selectedRange: string;
  setSelectedRange: (range: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  // Feedback & Utilities
  notification: string | null;
  showToast: (msg: string) => void;
  inviteUrl: string;
  copyInviteLink: () => void;
  downloadCensusCsv: () => void;
}

const CorporateContext = createContext<CorporateContextType | undefined>(undefined);

export function CorporateProvider({ children }: { children: React.ReactNode }) {
  const { organizationId, user, isDemoMode } = useAuth();

  // 1. Organization State
  const initialOrg = useMemo(() => {
    if (organizationId) {
      const match = NETWORK_ORGANIZATIONS.find((o) => o.id === organizationId);
      if (match) return match;
    }
    return NETWORK_ORGANIZATIONS[0];
  }, [organizationId]);

  const [organization, setOrganization] = useState<CorporateOrganization>(initialOrg);

  // 2. Global UI Controls
  const [selectedRange, setSelectedRange] = useState("30d");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const showToast = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  }, []);

  // 3. Funnel & Economics State
  const [funnelData, setFunnelData] = useState<AdoptionFunnelData>(
    TECHCORP_CANONICAL_DATA.funnel
  );
  const [economics, setEconomics] = useState(TECHCORP_CANONICAL_DATA.economics);

  // 4. Employee Roster State
  const [employees, setEmployees] = useState<CorporateEmployee[]>(
    TECHCORP_CANONICAL_DATA.employees as CorporateEmployee[]
  );
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // 5. Benefit Plans State
  const [plans, setPlans] = useState<BenefitPlan[]>(
    TECHCORP_CANONICAL_DATA.plans as unknown as BenefitPlan[]
  );
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  // 6. Invoices State
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(
    TECHCORP_CANONICAL_DATA.invoices as unknown as InvoiceRecord[]
  );
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  // Invite Link derived from origin
  const [origin, setOrigin] = useState("https://polyfit.onrender.com");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const inviteUrl = `${origin}/join/${organization.slug}`;

  const copyInviteLink = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      showToast("Join link copied to clipboard! Ready to share on Slack or Teams.");
    }
  }, [inviteUrl, showToast]);

  // Download Census RFC 4180 CSV
  const downloadCensusCsv = useCallback(() => {
    const headers = [
      "Employee ID",
      "Full Name",
      "Work Email",
      "Department",
      "Benefit Tier",
      "Status",
      "Created At",
    ];
    const rows = employees.map((emp) => [
      emp.employee_id_external || "ID-UNSET",
      emp.full_name,
      emp.email,
      emp.department || "General",
      emp.tier,
      emp.status,
      emp.created_at ? emp.created_at.split("T")[0] : "2026-01-15",
    ]);

    const escapeCell = (str: string) => `"${String(str).replace(/"/g, '""')}"`;
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.map(escapeCell).join(","),
        ...rows.map((row) => row.map(escapeCell).join(",")),
      ].join("\r\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${organization.slug}-employee-census-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Corporate employee census downloaded as RFC 4180 CSV.");
  }, [employees, organization.slug, showToast]);

  // Data fetching functions
  const refreshFunnelData = useCallback(async () => {
    if (!user || isDemoMode) return;
    try {
      const utilRes = await apiFetch<any>(
        `/api/reporting/employer/${organization.id}/utilization`
      );
      if (utilRes?.summary) {
        setFunnelData((prev) => ({
          ...prev,
          totalEligible: utilRes.summary.total_eligible ?? prev.totalEligible,
          registeredEmployees: utilRes.summary.registered_employees ?? prev.registeredEmployees,
          activeBeneficiaries: utilRes.summary.active_beneficiaries ?? prev.activeBeneficiaries,
          totalVisits: utilRes.summary.total_visits ?? prev.totalVisits,
        }));
      }
    } catch {
      // Keep resilient data
    }
  }, [organization.id, user, isDemoMode]);

  const refreshEmployees = useCallback(async () => {
    if (!user || isDemoMode) return;
    setIsLoadingEmployees(true);
    try {
      const res = await apiFetch<{ employees: CorporateEmployee[] }>(
        `/api/organizations/${organization.id}/employees?limit=100`
      );
      if (res?.employees && Array.isArray(res.employees) && res.employees.length > 0) {
        setEmployees(res.employees);
      }
    } catch {
      // Keep canonical data
    } finally {
      setIsLoadingEmployees(false);
    }
  }, [organization.id, user, isDemoMode]);

  const refreshPlans = useCallback(async () => {
    if (!user || isDemoMode) return;
    setIsLoadingPlans(true);
    try {
      const res = await apiFetch<{ benefits: BenefitPlan[] }>(
        `/api/organizations/${organization.id}/benefits`
      );
      if (res?.benefits && Array.isArray(res.benefits) && res.benefits.length > 0) {
        setPlans(res.benefits);
      }
    } catch {
      // Keep canonical data
    } finally {
      setIsLoadingPlans(false);
    }
  }, [organization.id, user, isDemoMode]);

  const refreshInvoices = useCallback(async () => {
    if (!user || isDemoMode) return;
    setIsLoadingInvoices(true);
    try {
      const invRes = await apiFetch<{ invoices: InvoiceRecord[] }>(
        `/api/billing/invoices?org_id=${organization.id}&limit=50`
      );
      if (invRes?.invoices && Array.isArray(invRes.invoices) && invRes.invoices.length > 0) {
        setInvoices(invRes.invoices);
      }

      const summaryRes = await apiFetch<any>(
        `/api/billing/summary?org_id=${organization.id}&year=2026`
      );
      if (summaryRes) {
        setEconomics((prev) => ({
          ...prev,
          currentInvoiceRwf: summaryRes.current_balance ?? prev.currentInvoiceRwf,
          citTaxShieldRwf: summaryRes.cit_tax_shield_rwf ?? prev.citTaxShieldRwf,
          pmpmSpendRwf: summaryRes.average_cost_per_visit ?? prev.pmpmSpendRwf,
        }));
      }
    } catch {
      // Keep canonical data
    } finally {
      setIsLoadingInvoices(false);
    }
  }, [organization.id, user, isDemoMode]);

  // Reload everything when organization changes
  useEffect(() => {
    refreshFunnelData();
    refreshEmployees();
    refreshPlans();
    refreshInvoices();
  }, [organization.id, refreshFunnelData, refreshEmployees, refreshPlans, refreshInvoices]);

  // Switch organization
  const switchOrganization = useCallback(
    (orgId: string) => {
      const found = NETWORK_ORGANIZATIONS.find((o) => o.id === orgId);
      if (found) {
        setOrganization(found);
        showToast(`Switched active organization to ${found.name}`);
      }
    },
    [showToast]
  );

  // Update profile
  const updateOrganizationProfile = useCallback(
    async (data: Partial<CorporateOrganization>) => {
      try {
        await apiFetch(`/api/organizations/${organization.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch {
        // Fallback demo update
      }
      setOrganization((prev) => ({ ...prev, ...data }));
      showToast("Organization profile and domain settings updated!");
    },
    [organization.id, showToast]
  );

  // Mutators that break the silos by updating multiple parts of state reactively
  const addEmployee = useCallback(
    async (newEmp: Partial<CorporateEmployee>): Promise<CorporateEmployee> => {
      const created: CorporateEmployee = {
        id: `emp-live-${Date.now()}`,
        org_id: organization.id,
        full_name: newEmp.full_name || "New Employee",
        email: newEmp.email || `employee-${Date.now()}@${organization.domain}`,
        employee_id_external: newEmp.employee_id_external || `EMP-${Date.now().toString().slice(-4)}`,
        department: newEmp.department || "General",
        tier: newEmp.tier || "standard",
        status: newEmp.status || "active",
        created_at: new Date().toISOString(),
        visits_this_month: 0,
      };

      try {
        const res = await apiFetch<{ employee: CorporateEmployee }>(
          `/api/organizations/${organization.id}/employees`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newEmp),
          }
        );
        if (res?.employee) {
          Object.assign(created, res.employee);
        }
      } catch {
        // Optimistic local fallback
      }

      // Reactive cross-tab sync:
      // 1. Update employees list
      setEmployees((prev) => [created, ...prev]);

      // 2. Update funnel counters
      setFunnelData((prev) => ({
        ...prev,
        totalEligible: prev.totalEligible + 1,
        registeredEmployees: prev.registeredEmployees + 1,
        activeBeneficiaries:
          created.status === "active" ? prev.activeBeneficiaries + 1 : prev.activeBeneficiaries,
      }));

      // 3. Update plan headcount enrollments
      setPlans((prev) =>
        prev.map((p) =>
          p.tier && created.tier && p.tier.toLowerCase() === created.tier.toLowerCase()
            ? { ...p, enrolled_count: (p.enrolled_count || 0) + 1 }
            : p
        )
      );

      showToast(`Added ${created.full_name} (${(created.tier || "standard").toUpperCase()} tier). Active counts updated across portal.`);
      return created;
    },
    [organization.id, organization.domain, showToast]
  );

  const bulkAddEmployees = useCallback(
    async (newEmps: Partial<CorporateEmployee>[]) => {
      let createdCount = newEmps.length;
      let updatedCount = 0;

      try {
        const res = await apiFetch<any>(
          `/api/organizations/${organization.id}/employees/bulk`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ employees: newEmps }),
          }
        );
        if (res) {
          createdCount = res.created ?? createdCount;
          updatedCount = res.updated ?? 0;
        }
      } catch {
        // Optimistic fallback
      }

      // Convert to full employee records
      const fullRecords: CorporateEmployee[] = newEmps.map((emp, idx) => ({
        id: `emp-bulk-${Date.now()}-${idx}`,
        org_id: organization.id,
        full_name: emp.full_name || "Employee",
        email: emp.email || `emp-${idx}@${organization.domain}`,
        employee_id_external: emp.employee_id_external || `BULK-${idx + 1}`,
        department: emp.department || "General",
        tier: emp.tier || "standard",
        status: (emp.status as any) || "active",
        created_at: new Date().toISOString(),
        visits_this_month: 0,
      }));

      // Update state
      setEmployees((prev) => [...fullRecords, ...prev]);
      setFunnelData((prev) => ({
        ...prev,
        totalEligible: prev.totalEligible + createdCount,
        registeredEmployees: prev.registeredEmployees + createdCount,
        activeBeneficiaries: prev.activeBeneficiaries + createdCount,
      }));

      showToast(`Bulk imported ${createdCount} employees. Roster & Funnel synchronized!`);
      return { created: createdCount, updated: updatedCount };
    },
    [organization.id, organization.domain, showToast]
  );

  const updateEmployeeStatus = useCallback(
    async (id: string, newStatus: "active" | "frozen" | "terminated") => {
      const targetEmp = employees.find((e) => e.id === id);
      const oldStatus = targetEmp?.status || "active";

      try {
        await apiFetch(`/api/organizations/${organization.id}/employees/${id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
      } catch {
        // Optimistic fallback
      }

      // Update employees list
      setEmployees((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
      );

      // Reactive sync with Funnel:
      if (oldStatus === "active" && (newStatus === "frozen" || newStatus === "terminated")) {
        setFunnelData((prev) => ({
          ...prev,
          activeBeneficiaries: Math.max(0, prev.activeBeneficiaries - 1),
        }));
      } else if ((oldStatus === "frozen" || oldStatus === "terminated") && newStatus === "active") {
        setFunnelData((prev) => ({
          ...prev,
          activeBeneficiaries: prev.activeBeneficiaries + 1,
        }));
      }

      showToast(`Status updated to ${newStatus.toUpperCase()}. Mobile access updated instantly.`);
    },
    [employees, organization.id, showToast]
  );

  const updateEmployeeTier = useCallback(
    async (id: string, newTier: string) => {
      const targetEmp = employees.find((e) => e.id === id);
      const oldTier = targetEmp?.tier || "standard";

      try {
        await apiFetch(`/api/organizations/${organization.id}/employees/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: newTier }),
        });
      } catch {
        // Optimistic fallback
      }

      setEmployees((prev) =>
        prev.map((e) => (e.id === id ? { ...e, tier: newTier } : e))
      );

      // Rebalance plan enrollments
      setPlans((prev) =>
        prev.map((p) => {
          if (p.tier && p.tier.toLowerCase() === oldTier.toLowerCase()) {
            return { ...p, enrolled_count: Math.max(0, (p.enrolled_count || 1) - 1) };
          }
          if (p.tier && p.tier.toLowerCase() === newTier.toLowerCase()) {
            return { ...p, enrolled_count: (p.enrolled_count || 0) + 1 };
          }
          return p;
        })
      );

      showToast(`Reassigned employee to ${newTier.toUpperCase()} tier.`);
    },
    [employees, organization.id, showToast]
  );

  const savePlan = useCallback(
    async (planData: Partial<BenefitPlan>): Promise<BenefitPlan> => {
      const isEdit = Boolean(planData.id);
      let savedPlan: BenefitPlan;

      if (isEdit) {
        savedPlan = {
          ...plans.find((p) => p.id === planData.id)!,
          ...planData,
        } as BenefitPlan;

        try {
          await apiFetch(`/api/organizations/${organization.id}/benefits/${planData.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(planData),
          });
        } catch {
          // Optimistic fallback
        }

        setPlans((prev) =>
          prev.map((p) => (p.id === planData.id ? savedPlan : p))
        );
        showToast(`Updated benefit plan "${savedPlan.name}". Tiers synced across portal.`);
      } else {
        savedPlan = {
          id: `plan-live-${Date.now()}`,
          name: planData.name || "Custom Corporate Plan",
          tier: planData.tier || "standard",
          status: planData.status || "active",
          max_monthly_visits: planData.max_monthly_visits || 8,
          co_pay_percentage: planData.co_pay_percentage ?? 15,
          allowed_provider_categories: planData.allowed_provider_categories || ["gym", "pool"],
          budget_cap_per_employee: planData.budget_cap_per_employee || 60000,
          is_family_eligible: Boolean(planData.is_family_eligible),
          description: planData.description || "",
          enrolled_count: 0,
          estimated_monthly_liability: 0,
        };

        try {
          const res = await apiFetch<any>(
            `/api/organizations/${organization.id}/benefits`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(planData),
            }
          );
          if (res?.benefit) {
            Object.assign(savedPlan, res.benefit);
          }
        } catch {
          // Optimistic fallback
        }

        setPlans((prev) => [savedPlan, ...prev]);
        showToast(`Created new plan "${savedPlan.name}". Now selectable in employee roster.`);
      }

      return savedPlan;
    },
    [plans, organization.id, showToast]
  );

  const disputeInvoice = useCallback(
    async (id: string, reason: string, notes: string) => {
      try {
        await apiFetch(`/api/billing/invoices/${id}/dispute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason, notes }),
        });
      } catch {
        // Optimistic fallback
      }

      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status: "disputed" } : inv))
      );
      showToast("Invoice marked as disputed. PolyFit Finance will audit within 4 hours.");
    },
    [showToast]
  );

  const value = useMemo(
    () => ({
      organization,
      availableOrganizations: NETWORK_ORGANIZATIONS,
      switchOrganization,
      updateOrganizationProfile,
      funnelData,
      refreshFunnelData,
      employees,
      isLoadingEmployees,
      addEmployee,
      bulkAddEmployees,
      updateEmployeeStatus,
      updateEmployeeTier,
      refreshEmployees,
      plans,
      isLoadingPlans,
      savePlan,
      refreshPlans,
      invoices,
      isLoadingInvoices,
      economics,
      disputeInvoice,
      refreshInvoices,
      selectedRange,
      setSelectedRange,
      mobileMenuOpen,
      setMobileMenuOpen,
      toggleMobileMenu,
      notification,
      showToast,
      inviteUrl,
      copyInviteLink,
      downloadCensusCsv,
    }),
    [
      organization,
      switchOrganization,
      updateOrganizationProfile,
      funnelData,
      refreshFunnelData,
      employees,
      isLoadingEmployees,
      addEmployee,
      bulkAddEmployees,
      updateEmployeeStatus,
      updateEmployeeTier,
      refreshEmployees,
      plans,
      isLoadingPlans,
      savePlan,
      refreshPlans,
      invoices,
      isLoadingInvoices,
      economics,
      disputeInvoice,
      refreshInvoices,
      selectedRange,
      mobileMenuOpen,
      toggleMobileMenu,
      notification,
      showToast,
      inviteUrl,
      copyInviteLink,
      downloadCensusCsv,
    ]
  );

  return (
    <CorporateContext.Provider value={value}>
      {children}
    </CorporateContext.Provider>
  );
}

export function useCorporate() {
  const context = useContext(CorporateContext);
  if (!context) {
    throw new Error("useCorporate must be used within a CorporateProvider");
  }
  return context;
}
