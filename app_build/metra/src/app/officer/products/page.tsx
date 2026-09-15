"use client";

import { useState } from "react";
import {
  Package,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Building2,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

interface ProductItem {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  packSize: string;
  complianceRate: number;
  totalScans: number;
  violationsCount: number;
  repeatOffender: boolean;
}

const mockProducts: ProductItem[] = [
  {
    id: "PRD-001",
    name: "Fortune Sunlite Refined Sunflower Oil",
    manufacturer: "Adani Wilmar Ltd.",
    category: "Edible Oils",
    packSize: "1 L Pouch / Jar",
    complianceRate: 98,
    totalScans: 142,
    violationsCount: 1,
    repeatOffender: false,
  },
  {
    id: "PRD-002",
    name: "Parle-G Gold Glucose Biscuits",
    manufacturer: "Parle Products Pvt. Ltd.",
    category: "Bakery & Confectionery",
    packSize: "250 g Pack",
    complianceRate: 100,
    totalScans: 215,
    violationsCount: 0,
    repeatOffender: false,
  },
  {
    id: "PRD-003",
    name: "Imported Belgian Dark Cocoa Powder",
    manufacturer: "EuroConfect NV / Global Foods",
    category: "Confectionery",
    packSize: "200 g Tin",
    complianceRate: 45,
    totalScans: 38,
    violationsCount: 8,
    repeatOffender: true,
  },
  {
    id: "PRD-004",
    name: "Tata Salt Vacuum Evaporated Iodised",
    manufacturer: "Tata Consumer Products Ltd.",
    category: "Salt & Spices",
    packSize: "1 kg Pack",
    complianceRate: 99,
    totalScans: 320,
    violationsCount: 1,
    repeatOffender: false,
  },
  {
    id: "PRD-005",
    name: "FarmFresh Organic Raw Almonds",
    manufacturer: "NutriNaturals Organics",
    category: "Dry Fruits & Nuts",
    packSize: "500 g Jar",
    complianceRate: 78,
    totalScans: 64,
    violationsCount: 4,
    repeatOffender: false,
  },
  {
    id: "PRD-006",
    name: "Apex Herbal Antiseptic Liquid",
    manufacturer: "Apex Formulations",
    category: "Personal Care",
    packSize: "100 ml Bottle",
    complianceRate: 52,
    totalScans: 29,
    violationsCount: 6,
    repeatOffender: true,
  },
];

export default function OfficerProductsPage() {
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["ALL", "Edible Oils", "Bakery & Confectionery", "Confectionery", "Personal Care"];

  const filtered = mockProducts.filter((p) => {
    const matchesCat = categoryFilter === "ALL" || p.category === categoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#10243e] tracking-tight">
            Commodity Directory &amp; Registry
          </h2>
          <p className="text-xs text-[#62738a] mt-0.5">
            Registered packaged commodities, manufacturer packaging history, and repeat offender monitoring
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm">
          <p className="text-xs font-semibold text-[#62738a] uppercase tracking-wider">
            Total Commodities Monitored
          </p>
          <p className="text-2xl font-bold text-[#10243e] mt-2">1,248</p>
          <p className="text-[11px] text-[#159a68] font-medium mt-1">Across 18 FMCG categories</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm">
          <p className="text-xs font-semibold text-[#62738a] uppercase tracking-wider">
            Average Jurisdictional Compliance
          </p>
          <p className="text-2xl font-bold text-[#159a68] mt-2">85.1%</p>
          <p className="text-[11px] text-slate-500 mt-1">Based on on-label physical checks</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm">
          <p className="text-xs font-semibold text-[#62738a] uppercase tracking-wider">
            Flagged Repeat Violators
          </p>
          <p className="text-2xl font-bold text-red-600 mt-2">2 Entities</p>
          <p className="text-[11px] text-red-500 font-medium mt-1">
            Section 36(1) second offence escalation
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white rounded-xl p-4 border border-[#dce7f2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search commodities or manufacturers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0867c9] focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-slate-600 shrink-0">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? "bg-[#0867c9] text-white font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-[#dce7f2] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f7faff] text-[#62738a] border-b border-[#dce7f2] uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="px-5 py-3">Product Name</th>
                <th className="px-4 py-3">Manufacturer / Packer</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Pack Size</th>
                <th className="px-4 py-3">Compliance Rate</th>
                <th className="px-4 py-3">Violation History</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dce7f2]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No commodities found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f7faff] transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-[#10243e]">{p.name}</td>
                    <td className="px-4 py-3.5 text-slate-700 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{p.manufacturer}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{p.category}</td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono">{p.packSize}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              p.complianceRate >= 85
                                ? "bg-[#159a68]"
                                : p.complianceRate >= 60
                                ? "bg-[#b9781a]"
                                : "bg-red-600"
                            }`}
                            style={{ width: `${p.complianceRate}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-[11px]">{p.complianceRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {p.repeatOffender ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                          <ShieldAlert className="w-3 h-3 text-red-600" />
                          Repeat Offender ({p.violationsCount})
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">
                          {p.violationsCount} violations ({p.totalScans} scans)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <a
                        href="/officer/scan"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0867c9] hover:underline"
                      >
                        <span>Inspect</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-[#f7faff] border-t border-[#dce7f2] flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filtered.length} of {mockProducts.length} commodities</span>
          <span className="text-[11px] text-slate-400">Legal Metrology Packaged Commodities Database</span>
        </div>
      </div>
    </div>
  );
}
