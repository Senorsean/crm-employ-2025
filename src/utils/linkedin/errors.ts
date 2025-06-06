export class LinkedInError extends Error {
  constructor(
    public code: string,
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'LinkedInError';
    Object.setPrototypeOf(this, LinkedInError.prototype);
  }

  static isLinkedInError(error: unknown): error is LinkedInError {
    return error instanceof LinkedInError;
  }
}

export const LinkedInErrorMessages = {
  FORMAT_INVALID: 'Format d\'URL LinkedIn invalide',
  USERNAME_INVALID: 'Impossible d\'extraire le nom d\'utilisateur',
  AUTH_REQUIRED: 'Authentification LinkedIn requise',
  PROFILE_ERROR: 'Erreur lors de la récupération du profil',
  CONTACT_ERROR: 'Erreur lors de la récupération des informations de contact',
  API_ERROR: 'Erreur lors de la récupération des données LinkedIn',
  NETWORK_ERROR: 'Erreur de connexion au serveur LinkedIn',
  RATE_LIMIT: 'Trop de requêtes vers LinkedIn',
  PARSE_ERROR: 'Erreur lors de l\'analyse des données LinkedIn'
} as const;