import { fetchWithRetry } from "../../utils/fetchRetry.js";

const RAZORPAY_BASE = "https://api.razorpay.com/v1";

export class RazorpayError extends Error {
  status: number;
  body: string;
  constructor(message: string, status: number, body: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function razorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID ?? "";
}

function authHeader(): string {
  const id = process.env.RAZORPAY_KEY_ID ?? "";
  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  return `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
}

export async function razorpayRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetchWithRetry(`${RAZORPAY_BASE}${path}`, {
    method,
    timeoutMs: 25_000,
    retry: { label: `razorpay.${method.toLowerCase()}`, attempts: 4 },
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new RazorpayError(`Razorpay ${method} ${path} failed`, res.status, text);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
};

export type RazorpayPlan = {
  id: string;
  period: string;
  interval: number;
  item: { amount: number; currency: string; name: string };
};

export type RazorpaySubscription = {
  id: string;
  plan_id: string;
  status: string;
  current_end?: number | null;
  total_count?: number;
};

/** Ensure a Razorpay plan exists; cache id in env when set, else create once per process. */
const planCache = new Map<string, string>();

export async function ensureRazorpayPlan(opts: {
  cacheKey: string;
  envVar: string;
  period: "monthly" | "yearly";
  amountPaise: number;
  name: string;
}): Promise<string> {
  const fromEnv = process.env[opts.envVar]?.trim();
  if (fromEnv) return fromEnv;

  const cached = planCache.get(opts.cacheKey);
  if (cached) return cached;

  const plan = await razorpayRequest<RazorpayPlan>("POST", "/plans", {
    period: opts.period,
    interval: 1,
    item: {
      name: opts.name,
      amount: opts.amountPaise,
      currency: "INR",
      description: opts.name,
    },
  });
  planCache.set(opts.cacheKey, plan.id);
  return plan.id;
}
