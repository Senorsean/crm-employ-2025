import { LinkedInError } from './errors';
import { LinkedInProfile } from './types';
import { simulateLinkedInProfile } from './simulation';

export async function fetchLinkedInProfile(profileUrl: string): Promise<LinkedInProfile> {
  try {
    // For development/demo purposes
    const profile = await simulateLinkedInProfile();
    
    // Never return sensitive data in simulation
    return {
      ...profile,
      email: '',    // Clear email
      phone: ''     // Clear phone
    };
  } catch (error) {
    console.error('LinkedIn API error:', error);
    throw new LinkedInError('API_ERROR', 'Erreur lors de la récupération des données LinkedIn');
  }
}