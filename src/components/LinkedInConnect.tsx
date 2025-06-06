import React from 'react';
import { Linkedin } from 'lucide-react';
import { getOAuthUrl } from '../utils/linkedin/oauth';

export function LinkedInConnect() {
  const handleConnect = () => {
    const authUrl = getOAuthUrl();
    window.location.href = authUrl;
  };

  return (
    <button
      onClick={handleConnect}
      className="flex items-center gap-2 px-4 py-2 bg-[#0077B5] text-white rounded-lg hover:bg-[#006097] transition-colors"
    >
      <Linkedin className="w-5 h-5" />
      Se connecter avec LinkedIn
    </button>
  );
}