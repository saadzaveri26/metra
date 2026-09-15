"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  ScanLine,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface ProductSKU {
  id: string;
  sku: string;
  name: string;
  category: string;
  mrp: string;
  netQty: string;
  status: "verified" | "action_needed" | "untested";
  lastChecked: string;
}

export default function VendorProductsPage() {
  const [search, setSearch] = useState("");

  const [products] = useState<ProductSKU[]>([
    {
      id: "prod-1",
      sku: "8901234567890",
      name: "Organic Honey Glass Jar 500g",
      category: "Packaged Food",
      mrp: "₹385.00",
      netQty: "500 g",
      status: "verified",
      lastChecked: "14 Sep 2026",
    },
    {
      id: "prod-2",
      sku: "8901234567891",
      name: "Roasted Almonds Pouch 250g",
      category: "Packaged Food",
      mrp: "₹450.00",
      netQty: "250 g",
      status: "verified",
      lastChecked: "12 Sep 2026",
    },
    {
      id: "prod-3",
      sku: "8901234567892",
      name: "Herbal Shampoo Bottle 200ml",
      category: "Cosmetics",
      mrp: "₹190.00",
      netQty: "200 ml",
      status: "action_needed",
      lastChecked: "13 Sep 2026",
    },
    {
      id: "prod-4",
      sku: "8901234567893",
      name: "Cold-Pressed Mustard Oil 1L",
      category: "Edible Oils",
      mrp: "₹240.00",
      netQty: "1 L",
      status: "verified",
      lastChecked: "10 Sep 2026",
    },
    {
      id: "prod-5",
      sku: "8901234567894",
      name: "Organic Chia Seeds 200g",
      category: "Packaged Food",
      mrp: "₹280.00",
      netQty: "200 g",
      status: "untested",
      lastChecked: "Never tested",
    },
  ]);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.includes(search) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#10243e] tracking-tight">
            Product Catalog &amp; Packaging Readiness
          </h1>
          <p className="text-xs text-slate-500">
            Monitor pre-market compliance testing status across registered commodity lines
          </p>
        </div>

        <Link
          href="/vendor/self-check"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0867c9] hover:bg-[#0753a0] text-white text-xs font-semibold shadow transition-colors"
        >
          <ScanLine className="w-3.5 h-3.5" />
          <span>New Packaging Check</span>
        </Link>
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-white rounded-xl p-4 border border-[#dce7f2] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search SKU barcode or commodity name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0867c9]"
          />
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-500">
            <span className="font-bold text-[#159a68]">3</span> Verified Compliant
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">
            <span className="font-bold text-amber-600">1</span> Needs Remediation
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">
            <span className="font-bold text-slate-700">1</span> Untested
          </span>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-xl border border-[#dce7f2] shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f8fafc] text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-5 py-3">Product Name &amp; Barcode</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">MRP &amp; Net Quantity</th>
              <th className="px-5 py-3">Pre-Market Status</th>
              <th className="px-5 py-3">Last Checked</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((prod) => (
              <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5">
                  <p className="font-semibold text-[#10243e]">{prod.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{prod.sku}</p>
                </td>
                <td className="px-5 py-3.5 text-slate-600">{prod.category}</td>
                <td className="px-5 py-3.5 text-slate-700 font-medium">
                  {prod.mrp} · <span className="text-slate-500">{prod.netQty}</span>
                </td>
                <td className="px-5 py-3.5">
                  {prod.status === "verified" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f8f0] text-[#159a68]">
                      <CheckCircle2 className="w-3 h-3" />
                      PCR Verified
                    </span>
                  )}
                  {prod.status === "action_needed" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#feecec] text-[#dc2626]">
                      <AlertTriangle className="w-3 h-3" />
                      Action Needed
                    </span>
                  )}
                  {prod.status === "untested" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                      Not Tested
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-slate-500">{prod.lastChecked}</td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href="/vendor/self-check"
                    className="text-xs font-semibold text-[#0867c9] hover:underline"
                  >
                    {prod.status === "untested" ? "Run Check" : "Re-Check"}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
