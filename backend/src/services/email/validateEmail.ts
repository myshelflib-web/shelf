import { promises as dns } from "node:dns";

const EMAIL_MAX_LEN = 254;
const LOCAL_MAX_LEN = 64;
const DNS_TIMEOUT_MS = 2500;
const MX_CACHE_MS = 10 * 60 * 1000;

/** HTML5-style address with a real dotted domain (rejects `a@b`, IPs, spaces). */
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const RESERVED_TLDS = new Set(["example", "invalid", "localhost", "test", "local"]);
const RESERVED_DOMAINS = new Set(["example.com", "example.net", "example.org"]);

/** Common throwaway inboxes — they resolve MX but are not real student mailboxes. */
const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "discard.email",
  "dispostable.com",
  "emailfake.com",
  "guerrillamail.com",
  "guerrillamailblock.com",
  "mailinator.com",
  "mailnesia.com",
  "maildrop.cc",
  "sharklasers.com",
  "temp-mail.org",
  "tempmail.com",
  "throwawaymail.com",
  "trashmail.com",
  "yopmail.com",
]);

const mxCache = new Map<string, { ok: boolean; expiresAt: number }>();

export function clearEmailDomainCache() {
  mxCache.clear();
}

export class InvalidEmailError extends Error {
  constructor(message = "Enter a valid email address") {
    super(message);
    this.name = "InvalidEmailError";
  }
}

export function isValidEmailFormat(email: string): boolean {
  if (!email || email.length > EMAIL_MAX_LEN) return false;
  if (email.includes("..") || email.startsWith(".") || email.endsWith(".")) return false;

  const at = email.lastIndexOf("@");
  if (at < 1) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!local || local.length > LOCAL_MAX_LEN) return false;
  if (local.startsWith(".") || local.endsWith(".")) return false;
  if (!EMAIL_RE.test(email)) return false;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(domain) || domain.startsWith("[")) return false;

  const labels = domain.split(".");
  const tld = labels[labels.length - 1] ?? "";
  if (RESERVED_TLDS.has(tld)) return false;
  if (
    RESERVED_DOMAINS.has(domain) ||
    [...RESERVED_DOMAINS].some((d) => domain.endsWith(`.${d}`))
  ) {
    return false;
  }
  return true;
}

function isDisposableDomain(domain: string): boolean {
  const lower = domain.toLowerCase();
  if (DISPOSABLE_DOMAINS.has(lower)) return true;
  for (const blocked of DISPOSABLE_DOMAINS) {
    if (lower.endsWith(`.${blocked}`)) return true;
  }
  return false;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error("DNS lookup timed out") as NodeJS.ErrnoException;
      err.code = "ETIMEOUT";
      reject(err);
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function dnsCode(err: unknown): string | undefined {
  return (err as NodeJS.ErrnoException)?.code;
}

function isNoData(err: unknown): boolean {
  const code = dnsCode(err);
  return code === "ENOTFOUND" || code === "ENODATA";
}

function isTransient(err: unknown): boolean {
  const code = dnsCode(err);
  return code === "ETIMEOUT" || code === "ESERVFAIL" || code === "ECONNREFUSED";
}

type MailLookup = "yes" | "no" | "unknown";

async function lookupMxOrA(domain: string): Promise<MailLookup> {
  try {
    const mx = await withTimeout(dns.resolveMx(domain), DNS_TIMEOUT_MS);
    const usable = mx.filter((row) => row.exchange && row.exchange !== ".");
    if (usable.length > 0) return "yes";
    if (mx.length > 0) return "no";
  } catch (err) {
    if (isTransient(err)) return "unknown";
    if (!isNoData(err)) return "unknown";
  }

  try {
    const a = await withTimeout(dns.resolve4(domain), DNS_TIMEOUT_MS);
    if (a.length > 0) return "yes";
  } catch (err) {
    if (isTransient(err)) return "unknown";
    if (!isNoData(err)) return "unknown";
  }

  try {
    const aaaa = await withTimeout(dns.resolve6(domain), DNS_TIMEOUT_MS);
    return aaaa.length > 0 ? "yes" : "no";
  } catch (err) {
    if (isTransient(err)) return "unknown";
    return "no";
  }
}

export async function domainCanReceiveMail(domain: string): Promise<boolean> {
  const key = domain.toLowerCase();
  const cached = mxCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.ok;

  const result = await lookupMxOrA(key);
  if (result === "unknown") {
    // Transient DNS failure — don't block a real address or cache a miss.
    return true;
  }

  mxCache.set(key, { ok: result === "yes", expiresAt: Date.now() + MX_CACHE_MS });
  return result === "yes";
}

/** Normalize, check syntax + mailbox domain, then return the lowercase address. */
export async function assertDeliverableEmail(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  if (!isValidEmailFormat(normalized)) {
    throw new InvalidEmailError("Enter a valid email address");
  }

  const domain = normalized.slice(normalized.lastIndexOf("@") + 1);
  if (isDisposableDomain(domain)) {
    throw new InvalidEmailError(
      "Use a permanent email address, not a temporary or disposable inbox"
    );
  }

  const canReceive = await domainCanReceiveMail(domain);
  if (!canReceive) {
    throw new InvalidEmailError(
      "This email domain cannot receive mail. Check for typos and try again."
    );
  }

  return normalized;
}
