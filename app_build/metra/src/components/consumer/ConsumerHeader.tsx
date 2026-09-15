"use client";

import { useUser } from "@clerk/nextjs";
import { Search, ShieldAlert, User, Bell, HelpCircle, Heart } from "lucide-react";
import Link from "next/link";
import NotificationBell from "@/components/notifications/NotificationBell";

interface ConsumerHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function ConsumerHeader({
  title = "Citizen Consumer Protection Portal",
  subtitle = "Verify Packaged Goods · Nutrition Insights · Legal Metrology Protection",
}: ConsumerHeaderProps) {
  const { user, isSignedIn } = useUser();

  const citizenName =
    user?.fullName ||
    (user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Citizen Consumer");

  return (
    <header className="h-16 bg-white border-b border-[#dce7f2] px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Title / Breadcrumb */}
      <div>
        <h1 className="text-base font-bold text-[#10243e] tracking-tight">{title}</h1>
        <p className="text-xs text-[#62738a]">{subtitle}</p>
      </div>

      {/* Header Right Actions */}
      <div className="flex items-center gap-4">
        {/* Quick Product Lookup CTA */}
        <Link
          href="/consumer/lookup"
          className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#159a68] hover:bg-[#128358] text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Product Lookup</span>
        </Link>

        {/* Report Product CTA */}
        <Link
          href="/consumer/report"
          className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold transition-colors"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Report Product</span>
        </Link>

        {/* Notifications / Alerts */}
        <NotificationBell />

        {/* User Identity Pill */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#e8f8f0] border border-[#159a68]/30 flex items-center justify-center text-[#159a68]">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-bold text-[#10243e] leading-tight">
              {isSignedIn ? citizenName : "Guest Citizen"}
            </p>
            <p className="text-[10px] font-medium text-[#159a68] leading-tight">
              {isSignedIn ? "Verified Citizen Account" : "Open Public Access"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
