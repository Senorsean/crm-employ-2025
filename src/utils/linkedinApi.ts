import { CVData } from './cvParser';

export async function fetchLinkedInProfile(profileUrl: string): Promise<CVData> {
  try {
    const username = extractUsername(profileUrl);
    if (!username) {
      throw new Error('URL LinkedIn invalide');
    }

    // Simulate API response for development
    // This would be replaced with actual API calls in production
    const data = await simulateLinkedInProfile(username);
    return data;
  } catch (error) {
    console.error('LinkedIn API error:', error);
    throw new Error('Impossible de récupérer les données LinkedIn. Veuillez vérifier l\'URL et réessayer.');
  }
}

function extractUsername(url: string): string | null {
  const regex = /linkedin\.com\/in\/([^\/]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

async function simulateLinkedInProfile(username: string): Promise<CVData> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Return simulated profile data
  return {
    firstName: "Marie",
    lastName: "Martin",
    title: "Développeuse Full Stack",
    email: `${username}@example.com`,
    phone: "06 XX XX XX XX",
    location: "Marseille",
    experiences: [
      {
        title: "Développeuse Full Stack",
        company: "Tech Solutions",
        period: "2022 - Present",
        description: "Développement d'applications web avec React et Node.js"
      }
    ],
    education: [
      {
        degree: "Master en Développement Web",
        school: "École Numérique",
        year: "2020"
      }
    ],
    skills: ["React", "Node.js", "TypeScript", "MongoDB"],
    languages: ["Français", "Anglais"]
  };
}