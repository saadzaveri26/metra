"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileQuestion,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Search,
  Building,
  Filter,
} from "lucide-react";

interface NoticeItem {
  id: string;
  case_number: string;
  product_name: string;
  category: string;
  opened_at: string;
  status: "open" | "under_review" | "closed";
  statutory_grounds: string;
  inspected_region: string;
  risk_score: number;
}

export default function VendorCasesPage() {
  const [filter, setFilter] = useState<"all" | "open" | "under_review" | "closed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [notices] = useState<NoticeItem[]>([
    {
      id: "case-01-suvidha",
      case_number: "INQ-2026-MUM-0891",
      product_name: "Suvidha Roasted Chana Pouch 500g",
      category: "Packaged Food",
      opened_at: "13 Sep 2026",
      status: "open",
      statutory_grounds: "Rule 6(1)(da) & Rule 7: Missing customer care telephone helpline and sub-standard numeral height on Net Qty.",
      inspected_region: "Maharashtra (Mumbai Zone 2)",
      risk_score: 55,
    },
    {
      id: "case-02-suvidha",
      case_number: "INQ-2026-PUN-0744",
      product_name: "Suvidha Organic Mustard Oil 1L",
      category: "Edible Oils",
      opened_at: "02 Sep 2026",
      status: "under_review",
      statutory_grounds: "Rule 6(11): Unit Sale Price (USP) font height below mandatory 2.0 mm threshold.",
      inspected_region: "Maharashtra (Pune Division)",
      risk_score: 40,
    },
    {
      id: "case-03-suvidha",
      case_number: "INQ-2026-THN-0512",
      product_name: "Suvidha Fortified Wheat Flour 5kg",
      category: "Packaged Food",
      opened_at: "18 Aug 2026",
      status: "closed",
      statutory_grounds: "Rule 6(1)(a): Verification of manufacturing premises address completed. Clarification accepted.",
      inspected_region: "Maharashtra (Thane District)",
      risk_score: 15,
    },
  ]);

  const filteredNotices = notices.filter((n) => {
    if (filter !== "all" && n.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        n.case_number.toLowerCase().includes(q) ||
        n.product_name.toLowerCase().includes(q) ||
        n.statutory_grounds.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#10243e] tracking-tight">
            Official Compliance Notices &amp; Inquiries
          </h1>
          <p className="text-xs text-slate-500">
            Formal inquiries issued by Legal Metrology inspection officers regarding retail packaged commodities
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#fef5e7] border border-[#e69b00]/30 text-[#b87c00] text-xs font-semibold">
          <Clock className="w-4 h-4" />
          <span>1 Notice Awaiting Response</span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
          <FileQuestion className="w-4 h-4" />
        </div>
        <div className="text-xs text-blue-900 leading-relaxed">
          <span className="font-bold">Prompt Clarification Protocol: </span>
          Submitting formal explanations and corrected label artwork through this portal attaches directly to the inspecting officer&apos;s case file, expediting compliance verification without requiring in-person hearings.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-[#dce7f2] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filter === "all" ? "bg-white text-[#10243e] shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Notices ({notices.length})
          </button>
          <button
            onClick={() => setFilter("open")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filter === "open" ? "bg-white text-amber-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Action Required ({notices.filter((n) => n.status === "open").length})
          </button>
          <button
            onClick={() => setFilter("under_review")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filter === "under_review" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Under Review ({notices.filter((n) => n.status === "under_review").length})
          </button>
          <button
            onClick={() => setFilter("closed")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filter === "closed" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Resolved ({notices.filter((n) => n.status === "closed").length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search notice ID or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0867c9]"
          />
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-3">
        {filteredNotices.map((notice) => (
          <div
            key={notice.id}
            className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm hover:border-[#0867c9]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-[#0867c9] tracking-wide">
                  {notice.case_number}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-500 font-medium">{notice.inspected_region}</span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {notice.opened_at}
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#10243e]">{notice.product_name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {notice.statutory_grounds}
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
              {/* Status Badge */}
              <div>
                {notice.status === "open" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fef5e7] text-[#e69b00] border border-[#e69b00]/30">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Response Required
                  </span>
                )}
                {notice.status === "under_review" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#eaf4ff] text-[#0867c9] border border-[#0867c9]/30">
                    <Clock className="w-3.5 h-3.5" />
                    Under Review
                  </span>
                )}
                {notice.status === "closed" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#e8f8f0] text-[#159a68] border border-[#159a68]/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolved
                  </span>
                )}
              </div>

              {/* Action Button */}
              <Link
                href={`/vendor/cases/${notice.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0867c9] hover:bg-[#0753a0] text-white text-xs font-semibold shadow transition-colors"
              >
                <span>{notice.status === "open" ? "Respond to Notice" : "View Case Record"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
