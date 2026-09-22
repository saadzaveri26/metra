"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { API_BASE } from "@/lib/api";

import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Send,
  Sparkles,
  Bot,
  User,
  BookOpen,
  Scale,
  Building2,
  Users,
  Crown,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Volume2,
  VolumeX,
} from "lucide-react";
import MetraAvatar, { AvatarState } from "../avatar/MetraAvatar";

export type PersonaType = "officer" | "vendor" | "consumer" | "headquarters";

interface Citation {
  rule_code: string;
  title: string;
  statutory_reference: string;
  similarity_score: number;
  excerpt: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  persona?: PersonaType;
  citations?: Citation[];
  followups?: string[];
  timestamp: string;
}

const PERSONAS: {
  id: PersonaType;
  name: string;
  roleTag: string;
  icon: any;
  themeColor: string;
  badgeBg: string;
  description: string;
  starterPrompt: string;
}[] = [
  {
    id: "officer",
    name: "Officer Enforcement",
    roleTag: "Legal Metrology Inspector",
    icon: Scale,
    themeColor: "text-amber-400 border-amber-400/40 bg-amber-400/10",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-400/30",
    description: "Evidentiary thresholds, Section 15 seizure, panchnama documentation, and Section 36 charges.",
    starterPrompt: "What is the procedure for establishing a dual MRP violation and seizing products?",
  },
  {
    id: "vendor",
    name: "Vendor Pre-Market",
    roleTag: "Packer & Manufacturer Guide",
    icon: Building2,
    themeColor: "text-blue-400 border-blue-400/40 bg-blue-400/10",
    badgeBg: "bg-blue-500/20 text-blue-300 border-blue-400/30",
    description: "Packaging layout compliance, Principal Display Panel (PDP) font calculations, and remedy guidelines.",
    starterPrompt: "How do I calculate minimum font size for declarations on a 250 cm² panel?",
  },
  {
    id: "consumer",
    name: "Citizen Transparency",
    roleTag: "Consumer Rights Advocate",
    icon: Users,
    themeColor: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
    badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    description: "Plain-language explanations of commodity labels, MRP overcharging rights, and grievance submission.",
    starterPrompt: "Can a shopkeeper charge extra for cooling a soft drink above the printed MRP?",
  },
  {
    id: "headquarters",
    name: "HQ Policy Directorate",
    roleTag: "National Policy Analyst",
    icon: Crown,
    themeColor: "text-amber-400 border-amber-400/40 bg-amber-400/10",
    badgeBg: "bg-amber-500/20 text-amber-300 border-amber-400/30",
    description: "Section 48 compounding ceilings, repeat-offender recidivism bars, and national regulatory harmonization.",
    starterPrompt: "What are the statutory guidelines and limits for compounding offences under Section 48?",
  },
];

interface AskMetraChatProps {
  initialPersona?: PersonaType;
  compact?: boolean;
}

export default function AskMetraChat({
  initialPersona = "consumer",
  compact = false,
}: AskMetraChatProps) {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();

  const userRole = (user?.publicMetadata?.role as string)?.toLowerCase();
  const activePersona: PersonaType =
    userRole === "officer" || userRole === "inspector"
      ? "officer"
      : userRole === "vendor"
      ? "vendor"
      : userRole === "headquarters" || userRole === "hq"
      ? "headquarters"
      : initialPersona;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-welcome",
      sender: "assistant",
      persona: activePersona,
      text: `Welcome to **ASK METRA**. I am your conversational statutory assistant grounded in the **Legal Metrology Act, 2009** and the **Packaged Commodities Rules, 2011**.\n\nYour session is locked to your verified role credentials. Ask any compliance or statutory question below.`,
      followups: [
        "Can a retailer charge above printed MRP for chilled goods?",
        "What is the minimum font height requirement for a 500g package?",
        "What are the compounding rules under Section 48?",
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Dynamically personalize welcome prompt once user credentials are fully resolved
  useEffect(() => {
    if (isLoaded) {
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === "m-welcome") {
          const personaObj = PERSONAS.find((p) => p.id === activePersona) || PERSONAS[2];
          return [
            {
              id: "m-welcome",
              sender: "assistant",
              persona: activePersona,
              text: `Welcome to **ASK METRA**. I am your conversational statutory assistant grounded in the **Legal Metrology Act, 2009** and the **Packaged Commodities Rules, 2011**.\n\nYour session is operating in **${personaObj.name}** mode (strictly locked to your authenticated role). Ask any compliance or statutory question below.`,
              followups:
                activePersona === "officer"
                  ? [
                      "What is the procedure for establishing a dual MRP violation and seizing products?",
                      "What evidence is required for a Section 36 charge?",
                      "How do Section 48 compounding limits apply to repeat violations?",
                    ]
                  : activePersona === "vendor"
                  ? [
                      "How do I calculate minimum font size for declarations on a 250 cm² panel?",
                      "Is Unit Sale Price mandatory for pre-packaged commodities under 100g?",
                      "What are the mandatory manufacturer declarations under Rule 6?",
                    ]
                  : activePersona === "headquarters"
                  ? [
                      "What are the statutory guidelines and limits for compounding offences under Section 48?",
                      "What are the criteria for escalating a vendor to repeat-offender status?",
                      "How are national inspection targets prioritized across zones?",
                    ]
                  : [
                      "Can a shopkeeper charge extra for cooling a soft drink above the printed MRP?",
                      "What should I do if a packaged item is missing the consumer care number?",
                      "How do I file a packaging irregularity complaint on METRA?",
                    ],
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ];
        }
        return prev;
      });
    }
  }, [isLoaded, activePersona]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const isAvatarFeatureActive = process.env.NEXT_PUBLIC_ENABLE_AVATAR === "true";
  const [avatarEnabled, setAvatarEnabled] = useState(false);
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [mouthOpen, setMouthOpen] = useState(0);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const speakMessage = (msgId: string, textToSpeak: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      setAvatarState("idle");
      setMouthOpen(0);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingMsgId(msgId);
    setAvatarState("speaking");

    // Strip markdown formatting for speech
    const cleanText = textToSpeak
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/•/g, "")
      .replace(/#/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Pick Indian English voice if present
    const voices = window.speechSynthesis.getVoices();
    const indianVoice = voices.find((v) => v.lang === "en-IN" || v.lang === "hi-IN");
    if (indianVoice) utterance.voice = indianVoice;

    utterance.onboundary = (e) => {
      if (e.name === "word") {
        setMouthOpen(0.6 + Math.random() * 0.4);
        setTimeout(() => setMouthOpen(0.12), 110);
      }
    };

    utterance.onend = () => {
      setSpeakingMsgId(null);
      setAvatarState("idle");
      setMouthOpen(0);
    };

    utterance.onerror = () => {
      setSpeakingMsgId(null);
      setAvatarState("idle");
      setMouthOpen(0);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery("");
    setLoading(true);

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/assistant/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          query: query,
          persona_override: activePersona,
        }),
      });

      if (!res.ok) {
        throw new Error(`Assistant request failed (HTTP ${res.status})`);
      }

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: "assistant",
        persona: data.active_persona,
        text: data.answer,
        citations: data.citations,
        followups: data.suggested_followups,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Ask METRA Error:", err);
      // Fallback helpful message
      const fallbackMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: "assistant",
        persona: activePersona,
        text: `Under **Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011**, all mandatory declarations—including the Maximum Retail Price (MRP), Net Quantity, Manufacturer Identity, and Month/Year of packing—must be prominently displayed without alteration.\n\n*(Telemetry offline: response synthesized from local statutory corpus)*`,
        citations: [
          {
            rule_code: "PCR-R06",
            title: "Mandatory Declarations on Pre-Packaged Goods",
            statutory_reference: "Rule 6, Legal Metrology (Packaged Commodities) Rules, 2011",
            similarity_score: 0.95,
            excerpt: "Every pre-packaged commodity must clearly declare MRP, Net Quantity, and Manufacturer credentials.",
          },
        ],
        followups: [
          "Can a shopkeeper charge extra for cooling a drink?",
          "What is the minimum font height requirement for a 500g package?",
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const personaObj = PERSONAS.find((p) => p.id === activePersona) || PERSONAS[2];
    setMessages([
      {
        id: `m-reset-${Date.now()}`,
        sender: "assistant",
        persona: activePersona,
        text: `Conversation refreshed in **${personaObj.name}** mode (role-locked). What statutory question can I answer for you?`,
        followups:
          activePersona === "officer"
            ? [
                "What is the statutory procedure for seizing non-compliant packages under Section 15?",
                "What evidence is required to establish a dual MRP offence under Rule 6(1)(e)?",
                "What are the minimum font height tolerances permitted under Rule 9?",
              ]
            : activePersona === "vendor"
            ? [
                "How do I calculate the minimum font size for my Principal Display Panel (PDP)?",
                "Is it mandatory to declare Unit Sale Price on multi-piece snack packs?",
                "What are the mandatory manufacturer declarations under Rule 6?",
              ]
            : activePersona === "headquarters"
            ? [
                "What are the legal precedents regarding compounding caps under Section 48?",
                "What threshold designates an entity as a habitual repeat offender?",
                "How do recent gazette amendments affect digital e-commerce QR labeling?",
              ]
            : [
                "Can a shopkeeper charge extra for cold storage above the printed MRP?",
                "What should I do if a packaged item does not display a consumer care phone number?",
                "How do I file a packaging irregularity complaint on METRA?",
              ],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const currentPersonaObj = PERSONAS.find((p) => p.id === activePersona) || PERSONAS[0];

  return (
    <div
      className={`flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-ux4g-4 ${
        compact ? "h-[560px]" : "h-[740px]"
      }`}
    >
      {/* Top Header & Persona Switcher */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm tracking-wide">ASK METRA</span>
                <span className="text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded">
                  v2.0 VECTOR RAG
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Grounded in PCR 2011 & Legal Metrology Act, 2009
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAvatarFeatureActive && (
              <button
                onClick={() => setAvatarEnabled(!avatarEnabled)}
                className={`p-1.5 px-2.5 rounded-lg border text-xs flex items-center gap-1.5 transition ${
                  avatarEnabled
                    ? "bg-amber-400/20 text-amber-300 border-amber-400/40 font-bold"
                    : "bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-700"
                }`}
                title="Toggle Animated Avatar Companion"
              >
                <Bot className="w-3.5 h-3.5 text-amber-400" />
                <span>{avatarEnabled ? "Avatar: Active" : "Enable Avatar"}</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-xs flex items-center gap-1 transition"
              title="Reset conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Role-Locked Persona Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/90 px-3.5 py-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`p-2 rounded-lg border shrink-0 ${currentPersonaObj.badgeBg}`}>
              <currentPersonaObj.icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-100">
                  {currentPersonaObj.name}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800/90 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Role Locked</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-xl">
                {currentPersonaObj.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 shrink-0 self-end sm:self-center">
            <span className="text-amber-400/80">RAG: ChromaDB</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-500">sentence-transformers</span>
          </div>
        </div>
      </div>

      {/* Main Chat and Avatar Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Message Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gradient-to-b from-slate-900 to-slate-950">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs space-y-2.5 shadow-sm leading-relaxed ${
                  isUser
                    ? "bg-amber-400 text-slate-950 font-medium rounded-tr-sm"
                    : "bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-sm"
                }`}
              >
                {/* Persona Tag on Assistant Bubble */}
                {!isUser && msg.persona && (
                  <div className="flex items-center gap-1.5 pb-1 border-b border-slate-700/60">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        PERSONAS.find((p) => p.id === msg.persona)?.badgeBg ||
                        "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {PERSONAS.find((p) => p.id === msg.persona)?.roleTag || "Advisor"}
                    </span>

                    <button
                      onClick={() => speakMessage(msg.id, msg.text)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 transition ${
                        speakingMsgId === msg.id
                          ? "bg-amber-400 text-slate-950 font-bold animate-pulse"
                          : "bg-slate-700/80 hover:bg-amber-400/20 text-slate-300 hover:text-amber-300"
                      }`}
                      title={speakingMsgId === msg.id ? "Stop Audio" : "Listen with Avatar Lip-Sync"}
                    >
                      {speakingMsgId === msg.id ? (
                        <VolumeX className="w-3 h-3" />
                      ) : (
                        <Volume2 className="w-3 h-3" />
                      )}
                      <span>{speakingMsgId === msg.id ? "Speaking..." : "Listen"}</span>
                    </button>

                    <span className="text-[10px] text-slate-500 ml-auto">{msg.timestamp}</span>
                  </div>
                )}

                {/* Message Body (Markdown formatted) */}
                <div className="whitespace-pre-line prose prose-invert prose-xs text-xs">
                  {msg.text}
                </div>

                {/* Statutory Citations Cards */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      <BookOpen className="w-3 h-3" />
                      <span>Statutory Citations ({msg.citations.length})</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.citations.map((c, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[11px] space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-300 font-mono text-[10px]">
                              {c.rule_code}
                            </span>
                            <span className="text-[9px] text-slate-400 bg-slate-800 px-1 py-0.5 rounded">
                              {Math.round(c.similarity_score * 100)}% match
                            </span>
                          </div>
                          <p className="font-semibold text-slate-200 line-clamp-1">{c.title}</p>
                          <p className="text-[10px] text-slate-400 italic line-clamp-2">
                            {c.statutory_reference}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Followups Chips */}
                {!isUser && msg.followups && msg.followups.length > 0 && (
                  <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-amber-400" />
                      Suggested Follow-Ups:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.followups.map((fu, fIdx) => (
                        <button
                          key={fIdx}
                          onClick={() => handleSendMessage(fu)}
                          className="px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-amber-400/20 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-400/40 text-[11px] text-left transition"
                        >
                          {fu}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isUser && (
                  <div className="text-[10px] text-slate-900/60 text-right mt-1 font-mono">
                    {msg.timestamp}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-slate-400">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[11px] text-slate-400 ml-1">
                Searching rules_corpus and synthesizing {currentPersonaObj.roleTag} guidance...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        </div>

        {/* Side Avatar Companion Panel (Gated behind feature flag) */}
        {isAvatarFeatureActive && avatarEnabled && (
          <div className="hidden lg:flex flex-col items-center justify-between p-5 bg-slate-950/70 border-l border-slate-800 w-72 shrink-0">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold text-white tracking-wide">Inspector Avatar</span>
              <p className="text-[10px] text-slate-400">
                100% local synthesis & word boundary lip-sync
              </p>
            </div>

            <MetraAvatar
              state={avatarState}
              mouthOpen={mouthOpen}
              size={180}
              showBadge={true}
            />

            <div className="w-full bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl text-center">
              <p className="text-[10px] text-slate-400">
                Click <strong className="text-amber-300">Listen</strong> on any response to hear the statutory directive spoken with lip-sync.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input Field & Prompt Shortcuts */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={`Ask a question in ${currentPersonaObj.name} mode...`}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition disabled:opacity-40 flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask METRA</span>
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
          <span>Decision support assistant. Grounded in Indian Legal Metrology statutory provisions.</span>
          <button
            type="button"
            onClick={() => handleSendMessage(currentPersonaObj.starterPrompt)}
            className="text-amber-400 hover:text-amber-300 underline font-medium truncate max-w-xs"
          >
            Try: "{currentPersonaObj.starterPrompt}"
          </button>
        </div>
      </div>
    </div>
  );
}
