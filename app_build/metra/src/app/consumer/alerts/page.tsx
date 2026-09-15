"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Megaphone,
  AlertTriangle,
  AlertOctagon,
  Info,
  ShieldCheck,
  Search,
  ArrowRight,
  Clock,
  Building,
} from "lucide-react";

interface AlertItem {
  id: string;
  title: string;
  product_name: string;
  brand_name: string;
  batch_number?: string;
  hazard_type: string;
  severity: "critical" | "warning" | "advisory";
  description: string;
  published_by: string;
  state_region?: string;
  created_at: string;
}

export default function ConsumerAlertsPage() {
  const [filter, setFilter] = useState<"all" | "critical" | "warning" | "advisory">("all");
  const [search, setSearch] = useState("");

  const [alerts] = useState<AlertItem[]>([
    {
      id: "alert-1",
      title: "Sub-Standard Net Quantity Recall Notice",
      product_name: "Golden Sun Refined Sunflower Oil 1L",
      brand_name: "Golden Sun Consumer Goods",
      batch_number: "GS-2026-0811",
      hazard_type: "Short Net Volume",
      severity: "critical",
      description:
        "Field inspection verified average net volume shortage of 45ml per container exceeding maximum permissible error under Rule 12. Retailers instructed to quarantine stock.",
      published_by: "Directorate of Legal Metrology, Maharashtra",
      state_region: "Maharashtra",
      created_at: "Today, 09:30 AM",
    },
    {
      id: "alert-2",
      title: "Overcharging and Obscured MRP Advisory",
      product_name: "Roasted Salted Pistachios 200g",
      brand_name: "NutriSnack Formulations",
      batch_number: "NS-P772",
      hazard_type: "Dual Sticker Tampering",
      severity: "warning",
      description:
        "Multiple consumer complaints confirmed double-sticker application concealing original manufacturer MRP of ₹240 with ₹299 sticker across transit hubs.",
      published_by: "Legal Metrology Enforcement Wing",
      state_region: "Delhi NCR",
      created_at: "12 Sep 2026",
    },
    {
      id: "alert-3",
      title: "Missing Expiry & Customer Helpline Advisory",
      product_name: "Organic Herbal Cough Lozenges 50g",
      brand_name: "AyurVeda Formulations",
      batch_number: "AY-5501",
      hazard_type: "Missing Mandatory Disclosures",
      severity: "advisory",
      description:
        "Packaging lacks mandatory customer care helpline number and illegible expiry month declaration in violation of Rule 6(1)(da).",
      published_by: "Ministry of Consumer Affairs",
      state_region: "ALL",
      created_at: "08 Sep 2026",
    },
  ]);

  const filtered = alerts.filter((a) => {
    if (filter !== "all" && a.severity !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.product_name.toLowerCase().includes(q) ||
        a.brand_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#10243e] tracking-tight">
            Safety &amp; Packaging Recall Bulletins
          </h1>
          <p className="text-xs text-slate-500">
            Official public notices issued by Legal Metrology inspection officers regarding non-compliant batches
          </p>
        </div>

        <Link
          href="/consumer/report"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Report an Irregular Batch</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-[#dce7f2] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filter === "all" ? "bg-white text-[#10243e] shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setFilter("critical")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filter === "critical" ? "bg-white text-red-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Critical Recalls
          </button>
          <button
            onClick={() => setFilter("warning")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filter === "warning" ? "bg-white text-amber-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Price Warnings
          </button>
          <button
            onClick={() => setFilter("advisory")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filter === "advisory" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Advisories
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search product or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#159a68]"
          />
        </div>
      </div>

      {/* Alerts Cards */}
      <div className="space-y-4">
        {filtered.map((alert) => (
          <div
            key={alert.id}
            className={`bg-white rounded-xl p-5 border shadow-sm transition-all ${
              alert.severity === "critical"
                ? "border-red-200 hover:border-red-300"
                : alert.severity === "warning"
                ? "border-amber-200 hover:border-amber-300"
                : "border-blue-200 hover:border-blue-300"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {alert.severity === "critical" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                    <AlertOctagon className="w-3 h-3" />
                    Critical Recall
                  </span>
                )}
                {alert.severity === "warning" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                    <AlertTriangle className="w-3 h-3" />
                    Price / Label Warning
                  </span>
                )}
                {alert.severity === "advisory" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
                    <Info className="w-3 h-3" />
                    Packaging Advisory
                  </span>
                )}
                <span className="text-xs text-slate-400 font-medium font-mono">{alert.hazard_type}</span>
              </div>

              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {alert.created_at}
              </span>
            </div>

            <h3 className="text-sm font-bold text-[#10243e]">{alert.title}</h3>
            <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
              <span className="font-semibold">{alert.product_name}</span>
              <span>·</span>
              <span className="text-slate-500">{alert.brand_name}</span>
              {alert.batch_number && (
                <>
                  <span>·</span>
                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-700">
                    Batch: {alert.batch_number}
                  </span>
                </>
              )}
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              {alert.description}
            </p>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Authority: <span className="text-slate-600 font-medium">{alert.published_by}</span></span>
              <span>Region: <span className="text-slate-600 font-medium">{alert.state_region || "National"}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
