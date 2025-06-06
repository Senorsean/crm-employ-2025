export const LINKEDIN_API = {
  BASE_URL: 'https://api.linkedin.com/v2',
  VERSION: '202304',
  ENDPOINTS: {
    PROFILE: '/me',
    EMAIL: '/emailAddress',
    POSITIONS: '/positions'
  },
  ERRORS: {
    INVALID_URL: 'URL LinkedIn invalide',
    INVALID_USERNAME: 'Nom d\'utilisateur LinkedIn invalide',
    UNAUTHORIZED: 'Non autorisé à accéder aux données LinkedIn',
    NETWORK_ERROR: 'Erreur de connexion au serveur LinkedIn',
    RATE_LIMIT: 'Trop de requêtes vers LinkedIn',
    PARSE_ERROR: 'Erreur lors de l\'analyse des données LinkedIn',
    GENERIC_ERROR: 'Une erreur est survenue lors de la connexion à LinkedIn'
  }
};