export const LINKEDIN_CONFIG = {
  // Use environment variables for sensitive data
  clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID || '',
  redirectUri: `${window.location.origin}/linkedin/callback`,
  scope: 'r_liteprofile r_emailaddress',
  authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
  apiBaseUrl: 'https://api.linkedin.com/v2'
};