"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Clock,
  ShieldCheck,
  Building2,
  FileCheck,
  RefreshCw,
  LogOut,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function OfficerPendingPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const publicMeta = (user?.publicMetadata || {}) as {
    role?: string;
    inspector_verified?: boolean;
    status?: string;
    government_id?: string;
    state_region?: string;
    designation?: string;
    applied_at?: string;
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMessage(null);
    try {
      if (user) {
        await user.reload();
      }
      const updatedVerified = (user?.publicMetadata as any)?.inspector_verified;
      const updatedRole = (user?.publicMetadata as any)?.role;

      if (updatedVerified || updatedRole === "officer") {
        setStatusMessage("Authorization verified! Redirecting to Officer Enforcement Console...");
        setTimeout(() => {
          window.location.href = "/officer";
        }, 1200);
      } else {
        setStatusMessage("Application is currently pending review by Legal Metrology Directorate.");
      }
    } catch (err: any) {
      console.error("Status refresh error:", err);
      setStatusMessage("Unable to refresh status. Please try again in a moment.");
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirectUrl: "/sign-in" });
  };

  return (
    <div className="min-h-screen bg-[#f7faff] text-[#10243e] flex flex-col">
      {/* HEADER */}
      <header className="bg-white/95 border-b border-[#dce7f2]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <nav className="h-[72px] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-[40px] h-[40px] rounded-[10px] overflow-hidden shadow-[0_4px_12px_rgba(8,103,201,0.2)]">
                <Image
                  src="/METRA-closeup.png"
                  alt="METRA"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div>
                <strong className="text-[18px] font-bold tracking-[0.08em] block leading-tight">
                  METRA
                </strong>
                <span className="block text-[#62738a] text-[10px] tracking-[0.03em] uppercase">
                  Metrology Enforcement &amp; Traceability
                </span>
              </div>
            </Link>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-[#62738a] hover:text-[#c84c54] transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[560px] bg-white border border-[#e6d8b8] rounded-xl p-8 sm:p-10 shadow-ux4g-3">
          {/* BADGE */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[12px] font-bold bg-[#faf3e4] text-[#8a5d00] border border-[#e6d8b8] mb-6">
            <Clock className="w-3.5 h-3.5 animate-pulse text-[#8a5d00]" />
            <span>HQ Verification Pending</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#10243e] mb-3">
            Officer Credentials Under Review
          </h1>

          <p className="text-[14px] text-[#556987] leading-relaxed mb-6">
            Your application for Legal Metrology enforcement credentials has been submitted to the
            National Directorate queue. Field authority, statutory inspection tools, and seizure logging
            will be unlocked upon verification.
          </p>

          {/* APPLICATION DETAILS CARD */}
          <div className="bg-[#fcfdfa] border border-[#e8ece5] rounded-lg p-5 mb-6 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#7a8a9a] mb-1">
              Registered Application Details
            </div>

            <div className="flex items-center justify-between text-[13px] py-1 border-b border-[#f0f4ee]">
              <span className="text-[#62738a] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#8a5d00]" />
                Government ID:
              </span>
              <span className="font-semibold text-[#10243e]">
                {publicMeta.government_id || "Under Processing"}
              </span>
            </div>

            <div className="flex items-center justify-between text-[13px] py-1 border-b border-[#f0f4ee]">
              <span className="text-[#62738a] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#8a5d00]" />
                Jurisdiction / State:
              </span>
              <span className="font-semibold text-[#10243e]">
                {publicMeta.state_region || "Regional Enforcement Directorate"}
              </span>
            </div>

            <div className="flex items-center justify-between text-[13px] py-1 border-b border-[#f0f4ee]">
              <span className="text-[#62738a] flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-[#8a5d00]" />
                Designation:
              </span>
              <span className="font-semibold text-[#10243e]">
                {publicMeta.designation || "Legal Metrology Inspector"}
              </span>
            </div>

            <div className="flex items-center justify-between text-[13px] pt-1">
              <span className="text-[#62738a]">Verification Status:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#faf3e4] text-[#8a5d00] border border-[#e6d8b8]">
                <Clock className="w-3 h-3" />
                Directorate Review
              </span>
            </div>
          </div>

          {/* STATUTORY PROTOCOL CALLOUT */}
          <div className="bg-[#f0f6ff] border border-[#d2e3fc] rounded-[12px] p-4 text-[12.5px] text-[#1a56db] leading-relaxed mb-6 flex gap-3">
            <AlertCircle className="w-4 h-4 text-[#1a56db] shrink-0 mt-0.5" />
            <div>
              <strong>Statutory Protocol Notice:</strong>
              <p className="mt-0.5 text-[#3b66ac]">
                Under Section 15 of the Legal Metrology Act, 2009, statutory search, seizure, and compliance notice
                powers require verified administrative appointment. Verification is typically completed within 24 hours.
              </p>
            </div>
          </div>

          {/* STATUS NOTIFICATION */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-[10px] text-[13px] mb-6 flex items-center gap-2 ${
                statusMessage.includes("verified")
                  ? "bg-[#eafbf1] border border-[#a6e9c4] text-[#0d7844]"
                  : "bg-[#f4f7fa] border border-[#dce7f2] text-[#43566d]"
              }`}
            >
              {statusMessage.includes("verified") ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 shrink-0 text-[#62738a]" />
              )}
              <span>{statusMessage}</span>
            </div>
          )}

          {/* ACTIONS */}
          <div className="space-y-3">
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full py-3 px-4 bg-[#8a5d00] hover:bg-[#724d00] text-white font-bold text-[14px] rounded-[10px] flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
              <span>{checking ? "Checking Directorate Queue..." : "Check Approval Status"}</span>
            </button>

            <Link
              href="/sign-in"
              className="w-full py-2.5 px-4 bg-white border border-[#dce7f2] text-[#43566d] font-bold text-[13px] rounded-[10px] text-center block hover:bg-[#f7faff] transition"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
