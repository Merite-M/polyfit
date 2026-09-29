"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Upload,
  Plus,
  Download,
  ArrowLeft,
  Filter,
  MoreVertical,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  RefreshCw,
  Share2,
  Check,
  Building2,
  Crown,
  Shield,
  Activity,
  UserX,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api-client";
import {
  EmployeeDetailDrawer,
  CorporateEmployee,
} from "@/components/corporate/EmployeeDetailDrawer";
import { BulkUploadModal } from "@/components/corporate/BulkUploadModal";
import { AddEmployeeModal } from "@/components/corporate/AddEmployeeModal";
import { BatchActionBar } from "@/components/corporate/BatchActionBar";

// Initial fallback enterprise roster for TechCorp Rwanda demo & offline resilience
const INITIAL_DEMO_EMPLOYEES: CorporateEmployee[] = [
  {
    id: "00fbe4e1-86aa-44bc-ad89-fcce6fb75687",
    full_name: "Jean Mugabo",
    email: "jean.mugabo@techcorp.rw",
    employee_id_external: "EMP001",
    department: "Engineering",
    tier: "standard",
    status: "active",
    created_at: "2026-01-15T08:30:00Z",
    visits_this_month: 8,
    eligibility: {
      id: "elig-1",
      status: "active",
      benefits: {
        id: "ben-1",
        name: "TechCorp Standard Wellness Plan",
        tier: "standard",
        max_monthly_visits: 10,
        co_pay_percentage: 10,
      },
    },
    recent_visits: [
      {
        id: "v-1",
        check_in_at: "2026-09-28T17:15:00Z",
        verification_method: "totp_qr",
        status: "verified",
        provider_locations: {
          id: "loc-1",
          name: "Kigali Central Facility",
          city: "Kigali",
          providers: { id: "p-1", name: "Waka Fitness", category: "gym" },
        },
      },
      {
        id: "v-2",
        check_in_at: "2026-09-25T18:00:00Z",
        verification_method: "totp_qr",
        status: "verified",
        provider_locations: {
          id: "loc-2",
          name: "Cercle Sportif de Kigali",
          city: "Kigali",
          providers: { id: "p-2", name: "Cercle Sportif", category: "pool" },
        },
      },
    ],
  },
  {
    id: "3e501231-7097-4e78-9c0e-445bcbafd0e9",
    full_name: "Marie Uwimana",
    email: "marie.uwimana@techcorp.rw",
    employee_id_external: "EMP002",
    department: "Marketing",
    tier: "standard",
    status: "active",
    created_at: "2026-02-01T09:00:00Z",
    visits_this_month: 6,
    eligibility: {
      id: "elig-2",
      status: "active",
      benefits: {
        id: "ben-1",
        name: "TechCorp Standard Wellness Plan",
        tier: "standard",
        max_monthly_visits: 10,
        co_pay_percentage: 10,
      },
    },
    recent_visits: [
      {
        id: "v-3",
        check_in_at: "2026-09-27T07:30:00Z",
        verification_method: "totp_qr",
        status: "verified",
        provider_locations: {
          id: "loc-1",
          name: "Kigali Central Facility",
          city: "Kigali",
          providers: { id: "p-1", name: "Waka Fitness", category: "gym" },
        },
      },
    ],
  },
  {
    id: "378d7933-329a-441a-acbe-21607e80191d",
    full_name: "Patrick Niyonzima",
    email: "patrick.niyonzima@techcorp.rw",
    employee_id_external: "EMP003",
    department: "Finance",
    tier: "premium",
    status: "active",
    created_at: "2026-02-15T10:15:00Z",
    visits_this_month: 16,
    eligibility: {
      id: "elig-3",
      status: "active",
      benefits: {
        id: "ben-3",
        name: "TechCorp Premium Wellness Plan",
        tier: "premium",
        max_monthly_visits: 20,
        co_pay_percentage: 0,
      },
    },
    recent_visits: [
      {
        id: "v-4",
        check_in_at: "2026-09-28T06:45:00Z",
        verification_method: "totp_qr",
        status: "verified",
        provider_locations: {
          id: "loc-3",
          name: "Nyashad Pilates & Wellness",
          city: "Kigali",
          providers: { id: "p-3", name: "Nyashad Studios", category: "studio" },
        },
      },
    ],
  },
  {
    id: "489bd7e2-393c-4b40-ade5-3832829053a6",
    full_name: "Claudine Mukandekeza",
    email: "claudine.mukandekeza@techcorp.rw",
    employee_id_external: "EMP004",
    department: "HR",
    tier: "standard",
    status: "frozen",
    created_at: "2026-03-01T11:00:00Z",
    visits_this_month: 2,
    eligibility: {
      id: "elig-4",
      status: "suspended",
      benefits: {
        id: "ben-1",
        name: "TechCorp Standard Wellness Plan",
        tier: "standard",
        max_monthly_visits: 10,
        co_pay_percentage: 10,
      },
    },
  },
  {
    id: "a2e591aa-73e9-4dd4-a141-508551372ec0",
    full_name: "Eric Habimana",
    email: "eric.habimana@techcorp.rw",
    employee_id_external: "EMP005",
    department: "Operations",
    tier: "basic",
    status: "active",
    created_at: "2026-03-10T14:20:00Z",
    visits_this_month: 3,
    eligibility: {
      id: "elig-5",
      status: "active",
      benefits: {
        id: "ben-2",
        name: "TechCorp Basic Wellness Plan",
        tier: "basic",
        max_monthly_visits: 4,
        co_pay_percentage: 20,
      },
    },
  },
  {
    id: "9912aa44-8833-4df1-8844-332211aabbcc",
    full_name: "Alice Gasana",
    email: "alice.gasana@techcorp.rw",
    employee_id_external: "EMP006",
    department: "Engineering",
    tier: "premium",
    status: "active",
    created_at: "2026-04-05T09:30:00Z",
    visits_this_month: 12,
  },
  {
    id: "aa88bb77-1122-4455-8899-ccddeeff0011",
    full_name: "David Karekezi",
    email: "david.karekezi@techcorp.rw",
    employee_id_external: "EMP007",
    department: "Sales",
    tier: "standard",
    status: "active",
    created_at: "2026-05-12T13:45:00Z",
    visits_this_month: 7,
  },
  {
    id: "cc33dd44-5566-7788-9900-112233445566",
    full_name: "Grace Umutoni",
    email: "grace.umutoni@techcorp.rw",
    employee_id_external: "EMP008",
    department: "Engineering",
    tier: "premium",
    status: "active",
    created_at: "2026-06-20T10:00:00Z",
    visits_this_month: 14,
  },
];

export default function EmployeesPage() {
  const { organizationId } = useAuth();
  const activeOrgId = organizationId || "c79a9982-4477-4336-a24b-561419f6c43b";
  const orgSlug = "techcorp-rwanda";
  const corporateDomain = "techcorp.rw";

  // Data State
  const [employees, setEmployees] = useState<CorporateEmployee[]>(INITIAL_DEMO_EMPLOYEES);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "frozen" | "terminated">("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");

  // Selection for Batch Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals & Drawer State
  const [selectedEmployee, setSelectedEmployee] = useState<CorporateEmployee | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchLoading, setIsBatchLoading] = useState(false);

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [origin, setOrigin] = useState("https://polyfit.onrender.com");
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const inviteUrl = `${origin}/join/${orgSlug}`;

  const handleCopyInviteLink = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      showToast("Join link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Fetch employees from backend
  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://polyfit-backend.onrender.com";

    try {
      const data = await apiFetch<{ employees: CorporateEmployee[] }>(
        `${apiUrl}/api/organizations/${activeOrgId}/employees?limit=100`,
        { method: "GET" }
      );

      if (data && Array.isArray(data.employees) && data.employees.length > 0) {
        setEmployees(data.employees);
      }
    } catch {
      // Keep demo employees if offline or unauthenticated
      console.warn("Using local resilient census records");
    } finally {
      setIsLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Open employee detail drawer
  const handleSelectEmployee = async (emp: CorporateEmployee) => {
    setSelectedEmployee(emp);
    setIsDrawerOpen(true);

    // Fetch full details & recent visit timeline
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://polyfit-backend.onrender.com";
    try {
      const res = await apiFetch<{ employee: CorporateEmployee }>(
        `${apiUrl}/api/organizations/${activeOrgId}/employees/${emp.id}`,
        { method: "GET" }
      );
      if (res?.employee) {
        setSelectedEmployee(res.employee);
      }
    } catch {
      // Use existing record
    }
  };

  // Single Status Change Handler
  const handleStatusChange = async (id: string, newStatus: "active" | "frozen" | "terminated") => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://polyfit-backend.onrender.com";

    // Optimistic UI update
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
    );
    if (selectedEmployee?.id === id) {
      setSelectedEmployee((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const endpoint =
        newStatus === "frozen"
          ? `${apiUrl}/api/organizations/${activeOrgId}/employees/${id}/freeze`
          : newStatus === "active"
          ? `${apiUrl}/api/organizations/${activeOrgId}/employees/${id}/activate`
          : `${apiUrl}/api/organizations/${activeOrgId}/employees/${id}`;

      await apiFetch(endpoint, {
        method: newStatus === "terminated" ? "DELETE" : "POST",
      });

      showToast(`Employee marked as ${newStatus}`);
    } catch {
      fetchEmployees();
      throw new Error("Status update failed");
    }
  };

  // Single Tier Change Handler
  const handleTierChange = async (id: string, newTier: "basic" | "standard" | "premium") => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://polyfit-backend.onrender.com";

    // Optimistic update
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, tier: newTier } : e))
    );
    if (selectedEmployee?.id === id) {
      setSelectedEmployee((prev) => (prev ? { ...prev, tier: newTier } : null));
    }

    try {
      await apiFetch(`${apiUrl}/api/organizations/${activeOrgId}/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: newTier }),
      });
      showToast(`Tier upgraded to ${newTier.toUpperCase()}`);
    } catch {
      fetchEmployees();
      throw new Error("Tier change failed");
    }
  };

  // Batch Freeze
  const handleBatchFreeze = async () => {
    if (selectedIds.size === 0) return;
    setIsBatchLoading(true);
    const ids = Array.from(selectedIds);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://polyfit-backend.onrender.com";

    // Optimistic
    setEmployees((prev) =>
      prev.map((e) => (selectedIds.has(e.id) ? { ...e, status: "frozen" } : e))
    );

    try {
      await apiFetch(`${apiUrl}/api/organizations/${activeOrgId}/employees/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "freeze", employee_ids: ids }),
      });
      showToast(`Suspended passes for ${ids.length} employees`);
      setSelectedIds(new Set());
    } catch {
      fetchEmployees();
      showToast("Batch action failed");
    } finally {
      setIsBatchLoading(false);
    }
  };

  // Batch Activate
  const handleBatchActivate = async () => {
    if (selectedIds.size === 0) return;
    setIsBatchLoading(true);
    const ids = Array.from(selectedIds);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://polyfit-backend.onrender.com";

    // Optimistic
    setEmployees((prev) =>
      prev.map((e) => (selectedIds.has(e.id) ? { ...e, status: "active" } : e))
    );

    try {
      await apiFetch(`${apiUrl}/api/organizations/${activeOrgId}/employees/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate", employee_ids: ids }),
      });
      showToast(`Reactivated passes for ${ids.length} employees`);
      setSelectedIds(new Set());
    } catch {
      fetchEmployees();
      showToast("Batch action failed");
    } finally {
      setIsBatchLoading(false);
    }
  };

  // Batch Change Tier
  const handleBatchChangeTier = async (newTier: "basic" | "standard" | "premium") => {
    if (selectedIds.size === 0) return;
    setIsBatchLoading(true);
    const ids = Array.from(selectedIds);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://polyfit-backend.onrender.com";

    // Optimistic
    setEmployees((prev) =>
      prev.map((e) => (selectedIds.has(e.id) ? { ...e, tier: newTier } : e))
    );

    try {
      await apiFetch(`${apiUrl}/api/organizations/${activeOrgId}/employees/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_tier", employee_ids: ids, tier: newTier }),
      });
      showToast(`Updated tier to ${newTier} for ${ids.length} employees`);
      setSelectedIds(new Set());
    } catch {
      fetchEmployees();
      showToast("Batch tier update failed");
    } finally {
      setIsBatchLoading(false);
    }
  };

  // 1-Click "Download Census" Handler (RFC 4180 CSV Export)
  const handleDownloadCensus = (subsetIds?: Set<string>) => {
    const targetEmployees = subsetIds && subsetIds.size > 0
      ? employees.filter((e) => subsetIds.has(e.id))
      : employees;

    const headers = [
      "Employee ID",
      "Full Name",
      "Work Email",
      "Department",
      "Benefit Tier",
      "Status",
      "Monthly Visits Used",
      "Enrolled Date",
    ];

    const rows = targetEmployees.map((e) => [
      e.employee_id_external || "N/A",
      e.full_name,
      e.email,
      e.department || "General",
      e.tier,
      e.status,
      String(e.visits_this_month || 0),
      e.created_at ? e.created_at.split("T")[0] : "2026-09-01",
    ]);

    const escapeCell = (str: string) => `"${str.replace(/"/g, '""')}"`;
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.map(escapeCell).join(","),
        ...rows.map((r) => r.map(escapeCell).join(",")),
      ].join("\r\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `polyfit-census-${orgSlug}-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${targetEmployees.length} census records`);
  };

  // Filter & Search Logic
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = e.full_name.toLowerCase().includes(query);
        const matchesEmail = e.email.toLowerCase().includes(query);
        const matchesId = (e.employee_id_external || "").toLowerCase().includes(query);
        if (!matchesName && !matchesEmail && !matchesId) return false;
      }

      // Status
      if (statusFilter !== "all" && e.status !== statusFilter) return false;

      // Department
      if (
        departmentFilter !== "all" &&
        (e.department || "").toLowerCase() !== departmentFilter.toLowerCase()
      )
        return false;

      // Tier
      if (tierFilter !== "all" && e.tier !== tierFilter) return false;

      return true;
    });
  }, [employees, searchQuery, statusFilter, departmentFilter, tierFilter]);

  // Department list for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [employees]);

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEmployees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEmployees.map((e) => e.id)));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Metrics
  const totalCount = employees.length;
  const activeCount = employees.filter((e) => e.status === "active").length;
  const frozenCount = employees.filter((e) => e.status === "frozen").length;
  const coverageRate = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 100;
  const totalVisitsMonth = employees.reduce((acc, curr) => acc + (curr.visits_this_month || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[#0B1F33] text-white px-4 py-2.5 rounded-xl border border-[#1E3A5F] shadow-xl text-xs font-semibold animate-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-[#28D17C]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-[#8491A3] mb-4">
        <Link href="/corporate" className="hover:text-[#0B1F33] flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
        <span>/</span>
        <span className="text-[#0B1F33] font-semibold">Employees & Roster</span>
      </div>

      {/* Page Title & Top Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#0B1F33]">
              Employee Roster Management
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E9FAF2] text-[#006D3C] border border-[#28D17C]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#28D17C]" />
              Live Sync
            </span>
          </div>
          <p className="text-xs text-[#526173] mt-1">
            Manage corporate wellness benefits, freeze or activate eligibility passes, and bulk upload census rosters.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => handleDownloadCensus()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white text-xs font-semibold text-[#0B1F33] hover:bg-[#F7F9FC] transition-colors shadow-2xs cursor-pointer"
            title="Export full company census to CSV"
          >
            <Download className="w-4 h-4 text-[#00D2B4]" />
            <span>Download Census</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white text-xs font-semibold text-[#0B1F33] hover:bg-[#F7F9FC] transition-colors shadow-2xs cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#28D17C]" />
            <span>Bulk Upload CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1F33] text-white text-xs font-semibold hover:bg-[#1E3A5F] transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#28D17C]" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between text-[#8491A3] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Census
            </span>
            <Users className="w-4 h-4 text-[#00D2B4]" />
          </div>
          <p className="text-2xl font-bold text-[#0B1F33]">{totalCount}</p>
          <p className="text-[11px] text-[#526173] mt-0.5">
            Registered corporate employees
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between text-[#8491A3] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Active Coverage
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#28D17C]" />
          </div>
          <p className="text-2xl font-bold text-[#006D3C]">{coverageRate}%</p>
          <p className="text-[11px] text-[#526173] mt-0.5">
            {activeCount} employees with live passes
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between text-[#8491A3] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Frozen Passes
            </span>
            <PauseCircle className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <p className="text-2xl font-bold text-[#B45309]">{frozenCount}</p>
          <p className="text-[11px] text-[#526173] mt-0.5">
            Temporary leave / paused access
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center justify-between text-[#8491A3] mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Monthly Visits
            </span>
            <Activity className="w-4 h-4 text-[#28D17C]" />
          </div>
          <p className="text-2xl font-bold text-[#0B1F33]">{totalVisitsMonth}</p>
          <p className="text-[11px] text-[#526173] mt-0.5">
            Verified check-ins this billing cycle
          </p>
        </div>
      </div>

      {/* Dedicated Company Join Link Banner */}
      <div className="mt-6 p-4 rounded-2xl bg-[#0B1F33] text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#1E3A5F]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E3A5F] flex items-center justify-center text-[#28D17C] shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#28D17C]">
                Corporate Self-Onboarding Link
              </span>
              <span className="text-[10px] bg-[#1E3A5F] px-2 py-0.5 rounded-full font-mono text-white/90">
                Restricted to @{corporateDomain}
              </span>
            </div>
            <p className="text-xs text-white/80 mt-0.5">
              Employees can register their own mobile wellness pass directly using this link.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-[#142C44] border border-[#1E3A5F] font-mono text-xs text-white/90 truncate max-w-xs select-all">
            {inviteUrl}
          </div>
          <button
            onClick={handleCopyInviteLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#28D17C] hover:bg-[#22BC6E] text-[#0B1F33] text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Copied" : "Copy Link"}</span>
          </button>
        </div>
      </div>

      {/* Search, Filter Pills & Controls Bar */}
      <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E2E8F0] shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8491A3]" />
          <input
            type="text"
            placeholder="Search by employee name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] text-xs text-[#0B1F33] placeholder:text-[#8491A3] focus:outline-none focus:border-[#28D17C] focus:bg-white transition-all"
          />
        </div>

        {/* Filter Dropdowns & Refresh */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E2E8F0] bg-white text-xs font-medium text-[#0B1F33] focus:outline-none focus:border-[#28D17C]"
          >
            <option value="all">Department: All</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#E2E8F0] bg-white text-xs font-medium text-[#0B1F33] focus:outline-none focus:border-[#28D17C]"
          >
            <option value="all">Tier: All</option>
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </select>

          <button
            onClick={fetchEmployees}
            className="p-2 rounded-xl border border-[#E2E8F0] bg-white text-[#526173] hover:text-[#0B1F33] hover:bg-[#F7F9FC] transition-colors cursor-pointer"
            title="Refresh roster from server"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin text-[#28D17C]")} />
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="mt-4 flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-xs font-semibold">
        <button
          onClick={() => setStatusFilter("all")}
          className={cn(
            "px-3.5 py-1.5 rounded-lg transition-all cursor-pointer",
            statusFilter === "all"
              ? "bg-[#0B1F33] text-white shadow-2xs"
              : "text-[#526173] hover:bg-[#F1F4F8]"
          )}
        >
          All ({employees.length})
        </button>

        <button
          onClick={() => setStatusFilter("active")}
          className={cn(
            "px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
            statusFilter === "active"
              ? "bg-[#006D3C] text-white shadow-2xs"
              : "text-[#526173] hover:bg-[#F1F4F8]"
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#28D17C]" />
          <span>Active ({employees.filter((e) => e.status === "active").length})</span>
        </button>

        <button
          onClick={() => setStatusFilter("frozen")}
          className={cn(
            "px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
            statusFilter === "frozen"
              ? "bg-[#B45309] text-white shadow-2xs"
              : "text-[#526173] hover:bg-[#F1F4F8]"
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
          <span>Frozen ({employees.filter((e) => e.status === "frozen").length})</span>
        </button>

        <button
          onClick={() => setStatusFilter("terminated")}
          className={cn(
            "px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
            statusFilter === "terminated"
              ? "bg-[#991B1B] text-white shadow-2xs"
              : "text-[#526173] hover:bg-[#F1F4F8]"
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
          <span>Terminated ({employees.filter((e) => e.status === "terminated").length})</span>
        </button>
      </div>

      {/* Directory Table */}
      <div className="mt-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[950px]">
            <thead className="bg-[#F7F9FC] text-[#526173] font-semibold border-b border-[#E2E8F0]">
              <tr>
                {/* Select All Checkbox */}
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredEmployees.length > 0 &&
                      selectedIds.size === filteredEmployees.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-[#CBD5E1] text-[#28D17C] focus:ring-[#28D17C] cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4 uppercase tracking-wider font-semibold">Employee</th>
                <th className="py-3.5 px-4 uppercase tracking-wider font-semibold">Staff ID</th>
                <th className="py-3.5 px-4 uppercase tracking-wider font-semibold">Department</th>
                <th className="py-3.5 px-4 uppercase tracking-wider font-semibold">Benefit Tier</th>
                <th className="py-3.5 px-4 uppercase tracking-wider font-semibold">Pass Status</th>
                <th className="py-3.5 px-4 uppercase tracking-wider font-semibold">Monthly Quota</th>
                <th className="py-3.5 px-4 uppercase tracking-wider font-semibold">Enrolled</th>
                <th className="py-3.5 px-4 w-12 text-center"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => {
                  const isSelected = selectedIds.has(emp.id);
                  const maxQuota =
                    emp.eligibility?.benefits?.max_monthly_visits ??
                    (emp.tier === "premium" ? 20 : emp.tier === "standard" ? 10 : 4);
                  const visits = emp.visits_this_month || 0;
                  const pct = Math.min(100, Math.round((visits / Math.max(1, maxQuota)) * 100));

                  return (
                    <tr
                      key={emp.id}
                      onClick={() => handleSelectEmployee(emp)}
                      className={cn(
                        "hover:bg-[#F7F9FC] transition-colors cursor-pointer group",
                        isSelected && "bg-[#F1F9F5]"
                      )}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => toggleSelectOne(emp.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-[#CBD5E1] text-[#28D17C] focus:ring-[#28D17C] cursor-pointer"
                        />
                      </td>

                      {/* Employee Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0B1F33] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {emp.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-[#0B1F33] text-[13px] group-hover:text-[#00D2B4] transition-colors">
                              {emp.full_name}
                            </p>
                            <p className="text-[#8491A3] font-mono text-[11px]">{emp.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Staff ID */}
                      <td className="py-3.5 px-4 font-mono text-[#526173]">
                        {emp.employee_id_external ? (
                          <span className="bg-[#F1F4F8] px-2 py-0.5 rounded text-[11px]">
                            {emp.employee_id_external}
                          </span>
                        ) : (
                          <span className="text-[#CBD5E1]">—</span>
                        )}
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 font-medium text-[#526173]">
                        {emp.department || "General"}
                      </td>

                      {/* Tier */}
                      <td className="py-3.5 px-4">
                        {emp.tier === "premium" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF5FF] text-[#7E22CE] border border-[#D8B4FE]">
                            <Crown className="w-3 h-3 text-[#7E22CE]" />
                            Premium
                          </span>
                        )}
                        {emp.tier === "standard" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E6FFFA] text-[#0D9488] border border-[#5EEAD4]">
                            Standard
                          </span>
                        )}
                        {emp.tier === "basic" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]">
                            Basic
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {emp.status === "active" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E9FAF2] text-[#006D3C] border border-[#28D17C]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#28D17C]" />
                            Active
                          </span>
                        )}
                        {emp.status === "frozen" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#F59E0B]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                            Frozen
                          </span>
                        )}
                        {emp.status === "terminated" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEE2E2] text-[#991B1B] border border-[#EF4444]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                            Terminated
                          </span>
                        )}
                      </td>

                      {/* Monthly Quota */}
                      <td className="py-3.5 px-4">
                        <div className="w-32">
                          <div className="flex items-center justify-between text-[11px] text-[#526173] mb-1 font-medium">
                            <span>{visits} / {maxQuota}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                pct > 80 ? "bg-[#F59E0B]" : "bg-[#28D17C]"
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Enrolled Date */}
                      <td className="py-3.5 px-4 text-[#8491A3] font-mono text-[11px]">
                        {emp.created_at ? emp.created_at.split("T")[0] : "2026-09-01"}
                      </td>

                      {/* Action Menu */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectEmployee(emp);
                          }}
                          className="p-1 rounded-lg text-[#8491A3] hover:text-[#0B1F33] hover:bg-[#F1F4F8] transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#8491A3]">
                    <div className="max-w-xs mx-auto">
                      <Users className="w-8 h-8 mx-auto text-[#CBD5E1] mb-2" />
                      <p className="font-bold text-sm text-[#0B1F33]">No Employees Match Criteria</p>
                      <p className="text-xs text-[#526173] mt-1">
                        Try resetting your search query or adjusting your department/status filters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-3.5 border-t border-[#E2E8F0] bg-[#F7F9FC] flex items-center justify-between text-xs text-[#526173]">
          <span>
            Showing <strong>{filteredEmployees.length}</strong> of <strong>{employees.length}</strong> employees
          </span>
          <span className="font-mono text-[11px] text-[#8491A3]">
            PolyFit B2B Infrastructure • Tier v1.0
          </span>
        </div>
      </div>

      {/* Floating Batch Action Bar */}
      <BatchActionBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onBatchFreeze={handleBatchFreeze}
        onBatchActivate={handleBatchActivate}
        onBatchChangeTier={handleBatchChangeTier}
        onBatchExport={() => handleDownloadCensus(selectedIds)}
        isLoading={isBatchLoading}
      />

      {/* Slide-over Detail Drawer */}
      <EmployeeDetailDrawer
        employee={selectedEmployee}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onStatusChange={handleStatusChange}
        onTierChange={handleTierChange}
        organizationName="TechCorp Rwanda"
      />

      {/* Bulk Upload CSV Modal */}
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        orgId={activeOrgId}
        onImportSuccess={() => {
          fetchEmployees();
          showToast("Roster updated from CSV");
        }}
        corporateDomain={corporateDomain}
      />

      {/* Add Single Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        orgId={activeOrgId}
        onEmployeeAdded={() => {
          fetchEmployees();
          showToast("New employee added to benefits roster");
        }}
        corporateDomain={corporateDomain}
      />
    </div>
  );
}
