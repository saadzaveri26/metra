# Skill: send_notifications

## Purpose
Automatically email a company/seller when a case is created with a compliance failure (mentor-directed requirement).

## Process
1. New module: `app_build/metra/backend/notifications.py`.
2. Trigger point: case verdict is `NON_COMPLIANT` (or `NEEDS_REVIEW`, per team decision) — call from the existing case-creation flow, don't duplicate case logic.
3. Email content: violation summary, rule clause(s) breached, evidence reference (link or attached PDF), factual and professional tone.
4. Sender: Resend recommended (generous free tier, better deliverability than raw SMTP for a live demo) — `fastapi-mail`/`smtplib` as fallback.
5. Recipient: pulled from the BUSINESS table — never hardcoded. Mandatory `DEMO_MODE` flag redirects all emails to a team-controlled test inbox during rehearsals and judging.

## Rules
- Never send to a real, uninvolved email address during development or demo — DEMO_MODE redirect is mandatory.
- Never put email credentials/API keys directly in code — use environment variables.
- Log every sent notification (recipient, case ID, timestamp) for auditability.
