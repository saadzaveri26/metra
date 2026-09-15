"use client";

import { useState } from "react";
import {
  BookOpenCheck,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Printer,
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface GuidanceRule {
  id: string;
  rule_no: string;
  title: string;
  category: "all" | "food" | "cosmetics" | "imported";
  description: string;
  mandatory_declarations: string[];
  font_guideline: string;
  penalty_clause: string;
}

export default function VendorGuidancePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [checkedRules, setCheckedRules] = useState<Record<string, boolean>>({});
  const [expandedRule, setExpandedRule] = useState<string | null>("pcr-1");

  const rules: GuidanceRule[] = [
    {
      id: "pcr-1",
      rule_no: "Rule 6(1)(a)",
      title: "Name & Physical Address of Manufacturer, Packer, or Importer",
      category: "all",
      description:
        "Every pre-packaged commodity must display the complete name and physical address of the entity responsible for manufacturing or packaging.",
      mandatory_declarations: [
        "Full registered legal name of manufacturer / packer",
        "Complete physical premises (Plot/Building no., Street, City, State, PIN)",
        "For contract packaging: 'Manufactured by X for Y' with both addresses",
      ],
      font_guideline: "Minimum 1.5 mm font height across all display areas.",
      penalty_clause: "Section 36(1) compounding penalty up to ₹25,000 for first offence.",
    },
    {
      id: "pcr-2",
      rule_no: "Rule 6(1)(b) & Rule 12",
      title: "Net Quantity Declaration & Metric Units",
      category: "all",
      description:
        "The correct net quantity of the commodity contained in the package must be clearly stated in standard SI metric units (g, kg, ml, L) or numerical count.",
      mandatory_declarations: [
        "Must use standard international metric symbols: 'g', 'kg', 'ml', 'L', 'N'",
        "No non-standard symbols like 'gms', 'kilo', 'litres'",
        "Must be placed on the Principal Display Panel (PDP)",
      ],
      font_guideline:
        "Area-dependent: 2.0 mm (up to 200g/ml), 4.0 mm (200g to 1kg/L), 6.0 mm (above 1kg/L).",
      penalty_clause: "Section 36(2) penalty up to ₹50,000 for non-standard units.",
    },
    {
      id: "pcr-3",
      rule_no: "Rule 6(1)(e) & Rule 6(11)",
      title: "Maximum Retail Price (MRP) & Unit Sale Price (USP)",
      category: "all",
      description:
        "Retail sale price inclusive of all taxes, accompanied by the Unit Sale Price for consumer transparency.",
      mandatory_declarations: [
        "Wording: 'MRP Rs. XX.XX (incl. of all taxes)' or 'Maximum Retail Price Rs. XX.XX'",
        "Unit Sale Price: 'Rs. XX.XX per g/ml/piece' for commodities exceeding 1g or 1ml",
        "Rounding off strictly to nearest paisa",
      ],
      font_guideline: "Same minimum numeral height as the Net Quantity declaration.",
      penalty_clause: "Compounding fine under Section 36 for dual MRP or omitted USP.",
    },
    {
      id: "pcr-4",
      rule_no: "Rule 6(1)(d)",
      title: "Month & Year of Manufacture / Pre-Packing",
      category: "all",
      description:
        "The date on which the commodity was packaged or manufactured for retail sale.",
      mandatory_declarations: [
        "Format: MM/YYYY or Month YYYY (e.g. 09/2026 or September 2026)",
        "Must be legible and indelible",
      ],
      font_guideline: "Minimum 1.5 mm font height.",
      penalty_clause: "Statutory violation under Rule 6(1)(d).",
    },
    {
      id: "pcr-5",
      rule_no: "Rule 6(1)(da)",
      title: "Consumer Grievance Care Contact Details",
      category: "all",
      description:
        "Comprehensive contact information for consumer grievance redressal.",
      mandatory_declarations: [
        "Designation or name of consumer care officer",
        "Telephone number (toll-free or landline)",
        "Dedicated email address",
        "Physical address for postal correspondence",
      ],
      font_guideline: "Minimum 1.5 mm font height.",
      penalty_clause: "Mandatory declaration under 2017 amendments.",
    },
    {
      id: "pcr-6",
      rule_no: "Rule 6(1)(g)",
      title: "Country of Origin for Imported Commodities",
      category: "imported",
      description:
        "Every imported packaged commodity must prominently state the country of manufacture.",
      mandatory_declarations: [
        "Declaration: 'Country of Origin: [Country Name]' or 'Manufactured in: [Country]'",
        "Must be displayed in a prominent position on the principal display panel",
      ],
      font_guideline: "Minimum 1.5 mm font height.",
      penalty_clause: "Customs and Legal Metrology seizure on import clearance.",
    },
    {
      id: "pcr-7",
      rule_no: "FSSAI / PCR Alignment",
      title: "Vegetarian / Non-Vegetarian Logo",
      category: "food",
      description:
        "Mandatory symbol indicating dietary nature on all food packages.",
      mandatory_declarations: [
        "Green filled circle in green outline square for Vegetarian commodities",
        "Brown filled triangle in brown outline square for Non-Vegetarian commodities",
      ],
      font_guideline: "Minimum symbol dimension: 3 mm up to 100 cm² PDP; 4 mm for larger packages.",
      penalty_clause: "FSSAI Regulation 2.2.2 & PCR alignment.",
    },
  ];

  const filteredRules = rules.filter(
    (r) => selectedCategory === "all" || r.category === selectedCategory || r.category === "all"
  );

  const toggleCheck = (id: string) => {
    setCheckedRules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(checkedRules).filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#10243e] tracking-tight">
            PCR 2011 Statutory Compliance Guidance
          </h1>
          <p className="text-xs text-slate-500">
            Official packaging checklists and minimum font specifications under Legal Metrology Rules, 2011
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Checklist</span>
          </button>
        </div>
      </div>

      {/* Progress Bar Card */}
      <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-[#10243e] uppercase tracking-wider">
            Pre-Launch Audit Checklist Progress
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {completedCount} of {filteredRules.length} mandatory declarations checked
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-[#159a68] h-2.5 rounded-full transition-all duration-300"
              style={{
                width: `${Math.round((completedCount / (filteredRules.length || 1)) * 100)}%`,
              }}
            ></div>
          </div>
          <span className="text-xs font-bold text-[#159a68]">
            {Math.round((completedCount / (filteredRules.length || 1)) * 100)}%
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "all", label: "All Commodities" },
          { id: "food", label: "Packaged Food" },
          { id: "cosmetics", label: "Cosmetics & Toiletries" },
          { id: "imported", label: "Imported Goods" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === tab.id
                ? "bg-[#0867c9] text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Guidance Rules Accordion / Checklist */}
      <div className="space-y-3">
        {filteredRules.map((rule) => {
          const isChecked = !!checkedRules[rule.id];
          const isExpanded = expandedRule === rule.id;

          return (
            <div
              key={rule.id}
              className={`bg-white rounded-xl border transition-all shadow-sm ${
                isChecked ? "border-[#159a68]/40 bg-[#fbfdfb]" : "border-[#dce7f2]"
              }`}
            >
              <div className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCheck(rule.id)}
                    className="mt-1 h-4 w-4 rounded text-[#159a68] focus:ring-[#159a68] cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {rule.rule_no}
                      </span>
                      <h3 className="text-xs font-bold text-[#10243e]">{rule.title}</h3>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rule.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-3 text-xs">
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-1">Mandatory Declarations:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-slate-600">
                      {rule.mandatory_declarations.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <p className="font-semibold text-slate-700">Minimum Font Size Requirement:</p>
                      <p className="text-slate-600 mt-0.5">{rule.font_guideline}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50/50 border border-red-200/60">
                      <p className="font-semibold text-red-800">Compounding / Penalty Provision:</p>
                      <p className="text-red-700 mt-0.5">{rule.penalty_clause}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Table 1: Minimum Font Sizes per Rule 7 */}
      <div className="bg-white rounded-xl p-5 border border-[#dce7f2] shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-[#10243e] uppercase tracking-wider">
          Rule 7, Table 1: Minimum Height of Numerals for Net Quantity &amp; Retail Price
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Net Quantity Range</th>
                <th className="px-4 py-2.5">Principal Display Panel Area (A)</th>
                <th className="px-4 py-2.5">Minimum Height (Normal)</th>
                <th className="px-4 py-2.5">Blow-moulded / Perforated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              <tr>
                <td className="px-4 py-2 font-medium text-slate-800">Up to 50 g / ml</td>
                <td className="px-4 py-2">A ≤ 50 cm²</td>
                <td className="px-4 py-2 font-bold text-[#159a68]">1.0 mm</td>
                <td className="px-4 py-2">1.5 mm</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium text-slate-800">50 g to 200 g / ml</td>
                <td className="px-4 py-2">50 cm² &lt; A ≤ 100 cm²</td>
                <td className="px-4 py-2 font-bold text-[#159a68]">2.0 mm</td>
                <td className="px-4 py-2">3.0 mm</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium text-slate-800">200 g to 1 kg / L</td>
                <td className="px-4 py-2">100 cm² &lt; A ≤ 500 cm²</td>
                <td className="px-4 py-2 font-bold text-[#159a68]">4.0 mm</td>
                <td className="px-4 py-2">6.0 mm</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-medium text-slate-800">Above 1 kg / L</td>
                <td className="px-4 py-2">A &gt; 500 cm²</td>
                <td className="px-4 py-2 font-bold text-[#159a68]">6.0 mm</td>
                <td className="px-4 py-2">8.0 mm</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
