import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f5f7f9] px-6">
      <div className="text-center max-w-md animate-in">
        {/* Branded illustration */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#eaf4ff] text-[#0867c9] grid place-items-center">
          <svg
            className="w-10 h-10"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>

        <h1 className="text-5xl font-bold text-[#17324a] mb-3 tabular-nums">404</h1>
        <p className="text-[17px] text-[#62738a] mb-8 leading-relaxed">
          This page doesn&apos;t exist in the METRA system. It may have been moved or the URL
          may be incorrect.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-2.5 text-[14px] font-semibold text-white bg-[#0867c9] rounded-lg shadow-[0_6px_16px_rgba(6,44,77,0.18)] hover:-translate-y-0.5 transition-transform"
          >
            Back to home
          </Link>
          <Link
            href="/sign-in"
            className="px-6 py-2.5 text-[14px] font-semibold text-[#0867c9] bg-white border border-[#b9d5f2] rounded-lg hover:-translate-y-0.5 transition-transform"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
