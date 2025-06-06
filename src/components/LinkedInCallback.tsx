import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { handleOAuthCallback } from '../utils/linkedin/oauth';
import { LinkedInError } from '../utils/linkedin/errors';

export function LinkedInCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processOAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        setError('Authentification LinkedIn annulée');
        return;
      }

      if (!code) {
        setError('Code d\'autorisation manquant');
        return;
      }

      try {
        const accessToken = await handleOAuthCallback(code);
        // Store token and redirect
        localStorage.setItem('linkedin_token', accessToken);
        navigate('/import-profile');
      } catch (err) {
        setError(err instanceof LinkedInError ? err.message : 'Erreur d\'authentification');
      }
    };

    processOAuth();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <p className="mt-4 text-gray-600">Connexion à LinkedIn en cours...</p>
    </div>
  );
}