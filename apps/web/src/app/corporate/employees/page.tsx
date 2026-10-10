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
import { apiFetch } from "@/lib/api-client";
import { CorporateHeader } from "@/components/corporate/CorporateHeader";
import { useCorporate } from "@/contexts/CorporateContext";
import {
  EmployeeDetailDrawer,
  CorporateEmployee,
} from "@/components/corporate/EmployeeDetailDrawer";
import { BulkUploadModal } from "@/components/corporate/BulkUploadModal";
import { AddEmployeeModal } from "@/components/corporate/AddEmployeeModal";
import { BatchActionBar } from "@/components/corporate/BatchActionBar";

export default function EmployeesPage() {
  const {
    organization,
    employees,
    addEmployee,
    bulkAddEmployees,
    updateEmployeeStatus,
    updateEmployeeTier,
    refreshEmployees,
    refreshFunnelData,
    isLoadingEmployees,
    plans,
    showToast,
    downloadCensusCsv,
    inviteUrl,
    copyInviteLink,
  } = useCorporate();

  const activeOrgId = organization.id;
  const orgSlug = organization.slug;
  const corporateDomain = organization.domain;

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
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyInviteLink = () => {
    copyInviteLink();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

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

  // Status Change in Drawer (e.g. Freeze / Activate)
  const handleStatusChange = async (
    id: string,
    newStatus: "active" | "frozen" | "terminated"
  ) => {
    await updateEmployeeStatus(id, newStatus);
    if (selectedEmployee && selectedEmployee.id === id) {
      setSelectedEmployee((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // Tier Change in Drawer
  const handleTierChange = async (
    id: string,
    newTier: "basic" | "standard" | "premium" | "executive"
  ) => {
    await updateEmployeeTier(id, newTier);
    if (selectedEmployee && selectedEmployee.id === id) {
      setSelectedEmployee((prev) => (prev ? { ...prev, tier: newTier } : null));
    }
  };

  // Batch Freeze
  const handleBatchFreeze = async () => {
    if (selectedIds.size === 0) return;
    setIsBatchLoading(true);
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await updateEmployeeStatus(id, "frozen");
    }
    showToast(`Froze passes for ${ids.length} employees`);
    setSelectedIds(new Set());
    setIsBatchLoading(false);
  };

  // Batch Activate
  const handleBatchActivate = async () => {
    if (selectedIds.size === 0) return;
    setIsBatchLoading(true);
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await updateEmployeeStatus(id, "active");
    }
    showToast(`Reactivated passes for ${ids.length} employees`);
    setSelectedIds(new Set());
    setIsBatchLoading(false);
  };

  // Batch Change Tier
  const handleBatchChangeTier = async (
    newTier: "basic" | "standard" | "premium" | "executive"
  ) => {
    if (selectedIds.size === 0) return;
    setIsBatchLoading(true);
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await updateEmployeeTier(id, newTier);
    }
    showToast(`Updated tier to ${newTier} for ${ids.length} employees`);
    setSelectedIds(new Set());
    setIsBatchLoading(false);
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
    <div className="min-h-full">
      {/* Sticky Corporate Navigation Header with contextual actions */}
      <CorporateHeader
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Bulk Upload CSV</span>
              <span className="sm:hidden">Bulk</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Employee</span>
            </button>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* KPI Metric Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Total Census
              </span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{totalCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Registered corporate employees
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Active Coverage
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{coverageRate}%</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {activeCount} employees with live passes
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Frozen Passes
              </span>
              <PauseCircle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{frozenCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Temporary leave / paused access
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Monthly Visits
              </span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-foreground">{totalVisitsMonth}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Verified check-ins this billing cycle
            </p>
          </div>
        </div>

        {/* Compact Join Link Badge (Replaces redundant 120px banner) */}
        <div className="mt-4 flex items-center justify-between px-4 py-2.5 rounded-xl bg-card border border-border shadow-2xs">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Workforce Join Link:</span>
            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20">
              {inviteUrl}
            </span>
            <span className="hidden sm:inline text-muted-foreground">(@{corporateDomain})</span>
          </div>
          <button
            onClick={handleCopyInviteLink}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5 text-muted-foreground" />}
            <span>{copiedLink ? "Copied" : "Copy Link"}</span>
          </button>
        </div>

        {/* Search, Filter Pills & Controls Bar */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-2xs">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="employee-search"
              name="employee-search"
              type="text"
              placeholder="Search by employee name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-muted/30 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-background transition-all"
            />
          </div>

          {/* Filter Dropdowns & Refresh */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Department Filter */}
            <select
              id="department-filter"
              name="department-filter"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-card text-xs font-medium text-foreground focus:outline-none focus:border-primary"
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
              id="tier-filter"
              name="tier-filter"
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border bg-card text-xs font-medium text-foreground focus:outline-none focus:border-primary"
            >
              <option value="all">Tier: All</option>
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="executive">Executive</option>
            </select>

            <button
              onClick={refreshEmployees}
              className="p-2 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Refresh roster from server"
            >
              <RefreshCw className={cn("w-4 h-4", isLoadingEmployees && "animate-spin text-emerald-500")} />
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
        organizationName={organization.name}
      />

      {/* Bulk Upload CSV Modal */}
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        orgId={activeOrgId}
        onImportSuccess={() => {
          refreshEmployees();
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
          refreshEmployees();
          showToast("New employee added to benefits roster");
        }}
        corporateDomain={corporateDomain}
      />
      </div>
    </div>
  );
}
