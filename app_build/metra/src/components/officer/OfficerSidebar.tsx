"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Package,
  ScanLine,
  FileText,
  History,
  Settings,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Bot,
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";

const navItems = [
  { name: "Dashboard", href: "/officer", icon: LayoutDashboard },
  { name: "Products", href: "/officer/products", icon: Package },
  { name: "Scan Package", href: "/officer/scan", icon: ScanLine },
  { name: "Reports", href: "/officer/reports", icon: FileText },
  { name: "Ask METRA", href: "/assistant", icon: Bot },
  { name: "History", href: "/officer/history", icon: History },
  { name: "Settings", href: "/officer/settings", icon: Settings },
];

export default function OfficerSidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();

  return (
    <aside className="w-64 bg-[#0a2038] text-white flex flex-col min-h-screen border-r border-[#153457] shrink-0">
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
            <span className="text-[10px] font-semibold bg-[#0867c9] text-white px-1.5 py-0.5 rounded tracking-normal">
              PORTAL
            </span>
          </div>
          <p className="text-[11px] text-[#8fa7c4] tracking-tight leading-tight">
            Legal Metrology Enforcement
          </p>
        </div>
      </div>

      {/* Role Badge */}
      <div className="mx-4 my-3 px-3 py-2 rounded-lg bg-[#0e2c4d] border border-[#1e4a7a] flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-[#159a68]/20 flex items-center justify-center text-[#2fd195]">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-400 leading-none">Access Level</p>
          <p className="text-xs font-semibold text-white mt-0.5">Enforcement Officer</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/officer"
              ? pathname === "/officer"
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

      {/* Statutory Footer Citation */}
      <div className="p-4 mx-3 mb-3 rounded-lg bg-[#091b2e] border border-[#143250] text-[11px] text-slate-400">
        <p className="font-semibold text-slate-300">Statutory Framework</p>
        <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
          Legal Metrology Act, 2009 &amp; Packaged Commodities Rules, 2011.
        </p>
        <a
          href="https://consumeraffairs.nic.in"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-[10px] text-[#4ea0f5] hover:underline flex items-center gap-1"
        >
          DoCA Guidelines <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>

      {/* Sign Out Button */}
      <div className="p-3 border-t border-[#16385d]">
        <button
          onClick={() => signOut({ redirectUrl: "/sign-in" })}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-[#163252] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
