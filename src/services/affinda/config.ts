export const AFFINDA_CONFIG = {
  apiKey: import.meta.env.VITE_AFFINDA_API_KEY,
  language: 'fra', // Spécifique pour le français
  region: 'eu',    // Région Europe
  waitTime: 60000, // 60 secondes de timeout
  endpoints: {
    resume: '/v3/resumes',
    documents: '/v3/documents'
  }
};