"use client";

import React from "react";
import Link from "next/link";
import { Users, FileSpreadsheet, Plus, Upload, ArrowLeft } from "lucide-react";

export default function EmployeesPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center gap-2 text-xs text-[#8491A3] mb-4">
        <Link href="/corporate" className="hover:text-[#0B1F33] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </Link>
        <span>/</span>
        <span className="text-[#0B1F33] font-semibold">Employees & Roster</span>
      </div>

      <div className="flex items-center justify-between pb-6 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F33]">Employee Roster Management</h1>
          <p className="text-xs text-[#526173] mt-1">
            Manage corporate wellness eligibility, freeze/activate benefits, and bulk upload census rosters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-semibold text-[#0B1F33] hover:bg-[#F7F9FC]">
            <Upload className="w-3.5 h-3.5 text-[#00D2B4]" />
            <span>Upload CSV</span>
          </button>
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0B1F33] text-white text-xs font-semibold hover:bg-[#142C44]">
            <Plus className="w-3.5 h-3.5 text-[#28D17C]" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      <div className="mt-8 p-8 rounded-2xl bg-white border border-[#E2E8F0] text-center max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-[#E9FAF2] text-[#28D17C] flex items-center justify-center mx-auto mb-4">
          <Users className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-[#0B1F33]">Next Up: Issue PF-90</h2>
        <p className="text-xs text-[#526173] mt-2 leading-relaxed">
          The complete Employee Roster Management module with CSV drag-and-drop, instant freeze/activate status controls, and Census export will be implemented next under ticket PF-90.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/corporate"
            className="px-4 py-2 rounded-xl bg-[#28D17C] text-[#0B1F33] font-semibold text-xs hover:bg-[#22BC6E] transition-colors"
          >
            Return to Dashboard Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
