import * as pdfjsLib from 'pdfjs-dist';

// Définir l'URL du worker PDF.js
const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

export async function initPdfWorker(): Promise<void> {
  try {
    // Configurer l'URL du worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
  } catch (error) {
    console.error('Failed to initialize PDF.js worker:', error);
    throw new Error('Failed to initialize PDF processing');
  }
}