"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SelectRolePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"consumer" | "vendor" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmRole = async () => {
    if (!selectedRole) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update role");
      }

      await user?.reload();
      router.replace(`/${selectedRole}`);
    } catch (err: any) {
      setError(err.message || "Failed to assign role");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faff] text-[#10243e] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-[540px] bg-white border border-[#dce7f2] rounded-[18px] p-8 sm:p-10 shadow-[0_18px_50px_rgba(21,62,105,0.10)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-[10px] bg-[#0867c9] overflow-hidden">
            <Image src="/METRA-closeup.png" alt="METRA" width={40} height={40} className="object-cover" />
          </div>
          <div>
            <strong className="text-[17px] font-bold block leading-tight">METRA Onboarding</strong>
            <span className="text-[11px] text-[#62738a]">Complete your account setup</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-2">Select your role</h1>
        <p className="text-[13.5px] text-[#62738a] mb-6">
          Welcome to METRA! Since this is your first time signing in via Google, please confirm how you intend to use the platform.
        </p>

        {error && (
          <div className="mb-5 p-3.5 bg-[#fde9ea] border border-[#f7c5c7] rounded-lg text-[#c84c54] text-[13px]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Consumer card */}
          <div
            onClick={() => setSelectedRole("consumer")}
            className={`cursor-pointer rounded-[14px] p-5 border transition-all ${
              selectedRole === "consumer"
                ? "border-[#159a68] bg-[#e5f8ef]/40 ring-2 ring-[#159a68]"
                : "border-[#dce7f2] bg-white hover:border-[#159a68]"
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-[#e5f8ef] text-[#159a68] flex items-center justify-center text-lg font-bold mb-3">
              &#8962;
            </div>
            <h3 className="font-bold text-[16px] mb-1">Consumer</h3>
            <p className="text-[12px] text-[#62738a]">
              Scan product labels, check compliance &amp; MRPs, and report violations.
            </p>
          </div>

          {/* Vendor card */}
          <div
            onClick={() => setSelectedRole("vendor")}
            className={`cursor-pointer rounded-[14px] p-5 border transition-all ${
              selectedRole === "vendor"
                ? "border-[#b9781a] bg-[#fff3df]/40 ring-2 ring-[#b9781a]"
                : "border-[#dce7f2] bg-white hover:border-[#b9781a]"
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-[#fff3df] text-[#b9781a] flex items-center justify-center text-lg font-bold mb-3">
              &#9635;
            </div>
            <h3 className="font-bold text-[16px] mb-1">Vendor</h3>
            <p className="text-[12px] text-[#62738a]">
              Pre-market verification of commodity declarations and ASK METRA queries.
            </p>
          </div>
        </div>

        <div className="bg-[#faf3e4] border border-[#e6d8b8] rounded-[10px] p-3 text-[12px] text-[#7a5a0f] mb-6">
          <strong>Need Officer or HQ access?</strong> Official inspection and regulatory roles require administrative verification and cannot be self-selected.
        </div>

        <button
          type="button"
          disabled={!selectedRole || isLoading}
          onClick={handleConfirmRole}
          className={`w-full py-3 px-4 text-white font-bold text-[14px] rounded-[10px] transition-all ${
            !selectedRole
              ? "bg-[#62738a] opacity-50 cursor-not-allowed"
              : "bg-[#0867c9] hover:bg-[#063d78]"
          }`}
        >
          {isLoading ? "Saving..." : "Confirm Role & Continue to Dashboard \u2192"}
        </button>
      </div>
    </div>
  );
}
