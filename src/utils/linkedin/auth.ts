import { LINKEDIN_CONFIG } from './config';
import { LinkedInError } from './errors';

export function generateAuthUrl(): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINKEDIN_CONFIG.clientId,
    redirect_uri: LINKEDIN_CONFIG.redirectUri,
    scope: LINKEDIN_CONFIG.scope,
    state: generateState()
  });

  return `${LINKEDIN_CONFIG.authUrl}?${params}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: LINKEDIN_CONFIG.redirectUri,
      client_id: LINKEDIN_CONFIG.clientId
    });

    const response = await fetch(LINKEDIN_CONFIG.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    if (!response.ok) {
      throw new LinkedInError('TOKEN_ERROR', 'Failed to get access token');
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('LinkedIn token error:', error);
    throw new LinkedInError('TOKEN_ERROR', 'Failed to exchange code for token');
  }
}

function generateState(): string {
  return crypto.randomUUID();
}