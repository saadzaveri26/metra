import Link from "next/link";
import Image from "next/image";
import { Search, CheckCircle2, ClipboardList, History, MessageCircleQuestion, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#10243e]">
      {/* HEADER */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#dce7f2]">
        <div className="container-metra">
          <nav className="h-[72px] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-[40px] h-[40px] rounded-[10px] bg-[#0867c9] grid place-items-center shadow-[0_6px_16px_rgba(6,44,77,0.2)] overflow-hidden">
                <Image
                  src="/METRA-closeup.png"
                  alt="METRA emblem"
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              </div>
              <div>
                <strong className="text-[19px] font-bold tracking-[0.06em] block leading-tight">METRA</strong>
                <span className="block text-[#62738a] text-[10px] tracking-[0.02em] font-medium">
                  Metrology Enforcement &amp; Traceability
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-[14px] font-medium text-[#43566d]">
              <a href="#features" className="hover:text-[#0867c9] transition-colors">Features</a>
              <a href="#process" className="hover:text-[#0867c9] transition-colors">Workflow</a>
              <a href="#roles" className="hover:text-[#0867c9] transition-colors">Role dashboards</a>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/sign-in"
                className="px-4 py-2 text-[14px] font-semibold text-[#0867c9] bg-white border border-[#b9d5f2] rounded-lg hover:-translate-y-0.5 transition-transform"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-[14px] font-semibold text-white bg-[#0867c9] rounded-lg shadow-[0_6px_16px_rgba(6,44,77,0.18)] hover:-translate-y-0.5 transition-transform whitespace-nowrap"
              >
                <span>Get started</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* HERO — asymmetric, with depth */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f7fbff] to-white pt-24 pb-20" id="main-content">
        <div className="container-metra">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left — offset text block */}
            <div className="lg:col-span-7 lg:pr-8">
              <div className="inline-flex items-center gap-2 bg-[#eaf4ff] text-[#0867c9] border border-[#cfe5fb] rounded-full px-3 py-1 text-[12px] font-semibold tracking-[0.02em] mb-6">
                <span className="w-2 h-2 rounded-full bg-[#0867c9]"></span>
                Legal Metrology (Packaged Commodities) Rules, 2011
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.06] mb-6">
                AI-powered legal metrology compliance, from package to{" "}
                <em className="text-[#0867c9] not-italic">inspection record</em>.
              </h1>
              <p className="text-[17px] text-[#62738a] max-w-[560px] mb-8 leading-relaxed">
                Scan packaged commodities, extract the nine mandatory declarations via high-speed OCR,
                verify against central compliance matrices, and maintain traceability across India&apos;s market surveillance network.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/sign-up"
                  className="px-6 py-3 text-[15px] font-semibold text-white bg-[#0867c9] rounded-lg shadow-[0_8px_20px_rgba(6,44,77,0.18)] hover:-translate-y-0.5 transition-transform"
                >
                  Choose your role &rarr;
                </Link>
                <Link
                  href="/sign-in"
                  className="px-6 py-3 text-[15px] font-semibold text-[#0867c9] bg-white border border-[#b9d5f2] rounded-lg hover:-translate-y-0.5 transition-transform"
                >
                  Sign in to METRA
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative bg-white border border-[#d8e5f1] rounded-2xl p-5 shadow-[0_20px_60px_rgba(6,44,77,0.10)]">
                <div className="flex justify-between items-center pb-3 border-b border-[#edf1f5]">
                  <span className="text-[11px] font-semibold text-[#0867c9] tracking-wide">Live inspection preview</span>
                  <span className="text-[11px] text-[#6c7d91] font-mono tabular-nums">ID: INS-20260914-A82F19</span>
                </div>
                <div className="mt-4 bg-[#f7f9fc] border border-[#edf1f5] rounded-xl p-4">
                  <div className="text-[14px] font-semibold mb-3 flex items-center justify-between">
                    <span>Packaged Salt 1kg</span>
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded bg-[#eaf4ff] text-[#0867c9]">
                      9/9 fields present
                    </span>
                  </div>
                  <div className="space-y-2 text-[12px]">
                    <div className="flex justify-between p-2 bg-white rounded border border-[#e2e9f0]">
                      <span className="text-[#62738a]">MRP declared:</span>
                      <span className="font-semibold tabular-nums">&#8377;28.00 (incl. of all taxes)</span>
                    </div>
                    <div className="flex justify-between p-2 bg-white rounded border border-[#e2e9f0]">
                      <span className="text-[#62738a]">Net quantity:</span>
                      <span className="font-semibold">1.0 kg (font height compliant)</span>
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

      {/* FEATURES — 2-column zig-zag, not 3-col equal grid */}
      <section id="features" className="py-28">
        <div className="container-metra">
          <div className="max-w-[640px] mb-16">
            <div className="inline-block bg-[#eaf4ff] text-[#0867c9] border border-[#cfe5fb] rounded px-2.5 py-1 text-[12px] font-semibold tracking-[0.02em] mb-3">
              Built for practical inspections
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything you need in one compliance workspace
            </h2>
            <p className="text-[#62738a] text-[15px] leading-relaxed">
              From scanning and rule reference to history and documentation, METRA brings the inspection
              workflow together.
            </p>
          </div>

          {/* Simple 3-column feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Search}
              title="Scan and analyse packages"
              desc="Photograph a label and METRA reads the nine declarations the Rules require — manufacturer, net quantity, MRP, date of packing, country of origin, consumer care and more — and flags anything missing, wrongly formatted, or in too small a font."
            />
            <FeatureCard
              icon={CheckCircle2}
              title="Rule-guided, not memory-guided"
              desc="Every check traces back to a specific rule and section of the Legal Metrology (Packaged Commodities) Rules, 2011 — the same reference, applied the same way, whether it's an officer's first inspection or their thousandth."
            />
            <FeatureCard
              icon={ClipboardList}
              title="Reports that fill themselves in"
              desc="Complainant details, the company being reported, and the specifics of the violation carry straight from the scan into the report — officers check it and file it, instead of retyping what METRA already found."
            />
            <FeatureCard
              icon={History}
              title="A record for every company"
              desc="Every mismatch is logged against the company, not just the scan. A pattern of violations follows a manufacturer across inspections and across officers."
            />
            <FeatureCard
              icon={MessageCircleQuestion}
              title="Ask METRA"
              desc="A conversational assistant for vendors and inspectors, grounded in the actual text of the Act and Rules — ask what a clause means, not just what it says."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Pre-market self-check"
              desc="Vendors can run the same check on their own packaging before it ever reaches a shelf, and catch a labelling issue while it's still cheap to fix."
            />
          </div>
        </div>
      </section>

      {/* WORKFLOW — horizontal timeline with connecting line */}
      <section id="process" className="py-28 bg-[#f7fbff] border-y border-[#dce7f2]">
        <div className="container-metra">
          <div className="max-w-[640px] mb-16">
            <div className="inline-block bg-[#eaf4ff] text-[#0867c9] border border-[#cfe5fb] rounded px-2.5 py-1 text-[12px] font-semibold tracking-[0.02em] mb-3">
              Simple workflow
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              From package to inspection record
            </h2>
            <p className="text-[#62738a] text-[15px] leading-relaxed">
              Inspections start the way they always have &mdash; a planned route, a licence renewal, a complaint
              through the National Consumer Helpline, a tip-off, a festive-season drive, or a random check.
              METRA doesn&apos;t change when an inspection happens, only what happens once the officer is there.
            </p>
          </div>

          {/* Timeline steps */}
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-[28px] left-[60px] right-[60px] h-[2px] bg-gradient-to-r from-[#0867c9]/20 via-[#0867c9]/40 to-[#0867c9]/20"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  number: "1",
                  title: "Scan or upload",
                  desc: "Capture a clear image of the product package or label using a camera or upload.",
                },
                {
                  number: "2",
                  title: "Analyse compliance",
                  desc: "METRA checks the visible label information and highlights declarations that need attention.",
                },
                {
                  number: "3",
                  title: "Review and document",
                  desc: "Review the result, use company history and prepare the relevant inspection documentation.",
                },
              ].map((step) => (
                <article
                  key={step.number}
                  className="relative bg-white border border-[#dce7f2] rounded-xl p-7 pt-12"
                >
                  {/* Step number — overlaps card border for depth */}
                  <div className="absolute -top-[14px] left-7 w-[28px] h-[28px] rounded-lg bg-[#0867c9] text-white grid place-items-center text-[12px] font-bold shadow-[0_4px_12px_rgba(6,44,77,0.2)]">
                    {step.number}
                  </div>
                  <h3 className="text-[17px] font-semibold mb-1.5">{step.title}</h3>
                  <p className="text-[14px] text-[#62738a] leading-relaxed">{step.desc}</p>
                </article>
              ))}
            </div>
          </div>

          <p className="max-w-[700px] mx-auto text-center text-[13px] text-[#62738a] border-t border-[#dce7f2] mt-12 pt-8">
            If a violation holds up, what follows &mdash; seizure or sealing, notice to the trader, prosecution,
            penalties &mdash; is the same process it&apos;s always been. METRA&apos;s part ends at giving the officer an
            accurate, well-documented starting point, and keeping the record for next time.
          </p>
        </div>
      </section>

      {/* FOUR ROLE-PICKER CARDS — CTAs pinned to bottom */}
      <section id="roles" className="py-28 bg-[#f7fbff] border-y border-[#dce7f2]">
        <div className="container-metra">
          <div className="max-w-[640px] mb-16">
            <div className="inline-block bg-[#eaf4ff] text-[#0867c9] border border-[#cfe5fb] rounded px-2.5 py-1 text-[12px] font-semibold tracking-[0.02em] mb-3">
              One platform, four dedicated roles
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Designed around the people in the compliance ecosystem
            </h2>
            <p className="text-[#62738a] text-[15px] leading-relaxed">
              Each dashboard gives its user exactly the level of access their role needs &mdash; governed by verified cryptographic credentials and strict role-boundary enforcement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Officer / Inspector */}
            <div className="bg-gradient-to-b from-[#fffdf8] to-white border border-[#e6d8b8] rounded-xl p-7 flex flex-col justify-between shadow-[0_12px_36px_rgba(6,44,77,0.06)] hover:-translate-y-1 transition-transform">
              <div>
                <div className="w-[48px] h-[48px] rounded-xl bg-[#faf3e4] text-[#9a6b12] grid place-items-center text-[20px] font-bold mb-4">
                  &#9670;
                </div>
                <div className="inline-block bg-[#faf3e4] text-[#7a5a0f] text-[11px] font-semibold px-2.5 py-0.5 rounded mb-2">
                  Officer role
                </div>
                <h3 className="text-[18px] font-semibold mb-2">Legal Metrology Officer</h3>
                <p className="text-[13px] text-[#62738a] leading-relaxed mb-4">
                  The core enforcement pipeline: mobile scan capture, OCR extraction, compliance matrix checks, company history review, and pre-filled panchnama reports.
                </p>
                <div className="bg-[#faf3e4] border border-[#e6d8b8] rounded-lg p-2.5 text-[11px] text-[#7a5a0f] mb-4">
                  <strong>Restricted access:</strong> Requires government ID and administrative verification by HQ.
                </div>
              </div>
              <Link
                href="/sign-in"
                className="mt-2 inline-flex items-center justify-between w-full px-4 py-2.5 bg-[#9a6b12] text-white font-semibold text-[13px] rounded-lg hover:bg-[#7a5a0f] transition-colors"
              >
                <span>Officer sign in</span>
                <span>&rarr;</span>
              </Link>
            </div>

            {/* 2. Vendor */}
            <div className="bg-white border border-[#dce7f2] rounded-xl p-7 flex flex-col justify-between shadow-[0_12px_36px_rgba(6,44,77,0.06)] hover:border-[#b9781a] hover:-translate-y-1 transition-all">
              <div>
                <div className="w-[48px] h-[48px] rounded-xl bg-[#fff3df] text-[#b9781a] grid place-items-center text-[20px] font-bold mb-4">
                  &#9635;
                </div>
                <div className="inline-block bg-[#fff3df] text-[#b9781a] text-[11px] font-semibold px-2.5 py-0.5 rounded mb-2">
                  Vendor role
                </div>
                <h3 className="text-[18px] font-semibold mb-2">Packer and vendor</h3>
                <p className="text-[13px] text-[#62738a] leading-relaxed mb-4">
                  Pre-market self-check on product packaging and labels before market distribution. Consult Ask METRA on specific Legal Metrology requirements before they become findings.
                </p>
                <div className="bg-[#fff3df] border border-[#f5dfb8] rounded-lg p-2.5 text-[11px] text-[#b9781a] mb-4">
                  <strong>Self-service:</strong> Self-registration available for verified business entities.
                </div>
              </div>
              <Link
                href="/sign-up?role=vendor"
                className="mt-2 inline-flex items-center justify-between w-full px-4 py-2.5 bg-[#b9781a] text-white font-semibold text-[13px] rounded-lg hover:bg-[#996315] transition-colors"
              >
                <span>Register as vendor</span>
                <span>&rarr;</span>
              </Link>
            </div>

            {/* 3. Consumer */}
            <div className="bg-white border border-[#dce7f2] rounded-xl p-7 flex flex-col justify-between shadow-[0_12px_36px_rgba(6,44,77,0.06)] hover:border-[#159a68] hover:-translate-y-1 transition-all">
              <div>
                <div className="w-[48px] h-[48px] rounded-xl bg-[#e5f8ef] text-[#159a68] grid place-items-center text-[20px] font-bold mb-4">
                  &#8962;
                </div>
                <div className="inline-block bg-[#e5f8ef] text-[#0e6e4a] text-[11px] font-semibold px-2.5 py-0.5 rounded mb-2">
                  Consumer role
                </div>
                <h3 className="text-[18px] font-semibold mb-2">Citizen and consumer</h3>
                <p className="text-[13px] text-[#62738a] leading-relaxed mb-4">
                  Scan shelf labels for immediate compliance insights, check MRP discrepancies, view nutritional breakdowns, and file geo-tagged consumer grievances.
                </p>
                <div className="bg-[#e5f8ef] border border-[#bde8d4] rounded-lg p-2.5 text-[11px] text-[#0e6e4a] mb-4">
                  <strong>Instant access:</strong> Self-registration open to all citizens.
                </div>
              </div>
              <Link
                href="/sign-up?role=consumer"
                className="mt-2 inline-flex items-center justify-between w-full px-4 py-2.5 bg-[#159a68] text-white font-semibold text-[13px] rounded-lg hover:bg-[#0e6e4a] transition-colors"
              >
                <span>Sign up as consumer</span>
                <span>&rarr;</span>
              </Link>
            </div>

            {/* 4. Headquarters */}
            <div className="bg-white border border-[#dce7f2] rounded-xl p-7 flex flex-col justify-between shadow-[0_12px_36px_rgba(6,44,77,0.06)] hover:border-[#0a2038] hover:-translate-y-1 transition-all">
              <div>
                <div className="w-[48px] h-[48px] rounded-xl bg-[#e9edf3] text-[#0a2038] grid place-items-center text-[20px] font-bold mb-4">
                  &#9672;
                </div>
                <div className="inline-block bg-[#e9edf3] text-[#0a2038] text-[11px] font-semibold px-2.5 py-0.5 rounded mb-2">
                  HQ role
                </div>
                <h3 className="text-[18px] font-semibold mb-2">Legal Metrology HQ</h3>
                <p className="text-[13px] text-[#62738a] leading-relaxed mb-4">
                  State-wide and national oversight: aggregate inspection logs, repeat-offender analytics, compliance rulebook management, and officer credential provisioning.
                </p>
                <div className="bg-[#e9edf3] border border-[#cdd6e2] rounded-lg p-2.5 text-[11px] text-[#0a2038] mb-4">
                  <strong>Administrative:</strong> Restricted to authorized Controllers and Deputy Controllers.
                </div>
              </div>
              <Link
                href="/sign-in"
                className="mt-2 inline-flex items-center justify-between w-full px-4 py-2.5 bg-[#0a2038] text-white font-semibold text-[13px] rounded-lg hover:bg-[#163456] transition-colors"
              >
                <span>HQ sign in</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER — simplified, with legal links */}
      <footer className="bg-[#0a2038] text-[#d9e6f4] py-12">
        <div className="container-metra">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#0867c9] grid place-items-center text-white font-bold text-sm">M</div>
              <div>
                <strong className="text-white text-base tracking-wider block">METRA</strong>
                <span className="text-[#8ea3bb] text-[11px]">Department of Consumer Affairs &bull; Government of India</span>
              </div>
            </div>
            <div className="text-[13px] text-[#a7bad0] flex gap-6">
              <a href="#roles" className="hover:text-white transition-colors">Role directory</a>
              <Link href="/sign-in" className="hover:text-white transition-colors">Portal sign in</Link>
              <Link href="/sign-up" className="hover:text-white transition-colors">Registration</Link>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#8ea3bb]">
            <span>&copy; 2026 METRA &mdash; Metrology Enforcement and Traceability Regulatory Assistant. Decision support only.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Privacy policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of service</a>
              <a href="#" className="hover:text-white transition-colors">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <article
      className="group bg-white border border-[#dce7f2] rounded-xl p-6 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(6,44,77,0.08)] transition-all duration-300"
    >
      <div className="w-[44px] h-[44px] rounded-lg bg-[#eaf4ff] text-[#0867c9] grid place-items-center mb-4 group-hover:bg-[#0867c9] group-hover:text-white transition-colors duration-300">
        <Icon className="w-[20px] h-[20px]" />
      </div>
      <div>
        <h3 className="text-[16px] font-semibold mb-1.5">{title}</h3>
        <p className="text-[14px] text-[#62738a] leading-relaxed">{desc}</p>
      </div>
    </article>
  );
}
