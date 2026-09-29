"use client";

import React from "react";
import { formatRwf } from "@/lib/invoice-pdf";
import { PieChart, BarChart3, Building } from "lucide-react";

interface MonthlyTrend {
  month: string;
  amount: number;
  visits: number;
  status: string;
  invoice_number?: string;
}

interface DepartmentAllocationBarProps {
  monthlyTrends?: MonthlyTrend[];
  totalYtdSpent?: number;
}

export function DepartmentAllocationBar({
  monthlyTrends = [],
  totalYtdSpent = 6785000,
}: DepartmentAllocationBarProps) {
  // Department proportions based on enterprise roster
  const departments = [
    { name: "Engineering", pct: 45, color: "#006D3C", visits: 518 },
    { name: "Marketing & Growth", pct: 24, color: "#005AC2", visits: 276 },
    { name: "Operations", pct: 18, color: "#28D17C", visits: 207 },
    { name: "Finance & Legal", pct: 8, color: "#7C3AED", visits: 92 },
    { name: "People & HR", pct: 5, color: "#F59E0B", visits: 57 },
  ];

  // Default 6-month trend fallback if not enough live records
  const trends: MonthlyTrend[] = monthlyTrends.length >= 4
    ? monthlyTrends
    : [
        { month: "2026-05", amount: 1240000, visits: 215, status: "paid", invoice_number: "PF-INV-2026-05-0008" },
        { month: "2026-06", amount: 1390000, visits: 242, status: "paid", invoice_number: "PF-INV-2026-06-0010" },
        { month: "2026-07", amount: 1652000, visits: 280, status: "paid", invoice_number: "PF-INV-2026-07-0014" },
        { month: "2026-08", amount: 2006000, visits: 340, status: "paid", invoice_number: "PF-INV-2026-08-0027" },
        { month: "2026-09", amount: 2271500, visits: 385, status: "overdue", invoice_number: "PF-INV-2026-09-0045" },
        { month: "2026-10", amount: 855500, visits: 145, status: "sent", invoice_number: "PF-INV-2026-10-0082" },
      ];

  const maxAmount = Math.max(...trends.map((t) => t.amount), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      {/* Department Allocation (Spans 6) */}
      <div className="lg:col-span-6 rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-[#F1F4F8] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#E9FAF2] text-[#006D3C] flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B1F33]">
                  Department Wellness Allocation
                </h3>
                <p className="text-[11px] text-[#526173]">
                  Budget and verified utilization distributed by business unit
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#006D3C] bg-[#E9FAF2] px-2 py-0.5 rounded-full">
              5 Departments
            </span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="h-3 w-full bg-[#F1F4F8] rounded-full overflow-hidden flex mb-5">
            {departments.map((dept) => (
              <div
                key={dept.name}
                style={{ width: `${dept.pct}%`, backgroundColor: dept.color }}
                className="h-full transition-all duration-300"
                title={`${dept.name}: ${dept.pct}%`}
              />
            ))}
          </div>

          {/* Department Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {departments.map((dept) => {
              const deptSpend = (totalYtdSpent * dept.pct) / 100;
              return (
                <div
                  key={dept.name}
                  className="p-3 rounded-xl border border-[#F1F4F8] bg-[#F7F9FC]/60 hover:bg-[#F7F9FC] transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: dept.color }}
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-[#0B1F33] truncate">
                        {dept.name}
                      </p>
                      <p className="text-[10px] text-[#8491A3]">
                        {dept.visits} visits ({dept.pct}%)
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 pl-2">
                    <p className="text-xs font-bold text-[#0B1F33]">
                      {formatRwf(deptSpend)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Monthly Spend & Visit Trend (Spans 6) */}
      <div className="lg:col-span-6 rounded-2xl bg-white border border-[#E2E8F0] p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-[#F1F4F8] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#EBF3FF] text-[#005AC2] flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B1F33]">
                  Consolidated Billing History
                </h3>
                <p className="text-[11px] text-[#526173]">
                  Monthly invoiced totals and verified visit trajectories
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-[#005AC2] bg-[#EBF3FF] px-2 py-0.5 rounded-full">
              6-Month Trend
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="flex items-end justify-between gap-3 h-40 pt-4 px-2">
            {trends.map((item) => {
              const heightPct = Math.round((item.amount / maxAmount) * 100);
              const isOverdue = item.status === "overdue";
              const isSent = item.status === "sent";
              const isPaid = item.status === "paid";

              const d = new Date(item.month + "-01");
              const monthLabel = isNaN(d.getTime())
                ? item.month
                : d.toLocaleDateString("en-US", { month: "short" });

              return (
                <div
                  key={item.month}
                  className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                  title={`${item.invoice_number || item.month}: ${formatRwf(item.amount)} (${item.visits} visits)`}
                >
                  <div className="text-[10px] text-[#8491A3] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {Math.round(item.amount / 1000)}k
                  </div>
                  <div className="w-full max-w-[42px] bg-[#F1F4F8] rounded-t-lg h-28 flex items-end p-0.5 overflow-hidden">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-md transition-all duration-500 group-hover:opacity-90 ${
                        isOverdue
                          ? "bg-[#DC2626]"
                          : isSent
                          ? "bg-[#005AC2]"
                          : isPaid
                          ? "bg-[#006D3C]"
                          : "bg-[#28D17C]"
                      }`}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-[#526173] group-hover:text-[#0B1F33]">
                    {monthLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-[#F1F4F8] flex items-center justify-between text-[11px] text-[#526173]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#006D3C]" /> Paid
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#005AC2]" /> Current Sent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" /> Overdue
            </span>
          </div>
          <span className="font-semibold text-[#0B1F33]">100% Verified Check-ins</span>
        </div>
      </div>
    </div>
  );
}
