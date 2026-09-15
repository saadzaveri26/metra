"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  ScanLine,
  ArrowRight,
  BookOpenCheck,
  ShieldCheck,
  ExternalLink,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";

interface RecentCheck {
  id: string;
  name: string;
  category: string;
  date: string;
  status: "COMPLIANT" | "NON_COMPLIANT" | "REVIEW";
  declaredMrp: string;
  netQty: string;
}

export default function VendorDashboard() {
  const [recentChecks] = useState<RecentCheck[]>([
    {
      id: "chk-8921",
      name: "Organic Honey Glass Jar 500g",
      category: "Packaged Food",
      date: "Today, 11:20 AM",
      status: "COMPLIANT",
      declaredMrp: "₹385.00",
      netQty: "500 g",
    },
    {
      id: "chk-8919",
      name: "Herbal Shampoo Bottle 200ml",
      category: "Cosmetics",
      date: "Yesterday, 04:15 PM",
      status: "NON_COMPLIANT",
      declaredMrp: "₹190.00",
      netQty: "200 ml",
    },
    {
      id: "chk-8914",
      name: "Roasted Almonds Pouch 250g",
      category: "Packaged Food",
      date: "12 Sep 2026",
      status: "COMPLIANT",
      declaredMrp: "₹450.00",
      netQty: "250 g",
    },
    {
      id: "chk-8902",
      name: "Cold-Pressed Mustard Oil 1L",
      category: "Edible Oils",
      date: "10 Sep 2026",
      status: "REVIEW",
      declaredMrp: "₹240.00",
      netQty: "1 L",
    },
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Statutory Safe Harbor Advisory Banner */}
      <div className="bg-gradient-to-r from-[#0d2a4d] to-[#123966] text-white rounded-xl p-5 shadow-sm border border-[#1e4e85] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#e69b00]/20 border border-[#e69b00]/40 flex items-center justify-center text-[#ffc038] shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm tracking-wide text-white uppercase">
                Statutory Advisory Safe Harbor
              </h2>
              <span className="text-[10px] font-semibold bg-[#159a68] text-white px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Pre-market checks run in this portal provide non-punitive technical guidance under the Legal Metrology (Packaged Commodities) Rules, 2011. Results are strictly confidential and do not generate enforcement records or penalties.
            </p>
          </div>
        </div>
        <Link
          href="/vendor/self-check"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0867c9] hover:bg-[#0753a0] text-white text-xs font-semibold shrink-0 shadow transition-colors"
        >
          <ScanLine className="w-4 h-4" />
          <span>Launch Pre-Market Check</span>
        </Link>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Pre-Market Checks</p>
            <div className="w-8 h-8 rounded-lg bg-[#eaf4ff] text-[#0867c9] flex items-center justify-center">
              <ScanLine className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#10243e] mt-2">128</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-[#159a68] font-medium">
            <span>+14 this month</span>
            <span className="text-slate-400">· Pre-launch verified</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Advisory Pass Rate</p>
            <div className="w-8 h-8 rounded-lg bg-[#e8f8f0] text-[#159a68] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#10243e] mt-2">91.4%</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-[#159a68] font-medium">
            <span>+3.2% vs last cycle</span>
            <span className="text-slate-400">· PCR compliant</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Compliance Inquiries</p>
            <div className="w-8 h-8 rounded-lg bg-[#fef5e7] text-[#e69b00] flex items-center justify-center">
              <FileQuestion className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#10243e] mt-2">1</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-[#e69b00] font-medium">
            <span>Action required</span>
            <span className="text-slate-400">· Response pending</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Mandatory Rules Monitored</p>
            <div className="w-8 h-8 rounded-lg bg-[#f4effe] text-[#7c3aed] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#10243e] mt-2">9 / 9</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-medium">
            <span>Full PCR 2011 scope</span>
            <span className="text-slate-400">· Active</span>
          </div>
        </div>
      </div>

      {/* Quick Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Self Check */}
        <div className="bg-white rounded-xl p-6 border border-[#dce7f2] shadow-sm flex flex-col justify-between hover:border-[#0867c9]/40 transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#eaf4ff] text-[#0867c9] flex items-center justify-center mb-4">
              <ScanLine className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#10243e]">Pre-Market Label Check</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Upload packaging artwork before commercial printing to verify all 9 mandatory declarations, font heights, and unit pricing.
            </p>
          </div>
          <Link
            href="/vendor/self-check"
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0867c9] hover:underline"
          >
            <span>Start self-check</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 2: Regulatory Notices */}
        <div className="bg-white rounded-xl p-6 border border-[#dce7f2] shadow-sm flex flex-col justify-between hover:border-[#0867c9]/40 transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#fef5e7] text-[#e69b00] flex items-center justify-center mb-4">
              <FileQuestion className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#10243e]">Official Inquiries &amp; Notices</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Review any formal inquiry issued by Legal Metrology inspection officers. Submit formal clarifications and upload evidence.
            </p>
          </div>
          <Link
            href="/vendor/cases"
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0867c9] hover:underline"
          >
            <span>View open notices</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Card 3: PCR 2011 Guidance */}
        <div className="bg-white rounded-xl p-6 border border-[#dce7f2] shadow-sm flex flex-col justify-between hover:border-[#0867c9]/40 transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#e8f8f0] text-[#159a68] flex items-center justify-center mb-4">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-[#10243e]">Statutory Guidance Checklist</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Access category-specific rules checklists, minimum numeral font heights per display panel area, and DoCA statutory guidelines.
            </p>
          </div>
          <Link
            href="/vendor/guidance"
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0867c9] hover:underline"
          >
            <span>Open checklist</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent Pre-Market Checks Table */}
      <div className="bg-white rounded-xl border border-[#dce7f2] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#dce7f2] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#10243e]">Recent Pre-Market Checks</h3>
            <p className="text-xs text-slate-500">Advisory packaging tests conducted across your product catalog</p>
          </div>
          <Link
            href="/vendor/self-check"
            className="text-xs font-semibold text-[#0867c9] hover:underline flex items-center gap-1"
          >
            <span>New Check</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Product Name / Identifier</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Declared Values</th>
                <th className="px-5 py-3">Date Tested</th>
                <th className="px-5 py-3">Advisory Outcome</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentChecks.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-[#10243e]">{item.name}</p>
                    <p className="text-[11px] text-slate-400">{item.id}</p>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{item.category}</td>
                  <td className="px-5 py-3.5 text-slate-600">
                    <span>{item.declaredMrp}</span> · <span className="text-slate-400">{item.netQty}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 flex items-center gap-1.5 pt-4">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.date}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {item.status === "COMPLIANT" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#e8f8f0] text-[#159a68]">
                        <CheckCircle2 className="w-3 h-3" />
                        Compliant
                      </span>
                    )}
                    {item.status === "NON_COMPLIANT" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#feecec] text-[#dc2626]">
                        <AlertTriangle className="w-3 h-3" />
                        Remediation Needed
                      </span>
                    )}
                    {item.status === "REVIEW" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#fef5e7] text-[#e69b00]">
                        <Sparkles className="w-3 h-3" />
                        Under Review
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href="/vendor/self-check"
                      className="text-xs font-semibold text-[#0867c9] hover:underline"
                    >
                      View Report
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
