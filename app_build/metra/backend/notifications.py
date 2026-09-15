"""
METRA Notification Engine.
Handles statutory compliance notices, vendor advisories, officer credential confirmations,
and lead assignment dispatches.

GROUND RULE:
Notification emails route to DEMO_MODE test inbox until explicitly enabled.
When EMAIL_DEMO_MODE is True, all outgoing emails are intercepted and stored in
the demo test inbox with their original intended recipient preserved in metadata.
"""
import os
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from config import settings

DEMO_INBOX_FILE = os.path.join(os.path.dirname(__file__), "notifications_demo_inbox.jsonl")

# In-memory cache for fast lookup
_IN_MEMORY_INBOX: List[Dict[str, Any]] = []


def _load_inbox_from_disk() -> None:
    global _IN_MEMORY_INBOX
    _IN_MEMORY_INBOX = []
    if os.path.exists(DEMO_INBOX_FILE):
        try:
            with open(DEMO_INBOX_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line:
                        _IN_MEMORY_INBOX.append(json.loads(line))
        except Exception as e:
            print(f"[NOTIFICATIONS] Warning reading demo inbox file: {e}")


def _save_notification_to_disk(notification: Dict[str, Any]) -> None:
    try:
        with open(DEMO_INBOX_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(notification) + "\n")
    except Exception as e:
        print(f"[NOTIFICATIONS] Warning writing to demo inbox file: {e}")


# Initialize on import
_load_inbox_from_disk()


def get_demo_inbox(template: Optional[str] = None, search: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    """Returns stored demo notifications sorted newest first."""
    items = list(_IN_MEMORY_INBOX)
    if template:
        items = [i for i in items if i.get("template") == template]
    if search:
        s = search.lower()
        items = [
            i for i in items
            if s in i.get("subject", "").lower()
            or s in i.get("intended_for", "").lower()
            or s in i.get("recipient_name", "").lower()
            or s in i.get("snippet", "").lower()
        ]
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items[:limit]


def get_notification_by_id(notification_id: str) -> Optional[Dict[str, Any]]:
    for item in _IN_MEMORY_INBOX:
        if item.get("id") == notification_id:
            return item
    return None


def clear_demo_inbox() -> int:
    """Clears the demo inbox in memory and on disk."""
    global _IN_MEMORY_INBOX
    count = len(_IN_MEMORY_INBOX)
    _IN_MEMORY_INBOX = []
    try:
        if os.path.exists(DEMO_INBOX_FILE):
            os.remove(DEMO_INBOX_FILE)
    except Exception as e:
        print(f"[NOTIFICATIONS] Warning clearing demo inbox file: {e}")
    return count


def _build_html_template(
    title: str,
    badge_text: str,
    badge_color: str,
    recipient_name: str,
    body_html: str,
    action_text: Optional[str] = None,
    action_url: Optional[str] = None,
    statutory_footer: str = "Legal Metrology Enforcement System (METRA) • Department of Consumer Affairs • Government of India",
) -> str:
    """Generates consistent, professional government notification emails."""
    btn_html = ""
    if action_text and action_url:
        btn_html = f"""
        <div style="margin: 28px 0; text-align: center;">
            <a href="{action_url}" style="background: #1e3a8a; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                {action_text} &rarr;
            </a>
        </div>
        """

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #0f172a;">
    <div style="max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background: #0f172a; padding: 24px; color: #ffffff; border-bottom: 3px solid #f59e0b;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <span style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; font-weight: 700;">Legal Metrology Enforcement Wing</span>
                    <h1 style="margin: 4px 0 0 0; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">METRA</h1>
                </div>
                <div style="background: {badge_color}; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
                    {badge_text}
                </div>
            </div>
        </div>

        <!-- Body -->
        <div style="padding: 32px 28px;">
            <p style="font-size: 15px; margin-top: 0; color: #334155;">Dear <strong>{recipient_name}</strong>,</p>
            {body_html}
            {btn_html}
        </div>

        <!-- Statutory Notice Banner -->
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; font-size: 12px; color: #64748b; line-height: 1.5;">
            <strong>Statutory Reference:</strong> The Legal Metrology Act, 2009 &amp; The Legal Metrology (Packaged Commodities) Rules, 2011.<br>
            {statutory_footer}
        </div>
    </div>
</body>
</html>"""


def render_template(template: str, recipient_name: str, data: Dict[str, Any]) -> Dict[str, str]:
    """
    Renders HTML, Plain-text and Subject line for supported notification templates:
    1. case_notice (Rule 32 statutory show-cause notice)
    2. vendor_advisory (Pre-market compliance guidance)
    3. lead_assignment (Field inspection triage assignment)
    4. officer_verified (Field officer credential verification)
    """
    now_str = datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p UTC")

    if template == "case_notice":
        case_id = data.get("case_id", "CAS-UNKNOWN")
        mfg = data.get("manufacturer_name", "Unknown Manufacturer")
        risk_score = data.get("risk_score", 0)
        overall_status = data.get("overall_status", "NON_COMPLIANT")
        violations = data.get("violations", [])
        deadline_days = data.get("deadline_days", 15)

        subject = f"[METRA STATUTORY NOTICE] Show-Cause Notice Issued: Case #{case_id} ({mfg})"
        badge_text = "Rule 32 Statutory Notice"
        badge_color = "#dc2626"

        v_items = "".join([f"<li style='margin-bottom: 6px;'><strong>{v.get('rule', 'Rule')}:</strong> {v.get('reason', 'Statutory infraction detected')}</li>" for v in violations]) if violations else "<li>Mandatory declaration non-compliance under Legal Metrology Rules, 2011.</li>"

        body_html = f"""
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            This is an official statutory notice under <strong>Rule 32 of The Legal Metrology (Packaged Commodities) Rules, 2011</strong>.
            A field inspection has identified critical non-compliance on commodities packaged or marketed by <strong>{mfg}</strong>.
        </p>

        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <div style="font-size: 13px; font-weight: 700; color: #991b1b; margin-bottom: 8px;">CASE PARTICULARS:</div>
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr><td style="color: #64748b; padding: 3px 0;">Case Number:</td><td style="font-weight: 600; color: #0f172a;">{case_id}</td></tr>
                <tr><td style="color: #64748b; padding: 3px 0;">Compliance Status:</td><td style="font-weight: 700; color: #dc2626;">{overall_status}</td></tr>
                <tr><td style="color: #64748b; padding: 3px 0;">Assessed Risk Score:</td><td style="font-weight: 700; color: #b91c1c;">{risk_score}/100</td></tr>
                <tr><td style="color: #64748b; padding: 3px 0;">Reply Deadline:</td><td style="font-weight: 700; color: #0f172a;">Within {deadline_days} days of receipt</td></tr>
            </table>
        </div>

        <div style="font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 8px;">IDENTIFIED STATUTORY INFRACTIONS:</div>
        <ul style="font-size: 13px; color: #475569; padding-left: 20px; line-height: 1.5;">
            {v_items}
        </ul>

        <p style="font-size: 13px; color: #475569; line-height: 1.6;">
            Failure to submit a formal defense or voluntary compounding application through the METRA Vendor Portal within the stipulated period may result in seizure of non-compliant packaged stock under Section 15 of The Legal Metrology Act, 2009.
        </p>
        """

        plain_text = (
            f"METRA STATUTORY NOTICE - Rule 32 Show-Cause Notice\n"
            f"Case: {case_id}\n"
            f"Manufacturer: {mfg}\n"
            f"Status: {overall_status} (Risk Score: {risk_score}/100)\n"
            f"Reply Deadline: {deadline_days} days\n\n"
            f"Submit formal defense via METRA Vendor Portal."
        )

        html = _build_html_template(
            title=subject,
            badge_text=badge_text,
            badge_color=badge_color,
            recipient_name=recipient_name,
            body_html=body_html,
            action_text="View Case File & Submit Reply",
            action_url=f"http://localhost:3000/vendor/cases",
        )

    elif template == "vendor_advisory":
        brand = data.get("brand_name", "Commodity Vendor")
        scan_ref = data.get("scan_ref", "SCN-RECENT")
        issues_count = data.get("issues_count", 1)

        subject = f"[METRA Pre-Market Advisory] Label Verification Feedback: {brand}"
        badge_text = "Pre-Market Guidance"
        badge_color = "#f59e0b"

        body_html = f"""
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Your recent pre-market packaging audit (Ref: <strong>{scan_ref}</strong>) has identified <strong>{issues_count} compliance advisories</strong> before dispatch.
        </p>
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="font-size: 13px; color: #92400e; margin: 0; line-height: 1.5;">
                <strong>Self-Check Protection:</strong> Because this scan was performed in the Vendor Self-Audit portal, no statutory violation has been registered against your business account.
            </p>
        </div>
        <p style="font-size: 13px; color: #475569; line-height: 1.6;">
            Please download the corrective guidance report and ensure all mandatory declarations (such as MRP font height, net weight decimal standardization, and manufacturer contact) conform to statutory standards prior to commercial distribution.
        </p>
        """

        plain_text = (
            f"METRA Pre-Market Packaging Advisory\n"
            f"Brand: {brand} | Scan Ref: {scan_ref}\n"
            f"Advisories Detected: {issues_count}\n"
            f"Review your self-check report in the Vendor Portal."
        )

        html = _build_html_template(
            title=subject,
            badge_text=badge_text,
            badge_color=badge_color,
            recipient_name=recipient_name,
            body_html=body_html,
            action_text="Open Vendor Portal",
            action_url="http://localhost:3000/vendor",
        )

    elif template == "lead_assignment":
        lead_id = data.get("lead_id", "REP-UNKNOWN")
        product = data.get("product_name", "Packaged Commodity")
        retailer = data.get("retailer_name", "Retail Store")
        state_region = data.get("state_region", "Regional Jurisdiction")
        priority = data.get("priority", "HIGH")

        subject = f"[METRA Field Assignment] Citizen Lead #{lead_id} Triaged: {product}"
        badge_text = f"Lead Priority: {priority}"
        badge_color = "#2563eb"

        body_html = f"""
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Headquarters Enforcement Directorate has assigned a verified citizen grievance to your field division for physical verification:
        </p>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr><td style="color: #64748b; padding: 3px 0;">Lead Tracking ID:</td><td style="font-weight: 600; color: #0f172a;">{lead_id}</td></tr>
                <tr><td style="color: #64748b; padding: 3px 0;">Product Target:</td><td style="font-weight: 600; color: #0f172a;">{product}</td></tr>
                <tr><td style="color: #64748b; padding: 3px 0;">Target Retailer:</td><td style="font-weight: 600; color: #0f172a;">{retailer}</td></tr>
                <tr><td style="color: #64748b; padding: 3px 0;">Jurisdiction:</td><td style="font-weight: 600; color: #0f172a;">{state_region}</td></tr>
            </table>
        </div>
        <p style="font-size: 13px; color: #475569; line-height: 1.6;">
            Please conduct a physical shelf-audit, scan packaging using the METRA Officer Mobile/Web interface, and file your inspection report within 48 hours.
        </p>
        """

        plain_text = (
            f"METRA Field Lead Assignment\n"
            f"Lead ID: {lead_id}\n"
            f"Product: {product}\n"
            f"Retailer: {retailer}\n"
            f"Jurisdiction: {state_region}\n"
            f"Log in to the Officer Portal to view full complaint dossier."
        )

        html = _build_html_template(
            title=subject,
            badge_text=badge_text,
            badge_color=badge_color,
            recipient_name=recipient_name,
            body_html=body_html,
            action_text="Review Lead Dossier",
            action_url="http://localhost:3000/officer",
        )

    elif template == "officer_verified":
        officer_name = data.get("officer_name", recipient_name)
        gov_id = data.get("gov_id", "LM-FIELD-VERIFIED")
        state_region = data.get("state_region", "All India")

        subject = f"[METRA Authorization] Officer Credentials Verified: {officer_name}"
        badge_text = "Credential Verified"
        badge_color = "#16a34a"

        body_html = f"""
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Your Legal Metrology Field Inspector credentials have been successfully reviewed and verified by Central Enforcement Headquarters.
        </p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr><td style="color: #64748b; padding: 3px 0;">Authorized Officer:</td><td style="font-weight: 600; color: #0f172a;">{officer_name}</td></tr>
                <tr><td style="color: #64748b; padding: 3px 0;">Government ID / Badge:</td><td style="font-weight: 600; color: #0f172a;">{gov_id}</td></tr>
                <tr><td style="color: #64748b; padding: 3px 0;">Assigned Jurisdiction:</td><td style="font-weight: 600; color: #0f172a;">{state_region}</td></tr>
                <tr><td style="color: #64748b; padding: 3px 0;">Enforcement Powers:</td><td style="font-weight: 700; color: #16a34a;">Active • Full Inspection Authority</td></tr>
            </table>
        </div>
        <p style="font-size: 13px; color: #475569; line-height: 1.6;">
            You can now generate official evidentiary inspection reports and initiate statutory compounding notices under Rule 32 directly from your METRA officer terminal.
        </p>
        """

        plain_text = (
            f"METRA Officer Credential Verification\n"
            f"Officer: {officer_name}\n"
            f"Badge: {gov_id}\n"
            f"Jurisdiction: {state_region}\n"
            f"Access your Officer Terminal to begin inspections."
        )

        html = _build_html_template(
            title=subject,
            badge_text=badge_text,
            badge_color=badge_color,
            recipient_name=recipient_name,
            body_html=body_html,
            action_text="Access Officer Terminal",
            action_url="http://localhost:3000/officer",
        )

    else:
        # Generic fallback
        subject = f"[METRA Notification] {data.get('subject', 'Official Notice')}"
        badge_text = "System Advisory"
        badge_color = "#64748b"
        content = data.get("message", "You have received an official notification from the METRA Enforcement Network.")
        body_html = f"<p style='font-size: 14px; line-height: 1.6; color: #334155;'>{content}</p>"
        plain_text = content
        html = _build_html_template(
            title=subject,
            badge_text=badge_text,
            badge_color=badge_color,
            recipient_name=recipient_name,
            body_html=body_html,
        )

    return {
        "subject": subject,
        "badge_text": badge_text,
        "badge_color": badge_color,
        "html": html,
        "plain_text": plain_text,
    }


def send_notification(
    template: str,
    to_email: str,
    recipient_name: str,
    data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Core notification dispatcher.
    Adheres strictly to GROUND RULE:
    Notification emails route to DEMO_MODE test inbox until explicitly enabled.
    """
    rendered = render_template(template, recipient_name, data)
    notification_id = f"notif_{uuid.uuid4().hex[:12]}"
    created_at = datetime.now(timezone.utc).isoformat()

    # Create snippet for fast UI previews
    snippet = rendered["plain_text"].split("\n")[0][:120]

    record = {
        "id": notification_id,
        "template": template,
        "intended_for": to_email,
        "recipient_name": recipient_name,
        "from_email": settings.FROM_EMAIL,
        "delivered_to": settings.EMAIL_TEST_INBOX if settings.EMAIL_DEMO_MODE else to_email,
        "demo_mode": settings.EMAIL_DEMO_MODE,
        "subject": rendered["subject"],
        "badge_text": rendered["badge_text"],
        "badge_color": rendered["badge_color"],
        "snippet": snippet,
        "html_body": rendered["html"],
        "plain_text": rendered["plain_text"],
        "metadata": data,
        "created_at": created_at,
        "status": "delivered_to_test_inbox" if settings.EMAIL_DEMO_MODE else "dispatched",
    }

    if settings.EMAIL_DEMO_MODE:
        # Route to DEMO_MODE test inbox
        _IN_MEMORY_INBOX.insert(0, record)
        _save_notification_to_disk(record)
        print(f"[NOTIFICATION DEMO_MODE] Intercepted email intended for '{to_email}' -> routed to '{settings.EMAIL_TEST_INBOX}' (Subject: {rendered['subject']})")
        return {
            "success": True,
            "id": notification_id,
            "mode": "demo_mode",
            "delivered_to": settings.EMAIL_TEST_INBOX,
            "intended_for": to_email,
            "subject": rendered["subject"],
            "created_at": created_at,
        }
    else:
        # In production mode (when EMAIL_DEMO_MODE is False):
        # We can integrate Resend SDK / SMTP client here
        print(f"[NOTIFICATION PRODUCTION] Sending external email to {to_email}")
        _IN_MEMORY_INBOX.insert(0, record)
        _save_notification_to_disk(record)
        return {
            "success": True,
            "id": notification_id,
            "mode": "production",
            "delivered_to": to_email,
            "intended_for": to_email,
            "subject": rendered["subject"],
            "created_at": created_at,
        }
