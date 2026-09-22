"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Shield, Sparkles, Building2 } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";

interface HQHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function HQHeader({ title, subtitle, actions }: HQHeaderProps) {
  const { user } = useUser();
  const userName = user?.fullName || user?.firstName || "Directorate Administrator";
  const userRole = (user?.publicMetadata?.role as string) || "headquarters";

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-slate-900/90">
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
            <span className="text-[11px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3 text-amber-400" />
              HQ STATUTORY GOVERNANCE
            </span>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* Notifications */}
        <NotificationBell />

        <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-200">{userName}</p>
            <div className="flex items-center justify-end gap-1 text-[11px] text-amber-400">
              <Building2 className="w-3 h-3" />
              <span className="capitalize">{userRole.replace("_", " ")}</span>
            </div>
          </div>
          <UserButton
            userProfileMode="modal"
            appearance={{
              elements: {
                avatarBox: "w-8 h-8 ring-2 ring-amber-400/30",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
