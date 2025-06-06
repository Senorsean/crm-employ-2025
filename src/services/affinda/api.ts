import { AffindaAPI, AffindaCredential } from '@affinda/affinda';
import { AFFINDA_CONFIG } from './config';
import { AffindaError, AffindaErrorMessages } from './errors';
import { formatCVData } from './formatters';
import type { CVData } from '../../types/cv';

export async function parseCV(file: File): Promise<CVData> {
  // Vérification de la clé API
  if (!AFFINDA_CONFIG.apiKey) {
    console.error('Missing Affinda API key');
    throw new AffindaError('MISSING_API_KEY', AffindaErrorMessages.MISSING_API_KEY);
  }

  try {
    // Création du client avec logging
    console.log('Initializing Affinda client...');
    const credential = new AffindaCredential(AFFINDA_CONFIG.apiKey);
    const client = new AffindaAPI(credential);

    // Conversion du fichier
    console.log('Converting file to buffer...');
    const buffer = await file.arrayBuffer();

    // Appel API avec logging
    console.log('Sending request to Affinda...');
    const response = await client.createResume({
      file: new Uint8Array(buffer),
      wait: true,
      language: AFFINDA_CONFIG.language,
      waitTime: AFFINDA_CONFIG.waitTime
    });

    // Vérification de la réponse
    if (!response || !response.data) {
      console.error('No data in Affinda response');
      throw new AffindaError('NO_DATA', AffindaErrorMessages.PARSE_ERROR);
    }

    // Formatage des données
    console.log('Formatting CV data...');
    return formatCVData(response);
  } catch (error) {
    // Logging détaillé de l'erreur
    console.error('Affinda API error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        throw new AffindaError('INVALID_API_KEY', AffindaErrorMessages.INVALID_API_KEY);
      }
      if (error.message.includes('429')) {
        throw new AffindaError('RATE_LIMIT', AffindaErrorMessages.RATE_LIMIT);
      }
    }

    throw new AffindaError('PARSE_ERROR', AffindaErrorMessages.PARSE_ERROR);
  }
}