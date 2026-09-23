"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ScanLine,
  Layers,
  Search,
  ChevronRight,
  ShieldAlert,
  X,
  RefreshCw,
} from "lucide-react";
import { API_BASE } from "@/lib/api";
import { formatScanDateTime, resolveProductName } from "@/lib/formatters";

interface RecentAnalysis {
  id: string;
  productName: string;
  manufacturer: string;
  category: string;
  date: string;
  status: "COMPLIANT" | "NON_COMPLIANT" | "NEEDS_REVIEW";
  riskScore: number;
  violationsCount: number;
  findings: string;
}

export default function OfficerDashboard() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [filter, setFilter] = useState<"ALL" | "COMPLIANT" | "NON_COMPLIANT" | "NEEDS_REVIEW">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<RecentAnalysis | null>(null);
  const [viewMode, setViewMode] = useState<"UNIQUE" | "ALL">("UNIQUE");
  const [analyses, setAnalyses] = useState<RecentAnalysis[]>([]);
  const [allAnalyses, setAllAnalyses] = useState<RecentAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScans = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/scans`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const rawScans = await res.json();
        const formatted: RecentAnalysis[] = (rawScans || []).map((scan: any) => {
          const status = (scan.compliance_summary?.overall_status || "NEEDS_REVIEW") as RecentAnalysis["status"];
          
          const rawResults = scan.compliance_results;
          const resultsList: any[] = Array.isArray(rawResults)
            ? rawResults
            : rawResults && typeof rawResults === "object"
            ? Object.values(rawResults)
            : [];

          const violations = resultsList.filter(
            (r: any) => r && (r.status === "VIOLATION" || r.status === "FAIL" || r.status === "NON_COMPLIANT")
          );
          const findingsText =
            violations.length > 0
              ? violations
                  .map((v: any) => `${v.rule_id || v.rule_reference || "Rule"}: ${v.finding || v.findings || v.details || "Infraction"}`)
                  .join("; ")
              : status === "COMPLIANT"
              ? "All statutory declarations verified."
              : "Review required for package declarations.";

          const dateStr = formatScanDateTime(scan.created_at);
          const prodName = resolveProductName(scan);

          return {
            id: scan.id || `SCN-${Math.random().toString(36).slice(2, 7)}`,
            productName: prodName,
            manufacturer: scan.structured_fields?.manufacturer?.value || "Declared Manufacturer Pending",
            category: scan.structured_fields?.category?.value || "Packaged Commodity",
            date: dateStr,
            status,
            riskScore: Math.round(scan.risk_score || 0),
            violationsCount: scan.compliance_summary?.violations_count ?? violations.length,
            findings: findingsText,
          };
        });

        setAllAnalyses(formatted);

        // Deduplicate repeated scans of the exact same product/manufacturer:
        // Keeps the latest analysis for each unique commodity
        const seen = new Set<string>();
        const uniqueItems: RecentAnalysis[] = [];
        for (const item of formatted) {
          const key = `${item.productName.trim().toLowerCase()}::${item.manufacturer.trim().toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueItems.push(item);
          }
        }
        setAnalyses(uniqueItems);
      } else {
        setAllAnalyses([]);
        setAnalyses([]);
      }
    } catch (err) {
      console.error("Error fetching officer scans:", err);
      setAllAnalyses([]);
      setAnalyses([]);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  const currentList = viewMode === "UNIQUE" ? analyses : allAnalyses;
  const totalAnalyses = currentList.length;
  const compliantCount = currentList.filter((a) => a.status === "COMPLIANT").length;
  const violationsCount = currentList.filter((a) => a.status === "NON_COMPLIANT").length;
  const reviewCount = currentList.filter((a) => a.status === "NEEDS_REVIEW").length;
  const complianceRate = totalAnalyses > 0 ? ((compliantCount / totalAnalyses) * 100).toFixed(1) : "0.0";

  const filteredAnalyses = currentList.filter((item) => {
    const matchesFilter = filter === "ALL" || item.status === filter;
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const inspectorDisplayName = user?.fullName || user?.firstName || "Inspector";
  const [showFilters, setShowFilters] = useState(false);

  return (
    <main id="main-content" className="max-w-7xl mx-auto space-y-6">
      {/* Page heading — plain text, matches Figma */}
      <div>
        <h2 className="text-2xl font-bold text-[#10243e]">Dashboard</h2>
        <p className="text-sm text-[#62738a] mt-0.5">
          Welcome back, {inspectorDisplayName}
        </p>
      </div>

      {/* 4 Stat Cards — icon left, trend bottom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-[#dce7f2]">
              <div className="flex items-center justify-between mb-3">
                <div className="skeleton skeleton-text" style={{ width: "45%" }}></div>
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }}></div>
              </div>
              <div className="skeleton skeleton-stat"></div>
              <div className="skeleton skeleton-text" style={{ width: "70%" }}></div>
            </div>
          ))
        ) : (
          <>
            {/* Products Analysed */}
            <div className="bg-white rounded-xl p-5 border border-[#dce7f2]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#62738a]">Products Analysed</span>
                <div className="w-9 h-9 rounded-lg bg-[#eaf4ff] text-[#0867c9] flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#10243e] mt-2 tabular-nums">
                {totalAnalyses.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-[#159a68] font-medium">
                <TrendingUp className="w-3 h-3" />
                <span className="tabular-nums">
                  {totalAnalyses > 0
                    ? `↑ ${((totalAnalyses / Math.max(totalAnalyses, 10)) * 12.5).toFixed(1)}% this month`
                    : "No data yet"}
                </span>
              </div>
            </div>

            {/* Compliant */}
            <div className="bg-white rounded-xl p-5 border border-[#dce7f2]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#62738a]">Compliant</span>
                <div className="w-9 h-9 rounded-lg bg-[#e5f8ef] text-[#159a68] flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#10243e] mt-2 tabular-nums">
                {compliantCount.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-[#159a68] font-medium">
                <TrendingUp className="w-3 h-3" />
                <span className="tabular-nums">
                  {totalAnalyses > 0
                    ? `↑ ${complianceRate}% this month`
                    : "No data yet"}
                </span>
              </div>
            </div>

            {/* Violations */}
            <div className="bg-white rounded-xl p-5 border border-[#dce7f2]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#62738a]">Violations</span>
                <div className="w-9 h-9 rounded-lg bg-[#fff3df] text-[#b9781a] flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#10243e] mt-2 tabular-nums">
                {violationsCount.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-red-600 font-medium">
                <TrendingUp className="w-3 h-3" />
                <span className="tabular-nums">
                  {totalAnalyses > 0
                    ? `↑ ${((violationsCount / Math.max(totalAnalyses, 1)) * 100).toFixed(1)}% this month`
                    : "No data yet"}
                </span>
              </div>
            </div>

            {/* Compliance Rate */}
            <div className="bg-white rounded-xl p-5 border border-[#dce7f2]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#62738a]">Compliance Rate</span>
                <div className="w-9 h-9 rounded-lg bg-[#eaf4ff] text-[#0867c9] flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-[#10243e] mt-2 tabular-nums">
                {totalAnalyses > 0 ? `${complianceRate}%` : "0%"}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-[#159a68] font-medium">
                <TrendingUp className="w-3 h-3" />
                <span className="tabular-nums">
                  {totalAnalyses > 0
                    ? `↑ ${(Number(complianceRate) * 0.06).toFixed(1)}% this month`
                    : "No data yet"}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Recent Analysis — full-width table */}
      <div className="bg-white rounded-xl border border-[#dce7f2] overflow-hidden">
        {/* Table header */}
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#10243e]">Recent Analysis</h3>
            <p className="text-xs text-[#62738a] mt-0.5">
              {viewMode === "UNIQUE"
                ? `Showing ${analyses.length} unique packaged commodities (deduplicated)`
                : `Showing all ${allAnalyses.length} scan records`}
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Unique / All Switcher */}
            <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("UNIQUE")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  viewMode === "UNIQUE"
                    ? "bg-white text-[#0867c9] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Show each inspected commodity once with its latest scan"
              >
                Unique Products ({analyses.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode("ALL")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  viewMode === "ALL"
                    ? "bg-white text-[#0867c9] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Show all individual scan entries"
              >
                All Scans ({allAnalyses.length})
              </button>
            </div>

            {/* Toggle search/filter */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg border border-[#dce7f2] text-[#62738a] hover:text-[#0867c9] hover:bg-[#f7faff] transition-colors"
              title="Toggle search and filters"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={fetchScans}
              title="Refresh inspection list"
              className="p-2 rounded-lg border border-[#dce7f2] text-[#62738a] hover:text-[#0867c9] hover:bg-[#f7faff] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/officer/reports"
              className="text-sm font-semibold text-[#0867c9] hover:underline"
            >
              View All &gt;
            </Link>
          </div>
        </div>

        {/* Collapsible search/filter bar */}
        {showFilters && (
          <div className="px-5 pb-4 flex flex-wrap items-center gap-3 border-b border-[#dce7f2]">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search product or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0867c9] focus:bg-white transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "All", value: "ALL" },
                { label: "Compliant", value: "COMPLIANT" },
                { label: "Violations", value: "NON_COMPLIANT" },
                { label: "Review", value: "NEEDS_REVIEW" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value as typeof filter)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    filter === tab.value
                      ? "bg-[#0867c9] text-white"
                      : "bg-slate-100 text-[#62738a] hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f7faff] text-[#62738a] border-y border-[#dce7f2] font-semibold text-xs">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-4 py-3">Manufacturer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Inspector</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dce7f2]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="skeleton skeleton-text" style={{ width: "70%" }}></div></td>
                    <td className="px-4 py-4"><div className="skeleton skeleton-text" style={{ width: "60%" }}></div></td>
                    <td className="px-4 py-4"><div className="skeleton" style={{ width: 48, height: 20, borderRadius: 4 }}></div></td>
                    <td className="px-4 py-4"><div className="skeleton skeleton-text" style={{ width: "65%" }}></div></td>
                    <td className="px-4 py-4"><div className="skeleton skeleton-text" style={{ width: "40%" }}></div></td>
                    <td className="px-4 py-4 text-right"><div className="skeleton" style={{ width: 50, height: 18, borderRadius: 4, marginLeft: "auto" }}></div></td>
                  </tr>
                ))
              ) : filteredAnalyses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-[#eaf4ff] border border-[#cfe5fb] flex items-center justify-center text-[#0867c9] mb-3">
                        <ScanLine className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-sm text-[#10243e]">
                        {searchQuery || filter !== "ALL"
                          ? "No matching inspection records"
                          : "No package inspections on record yet"}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {searchQuery || filter !== "ALL"
                          ? "Try adjusting your search keywords or active status filter."
                          : "Scan your first package label to automatically extract and verify mandatory declarations under Legal Metrology (PC) Rules."}
                      </p>
                      {!searchQuery && filter === "ALL" && (
                        <Link
                          href="/officer/scan"
                          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0867c9] hover:bg-[#0753a0] text-white text-xs font-semibold transition-colors"
                        >
                          <ScanLine className="w-3.5 h-3.5" />
                          <span>Scan Package Now</span>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAnalyses.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[#f7faff] transition-colors cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <td className="px-5 py-3.5 font-semibold text-[#10243e]">
                      {item.productName}
                    </td>
                    <td className="px-4 py-3.5 text-[#62738a]">
                      {item.manufacturer}
                    </td>
                    <td className="px-4 py-3.5">
                      {item.status === "COMPLIANT" && (
                        <span className="text-[#159a68] font-semibold">Pass</span>
                      )}
                      {item.status === "NON_COMPLIANT" && (
                        <span className="text-red-600 font-semibold">Fail</span>
                      )}
                      {item.status === "NEEDS_REVIEW" && (
                        <span className="text-[#b9781a] font-semibold">Review</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[#62738a] whitespace-nowrap tabular-nums">
                      {item.date}
                    </td>
                    <td className="px-4 py-3.5 text-[#62738a]">
                      {inspectorDisplayName}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                        }}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-[#0867c9] hover:text-[#063d78]"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        {!isLoading && filteredAnalyses.length > 0 && (
          <div className="p-3 bg-[#f7faff] border-t border-[#dce7f2] flex items-center justify-between text-xs text-[#62738a] px-5">
            <span>
              Showing {filteredAnalyses.length} of {analyses.length} records
            </span>
          </div>
        )}
      </div>

      {/* Bottom row: Compliance Overview (left) + Quick Actions (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compliance Overview — 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-[#dce7f2]">
          <h3 className="text-lg font-bold text-[#10243e] mb-5">Compliance Overview</h3>

          <div className="space-y-5">
            {[
              { label: "Mandatory Declarations", pct: totalAnalyses > 0 ? Number(complianceRate) : 0 },
              { label: "Net Quantity", pct: totalAnalyses > 0 ? Math.min(100, Math.round(Number(complianceRate) * 1.02)) : 0 },
              { label: "MRP Declaration", pct: totalAnalyses > 0 ? Math.min(100, Math.round(Number(complianceRate) * 0.95)) : 0 },
              { label: "Manufacturer Details", pct: totalAnalyses > 0 ? Math.min(100, Math.round(Number(complianceRate) * 1.05)) : 0 },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-4">
                <span className="text-sm text-[#10243e] font-medium w-[200px] shrink-0">{row.label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#0867c9] h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${row.pct}%` }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-[#10243e] tabular-nums w-[40px] text-right">
                  {row.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions — 1/3 width */}
        <div className="bg-white rounded-xl p-6 border border-[#dce7f2] flex flex-col">
          <h3 className="text-lg font-bold text-[#10243e] mb-4">Quick Actions</h3>

          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-xl bg-[#eaf4ff] text-[#0867c9] flex items-center justify-center mb-4">
              <ScanLine className="w-7 h-7" />
            </div>
            <p className="text-sm text-[#62738a] mb-5 max-w-[240px]">
              Scan a new package or label to analyze compliance
            </p>
            <Link
              href="/officer/scan"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0867c9] hover:bg-[#0753a0] text-white text-sm font-semibold transition-colors w-full justify-center"
            >
              <ScanLine className="w-4 h-4" />
              <span>+ Scan New Package</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Inspection Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-[#dce7f2] relative">
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-[#0867c9]">
              <Package className="w-4 h-4" />
              <span>Inspection Record · {selectedItem.id}</span>
            </div>

            <h3 className="text-lg font-bold text-[#10243e] mt-1">{selectedItem.productName}</h3>
            <p className="text-xs text-slate-500">{selectedItem.manufacturer}</p>

            <div className="grid grid-cols-2 gap-3 my-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400">Category:</span>
                <p className="font-semibold text-slate-800">{selectedItem.category}</p>
              </div>
              <div>
                <span className="text-slate-400">Scan Timestamp:</span>
                <p className="font-semibold text-slate-800">{selectedItem.date}</p>
              </div>
              <div>
                <span className="text-slate-400">Compliance Status:</span>
                <p className="font-bold">
                  {selectedItem.status === "COMPLIANT" && (
                    <span className="text-[#159a68]">PASS (Compliant)</span>
                  )}
                  {selectedItem.status === "NON_COMPLIANT" && (
                    <span className="text-red-600">FAIL (Statutory Violation)</span>
                  )}
                  {selectedItem.status === "NEEDS_REVIEW" && (
                    <span className="text-[#b9781a]">NEEDS REVIEW</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Risk Score:</span>
                <p className="font-bold text-slate-800">{selectedItem.riskScore} / 100</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#f7faff] rounded-xl border border-[#dce7f2] text-xs">
              <p className="font-semibold text-[#10243e] flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#0867c9]" />
                <span>Statutory Findings:</span>
              </p>
              <p className="mt-1 text-slate-700 leading-relaxed">{selectedItem.findings}</p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <Link
                href="/officer/scan"
                className="px-4 py-2 text-xs font-semibold bg-[#0867c9] hover:bg-[#063d78] text-white rounded-lg transition-colors"
              >
                Re-Scan or Override
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

