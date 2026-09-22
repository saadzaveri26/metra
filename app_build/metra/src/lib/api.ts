/**
 * METRA — Shared API configuration
 *
 * Centralizes the backend API base URL so that every fetch() call
 * in the frontend uses the same configurable origin, avoiding
 * hardcoded localhost:8000 references that break on deployment.
 */

export const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1"
).replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "") + "/api/v1";

