import { extractTextFromPDF } from './pdfExtractor';
import { parseText } from './textParser';
import type { CVData } from '../../types/cv';

export async function parseCV(file: File): Promise<CVData> {
  try {
    // Extraction du texte du PDF
    const text = await extractTextFromPDF(file);
    
    // Parsing du texte extrait
    return parseText(text);
  } catch (error) {
    console.error('Erreur lors du parsing du CV:', error);
    throw new Error('Impossible d\'analyser le CV. Veuillez vérifier le format du fichier.');
  }
}

export type { CVData };