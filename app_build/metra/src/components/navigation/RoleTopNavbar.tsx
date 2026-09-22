"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser, useClerk, UserButton } from "@clerk/nextjs";
import {
  Menu,
  X,
  LayoutDashboard,
  ScanLine,
  FileText,
  Package,
  Bot,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Search,
  ShieldAlert,
  Bell,
  History,
  Users2,
  AlertTriangle,
  Settings,
  BarChart3,
  ExternalLink,
  ChevronDown,
  LogOut,
  LucideIcon,
} from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";

export type RoleType = "officer" | "vendor" | "consumer" | "headquarters";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface RoleConfig {
  portalName: string;
  departmentTag: string;
  badgeLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  activeNavBg: string;
  activeNavText: string;
  activeIndicator: string;
  navItems: NavItem[];
  quickAction?: {
    label: string;
    href: string;
    icon: LucideIcon;
    bg: string;
    text: string;
  };
  isDark?: boolean;
}

const ROLE_CONFIGS: Record<RoleType, RoleConfig> = {
  officer: {
    portalName: "Officer Enforcement Portal",
    departmentTag: "Legal Metrology Enforcement Directorate",
    badgeLabel: "Field Inspector",
    badgeBg: "bg-[#faf3e4]",
    badgeText: "text-[#8a5d00]",
    badgeBorder: "border-[#e6d8b8]",
    activeNavBg: "bg-[#faf3e4]",
    activeNavText: "text-[#8a5d00]",
    activeIndicator: "bg-[#8a5d00]",
    navItems: [
      { name: "Dashboard", href: "/officer", icon: LayoutDashboard, exact: true },
      { name: "Scan Package", href: "/officer/scan", icon: ScanLine },
      { name: "Seizure Reports", href: "/officer/reports", icon: FileText },
      { name: "Verified Products", href: "/officer/products", icon: Package },
      { name: "Ask METRA", href: "/assistant", icon: Bot },
    ],
    quickAction: {
      label: "New Scan",
      href: "/officer/scan",
      icon: ScanLine,
      bg: "bg-[#8a5d00] hover:bg-[#704b00]",
      text: "text-white",
    },
    isDark: false,
  },
  vendor: {
    portalName: "Pre-Market Vendor Portal",
    departmentTag: "Legal Metrology Packaging Verification",
    badgeLabel: "Compliance Lead",
    badgeBg: "bg-[#fff3df]",
    badgeText: "text-[#b9781a]",
    badgeBorder: "border-[#f7dcb0]",
    activeNavBg: "bg-[#fff3df]",
    activeNavText: "text-[#b9781a]",
    activeIndicator: "bg-[#b9781a]",
    navItems: [
      { name: "Overview", href: "/vendor", icon: LayoutDashboard, exact: true },
      { name: "Pre-Market Check", href: "/vendor/self-check", icon: ShieldCheck },
      { name: "Compliance Cases", href: "/vendor/cases", icon: AlertCircle },
      { name: "Commodity Catalog", href: "/vendor/products", icon: Package },
      { name: "PCR 2011 Guidance", href: "/vendor/guidance", icon: HelpCircle },
      { name: "Ask METRA", href: "/assistant", icon: Bot },
    ],
    quickAction: {
      label: "Self-Check",
      href: "/vendor/self-check",
      icon: ShieldCheck,
      bg: "bg-[#b9781a] hover:bg-[#996315]",
      text: "text-white",
    },
    isDark: false,
  },
  consumer: {
    portalName: "Citizen Consumer Portal",
    departmentTag: "Ministry of Consumer Affairs · Citizen Protection",
    badgeLabel: "Citizen Account",
    badgeBg: "bg-[#e5f8ef]",
    badgeText: "text-[#159a68]",
    badgeBorder: "border-[#bfe9d5]",
    activeNavBg: "bg-[#e5f8ef]",
    activeNavText: "text-[#159a68]",
    activeIndicator: "bg-[#159a68]",
    navItems: [
      { name: "Dashboard", href: "/consumer", icon: LayoutDashboard, exact: true },
      { name: "Product Lookup", href: "/consumer/lookup", icon: Search },
      { name: "Report Violation", href: "/consumer/report", icon: ShieldAlert },
      { name: "Safety Alerts", href: "/consumer/alerts", icon: Bell },
      { name: "History", href: "/consumer/history", icon: History },
      { name: "Ask METRA", href: "/assistant", icon: Bot },
    ],
    quickAction: {
      label: "Report Violation",
      href: "/consumer/report",
      icon: ShieldAlert,
      bg: "bg-[#159a68] hover:bg-[#0e6e4a]",
      text: "text-white",
    },
    isDark: false,
  },
  headquarters: {
    portalName: "National Directorate HQ",
    departmentTag: "Legal Metrology Central Governance & Policy",
    badgeLabel: "HQ Directorate",
    badgeBg: "bg-amber-400/20",
    badgeText: "text-amber-300",
    badgeBorder: "border-amber-400/30",
    activeNavBg: "bg-slate-800",
    activeNavText: "text-amber-300",
    activeIndicator: "bg-amber-400",
    navItems: [
      { name: "Overview", href: "/headquarters", icon: BarChart3, exact: true },
      { name: "Field Officers", href: "/headquarters/officers", icon: Users2 },
      { name: "Repeat Offenders", href: "/headquarters/leaderboard", icon: AlertTriangle },
      { name: "Enforcement Leads", href: "/headquarters/leads", icon: FileText },
      { name: "Rule Matrix", href: "/headquarters/rules", icon: Settings },
      { name: "Ask METRA", href: "/assistant", icon: Bot },
    ],
    quickAction: {
      label: "Review Officers",
      href: "/headquarters/officers",
      icon: Users2,
      bg: "bg-amber-500 hover:bg-amber-600",
      text: "text-slate-950",
    },
    isDark: true,
  },
};

interface RoleTopNavbarProps {
  role: RoleType;
}

export default function RoleTopNavbar({ role }: RoleTopNavbarProps) {
  const pathname = usePathname();
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const config = ROLE_CONFIGS[role];
  const isDark = config.isDark;

  const isNavActive = (item: NavItem) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  const displayName =
    user?.fullName ||
    (user?.firstName ? `${user.firstName} ${user.lastName || ""}` : null) ||
    (role === "officer"
      ? "Enforcement Inspector"
      : role === "vendor"
      ? "Compliance Partner"
      : role === "headquarters"
      ? "HQ Director"
      : "Citizen User");

  const QuickActionIcon = config.quickAction?.icon;

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors ${
        isDark
          ? "bg-slate-900 border-b border-slate-800 text-slate-100"
          : "bg-white border-b border-[#dce7f2] text-[#10243e] shadow-xs"
      }`}
    >
      {/* UX4G Official Top Tricolor Accent Strip */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#ff9933] via-white to-[#138808]" />

      <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-[68px] flex items-center justify-between gap-4">
          {/* 1. LEFT: DEPARTMENT BRANDING */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href={`/${role}`} className="flex items-center gap-3 group">
              <div className="w-[38px] h-[38px] rounded-[10px] overflow-hidden shadow-[0_4px_12px_rgba(8,103,201,0.18)] group-hover:scale-105 transition-transform shrink-0">
                <Image
                  src="/METRA-closeup.png"
                  alt="METRA"
                  width={38}
                  height={38}
                  className="object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[17px] font-extrabold tracking-[0.06em] leading-tight block">
                    METRA
                  </span>
                  <span
                    className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
                  >
                    {config.badgeLabel}
                  </span>
                </div>
                <span
                  className={`block text-[11px] leading-tight line-clamp-1 ${
                    isDark ? "text-slate-400" : "text-[#62738a]"
                  }`}
                >
                  {config.departmentTag}
                </span>
              </div>
            </Link>
          </div>

          {/* 2. CENTER: PRIMARY NAVIGATION (DESKTOP) */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2">
            {config.navItems.map((item) => {
              const active = isNavActive(item);
              const ItemIcon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-[9px] text-[13px] font-medium transition-all ${
                    active
                      ? `${config.activeNavBg} ${config.activeNavText} font-bold shadow-xs`
                      : isDark
                      ? "text-slate-300 hover:text-white hover:bg-slate-800/70"
                      : "text-[#43566d] hover:text-[#10243e] hover:bg-[#f0f4f9]"
                  }`}
                >
                  <ItemIcon
                    className={`w-4 h-4 ${
                      active
                        ? config.activeNavText
                        : isDark
                        ? "text-slate-400"
                        : "text-[#62738a]"
                    }`}
                  />
                  <span>{item.name}</span>
                  {active && (
                    <span
                      className={`absolute -bottom-[15px] left-3 right-3 h-[2.5px] rounded-full ${config.activeIndicator}`}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 3. RIGHT: ACTIONS & ACCOUNT MENU */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Role-Specific Quick Action CTA */}
            {config.quickAction && (
              <Link
                href={config.quickAction.href}
                className={`hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[9px] text-[12px] font-bold shadow-xs transition-all hover:opacity-95 ${config.quickAction.bg} ${config.quickAction.text}`}
              >
                {QuickActionIcon && <QuickActionIcon className="w-3.5 h-3.5" />}
                <span>{config.quickAction.label}</span>
              </Link>
            )}

            {/* Notifications */}
            <div className="relative">
              <NotificationBell />
            </div>

            {/* Account Profile / User Menu */}
            <div
              className={`flex items-center gap-2.5 pl-3 border-l ${
                isDark ? "border-slate-800" : "border-[#dce7f2]"
              }`}
            >
              <div className="text-right hidden sm:block">
                <p
                  className={`text-[12px] font-bold leading-tight line-clamp-1 max-w-[140px] ${
                    isDark ? "text-slate-100" : "text-[#10243e]"
                  }`}
                >
                  {displayName}
                </p>
                <p
                  className={`text-[10px] font-medium leading-tight ${
                    isDark ? "text-amber-400" : config.badgeText
                  }`}
                >
                  {config.badgeLabel}
                </p>
              </div>

              {isSignedIn ? (
                <UserButton
                  userProfileMode="modal"
                  appearance={{
                    elements: {
                      avatarBox: `w-8 h-8 rounded-full ring-2 ${
                        isDark ? "ring-amber-400/40" : "ring-[#0867c9]/20"
                      }`,
                    },
                  }}
                />
              ) : (
                <Link
                  href="/sign-in"
                  className={`text-[12px] font-bold px-3 py-1 rounded-[8px] border transition ${
                    isDark
                      ? "border-slate-700 text-slate-200 hover:bg-slate-800"
                      : "border-[#dce7f2] text-[#0867c9] hover:bg-[#f0f4f9]"
                  }`}
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg border transition ${
                isDark
                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                  : "border-[#dce7f2] text-[#43566d] hover:bg-[#f0f4f9]"
              }`}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE COLLAPSIBLE DRAWER */}
      {mobileMenuOpen && (
        <div
          className={`lg:hidden border-t px-4 py-4 space-y-2 ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-[#dce7f2]"
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Primary Navigation
          </div>
          {config.navItems.map((item) => {
            const active = isNavActive(item);
            const ItemIcon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition ${
                  active
                    ? `${config.activeNavBg} ${config.activeNavText} font-bold`
                    : isDark
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-[#43566d] hover:bg-[#f0f4f9]"
                }`}
              >
                <ItemIcon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {config.quickAction && (
            <div className="pt-2">
              <Link
                href={config.quickAction.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-[13px] font-bold ${config.quickAction.bg} ${config.quickAction.text}`}
              >
                {QuickActionIcon && <QuickActionIcon className="w-4 h-4" />}
                <span>{config.quickAction.label}</span>
              </Link>
            </div>
          )}

          <div
            className={`pt-3 mt-3 border-t flex items-center justify-between text-[12px] ${
              isDark ? "border-slate-800 text-slate-400" : "border-[#dce7f2] text-[#62738a]"
            }`}
          >
            <span>{displayName}</span>
            <button
              onClick={() => signOut({ redirectUrl: "/sign-in" })}
              className="flex items-center gap-1 font-bold text-[#c84c54] hover:underline"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
