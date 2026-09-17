import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import AskMetraChat from "@/components/assistant/AskMetraChat";
import {
  Scale,
  Building2,
  Users,
  Crown,
  Sparkles,
  ArrowLeft,
  BookOpen,
  LayoutDashboard,
} from "lucide-react";

export const metadata = {
  title: "ASK METRA | Conversational Statutory Assistant",
  description:
    "Groundbreaking Legal Metrology Vector RAG assistant with role-locked statutory intelligence for Inspector, Vendor, Consumer, and Directorate channels.",
};

export default async function AskMetraPage() {
  const { sessionClaims, userId } = await auth();
  const role = (
    (sessionClaims as any)?.role ||
    (sessionClaims?.metadata as any)?.role ||
    (sessionClaims?.publicMetadata as any)?.role ||
    "consumer"
  ).toLowerCase();

  const dashboardHref =
    role === "officer" || role === "inspector"
      ? "/officer"
      : role === "vendor"
      ? "/vendor"
      : role === "headquarters" || role === "hq"
      ? "/headquarters"
      : "/consumer";

  const roleTitle =
    role === "officer" || role === "inspector"
      ? "Officer Dashboard"
      : role === "vendor"
      ? "Vendor Portal"
      : role === "headquarters" || role === "hq"
      ? "HQ Directorate"
      : "Consumer Portal";

  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 flex flex-col">
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 px-6 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-slate-300 hover:text-white transition"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center border border-amber-400/30">
              <Image
                src="/METRA-closeup.png"
                alt="METRA Emblem"
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <span className="font-bold text-lg text-white tracking-wider">METRA</span>
          </Link>
          <span className="text-slate-600">/</span>
          <div className="flex items-center gap-1.5 text-xs font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/20 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ASK METRA ASSISTANT</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {userId && (
            <Link
              href={dashboardHref}
              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition font-medium"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{roleTitle}</span>
            </Link>
          )}
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Portal</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Intro Hero Strip */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/60 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  ASK METRA — Statutory Compliance Assistant
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
                A conversational intelligence assistant grounded in the actual text of the{" "}
                <strong className="text-slate-200">Legal Metrology Act, 2009</strong> and the{" "}
                <strong className="text-slate-200">Packaged Commodities Rules, 2011</strong>. Operates strictly within your authenticated role credentials to provide statutory evidentiary standards, pre-market packaging checks, citizen transparency, and directorate policy insights.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-xs flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Vector Corpus: <strong>ChromaDB</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* The Universal Assistant Chat Component */}
        <AskMetraChat />

        {/* Persona Capabilities Grid */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Statutory Scope Across Operational Roles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <Scale className="w-4 h-4" />
                <span>Officer Enforcement</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Provides statutory seizure procedures under Section 15, panchnama documentation standards, and evidentiary thresholds for Section 36 charges.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-300">
                <Building2 className="w-4 h-4" />
                <span>Vendor Pre-Market</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Assists packers and FMCG brand owners with pre-market packaging checks, Rule 9 font height formulas, and Unit Sale Price formatting.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <Users className="w-4 h-4" />
                <span>Citizen Transparency</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Empowers citizens with plain-language explanations of MRP overcharging, dual packaging prohibitions, and National Consumer Helpline (1915) reporting.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <Crown className="w-4 h-4" />
                <span>HQ Directorate</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Offers executive analysis on Section 48 compounding ceilings, three-year recidivism bars, and national regulatory policy harmonization.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
