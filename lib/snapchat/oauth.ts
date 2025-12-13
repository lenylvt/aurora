import crypto from "crypto";

export interface SnapchatTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface SnapchatUserInfo {
  data: {
    me: {
      displayName: string;
      externalId: string;
      bitmoji?: {
        avatar: string;
      };
    };
  };
}

export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

const SNAPCHAT_AUTH_URL = "https://accounts.snapchat.com/accounts/oauth2/auth";
const SNAPCHAT_TOKEN_URL = "https://accounts.snapchat.com/accounts/oauth2/token";
const SNAPCHAT_REVOKE_URL = "https://accounts.snapchat.com/accounts/oauth2/revoke";
const SNAPCHAT_USER_INFO_URL = "https://kit.snapchat.com/v1/me?query={me{displayName,externalId,bitmoji{avatar}}}";

const SCOPES = [
  "https://auth.snapchat.com/oauth2/api/user.display_name",
  "https://auth.snapchat.com/oauth2/api/user.external_id",
  "https://auth.snapchat.com/oauth2/api/user.bitmoji.avatar",
];

export function generateState(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function generatePKCEPair(): PKCEPair {
  // Generate a random code verifier (43-128 characters)
  const codeVerifier = crypto.randomBytes(32).toString("base64url");

  // Generate code challenge using S256 method
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

  return { codeVerifier, codeChallenge };
}

export function getAuthorizationUrl(
  redirectUri: string,
  state: string,
  codeChallenge: string
): string {
  const params = new URLSearchParams({
    client_id: process.env.SNAPCHAT_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return `${SNAPCHAT_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  codeVerifier: string
): Promise<SnapchatTokenResponse> {
  const response = await fetch(SNAPCHAT_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: process.env.SNAPCHAT_CLIENT_ID!,
      client_secret: process.env.SNAPCHAT_CLIENT_SECRET!,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }

  return response.json();
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<SnapchatTokenResponse> {
  const response = await fetch(SNAPCHAT_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.SNAPCHAT_CLIENT_ID!,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return response.json();
}

export async function revokeToken(token: string): Promise<void> {
  await fetch(SNAPCHAT_REVOKE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      token,
      client_id: process.env.SNAPCHAT_CLIENT_ID!,
    }),
  });
}

export async function getUserInfo(
  accessToken: string
): Promise<SnapchatUserInfo> {
  const response = await fetch(SNAPCHAT_USER_INFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get user info: ${error}`);
  }

  return response.json();
}
