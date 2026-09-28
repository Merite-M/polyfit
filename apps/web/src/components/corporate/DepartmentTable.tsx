"use client";

import React, { useState } from "react";
import { Users, TrendingUp, Search, ArrowUpDown, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DepartmentItem {
  name: string;
  eligible: number;
  active: number;
  participationRate: number;
  visits: number;
  spend: number;
}

interface DepartmentTableProps {
  departments?: DepartmentItem[];
  className?: string;
}

const DEFAULT_DEPARTMENTS: DepartmentItem[] = [
  { name: "Engineering", eligible: 420, active: 285, participationRate: 67.9, visits: 640, spend: 819200 },
  { name: "Marketing & Growth", eligible: 180, active: 132, participationRate: 73.3, visits: 310, spend: 396800 },
  { name: "Sales & Account Mgmt", eligible: 250, active: 145, participationRate: 58.0, visits: 290, spend: 371200 },
  { name: "Finance & Accounting", eligible: 140, active: 78, participationRate: 55.7, visits: 130, spend: 166400 },
  { name: "People & HR", eligible: 60, active: 52, participationRate: 86.7, visits: 110, spend: 140800 },
];

export function DepartmentTable({
  departments = DEFAULT_DEPARTMENTS,
  className,
}: DepartmentTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"participationRate" | "visits" | "eligible">("participationRate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const filtered = departments
    .filter((d) => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const mult = sortOrder === "desc" ? -1 : 1;
      return (a[sortBy] - b[sortBy]) * mult;
    });

  const toggleSort = (field: "participationRate" | "visits" | "eligible") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className={cn("p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-[#0B1F33]">
            Department Participation Breakdown
          </h3>
          <p className="text-xs text-[#526173]">
            Analyze benefit adoption and engagement across internal corporate divisions
          </p>
        </div>

        {/* Search Filter */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#8491A3] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F7F9FC] text-xs focus:outline-none focus:border-[#28D17C] w-48 transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E2E8F0] text-[11px] font-semibold text-[#8491A3] uppercase tracking-wider">
              <th className="py-2.5 px-3">Department</th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-[#0B1F33]"
                onClick={() => toggleSort("eligible")}
              >
                <div className="flex items-center gap-1">
                  <span>Eligible</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3">Active Users</th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-[#0B1F33]"
                onClick={() => toggleSort("participationRate")}
              >
                <div className="flex items-center gap-1">
                  <span>Participation Rate</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-2.5 px-3 cursor-pointer hover:text-[#0B1F33]"
                onClick={() => toggleSort("visits")}
              >
                <div className="flex items-center gap-1">
                  <span>Total Visits</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right">Spend (RWF)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F4F8] text-xs">
            {filtered.map((dept) => (
              <tr
                key={dept.name}
                className="hover:bg-[#F7F9FC] transition-colors group"
              >
                <td className="py-3 px-3 font-semibold text-[#0B1F33]">
                  {dept.name}
                </td>
                <td className="py-3 px-3 text-[#526173]">
                  {dept.eligible}
                </td>
                <td className="py-3 px-3 text-[#0B1F33] font-medium">
                  {dept.active}
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2 max-w-[140px]">
                    <div className="flex-1 h-2 rounded-full bg-[#F1F4F8] overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          dept.participationRate >= 70
                            ? "bg-[#28D17C]"
                            : dept.participationRate >= 50
                            ? "bg-[#00D2B4]"
                            : "bg-amber-400"
                        )}
                        style={{ width: `${dept.participationRate}%` }}
                      />
                    </div>
                    <span className="font-bold text-[#0B1F33] text-[11px] min-w-[36px]">
                      {dept.participationRate}%
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 text-[#526173] font-medium">
                  {dept.visits}
                </td>
                <td className="py-3 px-3 text-right font-semibold text-[#0B1F33]">
                  {dept.spend.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 pt-3 border-t border-[#F1F4F8] flex items-center justify-between text-[11px] text-[#8491A3]">
        <span>Showing {filtered.length} departments</span>
        <span className="text-[#28D17C] font-semibold">HR Lead: People & HR (86.7%)</span>
      </div>
    </div>
  );
}
