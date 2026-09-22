"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useUser, useAuth } from "@clerk/nextjs";
import {
  History,
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  User,
  LogIn,
  RefreshCw,
  ScanLine,
  AlertTriangle,
} from "lucide-react";
import { API_BASE } from "@/lib/api";

interface HistoryItem {
  id: string;
  type: "scan" | "report";
  name: string;
  barcode: string;
  date: string;
  rawDate: number;
  status: string;
  isCompliant?: boolean;
  nutriscore?: string;
  violation?: string;
}

export default function ConsumerHistoryPage() {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      const [scansRes, reportsRes] = await Promise.all([
        fetch(`${API_BASE}/scans`, { headers }).catch(() => null),
        fetch(`${API_BASE}/consumer/reports`, { headers }).catch(() => null),
      ]);

      const items: HistoryItem[] = [];

      if (scansRes && scansRes.ok) {
        const scans = await scansRes.json();
        for (const s of scans || []) {
          const overall = s.compliance_summary?.overall_status;
          const isComp = overall === "COMPLIANT";
          const d = s.created_at ? new Date(s.created_at) : new Date();

          items.push({
            id: s.id,
            type: "scan",
            name: s.structured_fields?.product_name?.value || "Product Barcode Lookup",
            barcode: s.structured_fields?.barcode?.value || (s.id || "").slice(0, 13),
            date: d.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
            rawDate: d.getTime(),
            status: isComp ? "COMPLIANT" : overall === "NON_COMPLIANT" ? "VIOLATION" : "UNDER_REVIEW",
            isCompliant: isComp,
            nutriscore: "A",
          });
        }
      }

      if (reportsRes && reportsRes.ok) {
        const reports = await reportsRes.json();
        for (const r of reports || []) {
          const d = r.created_at ? new Date(r.created_at) : new Date();
          items.push({
            id: r.id,
            type: "report",
            name: r.product_name || "Citizen Deceptive Packaging Report",
            barcode: r.barcode || "N/A",
            date: d.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
            rawDate: d.getTime(),
            status: r.status === "unverified_lead" ? "Unverified Lead Submitted" : r.status,
            violation: r.violation_type || r.description,
          });
        }
      }

      // Sort newest first
      items.sort((a, b) => b.rawDate - a.rawDate);
      setHistoryItems(items);
    } catch (err) {
      console.error("Failed to load consumer activity history:", err);
      setHistoryItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isSignedIn) {
      fetchHistory();
    } else {
      setIsLoading(false);
      setHistoryItems([]);
    }
  }, [isSignedIn, fetchHistory]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#10243e] tracking-tight">
            My Activity &amp; Verification History
          </h1>
          <p className="text-xs text-slate-500">
            Personal record of product compliance lookups and citizen reports filed
          </p>
        </div>

        {isSignedIn && (
          <button
            type="button"
            onClick={fetchHistory}
            title="Refresh history"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-[#0867c9] hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {!isSignedIn && (
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-5 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-blue-200 flex items-center justify-center text-[#0867c9] shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#10243e]">
                Sign In to Save Your Activity Across Devices
              </h3>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Anonymous lookups are completely private. Create a free citizen account to keep track of your complaint dockets and product checks.
              </p>
            </div>
          </div>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0867c9] hover:bg-[#0753a0] text-white text-xs font-semibold shadow shrink-0 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Sign Up</span>
          </Link>
        </div>
      )}

      {/* History Timeline */}
      <div className="bg-white rounded-xl border border-[#dce7f2] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#dce7f2] bg-[#f8fafc] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#10243e] uppercase tracking-wider">
            Recent Product Lookups &amp; Reports
          </h3>
          <span className="text-[11px] text-slate-400">Personal Log</span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-[#0867c9]" />
              <span>Loading your activity history...</span>
            </div>
          </div>
        ) : historyItems.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="max-w-sm mx-auto flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0867c9] mb-3">
                <History className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-[#10243e]">
                No verification activity or reports on record
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Look up a product barcode to verify PCR declarations, or file a citizen report to track deceptive packaging.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <Link
                  href="/consumer/lookup"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0867c9] hover:bg-[#0753a0] text-white text-xs font-semibold shadow transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Verify Barcode</span>
                </Link>
                <Link
                  href="/consumer/report"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>File Citizen Report</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {historyItems.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      item.type === "scan"
                        ? "bg-[#e8f8f0] text-[#159a68]"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {item.type === "scan" ? (
                      <Search className="w-4 h-4" />
                    ) : (
                      <ShieldAlert className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#10243e]">{item.name}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono">{item.barcode}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.date}
                      </span>
                      {item.violation && (
                        <>
                          <span>·</span>
                          <span className="text-slate-500 line-clamp-1">{item.violation}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.type === "scan" ? (
                    <div className="text-right">
                      {item.isCompliant ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f8f0] text-[#159a68]">
                          <CheckCircle2 className="w-3 h-3" />
                          Compliant
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          Violation
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      {item.status}
                    </span>
                  )}

                  {item.barcode && item.barcode !== "N/A" && (
                    <Link
                      href={`/consumer/lookup?barcode=${item.barcode}`}
                      className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
