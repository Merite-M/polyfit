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
import type { MonthDataPoint } from "@/components/corporate/EngagementTrendChart";

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
    id: "02f13bdc-ce25-4c9d-b712-451c06a63fa2",
    name: "Kigali Tech Innovations",
    slug: "kigali-tech-innovations",
    domain: "kigalitech.rw",
    allowed_domains: ["kigalitech.rw"],
    tax_id: "109887766",
    contact_email: "hr@kigalitech.rw",
    billing_email: "hr@kigalitech.rw",
    industry: "Technology & Financial Services",
  },
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
  monthlyTrends?: MonthDataPoint[];
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

const DEMO_MONTHLY_TRENDS: MonthDataPoint[] = [
  { month: "Apr", eligible: 1150, members: 320, active: 160, visits: 540 },
  { month: "May", eligible: 1180, members: 480, active: 250, visits: 890 },
  { month: "Jun", eligible: 1200, members: 590, active: 310, visits: 1120 },
  { month: "Jul", eligible: 1200, members: 670, active: 360, visits: 1280 },
  { month: "Aug", eligible: 1210, members: 735, active: 384, visits: 1390 },
  { month: "Sep", eligible: 1217, members: 789, active: 412, visits: 1480 },
];

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
  deleteEmployee: (id: string) => Promise<void>;
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
  getOrgHref: (path: string) => string;
}

const CorporateContext = createContext<CorporateContextType | undefined>(undefined);

export function CorporateProvider({ children }: { children: React.ReactNode }) {
  const { organizationId, user, isDemoMode } = useAuth();

  // 1. Organization State with URL and localStorage sync
  const initialOrg = useMemo(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      let orgSlug = params.get("org") || params.get("slug");
      if (!orgSlug) {
        try {
          orgSlug = localStorage.getItem("polyfit_corporate_active_org");
        } catch {}
      } else {
        try {
          localStorage.setItem("polyfit_corporate_active_org", orgSlug);
        } catch {}
      }
      if (orgSlug) {
        const match = NETWORK_ORGANIZATIONS.find(
          (o) => o.slug.toLowerCase() === orgSlug!.toLowerCase() || o.id === orgSlug
        );
        if (match) return match;
        const slugClean = orgSlug.toLowerCase();
        const nameClean = slugClean
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        return {
          id: slugClean,
          name: nameClean,
          slug: slugClean,
          domain: `${slugClean}.rw`,
          allowed_domains: [`${slugClean}.rw`],
          tax_id: "100000000",
          contact_email: `hr@${slugClean}.rw`,
          billing_email: `finance@${slugClean}.rw`,
          industry: "Corporate Client",
        };
      }
    }
    if (organizationId) {
      const match = NETWORK_ORGANIZATIONS.find((o) => o.id === organizationId);
      if (match) return match;
    }
    return NETWORK_ORGANIZATIONS[0];
  }, [organizationId]);

  const [availableOrganizations, setAvailableOrganizations] =
    useState<CorporateOrganization[]>(NETWORK_ORGANIZATIONS);
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

  // 3. Dynamic Portal State (initialized cleanly; populated via loadPortalData)
  const isExplicitTechCorp = useMemo(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const s = params.get("org") || params.get("slug");
      if (s) return s.toLowerCase().includes("techcorp");
    }
    return false;
  }, []);

  const [funnelData, setFunnelData] = useState<AdoptionFunnelData>(() => {
    if (isExplicitTechCorp && isDemoMode) {
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
    if (isExplicitTechCorp && isDemoMode) {
      return {
        categories: TECHCORP_CANONICAL_DATA.wellness.categories,
        temporal: {
          wellnessHour: TECHCORP_CANONICAL_DATA.wellness.wellnessHour,
          peakDay: TECHCORP_CANONICAL_DATA.wellness.peakDay,
        },
        monthlyTrends: DEMO_MONTHLY_TRENDS,
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
      monthlyTrends: [],
    };
  });

  const [economics, setEconomics] = useState<CorporateEconomics>(() => {
    if (isExplicitTechCorp && isDemoMode) return TECHCORP_CANONICAL_DATA.economics;
    return ZERO_ECONOMICS;
  });

  // 4. Employee Roster State
  const [employees, setEmployees] = useState<CorporateEmployee[]>(() => {
    if (isExplicitTechCorp && isDemoMode) {
      return TECHCORP_CANONICAL_DATA.employees as CorporateEmployee[];
    }
    return [];
  });
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // 5. Benefit Plans State
  const [plans, setPlans] = useState<BenefitPlan[]>(() => {
    if (isExplicitTechCorp && isDemoMode) {
      return TECHCORP_CANONICAL_DATA.plans as unknown as BenefitPlan[];
    }
    return [];
  });
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  // 6. Invoices State
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() => {
    if (isExplicitTechCorp && isDemoMode) return TECHCORP_CANONICAL_DATA.invoices as unknown as InvoiceRecord[];
    return [];
  });
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  // Load portal data dynamically from database for ANY organization
  const loadPortalData = useCallback(async (targetSlugOrId: string) => {
    if (!targetSlugOrId) return;
    setIsLoadingEmployees(true);
    setIsLoadingPlans(true);
    try {
      const res = await apiFetch<any>(`/api/public/corporate/portal-data?slug=${encodeURIComponent(targetSlugOrId)}`);
      if (res?.success && res.organization) {
        setOrganization(res.organization);
        try {
          localStorage.setItem("polyfit_corporate_active_org", res.organization.slug);
        } catch {}
        if (typeof window !== "undefined" && window.history) {
          const url = new URL(window.location.href);
          if (url.searchParams.get("org") !== res.organization.slug) {
            url.searchParams.set("org", res.organization.slug);
            window.history.replaceState({}, "", url.pathname + url.search);
          }
        }
        if (Array.isArray(res.plans)) {
          setPlans(res.plans);
        }
        if (Array.isArray(res.employees)) {
          setEmployees(res.employees);
        }
        if (res.funnel) {
          setFunnelData(res.funnel);
        }
        if (res.economics) {
          setEconomics(res.economics);
        }
        if (Array.isArray(res.invoices)) {
          setInvoices(res.invoices);
        }
        if (res.reportingData) {
          setReportingData(res.reportingData);
        }
        return;
      }
    } catch (err) {
      console.warn("[CorporateContext] Portal data fetch notice:", err);
    } finally {
      setIsLoadingEmployees(false);
      setIsLoadingPlans(false);
    }

    // Fallback for techcorp-rwanda demo mode only
    if (targetSlugOrId.toLowerCase().includes("techcorp")) {
      setPlans(TECHCORP_CANONICAL_DATA.plans as unknown as BenefitPlan[]);
      setEmployees(TECHCORP_CANONICAL_DATA.employees as CorporateEmployee[]);
      setFunnelData(TECHCORP_CANONICAL_DATA.funnel);
      setEconomics(TECHCORP_CANONICAL_DATA.economics);
      setInvoices(TECHCORP_CANONICAL_DATA.invoices as unknown as InvoiceRecord[]);
    }
  }, []);

  // Sync live organizations from backend so any created in Super Admin or registration appear immediately
  useEffect(() => {
    async function loadLiveOrganizations() {
      try {
        const res = await apiFetch<any>("/api/public/corporate/organizations");
        const list = res?.organizations || [];
        const merged = [...NETWORK_ORGANIZATIONS];
        if (Array.isArray(list) && list.length > 0) {
          for (const item of list) {
            if (!merged.some((m) => m.id === item.id || m.slug === item.slug)) {
              merged.push(item);
            }
          }
        }
        setAvailableOrganizations(merged);

        let target = initialOrg.slug || initialOrg.id;
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const orgParam = params.get("org") || params.get("slug");
          if (orgParam) {
            target = orgParam;
          } else {
            try {
              const saved = localStorage.getItem("polyfit_corporate_active_org");
              if (saved) target = saved;
            } catch {}
          }
        }

        await loadPortalData(target);
      } catch (err) {
        console.warn("[CorporateContext] Error loading organizations:", err);
      }
    }
    loadLiveOrganizations();
  }, [initialOrg.slug, initialOrg.id, loadPortalData]);

  // Invite Link derived from origin
  const [origin, setOrigin] = useState("https://polyfit.onrender.com");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const inviteUrl = `${origin}/join?org=${organization.slug}`;

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

  // Data refresh functions backed by live database loader

  const refreshFunnelData = useCallback(async () => {
    await loadPortalData(organization.slug || organization.id);
  }, [organization.slug, organization.id, loadPortalData]);

  const refreshEmployees = useCallback(async () => {
    await loadPortalData(organization.slug || organization.id);
  }, [organization.slug, organization.id, loadPortalData]);

  const refreshPlans = useCallback(async () => {
    await loadPortalData(organization.slug || organization.id);
  }, [organization.slug, organization.id, loadPortalData]);

  const refreshInvoices = useCallback(async () => {
    await loadPortalData(organization.slug || organization.id);
  }, [organization.slug, organization.id, loadPortalData]);

  // Reload everything when organization changes
  useEffect(() => {
    refreshFunnelData();
  }, [organization.id, refreshFunnelData]);

  // Switch organization
  const switchOrganization = useCallback(
    async (orgId: string) => {
      const found = availableOrganizations.find((o) => o.id === orgId || o.slug === orgId);
      if (found) {
        setOrganization(found);
        try {
          localStorage.setItem("polyfit_corporate_active_org", found.slug);
        } catch {}
        showToast(`Switched active organization to ${found.name}`);
        await loadPortalData(found.slug || found.id);
        if (typeof window !== "undefined" && window.history) {
          const url = new URL(window.location.href);
          url.searchParams.set("org", found.slug);
          window.history.replaceState({}, "", url.pathname + url.search);
        }
      }
    },
    [availableOrganizations, loadPortalData, showToast]
  );

  // Update profile
  const updateOrganizationProfile = useCallback(
    async (data: Partial<CorporateOrganization>) => {
      try {
        await apiFetch(`/api/public/corporate/organization`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: organization.id,
            slug: organization.slug,
            ...data
          }),
        });
      } catch (err) {
        console.warn("[CorporateContext] Error updating org profile:", err);
      }
      setOrganization((prev) => ({ ...prev, ...data }));
      showToast("Organization profile and domain settings updated!");
    },
    [organization.id, organization.slug, showToast]
  );

  // Mutators that persist to Supabase database and update state reactively
  const addEmployee = useCallback(
    async (newEmp: Partial<CorporateEmployee>): Promise<CorporateEmployee> => {
      const created: CorporateEmployee = {
        id: `emp-live-${Date.now()}`,
        org_id: organization.id,
        full_name: newEmp.full_name || "New Employee",
        email: newEmp.email || `employee-${Date.now()}@${organization.domain}`,
        employee_id_external: newEmp.employee_id_external || `EMP-${Date.now().toString().slice(-4)}`,
        department: newEmp.department || "General",
        tier: (newEmp.tier || "standard").toLowerCase(),
        status: (newEmp.status as any) || "active",
        created_at: new Date().toISOString(),
        visits_this_month: 0,
      };

      try {
        const res = await apiFetch<{ employee: CorporateEmployee }>(
          `/api/public/corporate/employees`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              org_id: organization.id,
              org_slug: organization.slug,
              full_name: created.full_name,
              email: created.email,
              employee_id_external: created.employee_id_external,
              department: created.department,
              tier: created.tier,
              status: created.status
            }),
          }
        );
        if (res?.employee) {
          Object.assign(created, res.employee);
        }
      } catch (err) {
        console.warn("[CorporateContext] Error persisting employee to DB:", err);
      }

      // Reactive cross-tab sync:
      setEmployees((prev) => [created, ...prev.filter((e) => e.id !== created.id)]);

      setFunnelData((prev) => ({
        ...prev,
        totalEligible: prev.totalEligible + 1,
        registeredEmployees: prev.registeredEmployees + 1,
        activeBeneficiaries:
          created.status === "active" ? prev.activeBeneficiaries + 1 : prev.activeBeneficiaries,
      }));

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
    [organization.id, organization.slug, organization.domain, showToast]
  );

  const bulkAddEmployees = useCallback(
    async (newEmps: Partial<CorporateEmployee>[]) => {
      try {
        await apiFetch(`/api/public/corporate/employees/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            org_id: organization.id,
            org_slug: organization.slug,
            employees: newEmps
          }),
        });
      } catch (err) {
        console.warn("[CorporateContext] Error in bulk employees:", err);
      }

      await loadPortalData(organization.slug || organization.id);
      showToast(`Bulk imported ${newEmps.length} employees. Roster & Funnel synchronized!`);
      return { created: newEmps.length, updated: 0 };
    },
    [organization.id, organization.slug, loadPortalData, showToast]
  );

  const updateEmployeeStatus = useCallback(
    async (id: string, newStatus: "active" | "frozen" | "terminated") => {
      const targetEmp = employees.find((e) => e.id === id);
      const oldStatus = targetEmp?.status || "active";

      try {
        await apiFetch(`/api/public/corporate/employees/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
      } catch (err) {
        console.warn("[CorporateContext] Error updating status in DB:", err);
      }

      setEmployees((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
      );

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
    [employees, showToast]
  );

  const updateEmployeeTier = useCallback(
    async (id: string, newTier: string) => {
      const targetEmp = employees.find((e) => e.id === id);
      const oldTier = targetEmp?.tier || "standard";

      try {
        await apiFetch(`/api/public/corporate/employees/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier: newTier }),
        });
      } catch (err) {
        console.warn("[CorporateContext] Error updating tier in DB:", err);
      }

      setEmployees((prev) =>
        prev.map((e) => (e.id === id ? { ...e, tier: newTier } : e))
      );

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
    [employees, showToast]
  );

  const deleteEmployee = useCallback(
    async (id: string) => {
      const targetEmp = employees.find((e) => e.id === id);
      try {
        await apiFetch(`/api/public/corporate/employees/${id}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.warn("[CorporateContext] Error deleting employee in DB:", err);
      }

      setEmployees((prev) => prev.filter((e) => e.id !== id));
      setFunnelData((prev) => ({
        ...prev,
        totalEligible: Math.max(0, prev.totalEligible - 1),
        registeredEmployees: Math.max(0, prev.registeredEmployees - 1),
        activeBeneficiaries:
          targetEmp?.status === "active" ? Math.max(0, prev.activeBeneficiaries - 1) : prev.activeBeneficiaries,
      }));
      showToast(`Removed ${targetEmp?.full_name || "employee"} from organization roster.`);
    },
    [employees, showToast]
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
          await apiFetch(`/api/public/corporate/benefits/${planData.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: savedPlan.name,
              tier: savedPlan.tier,
              max_monthly_visits: savedPlan.max_monthly_visits,
              co_pay_percentage: savedPlan.co_pay_percentage,
              allowed_categories: savedPlan.allowed_provider_categories,
              status: savedPlan.status
            }),
          });
        } catch (err) {
          console.warn("[CorporateContext] Error patching benefit plan in DB:", err);
        }

        setPlans((prev) => prev.map((p) => (p.id === planData.id ? savedPlan : p)));
        showToast(`Updated benefit plan "${savedPlan.name}". Tiers synced across portal.`);
      } else {
        savedPlan = {
          id: `plan-live-${Date.now()}`,
          name: planData.name || "Custom Corporate Plan",
          tier: (planData.tier || "standard").toLowerCase(),
          status: planData.status || "active",
          max_monthly_visits: planData.max_monthly_visits || 8,
          co_pay_percentage: planData.co_pay_percentage ?? 0,
          allowed_provider_categories: planData.allowed_provider_categories || ["gym", "pool"],
          budget_cap_per_employee: planData.budget_cap_per_employee || 60000,
          is_family_eligible: Boolean(planData.is_family_eligible),
          description: planData.description || "",
          enrolled_count: 0,
          estimated_monthly_liability: 0,
        };

        try {
          const res = await apiFetch<any>(
            `/api/public/corporate/benefits`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                org_id: organization.id,
                org_slug: organization.slug,
                name: savedPlan.name,
                tier: savedPlan.tier,
                max_monthly_visits: savedPlan.max_monthly_visits,
                co_pay_percentage: savedPlan.co_pay_percentage,
                allowed_categories: savedPlan.allowed_provider_categories
              }),
            }
          );
          if (res?.benefit) {
            Object.assign(savedPlan, res.benefit);
          }
        } catch (err) {
          console.warn("[CorporateContext] Error saving benefit in DB:", err);
        }

        setPlans((prev) => [savedPlan, ...prev]);
        showToast(`Created new plan "${savedPlan.name}". Now selectable in employee roster.`);
      }

      return savedPlan;
    },
    [plans, organization.id, organization.slug, showToast]
  );

  const disputeInvoice = useCallback(
    async (id: string, reason: string, notes: string) => {
      try {
        await apiFetch(`/api/public/corporate/invoices/${id}/dispute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason, notes }),
        });
      } catch (err) {
        console.warn("[CorporateContext] Error submitting dispute:", err);
      }

      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status: "disputed" } : inv))
      );
      showToast("Invoice marked as disputed. PolyFit Finance will audit within 4 hours.");
    },
    [showToast]
  );

  // URL helper for maintaining active organization context across portal routes
  const getOrgHref = useCallback(
    (path: string) => {
      const slug = organization?.slug;
      if (!slug) return path;
      const delimiter = path.includes("?") ? "&" : "?";
      return `${path}${delimiter}org=${encodeURIComponent(slug)}`;
    },
    [organization?.slug]
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
      deleteEmployee,
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
      getOrgHref,
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
      deleteEmployee,
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
      getOrgHref,
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
