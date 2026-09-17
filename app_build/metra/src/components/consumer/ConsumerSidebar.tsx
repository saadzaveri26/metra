"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  Compass,
  Search,
  ShieldAlert,
  Megaphone,
  History,
  PhoneCall,
  LogOut,
  ExternalLink,
  HeartPulse,
  Bot,
} from "lucide-react";
import { useClerk, useUser } from "@clerk/nextjs";

const navItems = [
  { name: "Discover", href: "/consumer", icon: Compass },
  { name: "Product & Health Lookup", href: "/consumer/lookup", icon: Search },
  { name: "Ask METRA", href: "/assistant", icon: Bot },
  { name: "Report Suspicious Product", href: "/consumer/report", icon: ShieldAlert },
  { name: "Safety & Recall Alerts", href: "/consumer/alerts", icon: Megaphone },
  { name: "My Scan History", href: "/consumer/history", icon: History },
];

export default function ConsumerSidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { isSignedIn } = useUser();

  return (
    <aside className="hidden md:flex w-64 bg-[#0a2038] text-white flex-col min-h-[calc(100vh-71px)] border-r border-[#153457] shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#16385d] flex items-center gap-3">
        <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center border border-white/20">
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
            <span className="text-[10px] font-semibold bg-[#159a68] text-white px-1.5 py-0.5 rounded tracking-normal">
              CITIZEN
            </span>
          </div>
          <p className="text-[11px] text-[#8fa7c4] tracking-tight leading-tight">
            Consumer Rights &amp; Health
          </p>
        </div>
      </div>

      {/* Role Badge */}
      <div className="mx-4 my-3 px-3 py-2.5 rounded-lg bg-[#0e2c4d] border border-[#1e4a7a] flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-[#159a68]/20 flex items-center justify-center text-[#2fd195]">
          <HeartPulse className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-400 leading-none">Portal Access</p>
          <p className="text-xs font-semibold text-white mt-0.5">Citizen &amp; Consumer</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/consumer"
              ? pathname === "/consumer"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#0867c9] text-white shadow-sm font-semibold"
                  : "text-[#9cb3cf] hover:text-white hover:bg-[#122b49]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#7b98bc]"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* National Consumer Helpline Callout */}
      <div className="p-3.5 mx-3 mb-3 rounded-lg bg-[#071b2d] border border-[#143557] text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 text-[#2fd195] font-semibold mb-1">
          <PhoneCall className="w-3.5 h-3.5 shrink-0" />
          <span>National Consumer Helpline</span>
        </div>
        <p className="text-[11px] text-white font-bold">Dial 1915 (Toll-Free)</p>
        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
          Department of Consumer Affairs, Government of India
        </p>
        <a
          href="https://consumerhelpline.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-[10px] text-[#4ea0f5] hover:underline flex items-center gap-1"
        >
          consumerhelpline.gov.in <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>

      {/* Sign In / Sign Out Button */}
      <div className="p-3 border-t border-[#16385d]">
        {isSignedIn ? (
          <button
            onClick={() => signOut({ redirectUrl: "/sign-in" })}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-[#163252] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        ) : (
          <Link
            href="/sign-in"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#0867c9] hover:bg-[#0753a0] text-xs font-semibold text-white shadow transition-colors"
          >
            <span>Sign In for Scan History</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
