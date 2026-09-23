"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  FileText,
  Download,
  Filter,
  Search,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Printer,
  RefreshCw,
  ScanLine,
} from "lucide-react";
import { API_BASE } from "@/lib/api";
import { formatScanDateTime, resolveProductName } from "@/lib/formatters";

interface ReportItem {
  id: string;
  productName: string;
  manufacturer: string;
  reportType: string;
  status: "Pass" | "Fail" | "Review";
  date: string;
  jurisdiction: string;
}

export default function OfficerReportsPage() {
  const { getToken } = useAuth();
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/scans`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const scans = await res.json();
        const mapped: ReportItem[] = (scans || []).map((s: any) => {
          const overall = s.compliance_summary?.overall_status;
          const statusText: "Pass" | "Fail" | "Review" =
            overall === "COMPLIANT" ? "Pass" : overall === "NON_COMPLIANT" ? "Fail" : "Review";
          const reportType =
            overall === "NON_COMPLIANT"
              ? "Section 36(1) Violation Dossier"
              : overall === "NEEDS_REVIEW"
              ? "Rule 7 Field Review Audit"
              : "Statutory Packaging Audit";

          return {
            id: `REP-${(s.id || "").slice(-8).toUpperCase()}`,
            productName: resolveProductName(s),
            manufacturer: s.structured_fields?.manufacturer?.value || "Declared Manufacturer Pending",
            reportType,
            status: statusText,
            date: formatScanDateTime(s.created_at),
            jurisdiction: s.jurisdiction || "Assigned Division",
          };
        });
        setReports(mapped);
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error("Failed to load officer reports:", err);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filtered = reports.filter((r) => {
    const matchesStatus = statusFilter === "ALL" || r.status.toUpperCase() === statusFilter;
    const matchesSearch =
      r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#10243e] tracking-tight">
            Enforcement Reports
          </h2>
          <p className="text-xs text-[#62738a] mt-0.5">
            Legal Metrology inspection dossiers, violation registries, and statutory certificates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            disabled={reports.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Dossier</span>
          </button>
          <button
            type="button"
            disabled={filtered.length === 0}
            onClick={() => {
              const csvContent =
                "data:text/csv;charset=utf-8," +
                "Report ID,Product,Manufacturer,Report Type,Status,Date,Jurisdiction\n" +
                filtered
                  .map(
                    (r) =>
                      `"${r.id}","${r.productName}","${r.manufacturer}","${r.reportType}","${r.status}","${r.date}","${r.jurisdiction}"`
                  )
                  .join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute(
                "download",
                `metra_enforcement_reports_${new Date().toISOString().slice(0, 10)}.csv`
              );
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#0867c9] hover:bg-[#063d78] rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-[#dce7f2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Report ID, Product, or Manufacturer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0867c9] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Status:</span>
          {["ALL", "PASS", "FAIL", "REVIEW"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === tab
                  ? "bg-[#0867c9] text-white font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
          <button
            type="button"
            onClick={fetchReports}
            title="Refresh reports"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-[#0867c9] hover:bg-slate-50 transition-colors ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl border border-[#dce7f2] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f7faff] text-[#62738a] border-b border-[#dce7f2] uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="px-5 py-3">Report ID</th>
                <th className="px-4 py-3">Product &amp; Brand</th>
                <th className="px-4 py-3">Manufacturer</th>
                <th className="px-4 py-3">Report Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dce7f2]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0867c9]" />
                      <span>Loading statutory reports...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0867c9] mb-3">
                        <FileText className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm text-[#10243e]">
                        {searchQuery || statusFilter !== "ALL"
                          ? "No matching reports"
                          : "No statutory enforcement reports yet"}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {searchQuery || statusFilter !== "ALL"
                          ? "Try modifying your search or clearing the status filter."
                          : "Inspection dossiers and violation citations will be automatically generated whenever package labels are scanned."}
                      </p>
                      {!searchQuery && statusFilter === "ALL" && (
                        <Link
                          href="/officer/scan"
                          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0867c9] hover:bg-[#0753a0] text-white text-xs font-semibold shadow transition-colors"
                        >
                          <ScanLine className="w-3.5 h-3.5" />
                          <span>Scan Package Now</span>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-[#f7faff] transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#0867c9]">{r.id}</td>
                    <td className="px-4 py-3.5 font-semibold text-[#10243e]">{r.productName}</td>
                    <td className="px-4 py-3.5 text-slate-600">{r.manufacturer}</td>
                    <td className="px-4 py-3.5 text-slate-500">{r.reportType}</td>
                    <td className="px-4 py-3.5">
                      {r.status === "Pass" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e5f8ef] text-[#0e6e4a] border border-[#a8e7cb]">
                          <CheckCircle2 className="w-3 h-3 text-[#159a68]" />
                          Pass
                        </span>
                      )}
                      {r.status === "Fail" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                          <ShieldAlert className="w-3 h-3 text-red-600" />
                          Violation
                        </span>
                      )}
                      {r.status === "Review" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fff3df] text-[#b9781a] border border-[#f5d9a6]">
                          <AlertTriangle className="w-3 h-3 text-[#b9781a]" />
                          Review
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{r.date}</td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href="/officer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0867c9] hover:underline"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-[#f7faff] border-t border-[#dce7f2] flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {filtered.length} of {reports.length} records
          </span>
          <span className="text-[11px] text-slate-400">Statutory records retained under Rule 34</span>
        </div>
      </div>
    </div>
  );
}
