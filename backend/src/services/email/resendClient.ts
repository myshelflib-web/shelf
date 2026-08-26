import { Resend } from "resend";
import { getResendApiKey } from "./config.js";

let client: Resend | null = null;

export function getResendClient(): Resend {
  if (client) return client;

  const apiKey = getResendApiKey();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  client = new Resend(apiKey);
  return client;
}
