export const ABBYY_CONFIG = {
  apiKey: import.meta.env.VITE_ABBYY_API_KEY,
  apiEndpoint: 'https://cloud-westeurope.ocrsdk.com/v2',
  language: 'French',
  profile: 'documentArchiving',
  exportFormat: 'txtUnstructured',
  timeout: 30000 // 30 secondes
};