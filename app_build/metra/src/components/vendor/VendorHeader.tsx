"use client";

import { useUser } from "@clerk/nextjs";
import { Bell, HelpCircle, ScanLine, Building, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import NotificationBell from "@/components/notifications/NotificationBell";

interface VendorHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function VendorHeader({
  title = "Pre-Market Packaging Compliance Portal",
  subtitle = "Advisory Verification · Legal Metrology (Packaged Commodities) Rules, 2011",
}: VendorHeaderProps) {
  const { user } = useUser();

  const businessName =
    (user?.publicMetadata as any)?.business_name ||
    user?.organizationMemberships?.[0]?.organization?.name ||
    "Enterprise Partner";

  const userName =
    user?.fullName ||
    (user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Compliance Lead");

  return (
    <header className="h-16 bg-white border-b border-[#dce7f2] px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Title / Breadcrumb */}
      <div>
        <h1 className="text-base font-bold text-[#10243e] tracking-tight">{title}</h1>
        <p className="text-xs text-[#62738a]">{subtitle}</p>
      </div>

      {/* Header Right Actions */}
      <div className="flex items-center gap-4">
        {/* Quick Self-Check CTA */}
        <Link
          href="/vendor/self-check"
          className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#0867c9] hover:bg-[#063d78] text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <ScanLine className="w-3.5 h-3.5" />
          <span>New Pre-Market Check</span>
        </Link>

        {/* Notifications */}
        <NotificationBell />

        {/* Help & Guidance Link */}
        <Link
          href="/vendor/guidance"
          title="PCR 2011 Regulatory Guidance"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </Link>

        {/* User / Enterprise Identity Pill */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#fef5e7] border border-[#e69b00]/40 flex items-center justify-center text-[#b87c00]">
            <Building className="w-4 h-4" />
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-bold text-[#10243e] leading-tight">{businessName}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3 h-3 text-[#159a68]" />
              <span className="text-[10px] font-medium text-slate-500">
                {userName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
