"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ScanLine,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  Search,
  ChevronRight,
  ShieldAlert,
  Calendar,
  X,
  Scale,
} from "lucide-react";

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

const mockAnalyses: RecentAnalysis[] = [
  {
    id: "SCN-2026-0914-01",
    productName: "Fortune Sunlite Refined Sunflower Oil 1L",
    manufacturer: "Adani Wilmar Ltd., Ahmedabad, Gujarat",
    category: "Edible Oils",
    date: "Today, 14:20",
    status: "COMPLIANT",
    riskScore: 5,
    violationsCount: 0,
    findings: "All 9 mandatory declarations fully compliant with PCR 2011 Rule 6.",
  },
  {
    id: "SCN-2026-0914-02",
    productName: "Imported Belgian Dark Cocoa Powder 200g",
    manufacturer: "EuroConfect NV / Packed by Global Foods Delhi",
    category: "Confectionery",
    date: "Today, 12:45",
    status: "NON_COMPLIANT",
    riskScore: 78,
    violationsCount: 2,
    findings: "Violation: Missing Country of Origin (Rule 6(1)(aa)) and incomplete Importer Address.",
  },
  {
    id: "SCN-2026-0914-03",
    productName: "FarmFresh Organic Raw Almonds Jar 500g",
    manufacturer: "NutriNaturals Organics, Pune, Maharashtra",
    category: "Dry Fruits",
    date: "Today, 10:15",
    status: "NEEDS_REVIEW",
    riskScore: 35,
    violationsCount: 0,
    findings: "Review required: Net quantity numeral height ~1.8mm (Rule 7 requires >= 2.0mm for 500g).",
  },
  {
    id: "SCN-2026-0913-04",
    productName: "Parle-G Gold Glucose Biscuits 250g",
    manufacturer: "Parle Products Pvt. Ltd., Mumbai",
    category: "Bakery & Biscuits",
    date: "Yesterday",
    status: "COMPLIANT",
    riskScore: 0,
    violationsCount: 0,
    findings: "All declarations verified including Unit Sale Price (Rule 6(11)).",
  },
  {
    id: "SCN-2026-0913-05",
    productName: "Tata Salt Vacuum Evaporated Iodised 1kg",
    manufacturer: "Tata Consumer Products Ltd., Mumbai",
    category: "Spices & Salt",
    date: "Yesterday",
    status: "COMPLIANT",
    riskScore: 0,
    violationsCount: 0,
    findings: "Standard compliant packaging with complete consumer care details.",
  },
  {
    id: "SCN-2026-0912-06",
    productName: "Apex Herbal Antiseptic Liquid 100ml",
    manufacturer: "Apex Formulations, Baddi, HP",
    category: "Personal Care",
    date: "12 Sep 2026",
    status: "NON_COMPLIANT",
    riskScore: 65,
    violationsCount: 1,
    findings: "Violation: MRP not inclusive of all taxes wording; missing consumer care phone.",
  },
];

export default function OfficerDashboard() {
  const [filter, setFilter] = useState<"ALL" | "COMPLIANT" | "NON_COMPLIANT" | "NEEDS_REVIEW">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<RecentAnalysis | null>(null);

  const filteredAnalyses = mockAnalyses.filter((item) => {
    const matchesFilter = filter === "ALL" || item.status === filter;
    const matchesSearch =
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0a2038] via-[#0e2c4d] to-[#0867c9] rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md mb-3 border border-white/15">
            <Scale className="w-3.5 h-3.5 text-[#2fd195]" />
            <span>Enforcement Zone · Legal Metrology Act, 2009</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Welcome back, Inspector
          </h2>
          <p className="mt-2 text-sm text-[#c5d8ed] leading-relaxed">
            Here is your enforcement overview for today. 1,248 packaged commodities verified across
            jurisdiction, with 186 statutory violations logged for inspector action.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/officer/scan"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#159a68] hover:bg-[#0e6e4a] text-white text-sm font-semibold shadow-md transition-all transform hover:-translate-y-0.5"
            >
              <ScanLine className="w-4 h-4" />
              <span>+ Scan New Package</span>
            </Link>
            <Link
              href="/officer/reports"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 backdrop-blur-md transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Enforcement Reports</span>
            </Link>
          </div>
        </div>

        {/* Ambient watermark background */}
        <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1 */}
        <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#62738a] uppercase tracking-wider">
              Products Analysed
            </span>
            <div className="w-9 h-9 rounded-lg bg-[#eaf4ff] text-[#0867c9] flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-[#10243e] mt-3">1,248</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-[#159a68] font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+12% from last week</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all regional retail checks</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#62738a] uppercase tracking-wider">
              Compliant
            </span>
            <div className="w-9 h-9 rounded-lg bg-[#e5f8ef] text-[#159a68] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-[#159a68] mt-3">1,062</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span className="font-bold text-[#159a68]">85.1%</span>
            <span>met all 9 declarations</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">PCR 2011 Rules 6 &amp; 12 compliant</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#62738a] uppercase tracking-wider">
              Violations
            </span>
            <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-red-600 mt-3">186</p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>14.9% flagged for action</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Automated Section 36(1) cases</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#62738a] uppercase tracking-wider">
              Compliance Rate
            </span>
            <div className="w-9 h-9 rounded-lg bg-[#fff3df] text-[#b9781a] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-[#10243e] mt-3">85%</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-[#0867c9] h-full rounded-full" style={{ width: "85%" }}></div>
            </div>
            <span className="text-[11px] font-bold text-slate-600">Goal 90%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Jurisdictional enforcement index</p>
        </div>
      </div>

      {/* Main Grid: Recent Analysis Table (Left) + Compliance Breakdown & Quick Actions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Analysis Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#dce7f2] shadow-sm overflow-hidden flex flex-col">
          {/* Table Header & Controls */}
          <div className="p-5 border-b border-[#dce7f2]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#10243e]">Recent Analysis</h3>
                <p className="text-xs text-[#62738a]">
                  Packaged commodity inspection logs and automated rule evaluations
                </p>
              </div>
              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search product or brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0867c9] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: "All Analyses", value: "ALL" },
                { label: "Compliant", value: "COMPLIANT" },
                { label: "Violations", value: "NON_COMPLIANT" },
                { label: "Needs Review", value: "NEEDS_REVIEW" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value as any)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    filter === tab.value
                      ? "bg-[#0867c9] text-white font-semibold shadow-xs"
                      : "bg-slate-100 text-[#62738a] hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f7faff] text-[#62738a] border-b border-[#dce7f2] uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Product &amp; Manufacturer</th>
                  <th className="px-4 py-3 hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dce7f2]">
                {filteredAnalyses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400">
                      No analyses found matching your query.
                    </td>
                  </tr>
                ) : (
                  filteredAnalyses.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#f7faff] transition-colors cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-[#10243e] hover:text-[#0867c9]">
                          {item.productName}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {item.manufacturer}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 hidden md:table-cell">
                        {item.category}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 hidden sm:table-cell whitespace-nowrap">
                        {item.date}
                      </td>
                      <td className="px-4 py-3.5">
                        {item.status === "COMPLIANT" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e5f8ef] text-[#0e6e4a] border border-[#a8e7cb]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#159a68]"></span>
                            Pass
                          </span>
                        )}
                        {item.status === "NON_COMPLIANT" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                            Fail
                          </span>
                        )}
                        {item.status === "NEEDS_REVIEW" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#fff3df] text-[#b9781a] border border-[#f5d9a6]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#b9781a]"></span>
                            Review
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0867c9] hover:text-[#063d78]"
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

          <div className="p-3 bg-[#f7faff] border-t border-[#dce7f2] flex items-center justify-between text-xs text-slate-500 px-5">
            <span>Showing {filteredAnalyses.length} of {mockAnalyses.length} records</span>
            <Link href="/officer/reports" className="font-semibold text-[#0867c9] hover:underline">
              View All History &rarr;
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Compliance Progress Bars + Quick Actions */}
        <div className="space-y-6">
          {/* Compliance Overview Progress Card */}
          <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm">
            <h3 className="text-base font-bold text-[#10243e]">Compliance Overview</h3>
            <p className="text-xs text-[#62738a] mt-0.5">
              Rule 6 statutory requirements compliance across regional market sampling
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Mandatory Declarations (Rule 6)</span>
                  <span className="text-[#0867c9]">92%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-[#0867c9] h-2 rounded-full" style={{ width: "92%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Net Quantity &amp; Units (Rule 12)</span>
                  <span className="text-[#159a68]">88%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-[#159a68] h-2 rounded-full" style={{ width: "88%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Maximum Retail Price (Rule 6(1)(e))</span>
                  <span className="text-[#b9781a]">84%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-[#b9781a] h-2 rounded-full" style={{ width: "84%" }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Manufacturer Details (Rule 6(1)(a))</span>
                  <span className="text-[#159a68]">95%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-[#159a68] h-2 rounded-full" style={{ width: "95%" }}></div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Benchmark: Legal Metrology (PC) Rules</span>
              <span className="font-semibold text-slate-700">Updated today</span>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm">
            <h3 className="text-base font-bold text-[#10243e]">Quick Actions</h3>
            <p className="text-xs text-[#62738a] mt-0.5">Primary enforcement workflows</p>

            <div className="mt-4 space-y-3">
              <Link
                href="/officer/scan"
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#eaf4ff] border border-[#0867c9]/20 hover:bg-[#d8ecff] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0867c9] text-white flex items-center justify-center shadow-xs">
                    <ScanLine className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#0867c9] group-hover:text-[#063d78]">
                      + Scan New Package
                    </p>
                    <p className="text-[11px] text-slate-500">Run instant AI extraction &amp; checks</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#0867c9]" />
              </Link>

              <Link
                href="/officer/reports"
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#10243e] flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#10243e]">Generate Report</p>
                    <p className="text-[11px] text-slate-500">Export audit &amp; violation rosters</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
              </Link>

              <Link
                href="/officer/products"
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-[#10243e] flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#10243e]">Browse Products</p>
                    <p className="text-[11px] text-slate-500">Track commodities &amp; offenders</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Inspection Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-ux4g-4 border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
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
    </div>
  );
}
