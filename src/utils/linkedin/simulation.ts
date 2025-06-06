import type { LinkedInProfile } from './types';
import { LinkedInError } from './errors';

const SIMULATION_DELAY = 1000;

export async function simulateLinkedInProfile(): Promise<LinkedInProfile> {
  await new Promise(resolve => setTimeout(resolve, SIMULATION_DELAY));
  
  // Simulate random failures to test error handling
  if (Math.random() < 0.1) {
    throw new LinkedInError('SIMULATION_ERROR', 'Erreur simulée de l\'API LinkedIn');
  }

  return {
    localizedFirstName: 'Marie',
    localizedLastName: 'Martin',
    headline: 'Développeuse Full Stack',
    location: {
      defaultLocale: {
        country: 'France',
        language: 'fr'
      }
    },
    positions: [
      {
        title: 'Développeuse Full Stack',
        companyName: 'Tech Solutions',
        startDate: { year: 2022, month: 1 },
        description: 'Développement d\'applications web avec React et Node.js'
      }
    ],
    education: [
      {
        degreeName: 'Master en Développement Web',
        schoolName: 'École Numérique',
        endDate: { year: 2020 }
      }
    ],
    skills: [
      { name: 'React' },
      { name: 'TypeScript' },
      { name: 'Node.js' }
    ],
    languages: [
      { name: 'Français' },
      { name: 'Anglais' }
    ]
  };
}