import { ABBYY_CONFIG } from './config';
import { AbbyyError } from './errors';
import type { ProcessingResult } from './types';

export async function processDocument(file: File): Promise<string> {
  try {
    // Upload du document
    const uploadResponse = await uploadFile(file);
    if (!uploadResponse.taskId) {
      throw new AbbyyError('UPLOAD_ERROR', 'Échec du chargement du document');
    }

    // Attente du traitement
    const result = await waitForProcessing(uploadResponse.taskId);
    if (!result.resultUrl) {
      throw new AbbyyError('PROCESSING_ERROR', 'Échec du traitement du document');
    }

    // Récupération du texte
    const textContent = await downloadResult(result.resultUrl);
    return textContent;
  } catch (error) {
    console.error('ABBYY processing error:', error);
    throw error instanceof AbbyyError ? error : new AbbyyError(
      'PROCESSING_ERROR',
      'Erreur lors du traitement du document'
    );
  }
}

async function uploadFile(file: File): Promise<{ taskId: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${ABBYY_CONFIG.apiEndpoint}/processDocument`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ABBYY_CONFIG.apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    throw new AbbyyError('UPLOAD_ERROR', 'Échec du chargement du document');
  }

  return response.json();
}

async function waitForProcessing(taskId: string): Promise<ProcessingResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < ABBYY_CONFIG.timeout) {
    const response = await fetch(
      `${ABBYY_CONFIG.apiEndpoint}/getTaskStatus/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${ABBYY_CONFIG.apiKey}`
        }
      }
    );

    if (!response.ok) {
      throw new AbbyyError('STATUS_ERROR', 'Erreur lors de la vérification du statut');
    }

    const status = await response.json();
    if (status.status === 'Completed') {
      return status;
    }

    if (status.status === 'Failed') {
      throw new AbbyyError('PROCESSING_FAILED', 'Le traitement a échoué');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new AbbyyError('TIMEOUT', 'Le traitement a pris trop de temps');
}

async function downloadResult(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new AbbyyError('DOWNLOAD_ERROR', 'Impossible de récupérer le résultat');
  }
  return response.text();
}