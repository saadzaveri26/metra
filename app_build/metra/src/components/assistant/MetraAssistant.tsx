"use client";

import { useEffect, useRef, useState } from "react";

export type MitraState = "idle" | "listening" | "thinking" | "speaking";

const SPEAKING_SRC = "/metraSPEAKS2_NoBg.webm";
const THINKING_SRC = "/metraThinks_NoBg.webm";

export default function MetraAssistant({
  state,
  className = "",
  label = "Metra, METRA AI assistant",
}: {
  state: MitraState;
  className?: string;
  label?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    const onReady = () => setReady(true);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.load();
    return () => {
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !ready) return;
    if (state === "speaking") {
      video.currentTime = 0;
      void video.play().catch(() => undefined);
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [state, ready]);

  return (
    <div className={`mitra-assistant mitra-assistant-${state} ${className}`} role="img" aria-label={label}>
      {state === "thinking" ? (
        <video
          className="mitra-assistant-thinking-video"
          src={THINKING_SRC}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-label="Metra is thinking"
        />
      ) : (
        <video
          ref={videoRef}
          className="mitra-assistant-video"
          src={SPEAKING_SRC}
          muted
          playsInline
          preload="auto"
          loop
          aria-hidden="true"
        />
      )}
    </div>
  );
}
