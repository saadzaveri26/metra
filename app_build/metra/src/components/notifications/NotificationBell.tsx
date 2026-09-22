"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Mail, ShieldAlert, CheckCircle2, FileText, ArrowRight, ExternalLink, RefreshCw, Inbox } from "lucide-react";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

interface NotificationItem {
  id: string;
  template: string;
  intended_for: string;
  recipient_name: string;
  subject: string;
  badge_text: string;
  badge_color: string;
  snippet: string;
  html_body: string;
  created_at: string;
  status: string;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/notifications/inbox?limit=10`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.length);
      }
    } catch (err) {
      // Backend not running or network issue, silent fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getTemplateIcon = (template: string) => {
    switch (template) {
      case "case_notice":
        return <ShieldAlert className="w-4 h-4 text-red-500" />;
      case "vendor_advisory":
        return <FileText className="w-4 h-4 text-amber-500" />;
      case "officer_verified":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "lead_assignment":
        return <Mail className="w-4 h-4 text-blue-500" />;
      default:
        return <Inbox className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Statutory Notifications"
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus:outline-none"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
            <span className="sr-only">{unreadCount} notifications</span>
          </>
        )}
      </button>

      {/* Dropdown Flyout */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-white rounded-xl shadow-ux4g-3 border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Statutory Notices
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-wider">
                DEMO MODE
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchNotifications}
                title="Refresh notifications"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs text-blue-300 hover:text-white flex items-center gap-1 font-medium"
              >
                Console <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Safety Mode Notice */}
          <div className="bg-amber-50 border-b border-amber-200/80 px-3.5 py-2 text-[11px] text-amber-900 leading-tight">
            <strong>Ground Rule Enforced:</strong> Outgoing notices are captured in test inbox (<code className="font-mono text-[10px] text-amber-950">demo-test-inbox@metra.gov.in</code>).
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">No Captured Notices</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Notices will appear here when statutory actions or scans trigger them.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedNotification(item)}
                  className="p-3 hover:bg-slate-50 transition-colors cursor-pointer text-left group"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                      {getTemplateIcon(item.template)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold text-white uppercase tracking-tight"
                          style={{ backgroundColor: item.badge_color || "#2563eb" }}
                        >
                          {item.badge_text}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatTime(item.created_at)}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {item.subject}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        To: {item.recipient_name} ({item.intended_for})
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Link */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1.5"
            >
              Open Full Test Inbox &amp; Dispatch Simulator <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Quick Preview Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-ux4g-4 flex flex-col border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: selectedNotification.badge_color || "#2563eb" }}
                >
                  {selectedNotification.badge_text}
                </span>
                <h3 className="text-sm font-bold mt-1 text-slate-100 line-clamp-1">
                  {selectedNotification.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-sm"
              >
                &times; Close
              </button>
            </div>

            {/* Email Metadata Bar */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 text-xs text-slate-600 flex flex-wrap gap-y-1 gap-x-4">
              <div><strong>Intended Recipient:</strong> {selectedNotification.recipient_name} &lt;{selectedNotification.intended_for}&gt;</div>
              <div><strong>Delivered To:</strong> demo-test-inbox@metra.gov.in</div>
              <div><strong>Status:</strong> Intercepted (DEMO_MODE)</div>
            </div>

            {/* Rendered HTML View */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
              <div
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                dangerouslySetInnerHTML={{ __html: selectedNotification.html_body }}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between">
              <Link
                href="/notifications"
                onClick={() => setSelectedNotification(null)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                Go to Test Inbox Console &rarr;
              </Link>
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
