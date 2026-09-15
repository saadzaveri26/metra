import Link from "next/link";
import Image from "next/image";
import AvatarVoiceController from "@/components/avatar/AvatarVoiceController";
import {
  Sparkles,
  ArrowLeft,
  Volume2,
  ShieldCheck,
  Cpu,
  Bot,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "Inspector Avatar Studio | METRA",
  description: "Local-only state-machine animated Avatar with speech boundary lip-sync for Legal Metrology guidance.",
};

export default function AvatarPage() {
  return (
    <div className="min-h-screen bg-[#070d18] text-slate-100 flex flex-col">
      {/* Header */}
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
            href="/"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Title Strip */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-sm">
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
      </main>
    </div>
  );
}
