"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  ScanLine,
  FileQuestion,
  BookOpenCheck,
  Package,
  Building2,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Info,
  Bot,
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";

const navItems = [
  { name: "Overview", href: "/vendor", icon: LayoutDashboard },
  { name: "Pre-Market Check", href: "/vendor/self-check", icon: ScanLine },
  { name: "Ask METRA", href: "/assistant", icon: Bot },
  { name: "Compliance Notices", href: "/vendor/cases", icon: FileQuestion },
  { name: "PCR 2011 Guidance", href: "/vendor/guidance", icon: BookOpenCheck },
  { name: "Products", href: "/vendor/products", icon: Package },
];

export default function VendorSidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();

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
            <span className="text-[10px] font-semibold bg-[#e69b00] text-slate-900 px-1.5 py-0.5 rounded tracking-normal">
              VENDOR
            </span>
          </div>
          <p className="text-[11px] text-[#8fa7c4] tracking-tight leading-tight">
            Pre-Market Compliance
          </p>
        </div>
      </div>

      {/* Role Badge */}
      <div className="mx-4 my-3 px-3 py-2.5 rounded-lg bg-[#0e2c4d] border border-[#1e4a7a] flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-[#e69b00]/20 flex items-center justify-center text-[#ffc038]">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-slate-400 leading-none">Account Role</p>
          <p className="text-xs font-semibold text-white mt-0.5">Manufacturer / Packer</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/vendor"
              ? pathname === "/vendor"
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

      {/* Statutory Advisory Isolation Callout */}
      <div className="p-3.5 mx-3 mb-3 rounded-lg bg-[#071627] border border-[#143250] text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 text-[#ffc038] font-semibold mb-1">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>Statutory Safe Harbor</span>
        </div>
        <p className="text-[10.5px] leading-relaxed text-slate-400">
          Pre-market self-checks are advisory tools. Self-checks never trigger automated penalties or create enforcement records.
        </p>
        <a
          href="https://consumeraffairs.nic.in"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-[10px] text-[#4ea0f5] hover:underline flex items-center gap-1"
        >
          PCR 2011 Standards <ExternalLink className="w-2.5 h-2.5" />
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
