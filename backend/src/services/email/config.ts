/** Public app URL for email links and assets (logo). */
export function getAppUrl(): string {
  const fromEnv = process.env.APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const cors = process.env.CORS_ORIGIN?.split(",")[0]?.trim();
  if (cors) return cors.replace(/\/$/, "");

  return "http://localhost:3000";
}

export function getEmailLogoUrl(): string {
  const custom = process.env.EMAIL_LOGO_URL?.trim();
  if (custom) return custom;
  return `${getAppUrl()}/icons/shelf-icon-2048.png`;
}

export function getSesFromEmail(): string | undefined {
  return process.env.SES_FROM_EMAIL?.trim() || undefined;
}

export function isSesConfigured(): boolean {
  return Boolean(getSesFromEmail());
}

export function getSesRegion(): string {
  return (
    process.env.SES_REGION?.trim() ||
    process.env.AWS_REGION?.trim() ||
    process.env.S3_REGION?.trim() ||
    "us-east-1"
  );
}
