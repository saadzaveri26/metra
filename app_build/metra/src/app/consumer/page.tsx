"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShieldCheck,
  HeartPulse,
  ShieldAlert,
  Megaphone,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  Scale,
  DollarSign,
  Calendar,
  Sparkles,
} from "lucide-react";

export default function ConsumerDashboard() {
  const router = useRouter();
  const [barcodeInput, setBarcodeInput] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      router.push(`/consumer/lookup?barcode=${encodeURIComponent(barcodeInput.trim())}`);
    }
  };

  const sampleBarcodes = [
    { code: "8901234567890", name: "Organic Honey" },
    { code: "8901030383748", name: "Whole Wheat Atta" },
    { code: "8901491101837", name: "California Almonds" },
    { code: "8901725131209", name: "Masala Potato Chips" },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#0a2038] via-[#0d2a4d] to-[#0867c9] text-white rounded-2xl p-6 sm:p-8 shadow-md border border-[#1e4e85]">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-[#2fd195]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ministry of Consumer Affairs · Citizen Safety</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Verify Packaged Goods &amp; Nutritional Health
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            Instant statutory check against Legal Metrology (Packaged Commodities) Rules, 2011 combined with Open Food Facts Nutri-Score &amp; ultra-processing insights.
          </p>
        </div>

        {/* Hero Search Bar */}
        <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Enter product barcode number (e.g. 8901234567890)..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-slate-900 text-xs font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2fd195] shadow-inner"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#159a68] hover:bg-[#128358] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>Look Up Product</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Sample Chips */}
        <div className="mt-4 flex items-center gap-2 flex-wrap text-[11px] text-slate-300">
          <span className="font-semibold text-white">Try Sample Barcode:</span>
          {sampleBarcodes.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => router.push(`/consumer/lookup?barcode=${item.code}`)}
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white font-mono transition-colors"
            >
              {item.name} ({item.code.slice(-4)})
            </button>
          ))}
        </div>
      </div>

      {/* Safety Alert Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded">
              Active Warning
            </span>
            <p className="text-xs font-bold text-[#10243e] mt-0.5">
              Sub-Standard Net Quantity Notice: Refined Sunflower Oil 1L (Batch #GS-2026-0811)
            </p>
          </div>
        </div>
        <Link
          href="/consumer/alerts"
          className="text-xs font-bold text-[#0867c9] hover:underline whitespace-nowrap"
        >
          View All Alerts &rarr;
        </Link>
      </div>

      {/* 3 Core Workflow Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Product Lookup */}
        <div className="bg-white rounded-xl p-6 border border-[#dce7f2] shadow-sm flex flex-col justify-between hover:border-[#159a68]/40 transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#e8f8f0] text-[#159a68] flex items-center justify-center mb-4">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#10243e]">Compliance &amp; Health Lookup</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Verify mandatory MRP, packaging dates, and net quantity alongside Open Food Facts Nutri-Score, NOVA ultra-processing groups, and allergens.
            </p>
          </div>
          <Link
            href="/consumer/lookup"
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#159a68] hover:underline"
          >
            <span>Scan or lookup barcode</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 2: Report Suspicious Product */}
        <div className="bg-white rounded-xl p-6 border border-[#dce7f2] shadow-sm flex flex-col justify-between hover:border-red-300 transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#10243e]">Report an Irregularity</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Encountered overcharging above MRP, dual price stickers, or missing customer care contacts? File an instant citizen report for officer triage.
            </p>
          </div>
          <Link
            href="/consumer/report"
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
          >
            <span>Submit citizen report</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 3: Safety & Recalls */}
        <div className="bg-white rounded-xl p-6 border border-[#dce7f2] shadow-sm flex flex-col justify-between hover:border-[#0867c9]/40 transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#eaf4ff] text-[#0867c9] flex items-center justify-center mb-4">
              <Megaphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#10243e]">Safety &amp; Recall Bulletins</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Stay protected with verified notices issued by Legal Metrology inspection officers regarding substandard batches and adulteration warnings.
            </p>
          </div>
          <Link
            href="/consumer/alerts"
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0867c9] hover:underline"
          >
            <span>Browse safety alerts</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Know Your Statutory Rights Section */}
      <div className="bg-white rounded-xl p-6 border border-[#dce7f2] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#10243e] uppercase tracking-wider">
              Your Statutory Rights Under Legal Metrology (PCR 2011)
            </h2>
            <p className="text-xs text-slate-500">Every consumer in India is legally protected against deceptive pre-packaging</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-[#e8f8f0] text-[#159a68]">
            Statutory Protections
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-[#eaf4ff] text-[#0867c9] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-xs text-[#10243e]">No Surcharges Above MRP</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Section 36 prohibits retailers from charging higher than the printed MRP. Double stickering is illegal.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-[#e8f8f0] text-[#159a68] flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-xs text-[#10243e]">Mandatory Unit Sale Price</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Rule 6(11) mandates price per gram, ml, or piece to allow fair price comparison across brand pack sizes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-[#fef5e7] text-[#e69b00] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-xs text-[#10243e]">Clear Packaging &amp; Expiry</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Rule 6(1)(d) mandates month &amp; year of manufacture and expiry. Smudged or missing dates violate the law.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-[#f4effe] text-[#7c3aed] flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-xs text-[#10243e]">Mandatory Grievance Helpline</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Rule 6(1)(da) requires every manufacturer to state telephone, email, and postal address for customer complaints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
