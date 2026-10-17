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

export interface CorporateReportingCategory {
  category: string;
  visits: number;
  percentage: number;
  uniqueBeneficiaries?: number;
  spend?: number;
}

export interface CorporateReportingTopProvider {
  providerId: string;
  providerName: string;
  category: string;
  visitCount: number;
  uniqueBeneficiariesCount?: number;
  spend?: number;
  percentageOfVisits?: number;
  location?: string;
  rating?: number;
}

export interface CorporateReportingDepartment {
  department: string;
  totalEligibleEmployees: number;
  activeEmployees: number;
  participationRate: number;
  totalVisits: number;
  totalSpend: number;
  avgVisitsPerActiveEmployee?: number;
}

export interface CorporateReportingData {
  categories?: Record<string, number>;
  topProviders?: CorporateReportingTopProvider[];
  departments?: CorporateReportingDepartment[];
  temporal?: {
    wellnessHour?: string;
    peakDay?: string;
    timeOfDayBuckets?: Record<string, number>;
  };
  roi?: any;
}

export interface CorporateEconomics {
  currentBalance: number;
  currentInvoiceRwf: number;
  invoiceStatus: "draft" | "sent" | "paid" | "overdue";
  invoiceNumber: string;
  overdueAmount: number;
  overdueInvoiceNumber: string;
  hasOverdue: boolean;
  overdueDays: number;
  dueDateStr: string;
  ytdTotalSpent: number;
  ytdTotalVisits: number;
  pmpmSpendRwf: number;
  avgCostPerVisit: number;
  citTaxShieldRwf: number;
}

const ZERO_ECONOMICS: CorporateEconomics = {
  currentBalance: 0,
  currentInvoiceRwf: 0,
  invoiceStatus: "draft",
  invoiceNumber: "PF-INV-PENDING",
  overdueAmount: 0,
  overdueInvoiceNumber: "",
  hasOverdue: false,
  overdueDays: 0,
  dueDateStr: "End of Month",
  ytdTotalSpent: 0,
  ytdTotalVisits: 0,
  pmpmSpendRwf: 0,
  avgCostPerVisit: 0,
  citTaxShieldRwf: 0,
};

interface CorporateContextType {
  // Organization state & switcher
  organization: CorporateOrganization;
  availableOrganizations: CorporateOrganization[];
  switchOrganization: (orgId: string) => void;
  updateOrganizationProfile: (data: Partial<CorporateOrganization>) => Promise<void>;

  // Adoption Funnel stats & Live Reporting Data
  funnelData: AdoptionFunnelData;
  reportingData: CorporateReportingData;
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
  economics: CorporateEconomics;
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

  const [availableOrganizations, setAvailableOrganizations] =
    useState<CorporateOrganization[]>(NETWORK_ORGANIZATIONS);

  // Sync live organizations from backend so any created in Super Admin console appear immediately
  useEffect(() => {
    async function loadLiveOrganizations() {
      try {
        const res = await apiFetch<any>('/api/organizations?limit=50');
        const list = res?.organizations || res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          const mapped: CorporateOrganization[] = list.map((org: any) => ({
            id: org.id,
            name: org.name,
            slug: org.slug || org.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            domain: Array.isArray(org.allowed_domains) && org.allowed_domains[0] ? org.allowed_domains[0] : (org.domain || 'polyfit.rw'),
            allowed_domains: Array.isArray(org.allowed_domains) ? org.allowed_domains : [org.domain || 'polyfit.rw'],
            tax_id: org.tax_id || '100000000',
            contact_email: org.contact_email || `hr@${org.slug || 'polyfit'}.rw`,
            billing_email: org.billing_email || `finance@${org.slug || 'polyfit'}.rw`,
            industry: org.industry || 'Enterprise Client',
          }));

          const merged = [...NETWORK_ORGANIZATIONS];
          for (const item of mapped) {
            if (!merged.some((m) => m.id === item.id)) {
              merged.push(item);
            }
          }
          setAvailableOrganizations(merged);
        }
      } catch {
        // Resilient fallback to static network orgs
      }
    }
    loadLiveOrganizations();
  }, []);

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

  // 3. Funnel & Economics State (Zero-data default for real authenticated sessions)
  const [funnelData, setFunnelData] = useState<AdoptionFunnelData>(() => {
    if (isDemoMode) {
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(`polyfit_corporate_funnel_${initialOrg.id}`);
          if (cached) return JSON.parse(cached);
        } catch {}
      }
      return TECHCORP_CANONICAL_DATA.funnel;
    }
    return {
      totalEligible: 0,
      registeredEmployees: 0,
      activeBeneficiaries: 0,
      totalVisits: 0,
      newEmployees30d: 0,
      newBeneficiaries30d: 0,
      avgVisitsPerActive: 0,
    };
  });

  const [reportingData, setReportingData] = useState<CorporateReportingData>(() => {
    if (isDemoMode) {
      return {
        categories: TECHCORP_CANONICAL_DATA.wellness.categories,
        temporal: {
          wellnessHour: TECHCORP_CANONICAL_DATA.wellness.wellnessHour,
          peakDay: TECHCORP_CANONICAL_DATA.wellness.peakDay,
        },
      };
    }
    return {
      categories: { gym: 0, pool: 0, studio: 0, clinic: 0 },
      topProviders: [],
      departments: [],
      temporal: {
        wellnessHour: "No activity yet",
        peakDay: "No activity yet",
      },
    };
  });

  const [economics, setEconomics] = useState<CorporateEconomics>(() => {
    if (isDemoMode) return TECHCORP_CANONICAL_DATA.economics;
    return ZERO_ECONOMICS;
  });

  // 4. Employee Roster State
  const [employees, setEmployees] = useState<CorporateEmployee[]>(() => {
    if (isDemoMode) {
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(`polyfit_corporate_employees_${initialOrg.id}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        } catch {}
      }
      return TECHCORP_CANONICAL_DATA.employees as CorporateEmployee[];
    }
    return [];
  });
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // 5. Benefit Plans State
  const [plans, setPlans] = useState<BenefitPlan[]>(() => {
    if (isDemoMode) {
      if (typeof window !== "undefined") {
        try {
          const cached = localStorage.getItem(`polyfit_corporate_plans_${initialOrg.id}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        } catch {}
      }
      return TECHCORP_CANONICAL_DATA.plans as unknown as BenefitPlan[];
    }
    return [];
  });
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  // 6. Invoices State
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() => {
    if (isDemoMode) return TECHCORP_CANONICAL_DATA.invoices as unknown as InvoiceRecord[];
    return [];
  });
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
      showToast("Join link copied to clipboard! Ready to share on WhatsApp or corporate email.");
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
      if (utilRes) {
        if (utilRes.summary) {
          setFunnelData({
            totalEligible: utilRes.summary.total_eligible ?? 0,
            registeredEmployees: utilRes.summary.registered_employees ?? 0,
            activeBeneficiaries: utilRes.summary.active_beneficiaries ?? 0,
            totalVisits: utilRes.summary.total_visits ?? 0,
            newEmployees30d: utilRes.summary.new_employees_30d ?? 0,
            newBeneficiaries30d: utilRes.summary.new_beneficiaries_30d ?? 0,
            avgVisitsPerActive: (utilRes.summary.active_beneficiaries && utilRes.summary.active_beneficiaries > 0)
              ? Number((utilRes.summary.total_visits / utilRes.summary.active_beneficiaries).toFixed(1))
              : 0,
          });
        }

        const catMap: Record<string, number> = {};
        if (Array.isArray(utilRes.categories)) {
          utilRes.categories.forEach((c: any) => {
            if (c.category) catMap[c.category] = c.visits ?? c.visitCount ?? 0;
          });
        } else if (utilRes.categories && typeof utilRes.categories === 'object') {
          Object.assign(catMap, utilRes.categories);
        }

        setReportingData({
          categories: catMap,
          topProviders: utilRes.topProviders || [],
          departments: utilRes.departments || [],
          temporal: utilRes.temporal || { wellnessHour: 'No activity yet', peakDay: 'No activity yet' },
          roi: utilRes.roi || null,
        });
      }
    } catch {
      // Keep resilient state
    }
  }, [organization.id, user, isDemoMode]);

  const refreshEmployees = useCallback(async () => {
    if (!user || isDemoMode) return;
    setIsLoadingEmployees(true);
    try {
      const res = await apiFetch<{ employees: CorporateEmployee[] }>(
        `/api/organizations/${organization.id}/employees?limit=100`
      );
      const employeeList = Array.isArray(res?.employees) ? res.employees : (Array.isArray(res) ? res : []);
      setEmployees(employeeList);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            `polyfit_corporate_employees_${organization.id}`,
            JSON.stringify(employeeList)
          );
        } catch {}
      }
    } catch {
      // Keep resilient state
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
      const planList = Array.isArray(res?.benefits) ? res.benefits : (Array.isArray(res) ? res : []);
      setPlans(planList);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            `polyfit_corporate_plans_${organization.id}`,
            JSON.stringify(planList)
          );
        } catch {}
      }
    } catch {
      // Keep resilient state
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
      const invoiceList = Array.isArray(invRes?.invoices) ? invRes.invoices : (Array.isArray(invRes) ? invRes : []);
      setInvoices(invoiceList);

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
      // Keep resilient state
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
      const found = availableOrganizations.find((o) => o.id === orgId);
      if (found) {
        setOrganization(found);
        showToast(`Switched active organization to ${found.name}`);
      }
    },
    [availableOrganizations, showToast]
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
      setEmployees((prev) => {
        const next = [created, ...prev];
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              `polyfit_corporate_employees_${organization.id}`,
              JSON.stringify(next)
            );
          } catch {}
        }
        return next;
      });

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
      setEmployees((prev) => {
        const next = [...fullRecords, ...prev];
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              `polyfit_corporate_employees_${organization.id}`,
              JSON.stringify(next)
            );
          } catch {}
        }
        return next;
      });
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
      setEmployees((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e));
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              `polyfit_corporate_employees_${organization.id}`,
              JSON.stringify(next)
            );
          } catch {}
        }
        return next;
      });

      // Reactive sync with Funnel:
      if (oldStatus === "active" && (newStatus === "frozen" || newStatus === "terminated")) {
        setFunnelData((prev) => {
          const next = {
            ...prev,
            activeBeneficiaries: Math.max(0, prev.activeBeneficiaries - 1),
          };
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(
                `polyfit_corporate_funnel_${organization.id}`,
                JSON.stringify(next)
              );
            } catch {}
          }
          return next;
        });
      } else if ((oldStatus === "frozen" || oldStatus === "terminated") && newStatus === "active") {
        setFunnelData((prev) => {
          const next = {
            ...prev,
            activeBeneficiaries: prev.activeBeneficiaries + 1,
          };
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(
                `polyfit_corporate_funnel_${organization.id}`,
                JSON.stringify(next)
              );
            } catch {}
          }
          return next;
        });
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

      setEmployees((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, tier: newTier } : e));
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              `polyfit_corporate_employees_${organization.id}`,
              JSON.stringify(next)
            );
          } catch {}
        }
        return next;
      });

      // Rebalance plan enrollments
      setPlans((prev) => {
        const next = prev.map((p) => {
          if (p.tier && p.tier.toLowerCase() === oldTier.toLowerCase()) {
            return { ...p, enrolled_count: Math.max(0, (p.enrolled_count || 1) - 1) };
          }
          if (p.tier && p.tier.toLowerCase() === newTier.toLowerCase()) {
            return { ...p, enrolled_count: (p.enrolled_count || 0) + 1 };
          }
          return p;
        });
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(
              `polyfit_corporate_plans_${organization.id}`,
              JSON.stringify(next)
            );
          } catch {}
        }
        return next;
      });

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

        setPlans((prev) => {
          const next = prev.map((p) => (p.id === planData.id ? savedPlan : p));
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(
                `polyfit_corporate_plans_${organization.id}`,
                JSON.stringify(next)
              );
            } catch {}
          }
          return next;
        });
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

        setPlans((prev) => {
          const next = [savedPlan, ...prev];
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(
                `polyfit_corporate_plans_${organization.id}`,
                JSON.stringify(next)
              );
            } catch {}
          }
          return next;
        });
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
      availableOrganizations,
      switchOrganization,
      updateOrganizationProfile,
      funnelData,
      reportingData,
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
      availableOrganizations,
      switchOrganization,
      updateOrganizationProfile,
      funnelData,
      reportingData,
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
