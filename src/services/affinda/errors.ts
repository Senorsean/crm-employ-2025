export class AffindaError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'AffindaError';
    Object.setPrototypeOf(this, AffindaError.prototype);
  }

  static isAffindaError(error: unknown): error is AffindaError {
    return error instanceof AffindaError;
  }
}

export const AffindaErrorMessages = {
  MISSING_API_KEY: 'L\'analyse de CV est temporairement indisponible. Veuillez contacter le support.',
  INVALID_API_KEY: 'Clé API Affinda invalide',
  PARSE_ERROR: 'Impossible d\'analyser le CV. Veuillez réessayer.',
  NETWORK_ERROR: 'Erreur de connexion au service d\'analyse. Veuillez vérifier votre connexion.',
  INVALID_FILE: 'Format de fichier non supporté. Formats acceptés : PDF, DOC, DOCX',
  TIMEOUT: 'L\'analyse du CV a pris trop de temps. Veuillez réessayer.',
  SERVER_ERROR: 'Erreur du service d\'analyse. Veuillez réessayer plus tard.',
  FORMAT_ERROR: 'Erreur lors du traitement des données du CV'
} as const;