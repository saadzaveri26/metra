"use client";

import { useState } from "react";
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
} from "lucide-react";

interface ReportItem {
  id: string;
  productName: string;
  manufacturer: string;
  reportType: string;
  status: "Pass" | "Fail" | "Review";
  date: string;
  jurisdiction: string;
}

const mockReports: ReportItem[] = [
  {
    id: "REP-2026-0891",
    productName: "Fortune Sunlite Refined Sunflower Oil 1L",
    manufacturer: "Adani Wilmar Ltd.",
    reportType: "Statutory Packaging Audit",
    status: "Pass",
    date: "14 Sep 2026",
    jurisdiction: "Maharashtra West",
  },
  {
    id: "REP-2026-0892",
    productName: "Imported Belgian Dark Cocoa Powder 200g",
    manufacturer: "EuroConfect NV / Global Foods",
    reportType: "Section 36(1) Violation Dossier",
    status: "Fail",
    date: "14 Sep 2026",
    jurisdiction: "Delhi Central",
  },
  {
    id: "REP-2026-0893",
    productName: "FarmFresh Organic Raw Almonds Jar 500g",
    manufacturer: "NutriNaturals Organics",
    reportType: "Rule 7 Font Verification",
    status: "Review",
    date: "13 Sep 2026",
    jurisdiction: "Maharashtra West",
  },
  {
    id: "REP-2026-0894",
    productName: "Parle-G Gold Glucose Biscuits 250g",
    manufacturer: "Parle Products Pvt. Ltd.",
    reportType: "Routine Market Survey",
    status: "Pass",
    date: "13 Sep 2026",
    jurisdiction: "Maharashtra West",
  },
  {
    id: "REP-2026-0895",
    productName: "Apex Herbal Antiseptic Liquid 100ml",
    manufacturer: "Apex Formulations",
    reportType: "Non-Standard Declaration Citation",
    status: "Fail",
    date: "12 Sep 2026",
    jurisdiction: "Himachal Pradesh",
  },
  {
    id: "REP-2026-0896",
    productName: "Tata Salt Vacuum Evaporated Iodised 1kg",
    manufacturer: "Tata Consumer Products Ltd.",
    reportType: "Standard Packaging Audit",
    status: "Pass",
    date: "11 Sep 2026",
    jurisdiction: "Maharashtra West",
  },
];

export default function OfficerReportsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = mockReports.filter((r) => {
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
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Dossier</span>
          </button>
          <button
            type="button"
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
              link.setAttribute("download", `metra_enforcement_reports_${new Date().toISOString().slice(0, 10)}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#0867c9] hover:bg-[#063d78] rounded-lg transition-colors shadow-sm"
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

        <div className="flex items-center gap-2">
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No enforcement reports match your criteria.
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
                      <button
                        type="button"
                        onClick={() => alert(`Report ${r.id} downloaded for ${r.productName}`)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0867c9] hover:underline"
                      >
                        <span>Download</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-[#f7faff] border-t border-[#dce7f2] flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filtered.length} of {mockReports.length} records</span>
          <span className="text-[11px] text-slate-400">Statutory records retained under Rule 34</span>
        </div>
      </div>
    </div>
  );
}
