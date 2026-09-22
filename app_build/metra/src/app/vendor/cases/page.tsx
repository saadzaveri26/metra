"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
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
  RefreshCw,
} from "lucide-react";
import { API_BASE } from "@/lib/api";

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
  const { getToken } = useAuth();
  const [filter, setFilter] = useState<"all" | "open" | "under_review" | "closed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCases = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/vendor/cases`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const rawCases = await res.json();
        const mapped: NoticeItem[] = (rawCases || []).map((c: any) => {
          const d = c.opened_at ? new Date(c.opened_at) : new Date();
          const grounds = (c.findings || []).map((f: any) => `${f.rule_id}: ${f.finding}`).join("; ") ||
            c.statutory_grounds || "Statutory compliance review required.";

          let statusNorm: NoticeItem["status"] = "open";
          if (c.status === "closed" || c.status === "compounded" || c.status === "dismissed") {
            statusNorm = "closed";
          } else if (c.status === "response_submitted" || c.status === "under_review") {
            statusNorm = "under_review";
          }

          return {
            id: c.id,
            case_number: c.case_number || `INQ-${c.id.slice(-6).toUpperCase()}`,
            product_name: c.product_name || "Packaged Commodity",
            category: c.category || "Packaged Goods",
            opened_at: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
            status: statusNorm,
            statutory_grounds: grounds,
            inspected_region: c.jurisdiction || "Assigned Division",
            risk_score: Math.round(c.risk_score || 0),
          };
        });
        setNotices(mapped);
      } else {
        setNotices([]);
      }
    } catch (err) {
      console.error("Failed to load vendor cases:", err);
      setNotices([]);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

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

  const openCount = notices.filter((n) => n.status === "open").length;
  const underReviewCount = notices.filter((n) => n.status === "under_review").length;
  const closedCount = notices.filter((n) => n.status === "closed").length;

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
          <span>
            {isLoading ? "..." : openCount === 1 ? "1 Notice Awaiting Response" : `${openCount} Notices Awaiting Response`}
          </span>
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
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg w-full sm:w-auto flex-wrap">
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
            Action Required ({openCount})
          </button>
          <button
            onClick={() => setFilter("under_review")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filter === "under_review" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Under Review ({underReviewCount})
          </button>
          <button
            onClick={() => setFilter("closed")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              filter === "closed" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Resolved ({closedCount})
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 w-full sm:w-64">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search notices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0867c9] focus:bg-white"
            />
          </div>
          <button
            type="button"
            onClick={fetchCases}
            title="Refresh notices"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-[#0867c9] hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-xl p-12 text-center border border-[#dce7f2]">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-[#0867c9]" />
              <span>Loading compliance notices...</span>
            </div>
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-[#dce7f2]">
            <div className="max-w-sm mx-auto flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-[#10243e]">
                {searchQuery || filter !== "all"
                  ? "No matching compliance notices"
                  : "No compliance inquiries or notices"}
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {searchQuery || filter !== "all"
                  ? "Try changing your search terms or selecting 'All Notices'."
                  : "Your business has zero active compliance citations or inquiries under the Legal Metrology Act, 2009."}
              </p>
            </div>
          </div>
        ) : (
          filteredNotices.map((n) => (
            <div
              key={n.id}
              className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm hover:border-[#0867c9]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#0867c9]">{n.case_number}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs font-semibold text-slate-700">{n.product_name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                    {n.category}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  <span className="font-semibold text-slate-800">Alleged Statutory Non-Compliance: </span>
                  {n.statutory_grounds}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span>Issued: {n.opened_at}</span>
                  <span>Jurisdiction: {n.inspected_region}</span>
                  <span>Risk Score: {n.risk_score}/100</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                {n.status === "open" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="w-3.5 h-3.5" />
                    Action Required
                  </span>
                )}
                {n.status === "under_review" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <Clock className="w-3.5 h-3.5" />
                    Officer Review
                  </span>
                )}
                {n.status === "closed" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolved
                  </span>
                )}

                <Link
                  href={`/vendor/cases/${n.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0867c9] hover:bg-[#0753a0] text-white text-xs font-semibold shadow transition-colors"
                >
                  <span>{n.status === "open" ? "Respond" : "View Docket"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
