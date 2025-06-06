import type { AffindaResponse } from './types';
import type { CVData } from '../../types/cv';

export function formatCVData(response: AffindaResponse): CVData {
  const { data } = response;
  
  return {
    firstName: data.name?.given || '',
    lastName: data.name?.family || '',
    email: data.emails?.[0] || '',
    phone: data.phoneNumbers?.[0] || '',
    title: data.jobTitle || data.profession || '',
    location: data.location?.rawInput || '',
    experiences: (data.workExperience || []).map(exp => ({
      title: exp.jobTitle || '',
      company: exp.organization || '',
      period: formatDateRange(exp.datesEmployed?.start, exp.datesEmployed?.end),
      description: exp.description || ''
    })),
    education: (data.education || []).map(edu => ({
      degree: edu.accreditation?.inputStr || '',
      school: edu.organization || '',
      year: edu.dates?.completionDate?.split('-')[0] || ''
    })),
    skills: (data.skills || []).map(skill => skill.name),
    languages: (data.languages || []).map(lang => lang.name)
  };
}

function formatDateRange(start?: string, end?: string): string {
  if (!start && !end) return '';
  const startStr = start ? new Date(start).getFullYear() : '';
  const endStr = end ? new Date(end).getFullYear() : 'Present';
  return `${startStr} - ${endStr}`;
}