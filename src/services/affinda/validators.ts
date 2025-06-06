const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateCVFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: 'Le fichier est trop volumineux. Taille maximum : 10MB'
    };
  }

  // Check file type
  if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Format de fichier non supporté. Formats acceptés : PDF, DOC, DOCX'
    };
  }

  return { isValid: true };
}