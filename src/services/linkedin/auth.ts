import { LINKEDIN_CONFIG } from '../../config/linkedin';
import { LinkedInError } from './errors';

export async function exchangeCodeForToken(code: string): Promise<string> {
  try {
    // Utiliser un service de proxy CORS sécurisé
    const tokenEndpoint = 'https://api.allorigins.win/raw?url=' + 
      encodeURIComponent(LINKEDIN_CONFIG.tokenUrl);
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: LINKEDIN_CONFIG.redirectUri,
      client_id: LINKEDIN_CONFIG.clientId,
      client_secret: LINKEDIN_CONFIG.clientSecret
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      throw new LinkedInError(
        'TOKEN_ERROR',
        'Erreur lors de l\'échange du code d\'autorisation'
      );
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('LinkedIn token exchange error:', error);
    throw new LinkedInError(
      'TOKEN_ERROR',
      'Erreur d\'authentification LinkedIn. Veuillez réessayer.'
    );
  }
}