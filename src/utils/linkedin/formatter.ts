import type { LinkedInProfile } from './types';
import type { CVData } from '../cvParser';

export function formatLinkedInData(profile: LinkedInProfile): CVData {
  return {
    firstName: profile.localizedFirstName || profile.firstName || '',
    lastName: profile.localizedLastName || profile.lastName || '',
    title: profile.headline || '',
    email: profile.email || '',
    location: profile.location?.defaultLocale?.country || '',
    experiences: profile.positions?.map(pos => ({
      title: pos.title,
      company: pos.companyName,
      period: formatPeriod(pos.startDate, pos.endDate),
      description: pos.description || ''
    })) || [],
    education: profile.education?.map(edu => ({
      degree: edu.degreeName,
      school: edu.schoolName,
      year: edu.endDate?.year?.toString() || ''
    })) || [],
    skills: profile.skills?.map(skill => skill.name) || [],
    languages: profile.languages?.map(lang => lang.name) || []
  };
}

function formatPeriod(
  start?: { year: number; month: number },
  end?: { year: number; month: number }
): string {
  const startStr = start ? `${start.year}` : '';
  const endStr = end ? `${end.year}` : 'Present';
  return `${startStr} - ${endStr}`;
}