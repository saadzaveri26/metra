"use client";

import { useState } from "react";
import { useSignIn, useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type RoleKey = "consumer" | "vendor" | "inspector" | "officer" | "hq" | "headquarters";

interface RoleTheme {
  label: string;
  dot: string;
  heading: string;
  sub: string;
  badgeClass: string;
  btnClass: string;
  note?: string;
  destination: string;
}

const roleThemes: Record<string, RoleTheme> = {
  consumer: {
    label: "Consumer account",
    dot: "\u2302",
    heading: "Welcome back",
    sub: "Sign in to scan a label, file a grievance, or find your state's Legal Metrology office.",
    badgeClass: "bg-[#e5f8ef] text-[#159a68]",
    btnClass: "bg-[#159a68] hover:bg-[#0e6e4a]",
    destination: "/consumer",
  },
  vendor: {
    label: "Vendor account",
    dot: "\u25A3",
    heading: "Welcome back",
    sub: "Sign in to run a pre-market self-check on your packaging or query ASK METRA.",
    badgeClass: "bg-[#fff3df] text-[#b9781a]",
    btnClass: "bg-[#b9781a] hover:bg-[#996315]",
    destination: "/vendor",
  },
  officer: {
    label: "Officer account",
    dot: "\u25C6",
    heading: "Officer sign-in",
    sub: "This dashboard is restricted to verified inspection officers.",
    badgeClass: "bg-[#faf3e4] text-[#7a5a0f] border border-[#e6d8b8]",
    btnClass: "bg-[#9a6b12] hover:bg-[#7a5a0f]",
    note: "Your government ID, designation, and state/region were verified by Legal Metrology HQ when this account was provisioned.",
    destination: "/officer",
  },
  inspector: {
    label: "Officer account",
    dot: "\u25C6",
    heading: "Officer sign-in",
    sub: "This dashboard is restricted to verified inspection officers.",
    badgeClass: "bg-[#faf3e4] text-[#7a5a0f] border border-[#e6d8b8]",
    btnClass: "bg-[#9a6b12] hover:bg-[#7a5a0f]",
    note: "Your government ID, designation, and state/region were verified by Legal Metrology HQ when this account was provisioned.",
    destination: "/officer",
  },
  headquarters: {
    label: "Legal Metrology HQ",
    dot: "\u25C8",
    heading: "Welcome back",
    sub: "Sign in for the state-wide view of inspections, reports, and officer activity.",
    badgeClass: "bg-[#e9edf3] text-[#0a2038]",
    btnClass: "bg-[#0a2038] hover:bg-[#163456]",
    destination: "/headquarters",
  },
  hq: {
    label: "Legal Metrology HQ",
    dot: "\u25C8",
    heading: "Welcome back",
    sub: "Sign in for the state-wide view of inspections, reports, and officer activity.",
    badgeClass: "bg-[#e9edf3] text-[#0a2038]",
    btnClass: "bg-[#0a2038] hover:bg-[#163456]",
    destination: "/headquarters",
  },
};

function inferRole(identifier: string): string {
  const id = identifier.trim().toLowerCase();
  if (id.includes("officer") || id.includes("inspector")) return "officer";
  if (id.includes("vendor")) return "vendor";
  if (id.includes("hq") || id.includes("headquarter")) return "headquarters";
  return "consumer";
}

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [inferredRole, setInferredRole] = useState("consumer");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleIdentifierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setError(null);
    const role = inferRole(identifier);
    setInferredRole(role);
    setStep(2);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn.create({
        identifier: identifier.trim(),
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });

        // Resolve destination based on user's publicMetadata.role, fallback to inferred
        const assignedRole = (result as any)?.userData?.publicMetadata?.role || inferredRole;
        const target = roleThemes[assignedRole]?.destination || "/consumer";
        window.location.href = target;
      } else {
        setError(`Additional verification step required: ${result.status}`);
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || err?.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn) return;
    setError(null);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/sso-callback",
      });
    } catch (err: any) {
      setError(err?.errors?.[0]?.longMessage || err?.message || "OAuth sign-in failed");
    }
  };

  const currentTheme = roleThemes[inferredRole] || roleThemes.consumer;

  return (
    <div className="min-h-screen bg-[#f7faff] text-[#10243e] flex flex-col">
      {/* HEADER */}
      <header className="bg-white/95 border-b border-[#dce7f2]">
        <div className="container-metra">
          <nav className="h-[76px] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-[42px] h-[42px] rounded-[11px] overflow-hidden shadow-[0_7px_18px_rgba(8,103,201,0.25)]">
                <Image src="/METRA-closeup.png" alt="METRA" width={42} height={42} className="object-cover" />
              </div>
              <div>
                <strong className="text-[20px] font-bold tracking-[0.08em] block leading-tight">METRA</strong>
                <span className="block text-[#62738a] text-[10px] tracking-[0.03em] uppercase">
                  Metrology Enforcement &amp; Traceability
                </span>
              </div>
            </Link>
            <Link href="/" className="text-[13px] font-bold text-[#0867c9] flex items-center gap-1.5">
              &larr; Back to home
            </Link>
          </nav>
        </div>
      </header>

      {/* MAIN TWO-COLUMN LAYOUT MATCHING LOGIN.HTML */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-76px)]">
        {/* Left branding banner */}
        <div className="hidden lg:flex lg:col-span-6 bg-gradient-to-br from-[#063d78] to-[#0867c9] text-white p-16 flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-xl mb-6">
              M
            </div>
            <h2 className="text-3xl font-extrabold max-w-[440px] leading-tight mb-4">
              Every inspection starts with a label.
            </h2>
            <p className="text-white/80 text-[15px] max-w-[440px] leading-relaxed">
              METRA reads it the same way, checks it against the same Packaged Commodities Rules, and verifies compliance consistently across all four roles.
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap gap-2.5">
            {["Consumer", "Vendor", "Officer", "Legal Metrology HQ"].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[12px] font-semibold tracking-wide border border-white/20"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="absolute right-[-20px] bottom-0 w-[80%] max-w-[420px] opacity-40 pointer-events-none">
            <Image
              src="/METRA-welcome.png"
              alt="METRA Welcome"
              width={420}
              height={500}
              className="object-contain"
            />
          </div>
        </div>

        {/* Right authentication form container */}
        <div className="lg:col-span-6 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-[460px] bg-white border border-[#dce7f2] rounded-[18px] shadow-[0_18px_50px_rgba(21,62,105,0.10)] p-8 sm:p-10">
            {isSignedIn && !error && (
              <div className="mb-6 p-4 bg-[#eaf4ff] border border-[#b8daff] rounded-xl text-[#0867c9] text-[13px]">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-bold">Already signed in:</span>{" "}
                    <div className="font-mono text-[12px] text-[#10243e] mt-0.5">
                      {user?.primaryEmailAddress?.emailAddress}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await signOut({ redirectUrl: "/sign-in" });
                      setError(null);
                    }}
                    className="px-2.5 py-1 bg-white border border-[#b8daff] text-[#0867c9] font-bold text-[11px] rounded hover:bg-[#f0f7ff] transition-colors"
                  >
                    Sign out
                  </button>
                </div>
                <div className="mt-3 pt-2 border-t border-[#d5e8fb] flex items-center justify-between">
                  <span className="text-[12px] text-[#43566d]">Want to switch accounts?</span>
                  <button
                    type="button"
                    onClick={() => {
                      const role = (user?.publicMetadata as any)?.role || "consumer";
                      const dest =
                        role === "vendor"
                          ? "/vendor"
                          : role === "officer" || role === "inspector"
                          ? "/officer"
                          : role === "headquarters" || role === "hq"
                          ? "/headquarters"
                          : "/consumer";
                      window.location.href = dest;
                    }}
                    className="text-[12px] font-bold text-[#0867c9] hover:underline"
                  >
                    Go to Dashboard &rarr;
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-3.5 bg-[#fde9ea] border border-[#f7c5c7] rounded-lg text-[#c84c54] text-[13px] font-medium leading-snug">
                {error}
              </div>
            )}


            {step === 1 && (
              <div id="step1">
                <div className="text-[11px] font-extrabold text-[#62738a] tracking-wider uppercase mb-1">
                  Step 1 of 2
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-2">Sign in to METRA</h1>
                <p className="text-[13.5px] text-[#62738a] mb-6">
                  Enter your email address or username. We'll recognise your account and route you to the correct dashboard.
                </p>

                {/* Google OAuth Option */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full mb-5 flex items-center justify-center gap-3 py-3 px-4 bg-white border border-[#dce7f2] rounded-[10px] text-[14px] font-bold text-[#10243e] hover:bg-[#f7faff] transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.39 7.35 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.61 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center mb-5">
                  <div className="border-t border-[#dce7f2] w-full"></div>
                  <span className="bg-white px-3 text-[12px] text-[#62738a] font-medium absolute uppercase">
                    or email
                  </span>
                </div>

                <form onSubmit={handleIdentifierSubmit}>
                  <label className="block text-[12px] font-bold text-[#43566d] mb-1.5" htmlFor="identifier">
                    Username or email
                  </label>
                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. officer@demo.metra or you@example.com"
                    required
                    autoFocus
                    className="w-full border border-[#dce7f2] rounded-[10px] p-3 text-[14px] text-[#10243e] focus:outline-none focus:border-[#0867c9] focus:ring-2 focus:ring-[#0867c9]/15 mb-2"
                  />
                  <div className="text-[12px] text-[#8195ab] mb-5">
                    Demo hints: <span className="font-mono">officer@demo.metra</span>, <span className="font-mono">vendor@demo.metra</span>, <span className="font-mono">consumer@demo.metra</span>, <span className="font-mono">hq@demo.metra</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-[#0867c9] text-white font-bold text-[14px] rounded-[10px] hover:-translate-y-0.5 transition-transform flex items-center justify-center gap-2"
                  >
                    <span>Continue</span>
                    <span>&rarr;</span>
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t border-[#dce7f2] text-center text-[13px] text-[#62738a]">
                  New to METRA? Sign up as:
                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                    <Link
                      href="/sign-up?role=consumer"
                      className="text-[12px] font-bold text-[#10243e] border border-[#dce7f2] rounded-full px-3 py-1 hover:border-[#0867c9] hover:text-[#0867c9] transition-colors"
                    >
                      Consumer
                    </Link>
                    <Link
                      href="/sign-up?role=vendor"
                      className="text-[12px] font-bold text-[#10243e] border border-[#dce7f2] rounded-full px-3 py-1 hover:border-[#0867c9] hover:text-[#0867c9] transition-colors"
                    >
                      Vendor
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div id="step2">
                <div className="text-[11px] font-extrabold text-[#62738a] tracking-wider uppercase mb-1">
                  Step 2 of 2
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-extrabold mb-3 ${currentTheme.badgeClass}`}>
                  <span>{currentTheme.dot}</span>
                  <span>{currentTheme.label}</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-1">{currentTheme.heading}</h1>
                <p className="text-[13.5px] text-[#62738a] mb-5">{currentTheme.sub}</p>

                <div className="flex items-center justify-between p-2.5 bg-[#f7faff] border border-dashed border-[#dce7f2] rounded-[10px] text-[12px] text-[#62738a] mb-5">
                  <span>
                    Signing in as <strong className="text-[#10243e]">{identifier}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setPassword("");
                      setError(null);
                    }}
                    className="font-bold text-[#0867c9] hover:underline"
                  >
                    Not you?
                  </button>
                </div>

                {currentTheme.note && (
                  <div className="bg-[#faf3e4] border border-[#e6d8b8] rounded-[10px] p-3 text-[12px] text-[#7a5a0f] leading-relaxed mb-5 flex gap-2.5">
                    <div className="w-6 h-6 rounded-full border border-[#9a6b12] flex items-center justify-center text-[12px] font-extrabold flex-shrink-0">
                      &#10003;
                    </div>
                    <div>{currentTheme.note}</div>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit}>
                  <label className="block text-[12px] font-bold text-[#43566d] mb-1.5" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoFocus
                    className="w-full border border-[#dce7f2] rounded-[10px] p-3 text-[14px] text-[#10243e] focus:outline-none focus:border-[#0867c9] focus:ring-2 focus:ring-[#0867c9]/15 mb-5"
                  />

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 px-4 text-white font-bold text-[14px] rounded-[10px] transition-all flex items-center justify-center gap-2 ${currentTheme.btnClass} ${
                      isLoading ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-0.5"
                    }`}
                  >
                    {isLoading ? "Signing in..." : `Sign in to ${currentTheme.label.replace(" account", "")}`}
                  </button>
                </form>

                <div className="mt-5 text-center text-[13px]">
                  <Link href="/sign-in" className="text-[#0867c9] font-bold hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
