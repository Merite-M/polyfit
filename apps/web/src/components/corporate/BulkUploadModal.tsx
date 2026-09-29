"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  onImportSuccess: () => void;
  corporateDomain?: string;
}

interface ParsedEmployeeRow {
  rowNumber: number;
  full_name: string;
  email: string;
  employee_id: string;
  department: string;
  tier: "basic" | "standard" | "premium";
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function BulkUploadModal({
  isOpen,
  onClose,
  orgId,
  onImportSuccess,
  corporateDomain = "techcorp.rw",
}: BulkUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawCsvText, setRawCsvText] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedEmployeeRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
    failed: number;
    duration_ms?: number;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  // Download official CSV template
  const handleDownloadTemplate = () => {
    const templateContent = [
      "first_name,last_name,email,employee_id,department,tier",
      "Jean,Mugabo,jean.mugabo@techcorp.rw,EMP-101,Engineering,standard",
      "Marie,Uwimana,marie.uwimana@techcorp.rw,EMP-102,Marketing,standard",
      "Patrick,Niyonzima,patrick.n@techcorp.rw,EMP-103,Finance,premium",
      "Claudine,Mukandekeza,claudine.m@techcorp.rw,EMP-104,HR,standard",
      "Eric,Habimana,eric.h@techcorp.rw,EMP-105,Operations,basic",
    ].join("\r\n");

    const blob = new Blob([templateContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "polyfit_census_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client-side CSV parser & validator
  const processCsvFile = (text: string, name: string) => {
    setIsParsing(true);
    setFileName(name);
    setRawCsvText(text);
    setImportResult(null);
    setSubmitError(null);

    try {
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setSubmitError("CSV file must contain a header row and at least one employee record.");
        setIsParsing(false);
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[\s_-]+/g, ""));
      const rows: ParsedEmployeeRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        // Simple comma split handling quotes
        const rawLine = lines[i];
        const cols: string[] = [];
        let curr = "";
        let inQuotes = false;
        for (let c = 0; c < rawLine.length; c++) {
          const ch = rawLine[c];
          if (ch === '"') inQuotes = !inQuotes;
          else if (ch === "," && !inQuotes) {
            cols.push(curr.trim());
            curr = "";
          } else curr += ch;
        }
        cols.push(curr.trim());

        const data: Record<string, string> = {};
        headers.forEach((h, idx) => {
          data[h] = (cols[idx] || "").replace(/^"|"$/g, "").trim();
        });

        const firstName = data["firstname"] || data["first"] || "";
        const lastName = data["lastname"] || data["last"] || "";
        let fullName = data["fullname"] || data["name"] || data["employeename"] || "";
        if (!fullName && (firstName || lastName)) {
          fullName = `${firstName} ${lastName}`.trim();
        }

        const email = (data["email"] || data["workemail"] || "").toLowerCase().trim();
        const employeeId = data["employeeid"] || data["staffid"] || data["id"] || "";
        const department = data["department"] || data["dept"] || data["team"] || "General";
        const rawTier = (data["tier"] || data["benefittier"] || data["plantier"] || "standard").toLowerCase().trim();
        const tier = ["basic", "standard", "premium"].includes(rawTier)
          ? (rawTier as "basic" | "standard" | "premium")
          : "standard";

        const errors: string[] = [];
        const warnings: string[] = [];

        if (!fullName) errors.push("Missing employee name");
        if (!email) {
          errors.push("Missing email address");
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push("Invalid email syntax");
        } else if (corporateDomain && !email.endsWith(`@${corporateDomain}`)) {
          warnings.push(`Non-corporate domain (@${email.split("@")[1]})`);
        }

        if (!["basic", "standard", "premium"].includes(rawTier)) {
          warnings.push(`Unrecognized tier '${rawTier}', defaulted to 'standard'`);
        }

        rows.push({
          rowNumber: i + 1,
          full_name: fullName,
          email,
          employee_id: employeeId,
          department,
          tier,
          isValid: errors.length === 0,
          errors,
          warnings,
        });
      }

      setParsedRows(rows);
    } catch {
      setSubmitError("Failed to parse CSV file. Please verify format and UTF-8 encoding.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          processCsvFile(event.target.result as string, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.name.endsWith(".csv")) {
        setSubmitError("Only .csv files are supported.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          processCsvFile(event.target.result as string, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmitImport = async () => {
    if (!rawCsvText || validCount === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://polyfit-backend.onrender.com";

    try {
      const response = await apiFetch<{
        success: boolean;
        message: string;
        summary: {
          created: number;
          updated: number;
          skipped: number;
          failed: number;
        };
        duration_ms?: number;
      }>(`${apiUrl}/api/organizations/${orgId}/employees/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csv_data: rawCsvText,
          update_existing: true,
          send_invites: false,
        }),
      });

      if (response && response.summary) {
        setImportResult({
          created: response.summary.created,
          updated: response.summary.updated,
          skipped: response.summary.skipped,
          failed: response.summary.failed,
          duration_ms: response.duration_ms,
        });
        onImportSuccess();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Bulk import failed. Please verify API connection.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetUpload = () => {
    setFileName(null);
    setRawCsvText(null);
    setParsedRows([]);
    setImportResult(null);
    setSubmitError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F7F9FC]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#E9FAF2] text-[#28D17C] flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0B1F33]">
                  Bulk Employee Census Upload
                </h2>
                <p className="text-xs text-[#526173]">
                  Wellhub-style high-throughput roster onboarding pipeline
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8491A3] hover:text-[#0B1F33] hover:bg-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Import Success State */}
            {importResult && (
              <div className="p-6 rounded-2xl bg-[#E9FAF2] border border-[#28D17C]/30 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#28D17C] text-white flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0B1F33]">
                    Census Import Completed!
                  </h3>
                  <p className="text-xs text-[#526173] mt-1">
                    Processed in {importResult.duration_ms || 320}ms with instant tier eligibility linkage.
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-2">
                  <div className="bg-white p-2.5 rounded-xl border border-[#E2E8F0]">
                    <span className="block text-lg font-bold text-[#006D3C]">
                      {importResult.created}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-[#8491A3]">
                      Created
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E2E8F0]">
                    <span className="block text-lg font-bold text-[#0B1F33]">
                      {importResult.updated}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-[#8491A3]">
                      Updated
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E2E8F0]">
                    <span className="block text-lg font-bold text-[#526173]">
                      {importResult.skipped}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-[#8491A3]">
                      Skipped
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#E2E8F0]">
                    <span className="block text-lg font-bold text-[#EF4444]">
                      {importResult.failed}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-[#8491A3]">
                      Failed
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={resetUpload}
                    className="px-4 py-2 rounded-xl border border-[#E2E8F0] bg-white text-xs font-semibold text-[#0B1F33] hover:bg-[#F7F9FC] cursor-pointer"
                  >
                    Upload Another File
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-2 rounded-xl bg-[#0B1F33] text-white text-xs font-semibold hover:bg-[#1E3A5F] cursor-pointer"
                  >
                    View Roster Table
                  </button>
                </div>
              </div>
            )}

            {!importResult && (
              <>
                {/* Download Template Bar */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F7F9FC] border border-[#E2E8F0]">
                  <div className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-[#00D2B4]" />
                    <span className="text-xs text-[#526173]">
                      Need the standard column schema?
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0B1F33] hover:bg-[#F1F4F8] transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#28D17C]" />
                    <span>Download CSV Template</span>
                  </button>
                </div>

                {/* Dropzone */}
                {!fileName ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all duration-200",
                      dragActive
                        ? "border-[#28D17C] bg-[#E9FAF2]/40"
                        : "border-[#CBD5E1] hover:border-[#28D17C] hover:bg-[#F7F9FC]"
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-[#F1F4F8] text-[#526173] flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6 text-[#0B1F33]" />
                    </div>
                    <p className="text-sm font-bold text-[#0B1F33]">
                      Click to choose or drag & drop CSV file here
                    </p>
                    <p className="text-xs text-[#8491A3] mt-1">
                      Supports up to 2,000 employees per upload (max 5MB)
                    </p>
                  </div>
                ) : (
                  /* File Loaded Summary */
                  <div className="p-4 rounded-xl bg-[#F7F9FC] border border-[#E2E8F0] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-6 h-6 text-[#28D17C]" />
                      <div>
                        <p className="text-xs font-bold text-[#0B1F33]">{fileName}</p>
                        <p className="text-[11px] text-[#526173]">
                          {parsedRows.length} total rows parsed
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={resetUpload}
                      className="text-xs font-semibold text-[#8491A3] hover:text-[#EF4444] transition-colors cursor-pointer"
                    >
                      Change file
                    </button>
                  </div>
                )}

                {/* Error Banner */}
                {submitError && (
                  <div className="p-3 rounded-xl bg-[#FEE2E2] border border-[#FECACA] flex items-start gap-2.5 text-xs text-[#991B1B]">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Validation Preview Table */}
                {parsedRows.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0B1F33]">
                        Validation Preview
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006D3C] bg-[#E9FAF2] px-2 py-0.5 rounded-full border border-[#28D17C]/30">
                          <CheckCircle2 className="w-3 h-3 text-[#28D17C]" />
                          {validCount} Ready to Import
                        </span>
                        {invalidCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#991B1B] bg-[#FEE2E2] px-2 py-0.5 rounded-full border border-[#EF4444]/30">
                            <AlertCircle className="w-3 h-3 text-[#EF4444]" />
                            {invalidCount} Invalid
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto border border-[#E2E8F0] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#F1F4F8] text-[#526173] font-semibold sticky top-0">
                          <tr>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Employee</th>
                            <th className="py-2.5 px-3">Email</th>
                            <th className="py-2.5 px-3">Dept</th>
                            <th className="py-2.5 px-3">Tier</th>
                            <th className="py-2.5 px-3">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0] bg-white">
                          {parsedRows.slice(0, 30).map((row) => (
                            <tr
                              key={row.rowNumber}
                              className={cn(
                                "hover:bg-[#F7F9FC] transition-colors",
                                !row.isValid && "bg-[#FFF5F5]"
                              )}
                            >
                              <td className="py-2 px-3">
                                {row.isValid ? (
                                  <CheckCircle2 className="w-4 h-4 text-[#28D17C]" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-[#EF4444]" />
                                )}
                              </td>
                              <td className="py-2 px-3 font-semibold text-[#0B1F33]">
                                {row.full_name || <span className="text-[#EF4444]">Missing</span>}
                              </td>
                              <td className="py-2 px-3 text-[#526173] font-mono text-[11px]">
                                {row.email || <span className="text-[#EF4444]">Missing</span>}
                              </td>
                              <td className="py-2 px-3 text-[#526173]">{row.department}</td>
                              <td className="py-2 px-3">
                                <span className="font-semibold uppercase text-[10px] px-1.5 py-0.5 rounded bg-[#F1F4F8] text-[#0B1F33]">
                                  {row.tier}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[11px]">
                                {row.errors.length > 0 ? (
                                  <span className="text-[#EF4444] font-medium">
                                    {row.errors.join(", ")}
                                  </span>
                                ) : row.warnings.length > 0 ? (
                                  <span className="text-[#B45309]">
                                    {row.warnings.join(", ")}
                                  </span>
                                ) : (
                                  <span className="text-[#28D17C]">Valid</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {parsedRows.length > 30 && (
                      <p className="text-[11px] text-[#8491A3] text-right">
                        Showing first 30 of {parsedRows.length} records
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Controls */}
          {!importResult && (
            <div className="px-6 py-4 border-t border-[#E2E8F0] bg-[#F7F9FC] flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#526173] hover:text-[#0B1F33] cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={validCount === 0 || isSubmitting}
                onClick={handleSubmitImport}
                className={cn(
                  "px-5 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer",
                  validCount > 0 && !isSubmitting
                    ? "bg-[#28D17C] text-[#0B1F33] hover:bg-[#22BC6E]"
                    : "bg-[#E2E8F0] text-[#8491A3] cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing Roster ({validCount})...</span>
                  </>
                ) : (
                  <>
                    <span>Import {validCount} Employees</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
