"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import MetraAssistant, { MitraState } from "@/components/assistant/MetraAssistant";

const WEBHOOK_URL =
  "https://reshmalik.app.n8n.cloud/webhook/metra-chat";

const SESSION_KEY = "metra_chat_session_id";

const MITRA_INTRO =
  "Namaskar! I'm Metra, your METRA compliance assistant. I can help you with Legal Metrology, packaged-commodity compliance, label verification, consumer complaints, and regulatory guidance. How can I help you?";

// EASY TO EDIT: control how short Metra answers should be.
const MAX_MITRA_WORDS = 65;
const MAX_MITRA_SENTENCES = 3;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const LANGUAGES = [
  ["English", "en-IN"],
  ["हिंदी", "hi-IN"],
  ["मराठी", "mr-IN"],
  ["Assamese", "as-IN"],
  ["Malayalam", "ml-IN"],
  ["ગુજરાતી", "gu-IN"],
  ["ಕನ್ನಡ", "kn-IN"],
  ["বাংলা", "bn-IN"],
  ["ਪੰਜਾਬੀ", "pa-IN"],
  ["ଓਡ଼ਿਆ", "or-IN"],
  ["தமிழ்", "ta-IN"],
  ["తెలుగు", "te-IN"],
] as const;

function cleanMitraText(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/\s*---+\s*/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function compactMitraReply(value: string): string {
  const clean = cleanMitraText(value);

  if (!clean) {
    return "I can help with that. Please try your question again.";
  }

  const sentences =
    clean
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((s) => s.trim())
      .filter(Boolean) ?? [clean];

  const selected: string[] = [];
  let wordCount = 0;

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/).filter(Boolean);

    if (!words.length) continue;

    if (
      selected.length >= MAX_MITRA_SENTENCES ||
      wordCount + words.length > MAX_MITRA_WORDS
    ) {
      break;
    }

    selected.push(sentence);
    wordCount += words.length;
  }

  if (!selected.length) {
    const words = clean.split(/\s+/);

    return (
      words.slice(0, MAX_MITRA_WORDS).join(" ") +
      (words.length > MAX_MITRA_WORDS ? "…" : "")
    );
  }

  return selected.join(" ");
}

function getReply(data: unknown): string {
  if (Array.isArray(data) && data.length) {
    return getReply(data[0]);
  }

  if (typeof data === "string") {
    return compactMitraReply(data);
  }

  if (!data || typeof data !== "object") {
    return "I couldn't read the response. Please try again.";
  }

  const value = data as Record<string, unknown>;

  for (const key of [
    "output",
    "response",
    "message",
    "text",
    "reply",
    "answer",
  ]) {
    if (
      typeof value[key] === "string" &&
      value[key].trim()
    ) {
      return compactMitraReply(value[key] as string);
    }
  }

  return "I received a response, but couldn't find the assistant message. Please try again.";
}

export default function MetraChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mitraState, setMitraState] =
    useState<MitraState>("idle");
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [language, setLanguage] = useState("en-IN");
  const [languageName, setLanguageName] =
    useState("English");

  const recognitionRef =
    useRef<SpeechRecognitionLike | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const messagesRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const box = messagesRef.current;

    if (box) {
      box.scrollTop = box.scrollHeight;
    }
  }, [messages, loading]);

  function getSessionId() {
    let id = window.sessionStorage.getItem(
      SESSION_KEY
    );

    if (!id) {
      id = crypto.randomUUID();

      window.sessionStorage.setItem(
        SESSION_KEY,
        id
      );
    }

    return id;
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel();

    setSpeaking(false);

    if (!loading) {
      setMitraState("idle");
    }
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const clean = cleanMitraText(text)
      .replace(/\s+/g, " ")
      .trim();

    if (!clean) {
      return;
    }

    const utterance =
      new SpeechSynthesisUtterance(clean);

    utterance.lang = language;
    utterance.rate = 0.92;
    utterance.pitch = 1.04;

    const voices =
      window.speechSynthesis.getVoices();

    const preferred =
      voices.find(
        (voice) =>
          voice.lang.toLowerCase() ===
          language.toLowerCase()
      ) ||
      voices.find((voice) =>
        voice.lang
          .toLowerCase()
          .startsWith(
            language.slice(0, 2).toLowerCase()
          )
      );

    if (preferred) {
      utterance.voice = preferred;
    }

    utterance.onstart = () => {
      setSpeaking(true);
      setMitraState("speaking");
    };

    utterance.onend = () => {
      setSpeaking(false);
      setMitraState("idle");
    };

    utterance.onerror = () => {
      setSpeaking(false);
      setMitraState("idle");
    };

    window.speechSynthesis.speak(utterance);
  }

  function chooseLanguage(
    name: string,
    code: string
  ) {
    stopSpeaking();

    setLanguageName(name);
    setLanguage(code);
    setLanguageOpen(false);
  }

  function toggleMic() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const Recognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!Recognition) {
      alert(
        "Speech-to-text is not supported in this browser. Please use Chrome or Edge."
      );

      return;
    }

    const recognition = new Recognition();

    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let transcript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        transcript +=
          event.results[i][0].transcript;
      }

      setInput(transcript);
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;

      if (!loading) {
        setMitraState("idle");
      }
    };

    recognition.onerror = () => {
      setListening(false);
      recognitionRef.current = null;

      if (!loading) {
        setMitraState("idle");
      }
    };

    recognitionRef.current = recognition;

    setListening(true);
    setMitraState("listening");

    recognition.start();
  }

  async function sendMessage(
    event?: FormEvent
  ) {
    event?.preventDefault();

    const message = input.trim();

    if (!message || loading) {
      return;
    }

    stopSpeaking();

    recognitionRef.current?.stop();

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: message,
      },
    ]);

    setInput("");
    setLoading(true);
    setMitraState("thinking");

    try {
      const response = await fetch(
        WEBHOOK_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            sessionId: getSessionId(),
            language,

            responseStyle:
              "Keep every Metra answer short, clear, and helpful. Use plain text only, no Markdown, no headings, no bullet symbols, and no long introductions. Prefer 1 to 3 short sentences and only the key action or requirement. Offer to explain more if needed.",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Webhook returned ${response.status}`
        );
      }

      const reply = getReply(
        await response.json()
      );

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: reply,
        },
      ]);

      setLoading(false);

      speak(reply);
    } catch {
      const reply =
        "I'm having trouble connecting right now. Please try again in a moment.";

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: reply,
        },
      ]);

      setLoading(false);

      speak(reply);
    }
  }

  function toggleOpen() {
    setOpen((current) => {
      const next = !current;

      if (next) {
        // Metra introduces herself every time the chat bubble is opened
        window.setTimeout(() => {
          speak(MITRA_INTRO);
        }, 500);
      } else {
        stopSpeaking();
        recognitionRef.current?.stop();
        setMitraState("idle");
      }

      return next;
    });
  }

  return (
    <>
      {open && (
        <div
          className="metra-chat-window"
          role="dialog"
          aria-label="METRA Assistant"
        >
          <header className="metra-chat-header">
            <div className="metra-chat-title">
              <div className="metra-chat-header-avatar">
                <MetraAssistant state="idle" />
              </div>

              <div>
                <div className="metra-chat-name">
                  Chat with Metra
                </div>

                <div className="metra-chat-status">
                  <span />
                  Online · Compliance support
                </div>
              </div>
            </div>

            <div className="metra-chat-header-actions">
              <button
                className="metra-language-trigger"
                onClick={() =>
                  setLanguageOpen((value) => !value)
                }
                aria-label="Choose language"
                title={languageName}
              >
                A<span>अ</span>
              </button>

              <button
                className="metra-chat-close"
                onClick={toggleOpen}
                aria-label="Close chat"
              >
                ×
              </button>
            </div>

            {languageOpen && (
              <div
                className="metra-language-menu"
                role="listbox"
                aria-label="Language preference"
              >
                <div className="metra-language-title">
                  Language Preference
                </div>

                <div className="metra-language-subtitle">
                  How would you like to chat?
                </div>

                {LANGUAGES.map(
                  ([name, code]) => (
                    <button
                      key={code}
                      className={`metra-language-option ${
                        language === code
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        chooseLanguage(
                          name,
                          code
                        )
                      }
                    >
                      <span>{name}</span>

                      {language === code && (
                        <b>✓</b>
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </header>

          <div
            ref={messagesRef}
            className="metra-chat-messages"
            aria-live="polite"
          >
            {messages.length === 0 && (
              <div className="metra-chat-intro">
                <div className="metra-chat-intro-avatar">
                  <MetraAssistant
                    state={mitraState}
                  />
                </div>

                <div className="metra-chat-intro-copy">
                  <strong>
                    Namaskar! I'm Metra.
                  </strong>

                  <p>
                    I'm your METRA compliance assistant. I can help you with Legal Metrology, packaged-commodity compliance, label verification, consumer complaints, and regulatory guidance. How can I help you?
                  </p>
                </div>
              </div>
            )}

            {messages.map(
              (item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  className={`metra-chat-row ${item.role}`}
                >
                  {item.role ===
                    "assistant" && (
                    <div className="metra-message-avatar">
                      <MetraAssistant
                        state={
                          index ===
                            messages.length -
                              1 &&
                          speaking
                            ? "speaking"
                            : "idle"
                        }
                      />
                    </div>
                  )}

                  <div className="metra-message-column">
                    <div className="metra-chat-bubble">
                      {item.content}
                    </div>

                    {item.role ===
                      "assistant" && (
                      <div className="metra-message-tools">
                        {speaking &&
                        index ===
                          messages.length -
                            1 ? (
                          <button
                            onClick={
                              stopSpeaking
                            }
                            className="metra-stop-speaking"
                          >
                            🔇 Stop Metra
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              speak(
                                item.content
                              )
                            }
                            className="metra-speak-button"
                          >
                            🔊 Listen
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {loading && (
              <div className="metra-chat-row assistant">
                <div className="metra-message-avatar thinking">
                  <MetraAssistant state="thinking" />
                </div>

                <div className="metra-chat-bubble metra-thinking">
                  Metra is thinking…
                </div>
              </div>
            )}
          </div>

          <form
            className="metra-chat-input"
            onSubmit={sendMessage}
          >
            <button
              type="button"
              className={`metra-mic-button ${
                listening ? "active" : ""
              }`}
              onClick={toggleMic}
              aria-label={
                listening
                  ? "Stop voice input"
                  : "Speak to Metra"
              }
              title={
                listening
                  ? "Stop listening"
                  : "Speak to Metra"
              }
            >
              🎙️
            </button>

            <input
              ref={inputRef}
              value={input}
              onChange={(event) =>
                setInput(event.target.value)
              }
              placeholder={
                listening
                  ? "Listening…"
                  : "Type your query here"
              }
              aria-label="Message Metra"
              disabled={loading}
            />

            <button
              type="submit"
              className="metra-send-button"
              disabled={
                loading || !input.trim()
              }
              aria-label="Send message"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      <button
        className={`metra-chat-launcher ${
          open ? "open" : ""
        }`}
        onClick={toggleOpen}
        aria-label={
          open
            ? "Close METRA Assistant"
            : "Open METRA Assistant"
        }
      >
        <MetraAssistant
          state={
            speaking ? "speaking" : "idle"
          }
        />

        <span className="metra-chat-launcher-dot" />
      </button>

      <style jsx global>{`
        .mitra-assistant {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
        }

        .mitra-assistant-video,
        .mitra-assistant-thinking-video {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: center;
          background: transparent;
        }

        .mitra-assistant-thinking-video {
          image-rendering: auto;
        }

        .metra-chat-launcher {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 1000;
          width: 76px;
          height: 76px;
          padding: 0;
          border: 2px solid white;
          border-radius: 999px;
          background: var(--color-primary, #00162f);
          box-shadow:
            0 12px 30px rgba(0, 16, 38, 0.24);
          cursor: pointer;
          object-fit: cover;
          overflow: hidden;
        }

        .metra-chat-launcher.open {
          width: 66px;
          height: 66px;
        }

        .metra-chat-launcher-dot {
          position: absolute;
          right: 2px;
          bottom: 3px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #70d58a;
          border: 2px solid white;
        }

        .metra-chat-window {
          position: fixed;
          right: 24px;
          bottom: 114px;
          z-index: 999;
          width: min(
            470px,
            calc(100vw - 28px)
          );
          height: min(
            690px,
            calc(100vh - 130px)
          );
          min-height: 480px;
          display: flex;
          flex-direction: column;
          overflow: visible;
          border: 1px solid #d3d8df;
          border-radius: 24px;
          background: #fff;
          box-shadow:
            0 24px 60px
              rgba(0, 16, 38, 0.22);
        }

        .metra-chat-header {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: #00162f;
          color: #fff;
          border-radius: 23px 23px 0 0;
          min-height: 76px;
        }

        .metra-chat-title {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .metra-chat-header-avatar {
          width: 56px;
          height: 56px;
          flex: 0 0 56px;
          overflow: hidden;
          border-radius: 50%;
          background: #fff;
        }

        .metra-chat-name {
          font-weight: 800;
          font-size: 18px;
        }

        .metra-chat-status {
          margin-top: 4px;
          font-size: 12px;
          opacity: 0.84;
        }

        .metra-chat-status span {
          display: inline-block;
          width: 8px;
          height: 8px;
          margin-right: 6px;
          border-radius: 50%;
          background: #70d58a;
        }

        .metra-chat-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .metra-language-trigger {
          width: 36px;
          height: 36px;
          border: 1px solid
            rgba(255, 255, 255, 0.7);
          border-radius: 8px;
          background: transparent;
          color: white;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
        }

        .metra-language-trigger span {
          font-size: 12px;
          margin-left: 1px;
        }

        .metra-chat-close {
          border: 0;
          background: transparent;
          color: white;
          font-size: 30px;
          line-height: 1;
          cursor: pointer;
          padding: 4px 7px;
        }

        .metra-language-menu {
          position: absolute;
          right: 14px;
          top: 68px;
          width: 320px;
          max-height: 470px;
          overflow: auto;
          background: #fff;
          color: #111;
          border: 1px solid #d4d8dd;
          border-radius: 10px;
          box-shadow:
            0 18px 40px
              rgba(0, 0, 0, 0.22);
          z-index: 20;
        }

        .metra-language-title {
          font-size: 18px;
          padding: 18px 20px 4px;
        }

        .metra-language-subtitle {
          padding: 4px 20px 14px;
          color: #555;
        }

        .metra-language-option {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 13px 16px;
          border: 0;
          border-top: 1px solid #ddd;
          background: #fff;
          text-align: left;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }

        .metra-language-option:hover {
          background: #f5f7fa;
        }

        .metra-language-option.selected {
          font-weight: 800;
        }

        .metra-language-option b {
          color: #183cff;
          font-size: 22px;
        }

        .metra-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 18px 16px 24px;
          background: #fff;
          scroll-behavior: smooth;
        }

        .metra-chat-intro {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 4px 0 20px;
        }

        .metra-chat-intro-avatar {
          width: 82px;
          height: 82px;
          flex: 0 0 82px;
          border-radius: 50%;
          overflow: hidden;
          background: #f3f5f7;
        }

        .metra-chat-intro-copy {
          font-size: 14px;
          line-height: 1.45;
        }

        .metra-chat-intro-copy strong {
          font-size: 17px;
        }

        .metra-chat-intro-copy p {
          margin: 4px 0 0;
          color: #444;
        }

        .metra-chat-row {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin: 12px 0;
        }

        .metra-chat-row.user {
          justify-content: flex-end;
        }

        .metra-message-avatar {
          width: 82px;
          height: 82px;
          flex: 0 0 82px;
          border-radius: 50%;
          overflow: hidden;
          background: #f1f4f7;
        }

        .metra-message-avatar.thinking {
          width: 78px;
          height: 78px;
          flex-basis: 78px;
        }

        .metra-message-column {
          max-width: 78%;
        }

        .metra-chat-bubble {
          max-width: 100%;
          padding: 11px 13px;
          border-radius: 14px;
          white-space: pre-wrap;
          font-size: 15px;
          line-height: 1.48;
          color: #101820;
          background: #fff;
          border: 1px solid #d7dce2;
        }

        .metra-chat-row.user
          .metra-chat-bubble {
          color: #fff;
          background: #00162f;
          border-color: #00162f;
          border-bottom-right-radius: 4px;
        }

        .metra-chat-row.assistant
          .metra-chat-bubble {
          border-bottom-left-radius: 4px;
        }

        .metra-thinking {
          align-self: center;
          opacity: 0.72;
        }

        .metra-message-tools {
          display: flex;
          gap: 6px;
          margin-top: 5px;
        }

        .metra-speak-button,
        .metra-stop-speaking {
          border: 0;
          background: transparent;
          color: #334155;
          font-size: 11px;
          cursor: pointer;
          padding: 3px 5px;
        }

        .metra-stop-speaking {
          color: #b42318;
          font-weight: 700;
        }

        .metra-chat-input {
          display: flex;
          gap: 8px;
          align-items: center;
          padding: 12px;
          border-top: 1px solid #d8dde3;
          background: #fff;
          border-radius: 0 0 23px 23px;
        }

        .metra-chat-input input {
          min-width: 0;
          flex: 1;
          height: 48px;
          padding: 0 13px;
          border: 1px solid #cbd3dc;
          border-radius: 9px;
          background: white;
          color: #101820;
          outline: none;
          font: inherit;
          font-size: 14px;
        }

        .metra-chat-input input:focus {
          border-color: #00162f;
          box-shadow:
            0 0 0 2px
              rgba(0, 22, 47, 0.08);
        }

        .metra-mic-button,
        .metra-send-button {
          width: 46px;
          height: 46px;
          flex: 0 0 46px;
          border: 0;
          border-radius: 9px;
          background: #edf0f4;
          color: #00162f;
          font-size: 19px;
          cursor: pointer;
        }

        .metra-mic-button.active {
          background: #fee4e2;
          color: #b42318;
        }

        .metra-send-button {
          background: #00162f;
          color: white;
          font-size: 22px;
        }

        .metra-send-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        @media (max-width: 520px) {
          .metra-chat-window {
            right: 10px;
            bottom: 86px;
            width: calc(100vw - 20px);
            height: calc(100vh - 106px);
            min-height: 420px;
          }

          .metra-chat-launcher {
            right: 16px;
            bottom: 16px;
          }

          .metra-language-menu {
            right: 8px;
            width: min(
              320px,
              calc(100vw - 42px)
            );
          }

          .metra-chat-name {
            font-size: 16px;
          }

          .metra-chat-header-avatar {
            width: 50px;
            height: 50px;
            flex-basis: 50px;
          }

          .metra-chat-intro-avatar {
            width: 70px;
            height: 70px;
            flex-basis: 70px;
          }
        }
      `}</style>
    </>
  );
}
