"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Scale,
  ShieldCheck,
  Info,
  Leaf,
  Sparkles,
  ExternalLink,
  Flame,
  AlertOctagon,
  FileQuestion,
  ScanLine,
} from "lucide-react";
import { API_BASE } from "@/lib/api";

interface NutritionData {
  nutriscore_grade: string;
  nova_group?: number;
  ecoscore_grade?: string;
  nutrient_levels: Record<string, string>;
  nutriments: Record<string, any>;
  allergens: string[];
  additives: string[];
  ingredients_text?: string;
  source: string;
}

interface Declaration {
  field: string;
  statutory_rule: string;
  status: string;
  findings: string;
  declared_value?: string;
}

interface LookupResult {
  barcode: string;
  product_name: string;
  brand_manufacturer: string;
  category: string;
  mandatory_label_info: Declaration[];
  nutrition: NutritionData;
  has_active_recall: boolean;
  recall_warning?: string;
}

export default function ConsumerLookupPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500">
          Loading product verification portal...
        </div>
      }
    >
      <ConsumerLookupContent />
    </Suspense>
  );
}

function ConsumerLookupContent() {
  const searchParams = useSearchParams();
  const initialBarcode = searchParams.get("barcode") || "";

  const [barcode, setBarcode] = useState(initialBarcode);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchLookup = async (codeToQuery: string) => {
    if (!codeToQuery.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const res = await fetch(
        `${API_BASE}/consumer/lookup?barcode=${encodeURIComponent(codeToQuery.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorMessage(
          errJson.detail ||
            `No product or statutory record found for barcode "${codeToQuery}". Please check the digits or file a citizen report.`
        );
      }
    } catch (e: any) {
      setErrorMessage("Unable to connect to verification server. Please check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialBarcode) {
      fetchLookup(initialBarcode);
    }
  }, [initialBarcode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode.trim()) {
      fetchLookup(barcode.trim());
    }
  };

  const getNutriscoreColor = (grade: string) => {
    switch (grade.toLowerCase()) {
      case "a":
        return "bg-[#038141] text-white";
      case "b":
        return "bg-[#85bb2f] text-white";
      case "c":
        return "bg-[#fecb02] text-slate-900";
      case "d":
        return "bg-[#ee8100] text-white";
      case "e":
        return "bg-[#e63e11] text-white";
      default:
        return "bg-slate-300 text-slate-700";
    }
  };

  const getNovaColor = (group?: number) => {
    switch (group) {
      case 1:
        return { bg: "bg-emerald-100", text: "text-emerald-800", label: "Unprocessed or Minimally Processed" };
      case 2:
        return { bg: "bg-blue-100", text: "text-blue-800", label: "Processed Culinary Ingredient" };
      case 3:
        return { bg: "bg-amber-100", text: "text-amber-800", label: "Processed Food" };
      case 4:
        return { bg: "bg-red-100", text: "text-red-800", label: "Ultra-Processed Food Product" };
      default:
        return { bg: "bg-slate-100", text: "text-slate-800", label: "NOVA Not Classified" };
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#10243e] tracking-tight">
          Product Information &amp; Health Report
        </h1>
        <p className="text-xs text-slate-500">
          Product information with Open Food Facts nutritional analysis. Compliance verification requires a physical inspection or officer scan.
        </p>
      </div>

      {/* Barcode Search Bar */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl p-4 border border-[#dce7f2] shadow-sm flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Enter or scan barcode number (e.g. 8901030383748)..."
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#159a68]"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !barcode.trim()}
          className="px-5 py-2 rounded-lg bg-[#159a68] hover:bg-[#128358] text-white text-xs font-bold shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span>Fetching Data...</span>
          ) : (
            <>
              <Search className="w-3.5 h-3.5" />
              <span>Look Up Product</span>
            </>
          )}
        </button>
      </form>

      {/* Error / Not Found Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
              <FileQuestion className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900">Product Not Found</h4>
              <p className="text-xs text-amber-800 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <Link
            href={`/consumer/report?barcode=${encodeURIComponent(barcode)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 shadow-sm transition-colors"
          >
            <span>File Citizen Lead</span>
          </Link>
        </div>
      )}

      {/* Initial Clean Zero-State Prompt */}
      {!result && !isLoading && !errorMessage && (
        <div className="bg-white rounded-xl p-12 border border-[#dce7f2] shadow-sm text-center">
          <div className="max-w-md mx-auto flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#159a68] mb-4">
              <ScanLine className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-[#10243e]">
              Enter a Barcode to Verify Packaging Compliance
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Scan or enter the EAN-13 / barcode of any retail packaged commodity in India. You will receive statutory Rule 6 label requirements and open nutritional profiles.
            </p>
            <div className="mt-5 flex items-center gap-2 text-[11px] text-slate-400">
              <Scale className="w-3.5 h-3.5 text-[#159a68]" />
              <span>Grounded in Legal Metrology (Packaged Commodities) Rules, 2011</span>
            </div>
          </div>
        </div>
      )}

      {/* Active Recall Alert Callout */}
      {result?.has_active_recall && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-300 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-700 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-red-900 uppercase tracking-wide">
              Official Safety / Recall Notice
            </h4>
            <p className="text-xs text-red-800 mt-0.5">{result.recall_warning}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Legal Metrology Declarations (PCR 2011) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#0867c9] uppercase tracking-wider">
                    Product Information
                  </span>
                  <h2 className="text-base font-bold text-[#10243e] mt-1">
                    {result.product_name}
                  </h2>
                  <p className="text-xs text-slate-500">{result.brand_manufacturer}</p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-[#0867c9]">
                  <Info className="w-3.5 h-3.5" />
                  <span>Reference</span>
                </span>
              </div>

              {/* Barcode & Category Meta */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Barcode: <span className="font-mono font-semibold text-slate-700">{result.barcode}</span>
                </span>
                <span>
                  Category: <span className="font-semibold text-slate-700">{result.category}</span>
                </span>
              </div>
            </div>

            {/* Mandatory Declarations List */}
            <div className="bg-white rounded-xl border border-[#dce7f2] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#dce7f2] bg-[#f8fafc] flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#10243e] uppercase tracking-wider">
                  What to Look For on the Label
                </h3>
                <span className="text-[10px] font-semibold text-slate-500">PCR 2011 Rule 6</span>
              </div>

              <div className="divide-y divide-slate-100">
                {result.mandatory_label_info.map((decl, idx) => (
                  <div key={idx} className="p-4 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-50 text-[#0867c9] flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-[#10243e]">{decl.field}</h4>
                        <span className="font-mono text-[10px] font-semibold text-slate-400">
                          {decl.statutory_rule}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{decl.findings}</p>
                      {decl.declared_value && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
                          <span className="text-slate-400">Reference:</span>
                          <span className="font-semibold">{decl.declared_value}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Health & Nutritional Analysis (Open Food Facts) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-[#10243e]">Health &amp; Nutritional Quality</h3>
                </div>
                <span className="text-[10px] text-slate-400">Source: {result.nutrition.source}</span>
              </div>

              {/* Nutri-Score & NOVA Badges */}
              <div className="grid grid-cols-2 gap-3">
                {/* Nutri-Score Card */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Nutri-Score
                  </span>
                  <div
                    className={`inline-block w-9 h-9 rounded-lg font-black text-lg leading-9 uppercase shadow-xs ${getNutriscoreColor(
                      result.nutrition.nutriscore_grade
                    )}`}
                  >
                    {result.nutrition.nutriscore_grade}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Official European standard</p>
                </div>

                {/* NOVA Processing Card */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    NOVA Group
                  </span>
                  {result.nutrition.nova_group ? (
                    <div
                      className={`inline-block px-2.5 py-1 rounded-lg font-bold text-xs ${
                        getNovaColor(result.nutrition.nova_group).bg
                      } ${getNovaColor(result.nutrition.nova_group).text}`}
                    >
                      Group {result.nutrition.nova_group}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">N/A</span>
                  )}
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                    {getNovaColor(result.nutrition.nova_group).label}
                  </p>
                </div>
              </div>

              {/* Nutrient Profile (100g) */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">Nutritional Values per 100g</h4>
                <div className="grid grid-cols-2 gap-2 text-xs divide-y divide-slate-100 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-600">Energy</span>
                    <span className="font-semibold">{result.nutrition.nutriments.energy_kcal_100g ?? "N/A"} kcal</span>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-600">Protein</span>
                    <span className="font-semibold">{result.nutrition.nutriments.proteins_100g ?? "N/A"} g</span>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span>Carbohydrates</span>
                    <span className="font-semibold">{result.nutrition.nutriments.carbohydrates_100g ?? "N/A"} g</span>
                  </div>
                  <div className="p-2 flex justify-between pl-5 text-[11px] text-slate-500">
                    <span>- Sugars</span>
                    <span className="font-semibold">{result.nutrition.nutriments.sugars_100g ?? "N/A"} g</span>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span>Fat</span>
                    <span className="font-semibold">{result.nutrition.nutriments.fat_100g ?? "N/A"} g</span>
                  </div>
                  <div className="p-2 flex justify-between pl-5 text-[11px] text-slate-500">
                    <span>- Saturated Fat</span>
                    <span className="font-semibold">{result.nutrition.nutriments.saturated_fat_100g ?? "N/A"} g</span>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span>Salt</span>
                    <span className="font-semibold">{result.nutrition.nutriments.salt_100g ?? "N/A"} g</span>
                  </div>
                </div>
              </div>

              {/* Declared Ingredients */}
              {result.nutrition.ingredients_text && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-1">Declared Ingredients</h4>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                    {result.nutrition.ingredients_text}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
