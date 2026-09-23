"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { API_BASE } from "@/lib/api";
import HQHeader from "@/components/headquarters/HQHeader";

import {
  BarChart3,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Users,
  Building2,
  Scale,
  Inbox,
  ArrowRight,
  TrendingUp,
  MapPin,
  RefreshCw,
} from "lucide-react";

interface HQOverviewData {
  total_inspections: number;
  total_cases: number;
  compliance_rate: number;
  violations_by_rule: Record<string, number>;
  cases_by_region: Record<string, number>;
  cases_by_status: Record<string, number>;
  unverified_leads_count: number;
  is_sample_data?: boolean;
}

export default function HeadquartersDashboardPage() {
  const { getToken } = useAuth();
  const [data, setData] = useState<HQOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/hq/analytics/overview`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load HQ analytics (HTTP ${res.status})`);
      }

      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error("HQ Overview Error:", err);
      // Fallback mock representation for offline / preview states
      setData({
        total_inspections: 1420,
        total_cases: 87,
        compliance_rate: 88.4,
        violations_by_rule: {
          "Rule 6(1)(e) - Net Quantity Shortage": 28,
          "Rule 6(1)(d) - Dual / Tampered MRP": 24,
          "Rule 6(1)(a) - Incomplete Manufacturer Info": 14,
          "Rule 9(1) - Minimum Font Size Infraction": 9,
          "Rule 6(1)(d) - Unit Sale Price Omission": 7,
          "Rule 6(1)(b) - Country of Origin Missing": 5,
        },
        cases_by_region: {
          "Western (Maharashtra/Gujarat)": 38,
          "Northern (Delhi/Punjab/UP)": 24,
          "Southern (Karnataka/TN/Telangana)": 16,
          "Eastern (WB/Odisha/Bihar)": 9,
        },
        cases_by_status: {
          open: 31,
          under_review: 42,
          closed: 14,
        },
        unverified_leads_count: 12,
        is_sample_data: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return (
    <main id="main-content" className="space-y-8">
      {data?.is_sample_data && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs font-semibold">Sample data — not live.</span>
          <span className="text-xs text-amber-700">Violation and regional breakdowns shown below use placeholder figures. Live aggregation requires real inspection data.</span>
        </div>
      )}
      <HQHeader
        title="National Legal Metrology Directorate"
        subtitle="Executive oversight of PCR 2011 inspections, officer enforcement pipelines, and corporate statutory compliance"
        actions={
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Directorate Telemetry</span>
          </button>
        }
      />

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Inspections</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {data?.total_inspections.toLocaleString() || "0"}
          </div>
          <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+14.2% across 28 states & UTs</span>
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">National Compliance Rate</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
            {data?.compliance_rate}%
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Target benchmark: <span className="text-slate-200 font-semibold">92.0%</span>
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Enforcement Cases</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-400 tracking-tight">
            {data?.total_cases || "0"}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Under Section 36 & PCR Rule 32 notice
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Citizen Leads Queue</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Inbox className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-300 tracking-tight">
            {data?.unverified_leads_count || "0"}
          </div>
          <Link
            href="/headquarters/leads"
            className="text-xs text-amber-400 hover:text-amber-300 mt-2 inline-flex items-center gap-1 font-semibold"
          >
            <span>Triage pending leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Analytics Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Violations by Statutory Rule */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-white">PCR 2011 Infraction Heatmap</h2>
              <p className="text-xs text-slate-400">Top non-compliant statutory provisions recorded nationwide</p>
            </div>
            <Link
              href="/headquarters/rules"
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
              <span>Manage Rules</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {data?.violations_by_rule &&
              Object.entries(data.violations_by_rule).map(([ruleName, count], idx) => {
                const maxCount = Math.max(...Object.values(data.violations_by_rule), 1);
                const percent = Math.round((count / maxCount) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium truncate max-w-[280px]">
                        {ruleName}
                      </span>
                      <span className="text-amber-400 font-bold">{count} notices</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Regional Enforcement Caseload */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-white">Zonal Enforcement Distribution</h2>
                <p className="text-xs text-slate-400">Active Legal Metrology cases segregated by geographic jurisdiction</p>
              </div>
              <Link
                href="/headquarters/officers"
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
              >
                <span>Officer Roster</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {data?.cases_by_region &&
                Object.entries(data.cases_by_region).map(([region, count], idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-sm font-semibold text-slate-200">{region}</span>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                      {count} active cases
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Case Status Pipeline:</span>
            <div className="flex items-center gap-3">
              <span className="text-blue-400">Open: {data?.cases_by_status.open || 0}</span>
              <span className="text-amber-400">Review: {data?.cases_by_status.under_review || 0}</span>
              <span className="text-emerald-400">Closed: {data?.cases_by_status.closed || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Directorate Action Hub */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/60 border border-slate-800 rounded-xl p-6">
        <h2 className="text-base font-bold text-white mb-1">Directorate Governance Shortcuts</h2>
        <p className="text-xs text-slate-400 mb-4">Direct links to statutory enforcement modules</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/headquarters/officers"
            className="p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-400/40 transition group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded bg-amber-400/10 text-amber-400 group-hover:bg-amber-400/20 transition">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Officer Approvals</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Verify new field inspectors and monitor throughput and caseloads across regions.
            </p>
          </Link>

          <Link
            href="/headquarters/leaderboard"
            className="p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-400/40 transition group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded bg-red-400/10 text-red-400 group-hover:bg-red-400/20 transition">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Repeat Offender Matrix</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Analyze corporate entities with persistent PCR infractions for escalated compounding or prosecution.
            </p>
          </Link>

          <Link
            href="/headquarters/rules"
            className="p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-400/40 transition group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded bg-blue-400/10 text-blue-400 group-hover:bg-blue-400/20 transition">
                <Scale className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Compliance Rules Matrix</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Promulgate statutory amendments, adjust penalty clauses, and toggle active inspection criteria.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
