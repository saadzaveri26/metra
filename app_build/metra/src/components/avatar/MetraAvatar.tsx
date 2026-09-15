"use client";

import React, { useEffect, useState, useRef } from "react";
import { Volume2, VolumeX, Sparkles, Mic, BrainCircuit } from "lucide-react";

export type AvatarState = "idle" | "speaking" | "listening" | "thinking";
export type VisemeType = "rest" | "aa" | "ee" | "oo" | "mm";

interface MetraAvatarProps {
  state?: AvatarState;
  mouthOpen?: number; // 0.0 (closed) to 1.0 (open)
  viseme?: VisemeType;
  size?: number;
  showBadge?: boolean;
  className?: string;
}

export default function MetraAvatar({
  state = "idle",
  mouthOpen = 0,
  viseme = "rest",
  size = 280,
  showBadge = true,
  className = "",
}: MetraAvatarProps) {
  const [blink, setBlink] = useState(false);
  const [internalMouth, setInternalMouth] = useState(0);
  const [internalState, setInternalState] = useState<AvatarState>(state);
  const animationFrameRef = useRef<number | null>(null);

  // Periodic natural blinking
  useEffect(() => {
    let blinkTimer: NodeJS.Timeout;
    const triggerBlink = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
      const nextDelay = 2500 + Math.random() * 3000;
      blinkTimer = setTimeout(triggerBlink, nextDelay);
    };

    blinkTimer = setTimeout(triggerBlink, 2000);
    return () => clearTimeout(blinkTimer);
  }, []);

  // Update state
  useEffect(() => {
    setInternalState(state);
  }, [state]);

  // Speaking mouth wave animation when in speaking state
  useEffect(() => {
    if (internalState === "speaking") {
      let t = 0;
      const animateMouth = () => {
        t += 0.22;
        // Modulate mouth height between 0.15 and 0.85 using sinusoidal harmonics
        const val = 0.5 + 0.35 * Math.sin(t) + 0.15 * Math.sin(2.3 * t);
        setInternalMouth(Math.max(0.1, Math.min(1.0, val)));
        animationFrameRef.current = requestAnimationFrame(animateMouth);
      };
      animationFrameRef.current = requestAnimationFrame(animateMouth);
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setInternalMouth(mouthOpen);
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [internalState, mouthOpen]);

  // Mouth dimension calculations
  const effectiveMouth = internalState === "speaking" ? internalMouth : mouthOpen;
  const mouthHeight = Math.max(3, effectiveMouth * 16);
  const mouthWidth = 24 + effectiveMouth * 6;

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Dynamic Background Glow based on State */}
      <div
        className={`absolute inset-0 rounded-full blur-2xl opacity-25 transition-all duration-700 ${
          internalState === "speaking"
            ? "bg-amber-400"
            : internalState === "listening"
            ? "bg-emerald-400"
            : internalState === "thinking"
            ? "bg-indigo-400"
            : "bg-blue-500"
        }`}
      />

      {/* SVG Character Illustration with State-Machine Driven Rigging */}
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-2xl overflow-visible transition-transform duration-500"
        style={{
          transform:
            internalState === "listening"
              ? "rotate(-2.5deg) translateY(-2px)"
              : internalState === "speaking"
              ? "translateY(-3px)"
              : "none",
        }}
      >
        <defs>
          <linearGradient id="skinGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f7c8a1" />
            <stop offset="100%" stopColor="#e4a87a" />
          </linearGradient>

          <linearGradient id="uniformGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#132338" />
            <stop offset="100%" stopColor="#0a1524" />
          </linearGradient>

          <linearGradient id="capGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a2e48" />
            <stop offset="100%" stopColor="#0e1b2c" />
          </linearGradient>

          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Officer Shoulders & Uniform */}
        <path
          d="M 35 188 C 45 152, 70 142, 100 142 C 130 142, 155 152, 165 188 Z"
          fill="url(#uniformGrad)"
          stroke="#1e3a5f"
          strokeWidth="1.5"
        />

        {/* Uniform Collar */}
        <polygon points="100,154 86,142 100,165 114,142" fill="#ffffff" opacity="0.9" />
        <polygon points="100,157 93,142 100,165" fill="#e2e8f0" />
        <polygon points="100,165 96,188 104,188" fill="#1e3a5f" />

        {/* Gold Epaulettes */}
        <rect x="42" y="152" width="16" height="5" rx="1.5" fill="url(#goldGrad)" transform="rotate(18, 50, 154)" />
        <rect x="142" y="152" width="16" height="5" rx="1.5" fill="url(#goldGrad)" transform="rotate(-18, 150, 154)" />

        {/* METRA Officer Gold Chest Badge */}
        <g transform="translate(132, 162)">
          <path d="M 0 0 L 10 0 L 8 10 L 0 6 Z" fill="url(#goldGrad)" />
          <circle cx="5" cy="4" r="1.5" fill="#ffffff" />
        </g>

        {/* Neck */}
        <rect x="91" y="122" width="18" height="24" rx="4" fill="#df9f71" />

        {/* Ears */}
        <circle cx="68" cy="98" r="8" fill="#e4a87a" />
        <circle cx="132" cy="98" r="8" fill="#e4a87a" />
        <circle cx="68" cy="98" r="4.5" fill="#df9f71" opacity="0.6" />
        <circle cx="132" cy="98" r="4.5" fill="#df9f71" opacity="0.6" />

        {/* Face Base */}
        <path
          d="M 72 74 C 72 52, 128 52, 128 74 C 128 114, 118 132, 100 132 C 82 132, 72 114, 72 74 Z"
          fill="url(#skinGrad)"
          filter="url(#subtleShadow)"
        />

        {/* Officer Mustache (Distinguished Legal Metrology Inspector Profile) */}
        <path
          d="M 88 109 C 94 107, 100 108, 100 110 C 100 108, 106 107, 112 109 C 114 112, 108 114, 100 112 C 92 114, 86 112, 88 109 Z"
          fill="#332219"
        />

        {/* Nose */}
        <path d="M 98 86 L 102 98 L 96 100" fill="none" stroke="#cf8f60" strokeWidth="2" strokeLinecap="round" />

        {/* Eyes & Eyebrows Rigging */}
        <g>
          {/* Eyebrows */}
          <path
            d="M 78 74 Q 85 71 92 74"
            fill="none"
            stroke="#261710"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              transform:
                internalState === "thinking"
                  ? "translateY(-3px) rotate(-4deg)"
                  : internalState === "speaking"
                  ? "translateY(-1px)"
                  : "none",
              transformOrigin: "85px 74px",
              transition: "transform 0.3s ease",
            }}
          />
          <path
            d="M 108 74 Q 115 71 122 74"
            fill="none"
            stroke="#261710"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              transform:
                internalState === "thinking"
                  ? "translateY(-3px) rotate(4deg)"
                  : internalState === "speaking"
                  ? "translateY(-1px)"
                  : "none",
              transformOrigin: "115px 74px",
              transition: "transform 0.3s ease",
            }}
          />

          {/* Eyes (Blinking State Machine) */}
          {blink ? (
            <>
              {/* Closed Eyes */}
              <line x1="80" y1="83" x2="90" y2="83" stroke="#261710" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="110" y1="83" x2="120" y2="83" stroke="#261710" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Left Eye */}
              <ellipse cx="85" cy="83" rx="5.5" ry="4.5" fill="#ffffff" />
              <circle
                cx={internalState === "thinking" ? 83.5 : 85}
                cy={internalState === "thinking" ? 81.5 : 83}
                r="3"
                fill="#2c1a10"
              />
              <circle
                cx={internalState === "thinking" ? 82.5 : 84}
                cy={internalState === "thinking" ? 80.5 : 82}
                r="1"
                fill="#ffffff"
              />

              {/* Right Eye */}
              <ellipse cx="115" cy="83" rx="5.5" ry="4.5" fill="#ffffff" />
              <circle
                cx={internalState === "thinking" ? 113.5 : 115}
                cy={internalState === "thinking" ? 81.5 : 83}
                r="3"
                fill="#2c1a10"
              />
              <circle
                cx={internalState === "thinking" ? 112.5 : 114}
                cy={internalState === "thinking" ? 80.5 : 82}
                r="1"
                fill="#ffffff"
              />
            </>
          )}
        </g>

        {/* Dynamic Mouth (Driven by Lip-Sync State Machine) */}
        <g transform={`translate(${100 - mouthWidth / 2}, 113)`}>
          {effectiveMouth < 0.15 ? (
            // Closed / Resting Mouth Smile
            <path
              d={`M 2 4 Q ${mouthWidth / 2} 8 ${mouthWidth - 2} 4`}
              fill="none"
              stroke="#8b3a2b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ) : (
            // Open Mouth with Teeth and Tongue
            <>
              <ellipse
                cx={mouthWidth / 2}
                cy={mouthHeight / 2}
                rx={mouthWidth / 2}
                ry={mouthHeight / 2}
                fill="#4a151b"
                stroke="#8b3a2b"
                strokeWidth="1.5"
              />
              {/* Upper teeth */}
              {mouthHeight > 7 && (
                <rect
                  x={mouthWidth * 0.25}
                  y={1}
                  width={mouthWidth * 0.5}
                  height={mouthHeight * 0.3}
                  rx="1"
                  fill="#f8fafc"
                />
              )}
              {/* Tongue */}
              {mouthHeight > 9 && (
                <ellipse
                  cx={mouthWidth / 2}
                  cy={mouthHeight * 0.8}
                  rx={mouthWidth * 0.35}
                  ry={mouthHeight * 0.25}
                  fill="#c55353"
                />
              )}
            </>
          )}
        </g>

        {/* Inspector Peaked Service Cap */}
        <g>
          {/* Cap Crown */}
          <path
            d="M 64 62 C 64 28, 136 28, 136 62 Z"
            fill="url(#capGrad)"
            stroke="#0e1b2c"
            strokeWidth="1.5"
          />
          {/* Gold Cap Band */}
          <rect x="66" y="58" width="68" height="7" rx="1.5" fill="url(#goldGrad)" />

          {/* National Ashoka / METRA Lion Cap Emblem */}
          <g transform="translate(94, 46)">
            <ellipse cx="6" cy="7" rx="6" ry="7" fill="url(#goldGrad)" />
            <circle cx="6" cy="6" r="3" fill="#0e1b2c" />
            <circle cx="6" cy="6" r="1.5" fill="url(#goldGrad)" />
          </g>

          {/* Cap Visor / Peak with subtle reflection */}
          <path
            d="M 62 65 C 80 73, 120 73, 138 65 C 130 73, 70 73, 62 65 Z"
            fill="#050a12"
          />
          <path
            d="M 68 67 C 84 72, 116 72, 132 67"
            stroke="#ffffff"
            strokeWidth="0.8"
            opacity="0.3"
            fill="none"
          />
        </g>
      </svg>

      {/* State Status Floating Pill */}
      {showBadge && (
        <div className="absolute -bottom-2.5 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/95 border border-slate-700/80 shadow-xl backdrop-blur-md">
          {internalState === "speaking" ? (
            <>
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <Volume2 className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-300 tracking-wide">
                METRA Speaking (Lip-Sync)
              </span>
            </>
          ) : internalState === "listening" ? (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <Mic className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-300 tracking-wide">
                Listening...
              </span>
            </>
          ) : internalState === "thinking" ? (
            <>
              <BrainCircuit className="w-3 h-3 text-indigo-400 animate-spin" />
              <span className="text-[10px] font-bold text-indigo-300 tracking-wide">
                Analyzing PCR 2011 Corpus
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-blue-400 opacity-80" />
              <span className="text-[10px] font-medium text-slate-300 tracking-wide">
                Inspector Avatar Ready
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
