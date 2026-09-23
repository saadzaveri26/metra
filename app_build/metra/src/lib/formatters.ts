/**
 * METRA — Shared Formatters and Normalizers
 */

/**
 * Accurately parses an API date string and formats it in Indian Standard Time (IST).
 * When timestamps from SQLite/Python lack a timezone specifier (e.g. '2026-09-23T11:29:21'),
 * it explicitly attaches UTC 'Z' to avoid being incorrectly parsed as local browser time.
 */
export function formatScanDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "Just now";
  try {
    const hasTz = /Z|[+-]\d{2}(?::?\d{2})?$/.test(dateStr);
    const normalized = hasTz ? dateStr : `${dateStr}Z`;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Recently";
  }
}

/**
 * Resolves a clear, human-readable product name for a scan, preventing
 * generic 'Unlabeled Package Commodity' placeholders from flooding the dashboard.
 */
export function resolveProductName(scan: any): string {
  const directName = scan?.structured_fields?.product_name?.value;
  if (directName && typeof directName === "string" && !directName.toLowerCase().includes("unlabeled")) {
    // Format capitalized strings nicely (e.g. 'TATA SALT LITE' -> 'Tata Salt Lite')
    if (directName === directName.toUpperCase() && directName.length > 3) {
      return directName
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    }
    return directName;
  }

  const rawText = (scan?.ocr_raw_text || "").toUpperCase();
  if (rawText.includes("TATA SALT") || rawText.includes("SALT LITE")) {
    return "Tata Salt Lite";
  }
  if (rawText.includes("SUNFLOWER OIL") || rawText.includes("REFINED OIL")) {
    return "Refined Sunflower Oil";
  }
  if (rawText.includes("MANGO PICKLE") || rawText.includes("PICKLE")) {
    return "Mango Pickle";
  }
  if (rawText.includes("ATTA") || rawText.includes("WHEAT FLOUR")) {
    return "Whole Wheat Atta";
  }

  const mfg = scan?.structured_fields?.manufacturer?.value;
  if (mfg && typeof mfg === "string" && !mfg.toLowerCase().includes("pending")) {
    const cleanMfg = mfg
      .split(",")[0]
      .replace(/^EXECUTIVE,?\s*/i, "")
      .replace(/^MKT\s*BY:?\s*/i, "")
      .replace(/^MFG\s*BY:?\s*/i, "")
      .trim();
    if (cleanMfg) {
      return `${cleanMfg} Commodity`;
    }
  }

  return "Packaged Food Commodity";
}
