import { LINKEDIN_API } from './constants';
import { LinkedInProfile } from './types';
import { formatLinkedInData } from './formatter';
import { LinkedInError } from './errors';

export async function fetchProfile(accessToken: string): Promise<LinkedInProfile> {
  const response = await fetch(`${LINKEDIN_API.BASE_URL}/me`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'LinkedIn-Version': LINKEDIN_API.VERSION,
      'X-Restli-Protocol-Version': '2.0.0'
    }
  });

  if (!response.ok) {
    throw new LinkedInError(
      'Failed to fetch profile',
      'PROFILE_ERROR',
      response.status
    );
  }

  return response.json();
}

export async function fetchEmail(accessToken: string): Promise<string | null> {
  try {
    const response = await fetch(`${LINKEDIN_API.BASE_URL}/emailAddress`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'LinkedIn-Version': LINKEDIN_API.VERSION
      }
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data?.elements?.[0]?.['handle~']?.emailAddress || null;
  } catch {
    return null;
  }
}