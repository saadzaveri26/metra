"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  ShieldAlert,
  BarChart3,
  Users2,
  Trophy,
  Scale,
  Inbox,
  LogOut,
  Crown,
  Bot,
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";

const navItems = [
  { name: "National Analytics", href: "/headquarters", icon: BarChart3 },
  { name: "Officer Roster & Approvals", href: "/headquarters/officers", icon: Users2 },
  { name: "Repeat Offender Matrix", href: "/headquarters/leaderboard", icon: Trophy },
  { name: "Statutory Rules & Policy", href: "/headquarters/rules", icon: Scale },
  { name: "Citizen Lead Triage", href: "/headquarters/leads", icon: Inbox },
  { name: "Ask METRA", href: "/assistant", icon: Bot },
];

export default function HQSidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();

  return (
    <aside className="hidden md:flex w-64 bg-[#0d1424] text-white flex-col min-h-[calc(100vh-71px)] border-r border-[#1e293b] shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1e293b] flex items-center gap-3">
        <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center border border-amber-400/30 shadow-inner">
          <Image
            src="/METRA-closeup.png"
            alt="METRA Emblem"
            width={36}
            height={36}
            className="object-cover"
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-lg tracking-wider text-white">METRA</span>
            <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded tracking-normal flex items-center gap-0.5">
              <Crown className="w-2.5 h-2.5" />
              HQ
            </span>
          </div>
          <p className="text-[11px] text-slate-400 tracking-tight leading-tight">
            Directorate Oversight
          </p>
        </div>
      </div>

      {/* Role Badge */}
      <div className="mx-4 my-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-amber-500/10 to-amber-400/10 border border-amber-500/20 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-300">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-200">Legal Metrology HQ</p>
          <p className="text-[10px] text-slate-400">Policy & Enforcement Authority</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/headquarters"
              ? pathname === "/headquarters"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-amber-400/15 text-amber-300 border border-amber-400/30 shadow-sm font-semibold"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-amber-400" : "text-slate-400"
                }`}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>



      {/* Sign Out */}
      <div className="p-3 border-t border-[#1e293b]">
        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Directorate</span>
        </button>
      </div>
    </aside>
  );
}
