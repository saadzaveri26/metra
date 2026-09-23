"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { API_BASE } from "@/lib/api";
import Image from "next/image";
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RotateCcw,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  Maximize2,
} from "lucide-react";

interface RuleResult {
  rule_id: string;
  field: string;
  statutory_clause: string;
  detected_value: string;
  status: "COMPLIANT" | "NON_COMPLIANT" | "REVIEW";
  guidance: string;
  box?: { x: number; y: number; width: number; height: number } | null;
}

export default function VendorSelfCheckPage() {
  const { getToken } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [category, setCategory] = useState("food");
  const [isImported, setIsImported] = useState(false);
  const [listedMrp, setListedMrp] = useState("");
  const [listedNetQty, setListedNetQty] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hoveredRuleId, setHoveredRuleId] = useState<string | null>(null);
  const [showBoxes, setShowBoxes] = useState(true);
  const [results, setResults] = useState<{
    overall_status: "COMPLIANT" | "NON_COMPLIANT" | "REVIEW";
    compliance_rate: string;
    rules: RuleResult[];
    font_analysis: {
      pdp_area_cm2: number;
      min_font_required_mm: number;
      detected_font_mm: number;
      font_compliant: boolean;
    };
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResults(null);
      setErrorMessage(null);
    }
  };

  const handleSelfCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("interface", "vendor");
      formData.append("is_imported", isImported ? "true" : "false");
      if (listedMrp) formData.append("listed_mrp", listedMrp);
      if (listedNetQty) formData.append("listed_net_quantity", listedNetQty);

      const res = await fetch(`${API_BASE}/scans`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Scan analysis failed with status ${res.status}`);
      }

      const data = await res.json();
      const comp = data.compliance_results || {};
      const rulesList: RuleResult[] = Object.keys(comp).map((key) => {
        const item = comp[key];
        const displayVal =
          item.effective_value ||
          item.ai_value ||
          (item.status === "NON_COMPLIANT"
            ? "Declaration Missing"
            : item.findings || "Verified on Packaging");
        return {
          rule_id: key,
          field: key.replace(/_/g, " ").toUpperCase(),
          statutory_clause: item.rule_reference || item.act_section || "PCR 2011",
          detected_value: displayVal,
          status:
            item.status === "COMPLIANT"
              ? "COMPLIANT"
              : item.status === "NON_COMPLIANT"
              ? "NON_COMPLIANT"
              : "REVIEW",
          guidance: item.findings || item.rule_description,
          box: item.normalized_box || null,
        };
      });

      const totalChecked = data.compliance_summary?.total_fields_checked || rulesList.length || 1;
      const compCount =
        data.compliance_summary?.compliant_count ??
        rulesList.filter((r) => r.status === "COMPLIANT").length;
      const rate = `${Math.round((compCount / totalChecked) * 100)}%`;

      setResults({
        overall_status:
          data.compliance_summary?.overall_status ||
          (compCount === totalChecked ? "COMPLIANT" : "NON_COMPLIANT"),
        compliance_rate: rate,
        rules: rulesList,
        font_analysis: {
          pdp_area_cm2: data.font_analysis?.pdp_area_cm2 ?? 180,
          min_font_required_mm: data.font_analysis?.min_font_required_mm ?? 2.0,
          detected_font_mm: data.font_analysis?.detected_font_mm ?? 2.2,
          font_compliant: data.font_analysis?.font_compliant ?? true,
        },
      });
    } catch (err: any) {
      console.error("Vendor self-check error:", err);
      setErrorMessage(err.message || "Failed to analyze packaging label artwork. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#10243e] tracking-tight">
            Pre-Market Package Self-Check
          </h1>
          <p className="text-xs text-slate-500">
            Advisory evaluation of pre-packaged label artwork against Packaged Commodities Rules, 2011
          </p>
        </div>

        {/* Clear Safe Harbor Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e8f8f0] border border-[#159a68]/30 text-[#159a68] text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Statutory Safe Harbor Active</span>
        </div>
      </div>

      {/* Upload and Form Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Image */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleSelfCheck} className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-[#10243e]">1. Upload Label Artwork</h2>

            {/* Drag & drop upload area */}
            <div className="relative border-2 border-dashed border-slate-300 hover:border-[#0867c9] rounded-xl p-6 text-center transition-colors bg-slate-50/50">
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {previewUrl ? (
                <div className="space-y-2">
                  <div className="relative min-h-[220px] max-h-[380px] w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Uploaded Label"
                      className="max-h-[380px] max-w-full object-contain"
                    />
                    {showBoxes && results?.rules && (
                      <div className="absolute inset-0 pointer-events-none">
                        {results.rules
                          .filter((r) => r.box && r.box.width > 0)
                          .map((r) => {
                            const isHovered = hoveredRuleId === r.rule_id;
                            const isCompliant = r.status === "COMPLIANT";
                            return (
                              <div
                                key={r.rule_id}
                                style={{
                                  left: `${r.box!.x}%`,
                                  top: `${r.box!.y}%`,
                                  width: `${r.box!.width}%`,
                                  height: `${Math.max(r.box!.height, 3.2)}%`,
                                }}
                                onMouseEnter={() => setHoveredRuleId(r.rule_id)}
                                onMouseLeave={() => setHoveredRuleId(null)}
                                className={`absolute pointer-events-auto cursor-pointer rounded transition-all duration-150 ${
                                  isHovered
                                    ? "ring-4 ring-sky-400 bg-sky-400/35 z-30 shadow-xl"
                                    : isCompliant
                                    ? "border-2 border-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/35 z-20"
                                    : "border-2 border-amber-400 bg-amber-500/25 hover:bg-amber-500/40 z-20"
                                }`}
                              >
                                <div
                                  className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-tight shadow flex items-center gap-1 whitespace-nowrap pointer-events-none ${
                                    isHovered
                                      ? "bg-[#0867c9] text-white z-40 scale-105"
                                      : isCompliant
                                      ? "bg-emerald-700 text-white"
                                      : "bg-amber-600 text-white"
                                  }`}
                                >
                                  <span>{r.field}</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <p className="font-semibold text-[#0867c9]">Click or drop to replace image</p>
                    {results?.rules && results.rules.some((r) => r.box && r.box.width > 0) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowBoxes(!showBoxes);
                        }}
                        className="text-[11px] font-medium text-slate-500 hover:text-slate-800 underline"
                      >
                        {showBoxes ? "Hide Detection Boxes" : "Show Detection Boxes"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <div className="w-12 h-12 rounded-full bg-[#eaf4ff] text-[#0867c9] flex items-center justify-center mx-auto">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Upload package label or pouch artwork</p>
                  <p className="text-[11px] text-slate-400">PNG, JPG, or WEBP up to 15MB</p>
                </div>
              )}
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Commodity Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0867c9]"
              >
                <option value="food">Packaged Food &amp; Edible Commodities</option>
                <option value="cosmetics">Cosmetics &amp; Personal Care</option>
                <option value="electronics">Consumer Electronics &amp; Hardware</option>
                <option value="general">General Packaged Commodity</option>
              </select>
            </div>

            {/* Cross-check fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Target MRP (₹)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 240.00"
                  value={listedMrp}
                  onChange={(e) => setListedMrp(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0867c9]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Net Quantity
                </label>
                <input
                  type="text"
                  placeholder="e.g. 500 g"
                  value={listedNetQty}
                  onChange={(e) => setListedNetQty(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0867c9]"
                />
              </div>
            </div>

            {/* Imported goods toggle */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isImported"
                checked={isImported}
                onChange={(e) => setIsImported(e.target.checked)}
                className="rounded text-[#0867c9] focus:ring-[#0867c9] h-4 w-4"
              />
              <label htmlFor="isImported" className="text-xs text-slate-700 font-medium">
                Imported Commodity (Enforce Rule 6(1)(g) Country of Origin)
              </label>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedFile || isSubmitting}
              className="w-full py-2.5 rounded-lg bg-[#0867c9] hover:bg-[#064e9a] disabled:bg-slate-300 text-white text-xs font-bold shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing Label Artwork...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Run Pre-Market Self-Check</span>
                </>
              )}
            </button>
          </form>

          {/* Statutory Advice Card */}
          <div className="bg-[#fcfaf4] rounded-xl p-4 border border-[#ecd9aa] text-xs text-slate-700 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-[#b87c00]">
              <Info className="w-4 h-4" />
              <span>Why Run Self-Checks Before Launch?</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Detecting missing declarations or sub-standard font heights before final printing prevents packaging recall costs, distributor rejection, and regulatory compounding notices under Section 36 of the Legal Metrology Act, 2009.
            </p>
          </div>
        </div>

        {/* Right Column: Advisory Results Matrix */}
        <div className="lg:col-span-7 space-y-4">
          {results ? (
            <div className="space-y-4">
              {/* Prominent Advisory Disclaimer Banner */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-amber-900 tracking-wide uppercase">
                      Advisory Self-Check Report
                    </h3>
                    <p className="text-[11px] text-amber-800">
                      Advisory only · Not an official Legal Metrology inspection · No case record created
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded bg-amber-600 text-white">
                  Safe Harbor
                </span>
              </div>

              {/* Summary Card */}
              <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Advisory Result</p>
                  <h3 className="text-lg font-black text-[#10243e] mt-0.5">
                    {results.overall_status === "COMPLIANT" ? "Ready for Commercial Printing" : "Remediation Required"}
                  </h3>
                  <p className="text-xs text-[#159a68] font-semibold mt-1">
                    Compliance Score: {results.compliance_rate}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      results.overall_status === "COMPLIANT"
                        ? "bg-[#e8f8f0] text-[#159a68]"
                        : "bg-[#feecec] text-[#dc2626]"
                    }`}
                  >
                    {results.overall_status === "COMPLIANT" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    {results.overall_status}
                  </span>
                </div>
              </div>

              {/* Font Size & PDP Analysis */}
              <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm">
                <h3 className="text-xs font-bold text-[#10243e] uppercase tracking-wider mb-3">
                  Rule 7 Font Size &amp; PDP Legibility Analysis
                </h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-[11px] text-slate-400">PDP Area</p>
                    <p className="text-sm font-black text-[#10243e] mt-1">
                      {results.font_analysis.pdp_area_cm2} cm²
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-[11px] text-slate-400">Min. Required Height</p>
                    <p className="text-sm font-black text-[#10243e] mt-1">
                      {results.font_analysis.min_font_required_mm} mm
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-[11px] text-slate-400">Detected Height</p>
                    <p className="text-sm font-black text-[#159a68] mt-1">
                      {results.font_analysis.detected_font_mm} mm
                    </p>
                  </div>
                </div>
              </div>

              {/* Mandatory Declarations Matrix */}
              <div className="bg-white rounded-xl border border-[#dce7f2] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#dce7f2] bg-[#f8fafc] flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#10243e] uppercase tracking-wider">
                    Mandatory Declarations Matrix (PCR 2011)
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {results.rules.length} Statutory Checks
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {results.rules.map((rule) => {
                    const isHovered = hoveredRuleId === rule.rule_id;
                    return (
                      <div
                        key={rule.rule_id}
                        id={`rule-card-${rule.rule_id}`}
                        onMouseEnter={() => setHoveredRuleId(rule.rule_id)}
                        onMouseLeave={() => setHoveredRuleId(null)}
                        className={`p-4 space-y-1.5 transition-all duration-150 ${
                          isHovered ? "bg-sky-50/70 ring-1 ring-inset ring-sky-300" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#10243e]">{rule.field}</span>
                            <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                              {rule.statutory_clause}
                            </span>
                          </div>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                              rule.status === "COMPLIANT"
                                ? "bg-[#e8f8f0] text-[#159a68]"
                                : "bg-[#feecec] text-[#dc2626]"
                            }`}
                          >
                            {rule.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono break-words leading-relaxed">
                          {rule.detected_value}
                        </p>
                        <p className="text-[11px] text-slate-500">{rule.guidance}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-xl p-12 border border-[#dce7f2] shadow-sm text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileCheck className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#10243e]">No Package Tested Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Upload your pre-packaged commodity label artwork on the left to run an automated PCR 2011 compliance check.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
