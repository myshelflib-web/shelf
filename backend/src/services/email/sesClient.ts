import { SESClient } from "@aws-sdk/client-ses";
import { getSesRegion } from "./config.js";

let client: SESClient | null = null;

export function getSesClient(): SESClient {
  if (client) return client;

  const accessKeyId =
    process.env.SES_ACCESS_KEY?.trim() ||
    process.env.AWS_ACCESS_KEY_ID?.trim() ||
    process.env.S3_ACCESS_KEY?.trim();
  const secretAccessKey =
    process.env.SES_SECRET_KEY?.trim() ||
    process.env.AWS_SECRET_ACCESS_KEY?.trim() ||
    process.env.S3_SECRET_KEY?.trim();

  client = new SESClient({
    region: getSesRegion(),
    ...(accessKeyId && secretAccessKey
      ? { credentials: { accessKeyId, secretAccessKey } }
      : {}),
  });

  return client;
}
