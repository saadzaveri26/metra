"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  History,
  Search,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  User,
  LogIn,
} from "lucide-react";

export default function ConsumerHistoryPage() {
  const { isSignedIn } = useUser();

  const [historyItems] = useState([
    {
      id: "scan-01",
      type: "scan",
      name: "Organic Mountain Honey 500g",
      barcode: "8901234567890",
      date: "14 Sep 2026, 11:30 AM",
      status: "COMPLIANT",
      nutriscore: "C",
    },
    {
      id: "scan-02",
      type: "scan",
      name: "Whole Wheat Sharbati Atta 5kg",
      barcode: "8901030383748",
      date: "12 Sep 2026, 06:15 PM",
      status: "COMPLIANT",
      nutriscore: "A",
    },
    {
      id: "rep-01",
      type: "report",
      name: "Classic Masala Potato Chips 70g",
      barcode: "8901725131209",
      date: "10 Sep 2026, 02:40 PM",
      status: "Unverified Lead Submitted",
      violation: "Overcharging above printed MRP",
    },
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#10243e] tracking-tight">
          My Activity &amp; Verification History
        </h1>
        <p className="text-xs text-slate-500">
          Personal record of product compliance lookups and citizen reports filed
        </p>
      </div>

      {!isSignedIn && (
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-xl p-5 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-blue-200 flex items-center justify-center text-[#0867c9] shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#10243e]">
                Sign In to Save Your Activity Across Devices
              </h3>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Anonymous lookups are completely private. Create a free citizen account to keep track of your complaint dockets and product checks.
              </p>
            </div>
          </div>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0867c9] hover:bg-[#0753a0] text-white text-xs font-semibold shadow shrink-0 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In / Sign Up</span>
          </Link>
        </div>
      )}

      {/* History Timeline */}
      <div className="bg-white rounded-xl border border-[#dce7f2] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#dce7f2] bg-[#f8fafc] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#10243e] uppercase tracking-wider">
            Recent Product Lookups &amp; Reports
          </h3>
          <span className="text-[11px] text-slate-400">Personal Log</span>
        </div>

        <div className="divide-y divide-slate-100">
          {historyItems.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    item.type === "scan"
                      ? "bg-[#e8f8f0] text-[#159a68]"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {item.type === "scan" ? (
                    <Search className="w-4 h-4" />
                  ) : (
                    <ShieldAlert className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#10243e]">{item.name}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="font-mono">{item.barcode}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.date}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {item.type === "scan" ? (
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#e8f8f0] text-[#159a68]">
                      <CheckCircle2 className="w-3 h-3" />
                      Compliant
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Nutri-Score: <span className="font-bold text-slate-700">{item.nutriscore}</span>
                    </p>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    {item.status}
                  </span>
                )}

                <Link
                  href={`/consumer/lookup?barcode=${item.barcode}`}
                  className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
