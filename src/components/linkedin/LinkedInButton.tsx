import React from 'react';
import { Linkedin } from 'lucide-react';
import { LINKEDIN_CONFIG } from '../../config/linkedin';

export function LinkedInButton() {
  const handleLogin = () => {
    // Générer un état unique pour la sécurité
    const state = crypto.randomUUID();
    sessionStorage.setItem('linkedin_state', state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: LINKEDIN_CONFIG.clientId,
      redirect_uri: LINKEDIN_CONFIG.redirectUri,
      scope: LINKEDIN_CONFIG.scope,
      state: state
    });

    window.location.href = `${LINKEDIN_CONFIG.authUrl}?${params.toString()}`;
  };

  return (
    <button
      onClick={handleLogin}
      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#0077B5] text-white rounded-lg hover:bg-[#006097] transition-colors"
    >
      <Linkedin className="w-5 h-5" />
      Se connecter avec LinkedIn
    </button>
  );
}