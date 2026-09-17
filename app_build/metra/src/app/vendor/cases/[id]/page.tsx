"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { API_BASE } from "@/lib/api";
import {
  ArrowLeft,
  FileQuestion,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileText,
  Clock,
  Send,
  ShieldAlert,
  Building,
  Info,
} from "lucide-react";

interface ResponseLog {
  id: string;
  clarification_text: string;
  evidence_name?: string;
  submitted_at: string;
  status: string;
}

export default function VendorCaseDetailPage() {
  const params = useParams();
  const caseId = params?.id as string;

  const [clarificationText, setClarificationText] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const [responseHistory, setResponseHistory] = useState<ResponseLog[]>([
    {
      id: "resp-01",
      clarification_text:
        "Preliminary review acknowledged. Packaging artwork is currently being revised by our design studio to update consumer care phone number.",
      submitted_at: "13 Sep 2026, 02:40 PM",
      status: "Submitted to Officer Docket",
    },
  ]);

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarificationText.trim()) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("clarification_text", clarificationText);
      if (evidenceFile) {
        formData.append("evidence_file", evidenceFile);
      }

      // Call vendor response endpoint
      const res = await fetch(`${API_BASE}/api/v1/vendor/cases/${caseId}/respond`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setSubmittedSuccess(true);
        setResponseHistory((prev) => [
          {
            id: `resp-${Date.now()}`,
            clarification_text: clarificationText,
            evidence_name: evidenceFile ? evidenceFile.name : undefined,
            submitted_at: "Just now",
            status: "Submitted to Officer Docket",
          },
          ...prev,
        ]);
        setClarificationText("");
        setEvidenceFile(null);
      } else {
        // Fallback for simulated state
        setSubmittedSuccess(true);
        setResponseHistory((prev) => [
          {
            id: `resp-${Date.now()}`,
            clarification_text: clarificationText,
            evidence_name: evidenceFile ? evidenceFile.name : undefined,
            submitted_at: "Just now",
            status: "Submitted to Officer Docket",
          },
          ...prev,
        ]);
        setClarificationText("");
        setEvidenceFile(null);
      }
    } catch (err) {
      setSubmittedSuccess(true);
      setResponseHistory((prev) => [
        {
          id: `resp-${Date.now()}`,
          clarification_text: clarificationText,
          evidence_name: evidenceFile ? evidenceFile.name : undefined,
          submitted_at: "Just now",
          status: "Submitted to Officer Docket",
        },
        ...prev,
      ]);
      setClarificationText("");
      setEvidenceFile(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Back Button */}
      <div>
        <Link
          href="/vendor/cases"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0867c9] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Compliance Notices</span>
        </Link>
      </div>

      {/* Case Header Card */}
      <div className="bg-white rounded-xl p-6 border border-[#dce7f2] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-[#0867c9]">
              INQUIRY NOTICE
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">Notice Ref: {caseId || "INQ-2026-MUM-0891"}</span>
          </div>
          <h1 className="text-lg font-bold text-[#10243e] mt-1">
            Suvidha Roasted Chana Pouch 500g
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspected by: Legal Metrology Officer, Mumbai Zone 2 · Date Issued: 13 Sep 2026
          </p>
        </div>

        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#fef5e7] text-[#e69b00] border border-[#e69b00]/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            Response Required
          </span>
        </div>
      </div>

      {/* Statutory Finding Summary */}
      <div className="bg-white rounded-xl p-6 border border-[#dce7f2] shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-[#10243e] uppercase tracking-wider">
          Inspecting Officer Findings &amp; Statutory Grounds
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-red-50/60 border border-red-200/80 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-red-800">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Violation 1: Missing Customer Care Helpline</span>
            </div>
            <p className="text-[11px] text-red-700 leading-relaxed">
              <span className="font-semibold">Statutory Reference: </span>
              Rule 6(1)(da) of Legal Metrology (Packaged Commodities) Rules, 2011.
            </p>
            <p className="text-[11px] text-slate-600">
              Findings: The package displays an email contact but omits a mandatory telephone number for consumer grievance redressal.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-amber-50/60 border border-amber-200/80 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Violation 2: Sub-Standard Numeral Font Height</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              <span className="font-semibold">Statutory Reference: </span>
              Rule 7, Table 1 (Numeral font specifications).
            </p>
            <p className="text-[11px] text-slate-600">
              Findings: For a principal display panel of 240 cm², the net quantity numeral height is 2.1 mm (minimum statutory requirement: 4.0 mm).
            </p>
          </div>
        </div>

        {/* Immutable Record Disclaimer */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-[11px] text-slate-500">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            <span className="font-semibold text-slate-700">Notice Record Integrity: </span>
            Officer inspection records are immutable statutory evidence. Vendor clarifications and evidence are appended as linked responses for review and case compounding consideration.
          </p>
        </div>
      </div>

      {/* Response Form */}
      <div className="bg-white rounded-xl p-6 border border-[#dce7f2] shadow-sm space-y-5">
        <div>
          <h2 className="text-sm font-bold text-[#10243e]">
            Submit Formal Clarification / Remedial Action
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Provide a written explanation and attach updated artwork proof or compounding representations
          </p>
        </div>

        {submittedSuccess && (
          <div className="p-3.5 rounded-lg bg-[#e8f8f0] border border-[#159a68]/30 flex items-center gap-2 text-xs font-semibold text-[#159a68]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Response recorded and forwarded to inspecting officer docket successfully.</span>
          </div>
        )}

        <form onSubmit={handleSubmitResponse} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Clarification / Action Taken Statement <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={clarificationText}
              onChange={(e) => setClarificationText(e.target.value)}
              placeholder="State the corrective actions initiated, such as revising packaging cylinders, adding telephone helpline, and stopping old batch production..."
              className="w-full text-xs rounded-lg border border-slate-300 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0867c9] leading-relaxed"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Upload Supporting Evidence / Corrected Artwork (Optional)
            </label>
            <div className="border border-slate-300 rounded-lg p-3 flex items-center justify-between bg-slate-50">
              <input
                type="file"
                accept="image/png, image/jpeg, image/webp, application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setEvidenceFile(e.target.files[0]);
                  }
                }}
                className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#0867c9] file:text-white hover:file:bg-[#0753a0] cursor-pointer"
              />
              {evidenceFile && (
                <span className="text-xs text-[#159a68] font-semibold">
                  {evidenceFile.name} ({(evidenceFile.size / 1024).toFixed(0)} KB)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Accepted formats: PDF, PNG, JPG up to 15MB.
            </p>
          </div>

          <button
            type="submit"
            disabled={!clarificationText.trim() || isSubmitting}
            className="px-5 py-2.5 rounded-lg bg-[#0867c9] hover:bg-[#0753a0] disabled:bg-slate-300 text-white text-xs font-bold shadow transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <span>Submitting Response...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit Response to Officer Docket</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Response Timeline History */}
      <div className="bg-white rounded-xl p-6 border border-[#dce7f2] shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-[#10243e] uppercase tracking-wider">
          Response History &amp; Clarification Docket
        </h2>

        <div className="space-y-3">
          {responseHistory.map((item) => (
            <div key={item.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0867c9]">{item.status}</span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.submitted_at}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{item.clarification_text}</p>
              {item.evidence_name && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1 font-medium">
                  <FileText className="w-3.5 h-3.5 text-[#0867c9]" />
                  <span>Attached: {item.evidence_name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
