/** Redact secrets and PII before logs leave the process. */

const REDACT_KEY_PATTERN =
  /^(password|passwd|pwd|secret|token|authorization|auth|api[_-]?key|credential|jwt|bearer|otp|code|signature|razorpay|webhook|private[_-]?key|access[_-]?key|secret[_-]?key|refresh[_-]?token|id[_-]?token|session[_-]?token|cookie|set-cookie|x-internal-secret|imagebase64|image[_-]?base64|rawbody|pdfbytes)$/i;

const REDACT_VALUE_PATTERN =
  /^(Bearer\s+|Basic\s+|sk-|gsk_|re_|whsec_|glc_|AIza|AQ\.)/i;

export function redactEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "[redacted-email]";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const maskedLocal =
    local.length <= 1 ? "*" : `${local[0]}${"*".repeat(Math.min(local.length - 1, 6))}`;
  return `${maskedLocal}@${domain}`;
}

function redactString(value: string, key?: string): string {
  if (key && REDACT_KEY_PATTERN.test(key)) return "[redacted]";
  if (REDACT_VALUE_PATTERN.test(value.trim())) return "[redacted]";
  if (value.length > 512 && /base64/i.test(key ?? "")) return `[redacted:${value.length}b]`;
  if (value.startsWith("data:image/")) return "[redacted:data-url]";
  if (key?.toLowerCase().includes("email") && value.includes("@")) {
    return redactEmail(value);
  }
  return value;
}

export function sanitizeLogFields(
  fields?: Record<string, unknown>
): Record<string, unknown> {
  if (!fields) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    out[key] = sanitizeLogValue(value, key);
  }
  return out;
}

export function sanitizeLogValue(value: unknown, key?: string): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return redactString(value, key);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.map((item, index) => sanitizeLogValue(item, `${key ?? "item"}[${index}]`));
  }
  if (value instanceof Error) {
    return {
      errName: value.name,
      errMessage: value.message,
    };
  }
  if (typeof value === "object") {
    return sanitizeLogFields(value as Record<string, unknown>);
  }
  return String(value);
}

export function clientIpFromRequest(headers: Record<string, unknown>): string | undefined {
  const forwarded = headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]?.trim();
  }
  const realIp = headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) return realIp.trim();
  return undefined;
}
