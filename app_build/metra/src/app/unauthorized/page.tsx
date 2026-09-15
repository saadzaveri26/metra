import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#f7faff] text-[#10243e] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[500px] bg-white border border-[#dce7f2] rounded-[18px] p-8 sm:p-10 shadow-[0_18px_50px_rgba(21,62,105,0.10)] text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#fde9ea] text-[#c84c54] text-2xl font-bold flex items-center justify-center mx-auto mb-5">
          &#9888;
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Access Restricted</h1>
        <p className="text-[14px] text-[#62738a] mb-6">
          Your authenticated account does not possess the cryptographic credentials required to access this dashboard.
          METRA strictly separates Officer, Vendor, Consumer, and Headquarters roles.
        </p>
        <div className="space-y-3">
          <Link
            href="/"
            className="w-full py-3 px-4 bg-[#0867c9] text-white font-bold text-[14px] rounded-[10px] block hover:bg-[#063d78] transition-colors"
          >
            Return to Home Page
          </Link>
          <Link
            href="/sign-in"
            className="w-full py-2.5 px-4 bg-white border border-[#dce7f2] text-[#43566d] font-bold text-[13px] rounded-[10px] block hover:bg-[#f7faff] transition-colors"
          >
            Switch Account
          </Link>
        </div>
      </div>
    </div>
  );
}
