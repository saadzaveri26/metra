"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
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
  RefreshCw,
  ScanLine,
} from "lucide-react";
import { API_BASE } from "@/lib/api";

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

export default function OfficerProductsPage() {
  const { getToken } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/scans`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const scans = await res.json();
        // Group scans by product name + manufacturer
        const groups: Record<
          string,
          {
            id: string;
            name: string;
            manufacturer: string;
            category: string;
            packSize: string;
            totalScans: number;
            violationsCount: number;
            compliantScans: number;
          }
        > = {};

        for (const s of scans || []) {
          const name = s.structured_fields?.product_name?.value || "Unlabeled Package Commodity";
          const mfg = s.structured_fields?.manufacturer?.value || "Declared Manufacturer Pending";
          const cat = s.structured_fields?.category?.value || "General FMCG";
          const qty = s.structured_fields?.net_quantity?.value || "--";
          const key = `${name.toLowerCase()}:::${mfg.toLowerCase()}`;

          if (!groups[key]) {
            groups[key] = {
              id: `PRD-${(s.id || "").slice(-6).toUpperCase()}`,
              name,
              manufacturer: mfg,
              category: cat,
              packSize: qty,
              totalScans: 0,
              violationsCount: 0,
              compliantScans: 0,
            };
          }

          groups[key].totalScans += 1;
          const status = s.compliance_summary?.overall_status;
          if (status === "NON_COMPLIANT") {
            groups[key].violationsCount += 1;
          } else if (status === "COMPLIANT") {
            groups[key].compliantScans += 1;
          }
        }

        const items: ProductItem[] = Object.values(groups).map((g) => {
          const rate = g.totalScans > 0 ? Math.round((g.compliantScans / g.totalScans) * 100) : 100;
          return {
            id: g.id,
            name: g.name,
            manufacturer: g.manufacturer,
            category: g.category,
            packSize: g.packSize,
            complianceRate: rate,
            totalScans: g.totalScans,
            violationsCount: g.violationsCount,
            repeatOffender: g.violationsCount >= 2,
          };
        });

        setProducts(items);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories = [
    "ALL",
    ...Array.from(new Set(products.map((p) => p.category))).filter((c) => c !== "ALL"),
  ];

  const totalCommodities = products.length;
  const avgCompliance =
    totalCommodities > 0
      ? (products.reduce((acc, p) => acc + p.complianceRate, 0) / totalCommodities).toFixed(1)
      : "0.0";
  const repeatViolatorsCount = products.filter((p) => p.repeatOffender).length;

  const filtered = products.filter((p) => {
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
          <p className="text-2xl font-bold text-[#10243e] mt-2">
            {isLoading ? "..." : totalCommodities}
          </p>
          <p className="text-[11px] text-[#159a68] font-medium mt-1">
            {totalCommodities > 0
              ? `Across ${categories.length - 1 || 1} packaged categories`
              : "Awaiting initial scans"}
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm">
          <p className="text-xs font-semibold text-[#62738a] uppercase tracking-wider">
            Average Jurisdictional Compliance
          </p>
          <p className="text-2xl font-bold text-[#159a68] mt-2">
            {isLoading ? "..." : totalCommodities > 0 ? `${avgCompliance}%` : "0%"}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Based on on-label physical checks</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm">
          <p className="text-xs font-semibold text-[#62738a] uppercase tracking-wider">
            Flagged Repeat Violators
          </p>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {isLoading ? "..." : `${repeatViolatorsCount} Entities`}
          </p>
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

        <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-wrap">
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
          <button
            type="button"
            onClick={fetchProducts}
            title="Refresh directory"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-[#0867c9] hover:bg-slate-50 transition-colors ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
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
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0867c9]" />
                      <span>Loading commodity directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0867c9] mb-3">
                        <Package className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm text-[#10243e]">
                        {searchQuery || categoryFilter !== "ALL"
                          ? "No matching commodities found"
                          : "No commodities registered yet"}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {searchQuery || categoryFilter !== "ALL"
                          ? "Try modifying your search or choosing a different category filter."
                          : "Commodities and their manufacturers are automatically registered and aggregated when package labels are scanned."}
                      </p>
                      {!searchQuery && categoryFilter === "ALL" && (
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
                      <Link
                        href="/officer/scan"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0867c9] hover:underline"
                      >
                        <span>Inspect</span>
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
            Showing {filtered.length} of {products.length} commodities
          </span>
          <span className="text-[11px] text-slate-400">Legal Metrology Packaged Commodities Database</span>
        </div>
      </div>
    </div>
  );
}
