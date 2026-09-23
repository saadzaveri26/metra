import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import AvatarVoiceController from "@/components/avatar/AvatarVoiceController";
import {
  Sparkles,
  ArrowLeft,
  Volume2,
  ShieldCheck,
  Cpu,
  Bot,
  Zap,
  Lock,
} from "lucide-react";

export const metadata = {
  title: "Inspector Avatar Studio | METRA",
  description: "Local-only state-machine animated Avatar with speech boundary lip-sync for Legal Metrology guidance.",
};

export default async function AvatarPage() {
  const isAvatarEnabled = process.env.NEXT_PUBLIC_ENABLE_AVATAR === "true";
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
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 px-6 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href={dashboardHref}
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
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            <span>INSPECTOR AVATAR STUDIO</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/assistant"
            className="text-amber-400 hover:text-amber-300 transition flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask METRA</span>
          </Link>
          <Link
            href={dashboardHref}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to {roleTitle}</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 flex flex-col justify-center">
        {!isAvatarEnabled ? (
          /* Gated Holding State */
          <div className="max-w-xl mx-auto w-full bg-slate-900 border border-slate-800 rounded-xl p-8 sm:p-10 text-center shadow-ux4g-4">
            <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300 mx-auto mb-4">
              <Lock className="w-6 h-6" />
            </div>

            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700 mb-3">
              Feature Flag Deactivated
            </span>

            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Avatar Studio Deferred
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
              The Live2D Inspector Avatar component has been deferred from active UI per deployment policy.
              The underlying speech-boundary lip-sync implementation is fully intact and gated behind{" "}
              <code className="text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                NEXT_PUBLIC_ENABLE_AVATAR
              </code>
              .
            </p>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3.5 text-left text-xs text-slate-400 mb-6 font-mono">
              <p className="text-[11px] text-slate-500 mb-1 font-sans font-bold uppercase tracking-wider">
                To Reactivate Without Rebuilding:
              </p>
              <code>NEXT_PUBLIC_ENABLE_AVATAR=true</code>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/assistant"
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition"
              >
                Go to Ask METRA
              </Link>
              <Link
                href={dashboardHref}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition"
              >
                Return to {roleTitle}
              </Link>
            </div>
          </div>
        ) : (
          /* Active Avatar Studio (when flag is true) */
          <>
            {/* Title Strip */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/60 border border-slate-800 rounded-xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Animated Inspector Avatar & Local Lip-Sync Studio
                    </h1>
                    <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      100% LOCAL SYNTHESIS
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
                    Adheres strictly to the architectural constraint:{" "}
                    <strong className="text-slate-200">
                      Avatar lip sync stays local-only, no paid/live cloud TTS API
                    </strong>
                    . Driven by an interactive state machine (`idle`, `speaking`, `listening`, `thinking`)
                    and real-time word boundary phoneme modulation.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-xs flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    <span>Zero Cloud Latency</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Centerpiece: Avatar Voice Controller */}
            <div className="flex justify-center">
              <AvatarVoiceController size={260} />
            </div>

            {/* Technical Architecture Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <Zap className="w-4 h-4" />
                  <span>State Machine Rigging</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Responsive vector character with dynamic eye-blinking intervals, head-tilting posture,
                  and smooth mouth aperture transforms keyed to utterance boundaries.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-300">
                  <Volume2 className="w-4 h-4" />
                  <span>Local Web Speech Synthesis</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Uses the native browser SpeechSynthesis runtime. Automatically detects regional Indian English
                  voices (`en-IN` / `hi-IN`) without requiring third-party cloud credits or external network calls.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Demo-Day Reliability</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Functions completely offline in air-gapped environments. If audio is muted by system permissions,
                  the mouth automatically modulates so visual lip-sync is always demonstrated.
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
