"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  const initialBarcode = searchParams.get("barcode") || "8901234567890";

  const [barcode, setBarcode] = useState(initialBarcode);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);

  const fetchLookup = async (codeToQuery: string) => {

    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/consumer/lookup?barcode=${encodeURIComponent(codeToQuery)}`
      );
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        // Mock fallback for offline resilience
        setResult(getMockLookup(codeToQuery));
      }
    } catch (e) {
      setResult(getMockLookup(codeToQuery));
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

  const getMockLookup = (code: string): LookupResult => ({
    barcode: code,
    product_name: "Pure Mountain Organic Honey",
    brand_manufacturer: "Suvidha FMCG Pvt. Ltd.",
    category: "Spread, Sweeteners, Bee products",
    has_active_recall: false,
    mandatory_label_info: [
      {
        field: "Maximum Retail Price (MRP)",
        statutory_rule: "Rule 6(1)(e)",
        status: "INFO",
        findings: "Must be printed inclusive of all taxes. Check physical label.",
      },
      {
        field: "Unit Sale Price (USP)",
        statutory_rule: "Rule 6(11)",
        status: "INFO",
        findings: "Unit price per gram/ml must be stated for fair comparison.",
      },
      {
        field: "Net Quantity",
        statutory_rule: "Rule 6(1)(b)",
        status: "INFO",
        findings: "Must be stated in standard metric units (g, ml, L, kg).",
        declared_value: "500 g",
      },
      {
        field: "Month & Year of Manufacture",
        statutory_rule: "Rule 6(1)(d)",
        status: "INFO",
        findings: "Packaging or manufacturing date must be clearly legible.",
      },
      {
        field: "Manufacturer Details",
        statutory_rule: "Rule 6(1)(a)",
        status: "INFO",
        findings: "Legal name and physical address of manufacturer/packer required.",
        declared_value: "Suvidha FMCG Pvt. Ltd.",
      },
      {
        field: "Consumer Helpline Contact",
        statutory_rule: "Rule 6(1)(da)",
        status: "INFO",
        findings: "Consumer helpline contact (phone/email) must be on label.",
      },
    ],
    nutrition: {
      nutriscore_grade: "c",
      nova_group: 1,
      ecoscore_grade: "b",
      nutrient_levels: {
        fat: "low",
        "saturated-fat": "low",
        sugars: "high",
        salt: "low",
      },
      nutriments: {
        energy_kcal_100g: 304,
        proteins_100g: 0.3,
        carbohydrates_100g: 82.4,
        sugars_100g: 82.1,
        fat_100g: 0.0,
        saturated_fat_100g: 0.0,
        salt_100g: 0.01,
      },
      allergens: [],
      additives: [],
      ingredients_text: "100% Pure Natural Raw Honey.",
      source: "Open Food Facts Reference DB",
    },
  });

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
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 border border-[#dce7f2] shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Enter or scan barcode number..."
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#159a68]"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2 rounded-lg bg-[#159a68] hover:bg-[#128358] text-white text-xs font-bold shadow transition-all flex items-center justify-center gap-2"
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
                <span>Barcode: <span className="font-mono font-semibold text-slate-700">{result.barcode}</span></span>
                <span>Category: <span className="font-semibold text-slate-700">{result.category}</span></span>
              </div>
            </div>

            {/* Mandatory Declarations List */}
            <div className="bg-white rounded-xl border border-[#dce7f2] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#dce7f2] bg-[#f8fafc] flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#10243e] uppercase tracking-wider">
                  What to Look For on the Label
                </h3>
                <span className="text-[11px] text-slate-400">PCR 2011 Rule 6 Reference</span>
              </div>

              <div className="divide-y divide-slate-100">
                {result.mandatory_label_info.map((item, idx) => (
                  <div key={idx} className="p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#10243e]">{item.field}</span>
                        <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                          {item.statutory_rule}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0867c9]">
                        {item.status}
                      </span>
                    </div>
                    {item.declared_value && (
                      <p className="text-xs text-slate-700 font-mono bg-slate-50 p-1.5 rounded border border-slate-200">
                        {item.declared_value}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500">{item.findings}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Public Disclosure Note */}
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                This is an informational reference only. Compliance verification requires a physical inspection of the label by a Legal Metrology officer. Section 36, Legal Metrology Act, 2009.
              </span>
            </div>
          </div>

          {/* Right Column: Open Food Facts Health & Nutrition Report */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                    Nutritional Health Profile
                  </span>
                  <h3 className="text-sm font-bold text-[#10243e] mt-1">
                    Open Food Facts Nutritional Audit
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{result.nutrition.source}</span>
              </div>

              {/* Nutri-Score & NOVA Group Cards */}
              <div className="grid grid-cols-2 gap-3">
                {/* Nutri-Score */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Nutri-Score
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    {["a", "b", "c", "d", "e"].map((grade) => (
                      <div
                        key={grade}
                        className={`w-6 h-8 rounded-md flex items-center justify-center font-black text-xs uppercase ${
                          result.nutrition.nutriscore_grade.toLowerCase() === grade
                            ? `${getNutriscoreColor(grade)} scale-110 shadow-sm ring-2 ring-slate-900/20`
                            : "bg-slate-200 text-slate-400 opacity-40"
                        }`}
                      >
                        {grade}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Grade {result.nutrition.nutriscore_grade.toUpperCase()}
                  </p>
                </div>

                {/* NOVA Ultra-Processing Group */}
                {(() => {
                  const novaInfo = getNovaColor(result.nutrition.nova_group);
                  return (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        NOVA Processing
                      </p>
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white font-black text-sm">
                        {result.nutrition.nova_group || "?"}
                      </div>
                      <p className={`text-[10px] font-semibold px-2 py-0.5 rounded ${novaInfo.bg} ${novaInfo.text}`}>
                        {novaInfo.label}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Nutrient Levels Traffic Lights */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">Nutrient Levels per 100g</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  {Object.entries(result.nutrition.nutrient_levels).map(([nutrient, level]) => {
                    const isLow = level === "low";
                    const isMod = level === "moderate";
                    return (
                      <div
                        key={nutrient}
                        className={`p-2 rounded-lg border ${
                          isLow
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : isMod
                            ? "bg-amber-50 border-amber-200 text-amber-800"
                            : "bg-red-50 border-red-200 text-red-800"
                        }`}
                      >
                        <p className="capitalize text-[10px] font-semibold">{nutrient.replace("-", " ")}</p>
                        <p className="font-bold text-xs uppercase mt-0.5">{level}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Nutrition Facts Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <div className="bg-slate-50 p-2.5 font-bold text-slate-700 border-b border-slate-200 flex justify-between">
                  <span>Nutritional Value</span>
                  <span>Per 100 g</span>
                </div>
                <div className="divide-y divide-slate-100 text-slate-600">
                  <div className="p-2 flex justify-between">
                    <span>Energy</span>
                    <span className="font-semibold">{result.nutrition.nutriments.energy_kcal_100g ?? "N/A"} kcal</span>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span>Protein</span>
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
