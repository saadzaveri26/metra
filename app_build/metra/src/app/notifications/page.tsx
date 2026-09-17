"use client";

import { useState, useEffect } from "react";
import {
  Inbox,
  Mail,
  ShieldAlert,
  CheckCircle2,
  FileText,
  RefreshCw,
  Trash2,
  Send,
  ExternalLink,
  Code,
  Eye,
  AlertTriangle,
  Search,
  Filter,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

interface NotificationItem {
  id: string;
  template: string;
  intended_for: string;
  recipient_name: string;
  from_email: string;
  delivered_to: string;
  demo_mode: boolean;
  subject: string;
  badge_text: string;
  badge_color: string;
  snippet: string;
  html_body: string;
  plain_text: string;
  metadata: Record<string, any>;
  created_at: string;
  status: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [templateFilter, setTemplateFilter] = useState("all");
  const [previewTab, setPreviewTab] = useState<"html" | "text" | "json">("html");
  const [sendingTest, setSendingTest] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchInbox = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/notifications/inbox?limit=100`);
      if (res.ok) {
        const data: NotificationItem[] = await res.json();
        setNotifications(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch inbox:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
  }, []);

  const handleSendTest = async (template: string) => {
    try {
      setSendingTest(true);
      setStatusMessage(null);
      let toEmail = "compliance@suvidhafoods.com";
      let recipientName = "Mr. Rajesh Singhania, Managing Director";

      if (template === "vendor_advisory") {
        toEmail = "quality@nutrifoods.in";
        recipientName = "NutriFoods Packaging Operations";
      } else if (template === "lead_assignment") {
        toEmail = "patil.r@doca.gov.in";
        recipientName = "Inspector R. Patil, Mumbai North";
      } else if (template === "officer_verified") {
        toEmail = "vikram.patel@doca.gov.in";
        recipientName = "Inspector Vikram Patel";
      }

      const res = await fetch(`${API_BASE}/api/v1/notifications/send-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          to_email: toEmail,
          recipient_name: recipientName,
          data: {},
        }),
      });

      if (res.ok) {
        setStatusMessage(`Test email (${template}) dispatched and intercepted into DEMO inbox.`);
        await fetchInbox();
      } else {
        setStatusMessage("Failed to dispatch test notification.");
      }
    } catch (err) {
      setStatusMessage("Error connecting to notification service.");
    } finally {
      setSendingTest(false);
    }
  };

  const handleClearInbox = async () => {
    if (!confirm("Are you sure you want to clear all test emails from the demo inbox?")) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/notifications/clear`, {
        method: "POST",
      });
      if (res.ok) {
        setNotifications([]);
        setSelectedId(null);
        setStatusMessage("Demo inbox cleared successfully.");
      }
    } catch (err) {
      console.error("Failed to clear inbox:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    const matchesTemplate = templateFilter === "all" || item.template === templateFilter;
    const matchesSearch =
      !searchQuery ||
      item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.intended_for.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.snippet.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTemplate && matchesSearch;
  });

  const selectedItem = notifications.find((n) => n.id === selectedId) || null;

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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Banner: Ground Rule Statutory Mode */}
      <div className="bg-amber-500 text-slate-950 px-6 py-2.5 flex items-center justify-between text-xs font-semibold shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />
          <span>
            <strong>STATUTORY GROUND RULE ENFORCED:</strong> All notification emails route to the DEMO_MODE test inbox (<code>demo-test-inbox@metra.gov.in</code>) until explicitly enabled in production. Real external recipient dispatch is bypassed.
          </span>
        </div>
        <span className="hidden md:inline-block px-2 py-0.5 rounded bg-slate-950 text-amber-400 text-[10px] uppercase tracking-wider font-bold">
          DEMO ENVIRONMENT
        </span>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Return to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Notification &amp; Email Dispatch Console
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  {notifications.length} Captured
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Legal Metrology Enforcement System (METRA) · Pass 9 Intercepted Notice Sandbox
              </p>
            </div>
          </div>

          {/* Quick Trigger Simulation Actions */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="text-xs font-bold text-slate-500 mr-1 hidden lg:inline">
              Dispatch Simulator:
            </div>
            <button
              onClick={() => handleSendTest("case_notice")}
              disabled={sendingTest}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>+ Rule 32 Notice</span>
            </button>
            <button
              onClick={() => handleSendTest("vendor_advisory")}
              disabled={sendingTest}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>+ Vendor Advisory</span>
            </button>
            <button
              onClick={() => handleSendTest("lead_assignment")}
              disabled={sendingTest}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>+ Field Lead</span>
            </button>
            <button
              onClick={() => handleSendTest("officer_verified")}
              disabled={sendingTest}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>+ Officer Verify</span>
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1" />

            <button
              onClick={fetchInbox}
              disabled={loading}
              title="Refresh Inbox"
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleClearInbox}
              disabled={loading || notifications.length === 0}
              title="Clear Demo Inbox"
              className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Status Alert */}
      {statusMessage && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-2 text-xs font-medium text-blue-900 flex items-center justify-between">
          <span>{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-blue-700 hover:text-blue-900 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Workspace Area: Master-Detail Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Email List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[calc(100vh-210px)] min-h-[500px]">
          {/* List Search & Filter Bar */}
          <div className="p-3 border-b border-slate-200 space-y-2 bg-slate-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipient, case ID, subject..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              {[
                { key: "all", label: "All Notices" },
                { key: "case_notice", label: "Rule 32" },
                { key: "vendor_advisory", label: "Advisories" },
                { key: "lead_assignment", label: "Leads" },
                { key: "officer_verified", label: "Credentials" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setTemplateFilter(tab.key)}
                  className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                    templateFilter === tab.key
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="py-16 px-4 text-center">
                <Inbox className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Inbox is Empty</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Use the "+ Rule 32 Notice" or other simulator buttons above to trigger demo notifications.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50/80 border-l-4 border-blue-600"
                        : "hover:bg-slate-50 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-white shadow-xs border border-slate-200">
                        {getTemplateIcon(item.template)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold text-white uppercase tracking-tight"
                            style={{ backgroundColor: item.badge_color || "#2563eb" }}
                          >
                            {item.badge_text}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(item.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <h4
                          className={`text-xs font-bold line-clamp-1 ${
                            isSelected ? "text-blue-900" : "text-slate-900"
                          }`}
                        >
                          {item.subject}
                        </h4>
                        <p className="text-[11px] font-medium text-slate-600 truncate mt-0.5">
                          Intended for: <span className="font-semibold text-slate-800">{item.recipient_name}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 truncate font-mono">
                          &lt;{item.intended_for}&gt;
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Email Preview Frame (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[calc(100vh-210px)] min-h-[500px]">
          {selectedItem ? (
            <>
              {/* Header Bar */}
              <div className="p-4 border-b border-slate-200 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                        style={{ backgroundColor: selectedItem.badge_color || "#2563eb" }}
                      >
                        {selectedItem.badge_text}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ID: {selectedItem.id}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900">
                      {selectedItem.subject}
                    </h2>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                    <button
                      onClick={() => setPreviewTab("html")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
                        previewTab === "html"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" /> HTML View
                    </button>
                    <button
                      onClick={() => setPreviewTab("text")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
                        previewTab === "text"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" /> Text
                    </button>
                    <button
                      onClick={() => setPreviewTab("json")}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
                        previewTab === "json"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" /> Metadata
                    </button>
                  </div>
                </div>

                {/* Envelope Metadata Card */}
                <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400">From:</span>{" "}
                    <span className="font-mono text-slate-800">{selectedItem.from_email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Intended Recipient:</span>{" "}
                    <span className="font-semibold text-slate-800">{selectedItem.recipient_name}</span>{" "}
                    <span className="font-mono text-slate-600">({selectedItem.intended_for})</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Delivered To:</span>{" "}
                    <span className="font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                      {selectedItem.delivered_to}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Timestamp:</span>{" "}
                    <span className="text-slate-800 font-mono">
                      {new Date(selectedItem.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Body Content Preview */}
              <div className="flex-1 overflow-y-auto bg-slate-100 p-4">
                {previewTab === "html" && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-2xl mx-auto">
                    <div dangerouslySetInnerHTML={{ __html: selectedItem.html_body }} />
                  </div>
                )}

                {previewTab === "text" && (
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-inner max-w-2xl mx-auto">
                    {selectedItem.plain_text}
                  </div>
                )}

                {previewTab === "json" && (
                  <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-inner max-w-2xl mx-auto">
                    {JSON.stringify(selectedItem.metadata, null, 2)}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
              <Mail className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-700">No Email Selected</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Select an email notice from the inbox on the left to preview its rendered layout and statutory particulars.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
