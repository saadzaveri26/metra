"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { API_BASE } from "@/lib/api";
import HQHeader from "@/components/headquarters/HQHeader";

import {
  Scale,
  Plus,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ShieldCheck,
  Power,
  RefreshCw,
  Clock,
  UserCheck,
  X,
} from "lucide-react";

interface ComplianceRule {
  id: string;
  rule_code: string;
  title: string;
  category: string;
  statutory_reference: string;
  severity: string;
  description: string;
  penalty_clause: string;
  is_active: boolean;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export default function HQRulesPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Rule Form State
  const [form, setForm] = useState({
    rule_code: "",
    title: "",
    category: "mrp",
    statutory_reference: "",
    severity: "HIGH",
    description: "",
    penalty_clause: "",
  });

  const fetchRules = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/hq/rules`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error("Failed to load statutory rules");
      const json = await res.json();
      setRules(json);
    } catch (err) {
      console.error("Rules fetch error:", err);
      // Fallback baseline PCR rules
      setRules([
        {
          id: "r-01",
          rule_code: "PCR-R06-MRP",
          title: "Maximum Retail Price (MRP) & Unit Sale Price",
          category: "mrp",
          statutory_reference: "Rule 6(1)(e) & Rule 6(11), PCR 2011",
          severity: "CRITICAL",
          description: "Mandatory declaration of MRP inclusive of all taxes, rounded to two decimal places.",
          penalty_clause: "Section 36(1) penalty up to Rs 25,000 for first offence.",
          is_active: true,
          created_by: "Directorate Legal Metrology",
          updated_by: "HQ Policy Admin",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-09-01T00:00:00Z",
        },
        {
          id: "r-02",
          rule_code: "PCR-R06-QTY",
          title: "Standard Net Quantity & Units of Measure",
          category: "quantity",
          statutory_reference: "Rule 6(1)(c) & Second Schedule, PCR 2011",
          severity: "CRITICAL",
          description: "Net weight, volume, or count declared using standard SI metric units (g, kg, ml, L).",
          penalty_clause: "Fine up to Rs 25,000; compounding under Section 48.",
          is_active: true,
          created_by: "Directorate Legal Metrology",
          updated_by: "HQ Policy Admin",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-09-01T00:00:00Z",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage(null);

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/hq/rules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          rule_code: form.rule_code.toUpperCase(),
          title: form.title,
          category: form.category,
          statutory_reference: form.statutory_reference,
          severity: form.severity,
          description: form.description,
          penalty_clause: form.penalty_clause,
          is_active: true,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Submission failed" }));
        throw new Error(errorData.detail || `Failed to create rule (HTTP ${res.status})`);
      }

      const createdRule = await res.json();
      setRules((prev) => [createdRule, ...prev]);
      setStatusMessage({ type: "success", text: `Rule ${createdRule.rule_code} promulgated successfully.` });
      setIsModalOpen(false);
      setForm({
        rule_code: "",
        title: "",
        category: "mrp",
        statutory_reference: "",
        severity: "HIGH",
        description: "",
        penalty_clause: "",
      });
    } catch (err: any) {
      console.error("Create rule error:", err);
      setStatusMessage({ type: "error", text: err.message || "Failed to create rule." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRuleActive = async (rule: ComplianceRule) => {
    try {
      const token = await getToken();
      const nextActiveState = !rule.is_active;
      const res = await fetch(`${API_BASE}/hq/rules/${rule.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          is_active: nextActiveState,
        }),
      });

      if (!res.ok) throw new Error("Failed to update rule status");
      const updated = await res.json();

      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, is_active: nextActiveState, updated_by: updated.updated_by } : r))
      );
      setStatusMessage({
        type: "success",
        text: `Rule ${rule.rule_code} is now ${nextActiveState ? "ACTIVE" : "INACTIVE"}.`,
      });
    } catch (err: any) {
      console.error("Toggle rule error:", err);
      setStatusMessage({ type: "error", text: "Failed to toggle rule state." });
    }
  };

  return (
    <div className="space-y-6">
      <HQHeader
        title="Statutory Compliance Rules & Policy Matrix"
        subtitle="Exclusive Headquarters authority: Promulgate PCR 2011 rule updates, configure penalty clauses, and maintain statutory audit logs"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchRules}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Promulgate New Rule</span>
            </button>
          </div>
        }
      />

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="font-bold ml-4 hover:opacity-80"
          >
            ×
          </button>
        </div>
      )}

      {/* Rules Matrix Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Active Compliance Policy Matrix</h2>
          </div>
          <span className="text-xs text-slate-400">
            Enforced by automated OCR engine & field officers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-4">Rule Code & Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Statutory Reference</th>
                <th className="p-4 text-center">Severity</th>
                <th className="p-4">Statutory Penalty</th>
                <th className="p-4 text-center">Audit Governance</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4">
                    <div className="font-bold text-white text-sm">{rule.title}</div>
                    <div className="text-[11px] font-mono text-amber-400/90 mt-0.5">
                      {rule.rule_code}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 max-w-sm">
                      {rule.description}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase font-semibold text-[10px]">
                      {rule.category}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300 font-medium">
                    {rule.statutory_reference}
                  </td>
                  <td className="p-4 text-center">
                    {rule.severity.toUpperCase() === "CRITICAL" ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 font-bold uppercase text-[10px]">
                        Critical
                      </span>
                    ) : rule.severity.toUpperCase() === "HIGH" ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold uppercase text-[10px]">
                        High
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-medium uppercase text-[10px]">
                        {rule.severity}
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-400 text-[11px] max-w-xs">
                    {rule.penalty_clause}
                  </td>
                  <td className="p-4 text-center text-[10px] text-slate-400">
                    <div className="flex items-center justify-center gap-1">
                      <UserCheck className="w-3 h-3 text-amber-400" />
                      <span className="truncate max-w-[100px]">{rule.updated_by || rule.created_by}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {rule.is_active ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold text-[10px]">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700 font-medium text-[10px]">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleToggleRuleActive(rule)}
                      className={`p-1.5 rounded-lg border transition ${
                        rule.is_active
                          ? "bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border-slate-700"
                          : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      }`}
                      title={rule.is_active ? "Deactivate Rule" : "Activate Rule"}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promulgate Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-ux4g-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Promulgate Statutory Compliance Rule</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Rule Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PCR-R07-QR"
                    value={form.rule_code}
                    onChange={(e) => setForm({ ...form, rule_code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="mrp">Maximum Retail Price</option>
                    <option value="quantity">Net Quantity</option>
                    <option value="identity">Manufacturer Identity</option>
                    <option value="font_size">Font Size & Legibility</option>
                    <option value="traceability">Digital QR / Traceability</option>
                    <option value="origin">Country of Origin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Rule Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Digital QR Code Verification on E-Commerce Packs"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Statutory Reference *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PCR Amendment 2024 Rule 7A"
                    value={form.statutory_reference}
                    onChange={(e) => setForm({ ...form, statutory_reference: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Severity Rating *</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="CRITICAL">Critical (Immediate Seizure / Compounding)</option>
                    <option value="HIGH">High (Mandatory Statutory Notice)</option>
                    <option value="MEDIUM">Medium (Correction Advisory)</option>
                    <option value="LOW">Low (Minor Technical Typo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Description & Verification Requirement *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Specify the exact statutory requirement field officers and AI vision must evaluate..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Statutory Penalty Clause *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fine up to Rs 25,000 under Section 36(1)"
                  value={form.penalty_clause}
                  onChange={(e) => setForm({ ...form, penalty_clause: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs transition disabled:opacity-50"
                >
                  {submitting ? "Promulgating..." : "Promulgate Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
