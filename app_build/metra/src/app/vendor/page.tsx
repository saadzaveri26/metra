"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
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
  RefreshCw,
} from "lucide-react";
import { API_BASE } from "@/lib/api";

interface RecentCheck {
  id: string;
  name: string;
  category: string;
  date: string;
  status: "COMPLIANT" | "NON_COMPLIANT" | "REVIEW";
  declaredMrp: string;
  netQty: string;
}

interface VendorOverview {
  total_self_checks: number;
  compliance_rate: number;
  open_cases_count: number;
  business_name: string;
  gstin?: string;
}

export default function VendorDashboard() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [overview, setOverview] = useState<VendorOverview | null>(null);
  const [recentChecks, setRecentChecks] = useState<RecentCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVendorData = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Fetch vendor overview
      const overviewPromise = fetch(`${API_BASE}/vendor/overview`, { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      // 2. Fetch vendor's pre-market scans
      const scansPromise = fetch(`${API_BASE}/scans`, { headers })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []);

      const [overviewData, rawScans] = await Promise.all([overviewPromise, scansPromise]);

      if (overviewData) {
        setOverview(overviewData);
      }

      if (Array.isArray(rawScans)) {
        const formatted: RecentCheck[] = rawScans.map((s: any) => {
          const overall = s.compliance_summary?.overall_status;
          const status: "COMPLIANT" | "NON_COMPLIANT" | "REVIEW" =
            overall === "COMPLIANT" ? "COMPLIANT" : overall === "NON_COMPLIANT" ? "NON_COMPLIANT" : "REVIEW";
          const d = s.created_at ? new Date(s.created_at) : new Date();

          return {
            id: s.id,
            name: s.structured_fields?.product_name?.value || "Packaged Product Artwork",
            category: s.structured_fields?.category?.value || "Packaged Commodity",
            date: d.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
            status,
            declaredMrp: s.structured_fields?.mrp?.value ? `₹${s.structured_fields.mrp.value}` : "₹--",
            netQty: s.structured_fields?.net_quantity?.value || "--",
          };
        });
        setRecentChecks(formatted);
      }
    } catch (err) {
      console.error("Error loading vendor dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchVendorData();
  }, [fetchVendorData]);

  const totalChecks = overview ? overview.total_self_checks : recentChecks.length;
  const passRate =
    overview && totalChecks > 0
      ? `${overview.compliance_rate}%`
      : totalChecks > 0
      ? `${Math.round(
          (recentChecks.filter((c) => c.status === "COMPLIANT").length / totalChecks) * 100
        )}%`
      : "0%";
  const openCases = overview?.open_cases_count ?? 0;

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
          <p className="text-2xl font-black text-[#10243e] mt-2">
            {isLoading ? "..." : totalChecks}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-[#159a68] font-medium">
            <span>{totalChecks > 0 ? `${totalChecks} completed` : "No checks recorded"}</span>
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
          <p className="text-2xl font-black text-[#10243e] mt-2">
            {isLoading ? "..." : passRate}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-[#159a68] font-medium">
            <span>{totalChecks > 0 ? "Compliant on first check" : "Awaiting check"}</span>
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
          <p className="text-2xl font-black text-[#10243e] mt-2">
            {isLoading ? "..." : openCases}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-[#e69b00] font-medium">
            <span>{openCases > 0 ? "Action required" : "No pending notices"}</span>
            <span className="text-slate-400">· Official inquiries</span>
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchVendorData}
              title="Refresh checks"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-[#0867c9] hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/vendor/self-check"
              className="text-xs font-semibold text-[#0867c9] hover:underline flex items-center gap-1"
            >
              <span>New Check</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
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
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#0867c9]" />
                      <span>Loading pre-market checks...</span>
                    </div>
                  </td>
                </tr>
              ) : recentChecks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0867c9] mb-3">
                        <ScanLine className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm text-[#10243e]">
                        No pre-market packaging checks yet
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Test your packaging artwork before commercial printing to verify compliance under PCR 2011 with complete safe-harbor protection.
                      </p>
                      <Link
                        href="/vendor/self-check"
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0867c9] hover:bg-[#0753a0] text-white text-xs font-semibold shadow transition-colors"
                      >
                        <ScanLine className="w-3.5 h-3.5" />
                        <span>Launch First Pre-Market Check</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                recentChecks.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-[#10243e]">{item.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{item.id}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{item.category}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <span>{item.declaredMrp}</span> · <span className="text-slate-400">{item.netQty}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.date}</span>
                      </div>
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
                        New Check
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
