import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export async function verifyGoogleToken(
  credential: string
): Promise<GoogleProfile> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Google OAuth is not configured");
  }

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.email || !payload.sub) {
    throw new Error("Invalid Google token");
  }

  if (!payload.email_verified) {
    throw new Error("Google email is not verified");
  }

  const given = payload.given_name?.trim();
  const family = payload.family_name?.trim();
  const name =
    given && family
      ? `${given} ${family}`
      : given ?? payload.name?.trim() ?? payload.email.split("@")[0];

  return {
    googleId: payload.sub,
    email: payload.email,
    name,
    avatarUrl: payload.picture,
  };
}
