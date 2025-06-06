import { CVData } from './cvParser';

export async function parseLinkedInProfile(url: string): Promise<CVData> {
  // Extract username from LinkedIn URL
  const username = extractUsernameFromUrl(url);
  if (!username) {
    throw new Error('URL LinkedIn invalide');
  }

  try {
    // Simulate API call to LinkedIn
    // In production, this would be a real API call to your backend
    // which would handle LinkedIn API authentication and data fetching
    const data = await simulateLinkedInAPI(username);
    return formatLinkedInData(data);
  } catch (error) {
    throw new Error('Impossible de récupérer les données LinkedIn');
  }
}

function extractUsernameFromUrl(url: string): string | null {
  const regex = /linkedin\.com\/in\/([^\/]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// Simulate LinkedIn API response
async function simulateLinkedInAPI(username: string) {
  // This is a mock implementation
  // In production, this would be replaced with actual LinkedIn API calls
  return {
    firstName: "Marie",
    lastName: "Martin",
    headline: "Développeuse Full Stack",
    location: "Marseille, France",
    positions: [
      {
        title: "Développeuse Full Stack",
        company: "Tech Solutions",
        startDate: "2022",
        endDate: "Present",
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

function formatLinkedInData(data: any): CVData {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    title: data.headline,
    location: data.location?.split(',')[0],
    experiences: data.positions.map((pos: any) => ({
      title: pos.title,
      company: pos.company,
      period: `${pos.startDate} - ${pos.endDate}`,
      description: pos.description
    })),
    education: data.education.map((edu: any) => ({
      degree: edu.degree,
      school: edu.school,
      year: edu.year
    })),
    skills: data.skills,
    languages: data.languages
  };
}