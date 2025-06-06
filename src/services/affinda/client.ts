import { AffindaAPI, AffindaCredential } from '@affinda/affinda';
import { AFFINDA_CONFIG } from './config';
import { AffindaError, AffindaResponse } from './types';
import type { CVData } from '../../types/cv';

if (!AFFINDA_CONFIG.apiKey) {
  throw new Error('Missing Affinda API key');
}

const credential = new AffindaCredential(AFFINDA_CONFIG.apiKey);
const client = new AffindaAPI(credential);

export async function parseResume(file: File): Promise<CVData> {
  try {
    const buffer = await file.arrayBuffer();
    
    const response = await client.createResume({
      file: new Uint8Array(buffer),
      wait: true,
      language: AFFINDA_CONFIG.language,
      waitTime: AFFINDA_CONFIG.waitTime
    });

    if (!response.data) {
      throw new AffindaError(
        'NO_DATA',
        'No data received from Affinda API'
      );
    }

    return formatResponse(response as AffindaResponse);
  } catch (error) {
    console.error('Affinda parsing error:', error);
    
    if (error instanceof AffindaError) {
      throw error;
    }

    throw new AffindaError(
      'PARSE_ERROR',
      'Failed to parse CV. Please try again.'
    );
  }
}

function formatResponse(response: AffindaResponse): CVData {
  try {
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
  } catch (error) {
    console.error('Error formatting Affinda response:', error);
    throw new AffindaError(
      'FORMAT_ERROR',
      'Failed to process CV data'
    );
  }
}

function formatDateRange(start?: string, end?: string): string {
  if (!start && !end) return '';
  const startStr = start ? new Date(start).getFullYear() : '';
  const endStr = end ? new Date(end).getFullYear() : 'Present';
  return `${startStr} - ${endStr}`;
}