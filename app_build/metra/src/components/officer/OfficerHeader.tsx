"use client";

import { useUser } from "@clerk/nextjs";
import { Bell, HelpCircle, ScanLine, UserCheck } from "lucide-react";
import Link from "next/link";
import NotificationBell from "@/components/notifications/NotificationBell";

interface OfficerHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function OfficerHeader({
  title = "Legal Metrology Enforcement Portal",
  subtitle = "Government of India · Ministry of Consumer Affairs",
}: OfficerHeaderProps) {
  const { user } = useUser();

  const officerName =
    user?.fullName ||
    (user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Officer");

  return (
    <header className="h-16 bg-white border-b border-[#dce7f2] px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Title / Breadcrumb */}
      <div>
        <h1 className="text-base font-bold text-[#10243e] tracking-tight">{title}</h1>
        <p className="text-xs text-[#62738a]">{subtitle}</p>
      </div>

      {/* Header Right Actions */}
      <div className="flex items-center gap-4">
        {/* Quick Scan CTA */}
        <Link
          href="/officer/scan"
          className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#0867c9] hover:bg-[#063d78] text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <ScanLine className="w-3.5 h-3.5" />
          <span>Scan Package</span>
        </Link>

        {/* Notifications */}
        <NotificationBell />

        {/* Help */}
        <button
          type="button"
          aria-label="Enforcement Guidance"
          title="PCR 2011 Guidance"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Identity Pill */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#eaf4ff] border border-[#0867c9]/30 flex items-center justify-center text-[#0867c9]">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-bold text-[#10243e] leading-tight">{officerName}</p>
            <p className="text-[10px] font-medium text-[#159a68] leading-tight">
              Verified Inspector · Active
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
