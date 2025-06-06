import { LINKEDIN_CONFIG } from './config';
import { LinkedInError } from './errors';

export function getOAuthUrl(): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINKEDIN_CONFIG.clientId,
    redirect_uri: window.location.origin + '/linkedin/callback',
    scope: 'r_liteprofile r_emailaddress',
    state: generateState()
  });

  return `${LINKEDIN_CONFIG.authUrl}?${params.toString()}`;
}

export async function handleOAuthCallback(code: string): Promise<string> {
  try {
    const response = await fetch('/api/linkedin/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      throw new LinkedInError(
        'Échec de l\'authentification LinkedIn',
        'AUTH_ERROR',
        response.status
      );
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('LinkedIn OAuth error:', error);
    throw new LinkedInError(
      'Erreur lors de l\'authentification LinkedIn',
      'AUTH_ERROR'
    );
  }
}

function generateState(): string {
  return Math.random().toString(36).substring(2);
}