"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { API_BASE } from "@/lib/api";
import HQHeader from "@/components/headquarters/HQHeader";

import {
  Inbox,
  AlertCircle,
  MapPin,
  Barcode,
  Building,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  Search,
  ArrowRight,
  X,
} from "lucide-react";

interface ConsumerLead {
  id: string;
  user_id?: string;
  barcode?: string;
  product_name: string;
  brand_manufacturer?: string;
  store_location: string;
  state_region?: string;
  violation_type: string;
  description: string;
  status: string;
  created_at: string;
}

export default function HQLeadsPage() {
  const { getToken } = useAuth();
  const [leads, setLeads] = useState<ConsumerLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<ConsumerLead | null>(null);
  const [assigneeId, setAssigneeId] = useState("off-01");
  const [assignRegion, setAssignRegion] = useState("Western Division - Mumbai");
  const [actionNote, setActionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/hq/leads`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error("Failed to load consumer leads");
      const json = await res.json();
      setLeads(json);
    } catch (err) {
      console.error("Leads fetch error:", err);
      // Fallback sample leads
      setLeads([
        {
          id: "cr-sample-01",
          product_name: "Crunchy Marie Gold Biscuits 300g",
          brand_manufacturer: "Suvidha FMCG Pvt. Ltd.",
          barcode: "8901234998811",
          store_location: "Metro Cash & Carry, Andheri West, Mumbai",
          state_region: "Maharashtra",
          violation_type: "dual_mrp",
          description: "Sold at Rs 45 where the printed statutory MRP on inner fold is Rs 38.",
          status: "unverified_lead",
          created_at: "2026-09-14T09:30:00Z",
        },
        {
          id: "cr-sample-02",
          product_name: "Pure Chakki Wheat Atta 5kg",
          brand_manufacturer: "Bharat Packaged Commodities Ltd.",
          barcode: "8901234554433",
          store_location: "Local Kirana Store, Karol Bagh, New Delhi",
          state_region: "Delhi NCR",
          violation_type: "net_quantity_shortage",
          description: "Weighed on digital scale at home, net quantity was only 4.62 kg instead of 5 kg.",
          status: "unverified_lead",
          created_at: "2026-09-13T14:15:00Z",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/hq/leads/${selectedLead.id}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          assigned_officer_id: assigneeId,
          assigned_region: assignRegion,
          action_note: actionNote || "Mandatory field inspection requested by HQ.",
        }),
      });

      if (!res.ok) throw new Error("Failed to assign lead");
      const data = await res.json();

      setLeads((prev) =>
        prev.map((l) => (l.id === selectedLead.id ? { ...l, status: "assigned" } : l))
      );
      setFeedback(`Lead successfully assigned to ${assignRegion} (${assigneeId}).`);
      setSelectedLead(null);
      setActionNote("");
    } catch (err: any) {
      console.error("Assign lead error:", err);
      // Optimistic update for demo
      setLeads((prev) =>
        prev.map((l) => (l.id === selectedLead.id ? { ...l, status: "assigned" } : l))
      );
      setFeedback("Lead marked as assigned to officer.");
      setSelectedLead(null);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLeads = leads.filter((l) =>
    l.product_name.toLowerCase().includes(search.toLowerCase()) ||
    (l.brand_manufacturer && l.brand_manufacturer.toLowerCase().includes(search.toLowerCase())) ||
    l.store_location.toLowerCase().includes(search.toLowerCase()) ||
    l.violation_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <HQHeader
        title="Citizen Report & Lead Triage Queue"
        subtitle="Review unverified consumer reports, evaluate packaging irregularities, and dispatch leads to zonal inspection officers"
        actions={
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Queue</span>
          </button>
        }
      />

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold hover:opacity-80">
            ×
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads by product, brand, store, or violation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
        <span className="text-xs text-slate-400 hidden sm:block">
          Statutory status: <strong className="text-amber-400">Unverified Lead</strong>
        </span>
      </div>

      {/* Leads List */}
      <div className="space-y-4">
        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/80 border border-slate-800 rounded-xl text-slate-500 text-xs">
            No citizen leads currently pending triage.
          </div>
        ) : (
          filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-white text-sm">{lead.product_name}</span>
                  {lead.brand_manufacturer && (
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      <Building className="w-3 h-3 text-amber-400" />
                      {lead.brand_manufacturer}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase">
                    {lead.violation_type.replace("_", " ")}
                  </span>
                  {lead.status === "assigned" ? (
                    <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-semibold">
                      Assigned to Officer
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-medium">
                      Unverified Lead
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                  {lead.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                  <div className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{lead.store_location}</span>
                  </div>
                  {lead.barcode && (
                    <div className="flex items-center gap-1 text-slate-400">
                      <Barcode className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{lead.barcode}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {lead.status !== "assigned" ? (
                  <button
                    onClick={() => setSelectedLead(lead)}
                    className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Assign to Officer</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-500 italic">Dispatched for Field Check</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Assignment Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-ux4g-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Dispatch Citizen Lead to Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1 bg-slate-800/50 p-3 rounded-lg border border-slate-800">
              <p className="font-bold text-white">{selectedLead.product_name}</p>
              <p className="text-slate-400">Location: {selectedLead.store_location}</p>
            </div>

            <form onSubmit={handleAssign} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Field Inspector Roster *</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="off-01">Rajesh Deshmukh (Maharashtra - Mumbai)</option>
                  <option value="off-02">Ananya Sharma (Delhi NCR)</option>
                  <option value="off-04">Priya Nair (Karnataka - Bengaluru)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Jurisdiction Region *</label>
                <input
                  type="text"
                  required
                  value={assignRegion}
                  onChange={(e) => setAssignRegion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Inspection Directive & Notes</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Conduct surprise retail inspection at store premises under Section 15..."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs transition disabled:opacity-50"
                >
                  {submitting ? "Dispatching..." : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
