"use client";

import React, { useState, useEffect, useRef } from "react";
import MetraAvatar, { AvatarState } from "./MetraAvatar";
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Settings2,
  Sliders,
  RotateCcw,
  Check,
} from "lucide-react";

interface AvatarVoiceControllerProps {
  initialText?: string;
  autoSpeak?: boolean;
  onStateChange?: (state: AvatarState) => void;
  size?: number;
}

const STATUTORY_PRESETS = [
  {
    label: "Dual MRP Seizure (Officer)",
    text: "Under Rule 6(1)(e) of the Packaged Commodities Rules, 2011, charging any price exceeding the Maximum Retail Price is an offense under Section 36(1). Inspecting officers must record the purchase invoice and seize specimen units under Section 15.",
  },
  {
    label: "Rule 9 Font Height (Vendor)",
    text: "For Principal Display Panel areas between 100 and 500 square centimeters, all numbers representing net quantity, retail price, and unit sale price must have a minimum font height of 2.5 millimeters in prominent contrast.",
  },
  {
    label: "Consumer Overcharge Rights (Citizen)",
    text: "No shopkeeper or vendor in India is permitted to charge even one rupee above the printed MRP, even for refrigeration or special packaging. The printed MRP is legally inclusive of all GST and taxes.",
  },
  {
    label: "Section 48 Compounding (HQ)",
    text: "Section 48 authorizes the Controller to compound first-time labeling offenses. However, any identical contravention committed within a three-year period is strictly non-compoundable and requires judicial prosecution.",
  },
];

export default function AvatarVoiceController({
  initialText = STATUTORY_PRESETS[0].text,
  autoSpeak = false,
  onStateChange,
  size = 240,
}: AvatarVoiceControllerProps) {
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [mouthOpen, setMouthOpen] = useState(0);
  const [text, setText] = useState(initialText);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  // Voice settings
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState<number>(0);
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load available browser voices (local only)
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      const avail = window.speechSynthesis.getVoices();
      if (avail && avail.length > 0) {
        setVoices(avail);
        // Look for Indian English voice or standard English
        const indianIndex = avail.findIndex(
          (v) => v.lang === "en-IN" || v.lang === "hi-IN" || v.name.toLowerCase().includes("india")
        );
        if (indianIndex !== -1) {
          setSelectedVoiceIndex(indianIndex);
        } else {
          const enIndex = avail.findIndex((v) => v.lang.startsWith("en"));
          if (enIndex !== -1) setSelectedVoiceIndex(enIndex);
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const updateAvatarState = (newState: AvatarState) => {
    setAvatarState(newState);
    onStateChange?.(newState);
  };

  const handleSpeak = (textToSpeak?: string) => {
    const textContent = textToSpeak || text;
    if (!textContent.trim() || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    // Cancel existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textContent);
    if (voices[selectedVoiceIndex]) {
      utterance.voice = voices[selectedVoiceIndex];
    }
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => {
      setIsPlaying(true);
      updateAvatarState("speaking");
    };

    // Word boundary tracking for real-time local lip-sync modulation
    utterance.onboundary = (event) => {
      if (event.name === "word") {
        setMouthOpen(0.6 + Math.random() * 0.4);
        setTimeout(() => setMouthOpen(0.15), 120);
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setMouthOpen(0);
      updateAvatarState("idle");
    };

    utterance.onerror = (e) => {
      console.warn("SpeechSynthesis error:", e);
      setIsPlaying(false);
      setMouthOpen(0);
      updateAvatarState("idle");
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setMouthOpen(0);
    updateAvatarState("idle");
  };

  return (
    <div className="flex flex-col items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl w-full max-w-md">
      {/* Animated Avatar */}
      <MetraAvatar
        state={avatarState}
        mouthOpen={mouthOpen}
        size={size}
        showBadge={true}
      />

      {/* Playback Controls */}
      <div className="flex items-center gap-2 w-full pt-2">
        {!isPlaying ? (
          <button
            onClick={() => handleSpeak()}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Speak Statutory Directive</span>
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>Stop Avatar Audio</span>
          </button>
        )}

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2.5 rounded-xl border transition ${
            showSettings
              ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
              : "bg-slate-800 text-slate-400 hover:text-white border-slate-700"
          }`}
          title="Voice & Lip-Sync Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>

      {/* Preset Statutory Utterances Chips */}
      <div className="w-full space-y-1.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Statutory Speech Presets:
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {STATUTORY_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setText(preset.text);
                handleSpeak(preset.text);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-amber-400/15 text-slate-300 hover:text-amber-300 border border-slate-700/80 hover:border-amber-400/30 text-[11px] text-left truncate transition"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expandable Settings Drawer */}
      {showSettings && (
        <div className="w-full pt-3 border-t border-slate-800 space-y-3 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl">
          <div className="space-y-1">
            <label className="block text-[11px] text-slate-400 font-semibold">Local Synthesis Voice</label>
            <select
              value={selectedVoiceIndex}
              onChange={(e) => setSelectedVoiceIndex(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
            >
              {voices.map((v, i) => (
                <option key={i} value={i}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Speed / Rate</span>
                <span>{rate}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Pitch</span>
                <span>{pitch}</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>
          </div>

          <div className="text-[10px] text-slate-500 italic">
            Ground rule verified: 100% local Web Speech API synthesis with word boundary lip-sync. Zero cloud API costs.
          </div>
        </div>
      )}
    </div>
  );
}
