import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#10243e]">
      {/* HEADER */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#dce7f2]">
        <div className="container-metra">
          <nav className="h-[76px] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-[42px] h-[42px] rounded-[11px] bg-[#0867c9] grid place-items-center shadow-[0_7px_18px_rgba(8,103,201,0.25)] overflow-hidden">
                <Image
                  src="/METRA-closeup.png"
                  alt="METRA"
                  width={42}
                  height={42}
                  className="object-cover w-full h-full"
                />
              </div>
              <div>
                <strong className="text-[20px] font-bold tracking-[0.08em] block leading-tight">METRA</strong>
                <span className="block text-[#62738a] text-[10px] tracking-[0.03em] uppercase">
                  Metrology Enforcement & Traceability Regulatory Assistant
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-[14px] font-semibold text-[#43566d]">
              <a href="#features" className="hover:text-[#0867c9] transition-colors">Features</a>
              <a href="#process" className="hover:text-[#0867c9] transition-colors">Workflow</a>
              <a href="#roles" className="hover:text-[#0867c9] transition-colors">Role Dashboards</a>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/sign-in"
                className="px-4 py-2 text-[14px] font-bold text-[#0867c9] bg-white border border-[#b9d5f2] rounded-[9px] hover:-translate-y-0.5 transition-transform"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-4.5 py-2 text-[14px] font-bold text-white bg-[#0867c9] border border-[#0867c9] rounded-[9px] shadow-[0_8px_20px_rgba(8,103,201,0.2)] hover:-translate-y-0.5 transition-transform"
              >
                Get Started &rarr;
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f7fbff] to-white pt-20 pb-16">
        <div className="container-metra">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 bg-[#eaf4ff] text-[#0867c9] border border-[#cfe5fb] rounded-full px-3 py-1 text-[12px] font-extrabold tracking-[0.03em] mb-6">
                <span className="w-2 h-2 rounded-full bg-[#159a68]"></span>
                Legal Metrology (Packaged Commodities) Rules, 2011
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-6">
                AI-powered legal metrology compliance, from package to{" "}
                <em className="text-[#0867c9] not-italic">inspection record</em>.
              </h1>
              <p className="text-[17px] text-[#62738a] max-w-[580px] mb-8 leading-relaxed">
                Scan packaged commodities, extract the nine mandatory declarations via high-speed OCR,
                verify against central compliance matrices, and maintain traceability across India's market surveillance network.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/sign-up"
                  className="px-6 py-3 text-[15px] font-bold text-white bg-[#0867c9] rounded-[10px] shadow-[0_8px_20px_rgba(8,103,201,0.2)] hover:-translate-y-0.5 transition-transform"
                >
                  Choose Your Role &rarr;
                </Link>
                <Link
                  href="/sign-in"
                  className="px-6 py-3 text-[15px] font-bold text-[#0867c9] bg-white border border-[#b9d5f2] rounded-[10px] hover:-translate-y-0.5 transition-transform"
                >
                  Sign in to METRA
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="bg-white border border-[#d8e5f1] rounded-2xl p-5 shadow-[0_18px_50px_rgba(21,62,105,0.10)] transform rotate-1 hover:rotate-0 transition-transform">
                <div className="flex justify-between items-center pb-3 border-b border-[#edf1f5]">
                  <span className="text-[11px] font-extrabold text-[#0867c9] tracking-wider uppercase">Live Inspection Preview</span>
                  <span className="text-[11px] text-[#6c7d91] font-mono">ID: INS-20260914-A82F19</span>
                </div>
                <div className="mt-4 bg-[#f7f9fc] border border-[#edf1f5] rounded-xl p-4">
                  <div className="text-[14px] font-bold mb-3 flex items-center justify-between">
                    <span>Packaged Salt 1kg</span>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#e5f8ef] text-[#159a68]">
                      9/9 Fields Present
                    </span>
                  </div>
                  <div className="space-y-2 text-[12px]">
                    <div className="flex justify-between p-2 bg-white rounded border border-[#e2e9f0]">
                      <span className="text-[#62738a]">MRP Declared:</span>
                      <span className="font-semibold">&#8377;28.00 (incl. of all taxes)</span>
                    </div>
                    <div className="flex justify-between p-2 bg-white rounded border border-[#e2e9f0]">
                      <span className="text-[#62738a]">Net Quantity:</span>
                      <span className="font-semibold">1.0 kg (Font height compliant)</span>
                    </div>
                    <div className="flex justify-between p-2 bg-white rounded border border-[#e2e9f0]">
                      <span className="text-[#62738a]">Manufacturer:</span>
                      <span className="font-semibold">Tata Consumer Products Ltd.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOUR ROLE-PICKER CARDS (EXACT REQUIREMENT 2) */}
      <section id="roles" className="py-20 bg-[#f7fbff] border-y border-[#dce7f2]">
        <div className="container-metra">
          <div className="text-center max-w-[720px] mx-auto mb-14">
            <div className="inline-block bg-[#eaf4ff] text-[#0867c9] border border-[#cfe5fb] rounded-full px-3 py-1 text-[12px] font-extrabold uppercase tracking-wide mb-3">
              One platform &bull; Four Dedicated Roles
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              Designed around the people in the compliance ecosystem
            </h2>
            <p className="text-[#62738a] text-[15px]">
              Each dashboard gives its user exactly the level of access their role needs &mdash; governed by verified cryptographic credentials and strict role-boundary enforcement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Officer / Inspector */}
            <div className="bg-gradient-to-b from-[#fffdf8] to-white border border-[#e6d8b8] rounded-[18px] p-7 flex flex-col justify-between shadow-[0_18px_50px_rgba(21,62,105,0.08)] hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-[52px] h-[52px] rounded-[14px] bg-[#faf3e4] text-[#9a6b12] grid place-items-center text-[22px] font-bold mb-4">
                  &#9670;
                </div>
                <div className="inline-block bg-[#faf3e4] text-[#7a5a0f] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full mb-2">
                  Officer Role
                </div>
                <h3 className="text-[19px] font-bold mb-2">Legal Metrology Officer</h3>
                <p className="text-[13.5px] text-[#62738a] leading-relaxed mb-4">
                  The core enforcement pipeline: mobile scan capture, PaddleOCR extraction, compliance matrix checks, company history review, and pre-filled panchnama reports.
                </p>
                <div className="bg-[#faf3e4] border border-[#e6d8b8] rounded-lg p-2.5 text-[11.5px] text-[#7a5a0f] mb-4">
                  <strong>Restricted access:</strong> Requires government ID and administrative verification by HQ.
                </div>
              </div>
              <Link
                href="/sign-in"
                className="mt-2 inline-flex items-center justify-between w-full px-4 py-2.5 bg-[#9a6b12] text-white font-bold text-[13px] rounded-lg hover:bg-[#7a5a0f] transition-colors"
              >
                <span>Officer Sign In</span>
                <span>&rarr;</span>
              </Link>
            </div>

            {/* 2. Vendor */}
            <div className="bg-white border border-[#dce7f2] rounded-[18px] p-7 flex flex-col justify-between shadow-[0_18px_50px_rgba(21,62,105,0.08)] hover:border-[#b9781a] hover:-translate-y-1 transition-all">
              <div>
                <div className="w-[52px] h-[52px] rounded-[14px] bg-[#fff3df] text-[#b9781a] grid place-items-center text-[22px] font-bold mb-4">
                  &#9635;
                </div>
                <div className="inline-block bg-[#fff3df] text-[#b9781a] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full mb-2">
                  Vendor Role
                </div>
                <h3 className="text-[19px] font-bold mb-2">Packer &amp; Vendor</h3>
                <p className="text-[13.5px] text-[#62738a] leading-relaxed mb-4">
                  Pre-market self-check on product packaging and labels before market distribution. Consult ASK METRA on specific Legal Metrology requirements before they become findings.
                </p>
                <div className="bg-[#fff3df] border border-[#f5dfb8] rounded-lg p-2.5 text-[11.5px] text-[#b9781a] mb-4">
                  <strong>Self-Service:</strong> Self-registration available for verified business entities.
                </div>
              </div>
              <Link
                href="/sign-up?role=vendor"
                className="mt-2 inline-flex items-center justify-between w-full px-4 py-2.5 bg-[#b9781a] text-white font-bold text-[13px] rounded-lg hover:bg-[#996315] transition-colors"
              >
                <span>Register as Vendor</span>
                <span>&rarr;</span>
              </Link>
            </div>

            {/* 3. Consumer */}
            <div className="bg-white border border-[#dce7f2] rounded-[18px] p-7 flex flex-col justify-between shadow-[0_18px_50px_rgba(21,62,105,0.08)] hover:border-[#159a68] hover:-translate-y-1 transition-all">
              <div>
                <div className="w-[52px] h-[52px] rounded-[14px] bg-[#e5f8ef] text-[#159a68] grid place-items-center text-[22px] font-bold mb-4">
                  &#8962;
                </div>
                <div className="inline-block bg-[#e5f8ef] text-[#0e6e4a] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full mb-2">
                  Consumer Role
                </div>
                <h3 className="text-[19px] font-bold mb-2">Citizen &amp; Consumer</h3>
                <p className="text-[13.5px] text-[#62738a] leading-relaxed mb-4">
                  Scan shelf labels for immediate compliance insights, check MRP discrepancies, view nutritional breakdowns, and file geo-tagged consumer grievances.
                </p>
                <div className="bg-[#e5f8ef] border border-[#bde8d4] rounded-lg p-2.5 text-[11.5px] text-[#0e6e4a] mb-4">
                  <strong>Instant Access:</strong> Self-registration open to all citizens.
                </div>
              </div>
              <Link
                href="/sign-up?role=consumer"
                className="mt-2 inline-flex items-center justify-between w-full px-4 py-2.5 bg-[#159a68] text-white font-bold text-[13px] rounded-lg hover:bg-[#0e6e4a] transition-colors"
              >
                <span>Sign up as Consumer</span>
                <span>&rarr;</span>
              </Link>
            </div>

            {/* 4. Headquarters */}
            <div className="bg-white border border-[#dce7f2] rounded-[18px] p-7 flex flex-col justify-between shadow-[0_18px_50px_rgba(21,62,105,0.08)] hover:border-[#0a2038] hover:-translate-y-1 transition-all">
              <div>
                <div className="w-[52px] h-[52px] rounded-[14px] bg-[#e9edf3] text-[#0a2038] grid place-items-center text-[22px] font-bold mb-4">
                  &#9672;
                </div>
                <div className="inline-block bg-[#e9edf3] text-[#0a2038] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full mb-2">
                  HQ Role
                </div>
                <h3 className="text-[19px] font-bold mb-2">Legal Metrology HQ</h3>
                <p className="text-[13.5px] text-[#62738a] leading-relaxed mb-4">
                  State-wide and national oversight: aggregate inspection logs, repeat-offender analytics, compliance rulebook management, and officer credential provisioning.
                </p>
                <div className="bg-[#e9edf3] border border-[#cdd6e2] rounded-lg p-2.5 text-[11.5px] text-[#0a2038] mb-4">
                  <strong>Administrative:</strong> Restricted to authorized Controllers and Deputy Controllers.
                </div>
              </div>
              <Link
                href="/sign-in"
                className="mt-2 inline-flex items-center justify-between w-full px-4 py-2.5 bg-[#0a2038] text-white font-bold text-[13px] rounded-lg hover:bg-[#163456] transition-colors"
              >
                <span>HQ Sign In</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0a2038] text-[#d9e6f4] py-12">
        <div className="container-metra">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#0867c9] grid place-items-center text-white font-bold">M</div>
              <div>
                <strong className="text-white text-base tracking-wider block">METRA</strong>
                <span className="text-[#8ea3bb] text-[11px]">Department of Consumer Affairs &bull; Government of India</span>
              </div>
            </div>
            <div className="text-[13px] text-[#a7bad0] flex gap-6">
              <a href="#roles" className="hover:text-white">Role Directory</a>
              <Link href="/sign-in" className="hover:text-white">Portal Sign In</Link>
              <Link href="/sign-up" className="hover:text-white">Registration</Link>
            </div>
          </div>
          <div className="pt-6 text-center md:text-left text-[11px] text-[#8ea3bb]">
            &copy; 2026 METRA &mdash; Metrology Enforcement and Traceability Regulatory Assistant. Decision support only.
          </div>
        </div>
      </footer>
    </div>
  );
}
