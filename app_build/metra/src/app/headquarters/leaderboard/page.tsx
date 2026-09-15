"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import HQHeader from "@/components/headquarters/HQHeader";
import {
  Trophy,
  AlertTriangle,
  Building2,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Scale,
} from "lucide-react";

interface SellerLeaderboardItem {
  business_id: string;
  canonical_name: string;
  primary_category: string;
  state_region: string;
  violation_count: number;
  risk_level: string;
  last_violation_date?: string;
}

export default function HQLeaderboardPage() {
  const { getToken } = useAuth();
  const [sellers, setSellers] = useState<SellerLeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch("http://127.0.0.1:8000/api/v1/hq/sellers/leaderboard", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error("Failed to load seller leaderboard");
      const json = await res.json();
      setSellers(json);
    } catch (err) {
      console.error("Seller leaderboard fetch error:", err);
      // Fallback fictional seller registry
      setSellers([
        {
          business_id: "BIZ-MFG-001",
          canonical_name: "Suvidha FMCG Pvt. Ltd.",
          primary_category: "Packaged Snacks & Biscuits",
          state_region: "Maharashtra",
          violation_count: 5,
          risk_level: "Critical",
          last_violation_date: "13 Sep 2026",
        },
        {
          business_id: "BIZ-MFG-002",
          canonical_name: "Bharat Packaged Commodities Ltd.",
          primary_category: "Flours, Grains, Edible Pulses",
          state_region: "Madhya Pradesh",
          violation_count: 3,
          risk_level: "High",
          last_violation_date: "02 Sep 2026",
        },
        {
          business_id: "BIZ-MFG-003",
          canonical_name: "Himalayan Nectar Foods Ltd.",
          primary_category: "Honey, Dry Fruits, Premium Nuts",
          state_region: "Himachal Pradesh",
          violation_count: 2,
          risk_level: "Moderate",
          last_violation_date: "20 Aug 2026",
        },
        {
          business_id: "BIZ-MFG-004",
          canonical_name: "Kaveri Agro Industries Pvt. Ltd.",
          primary_category: "Edible Oils, Mustard & Sunflower",
          state_region: "Karnataka",
          violation_count: 2,
          risk_level: "Moderate",
          last_violation_date: "14 Aug 2026",
        },
        {
          business_id: "BIZ-MFG-005",
          canonical_name: "Vanguard Consumer Formulations Ltd.",
          primary_category: "Cosmetics, Shampoo, Personal Care",
          state_region: "Gujarat",
          violation_count: 1,
          risk_level: "Moderate",
          last_violation_date: "05 Aug 2026",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filteredSellers = sellers.filter((s) => {
    const matchesSearch =
      s.canonical_name.toLowerCase().includes(search.toLowerCase()) ||
      s.business_id.toLowerCase().includes(search.toLowerCase()) ||
      s.primary_category.toLowerCase().includes(search.toLowerCase()) ||
      s.state_region.toLowerCase().includes(search.toLowerCase());

    if (riskFilter !== "all") return matchesSearch && s.risk_level.toLowerCase() === riskFilter.toLowerCase();
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-800">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="text-xs font-semibold">Sample data — not live.</span>
        <span className="text-xs text-amber-700">Leaderboard entries use fictional manufacturer records for demonstration. Live data requires real violation case aggregation.</span>
      </div>
      <HQHeader
        title="Repeat Offender Matrix & Corporate Watchlist"
        subtitle="National surveillance ranking of entities with persistent PCR 2011 packaging non-compliances"
        actions={
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Watchlist</span>
          </button>
        }
      />

      {/* Statutory Guidance Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-amber-200">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-amber-300">Statutory Compounding Threshold Notice (Section 48)</h3>
          <p className="mt-1 text-slate-300 leading-relaxed">
            Entities with <strong className="text-amber-300">3 or more verified infractions</strong> within a 24-month period
            are flagged for mandatory compounding escalation under Section 48 of the Legal Metrology Act, 2009. Second and subsequent
            offenses under Section 36(1) carry enhanced pecuniary penalties and imprisonment up to one year.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company name, category, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Risk Severity:</span>
          {(["all", "critical", "high", "moderate"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setRiskFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                riskFilter === filter
                  ? "bg-amber-400 text-slate-950 font-semibold"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Ranked Corporate Violators Matrix</h2>
          </div>
          <span className="text-xs text-slate-400">
            Fictional manufacturer entities registered in Vector DB
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4 text-center w-16">Rank</th>
                <th className="p-4">Manufacturer / Entity</th>
                <th className="p-4">Commodity Class</th>
                <th className="p-4">State Jurisdiction</th>
                <th className="p-4 text-center">Infractions Count</th>
                <th className="p-4 text-center">Risk Classification</th>
                <th className="p-4">Last Violation Date</th>
                <th className="p-4 text-right">Directorate Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredSellers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No manufacturers match the selected risk filter.
                  </td>
                </tr>
              ) : (
                filteredSellers.map((s, idx) => (
                  <tr key={s.business_id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 text-center font-bold text-slate-400">
                      {idx === 0 ? (
                        <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 inline-flex items-center justify-center font-black">
                          1
                        </span>
                      ) : idx === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 inline-flex items-center justify-center font-black">
                          2
                        </span>
                      ) : idx === 2 ? (
                        <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 inline-flex items-center justify-center font-black">
                          3
                        </span>
                      ) : (
                        <span>#{idx + 1}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-white text-sm">{s.canonical_name}</div>
                      <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">
                        ID: {s.business_id}
                      </div>
                    </td>
                    <td className="p-4 text-slate-300 font-medium">
                      {s.primary_category}
                    </td>
                    <td className="p-4 text-slate-400 font-medium">
                      {s.state_region}
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-base font-black text-amber-400">
                        {s.violation_count}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {s.risk_level.toLowerCase() === "critical" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 font-bold uppercase text-[10px]">
                          <AlertTriangle className="w-3 h-3" />
                          Critical Risk
                        </span>
                      ) : s.risk_level.toLowerCase() === "high" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold uppercase text-[10px]">
                          High Risk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-semibold uppercase text-[10px]">
                          Moderate
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 text-xs">
                      {s.last_violation_date || "Recent"}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() =>
                          alert(
                            `Statutory notice draft prepared for ${s.canonical_name} under Section 36/48.`
                          )
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-400/40 text-xs font-semibold transition inline-flex items-center gap-1"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Issue Notice</span>
                      </button>
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
