import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { exchangeCodeForToken } from '../../services/linkedin/auth';
import { LinkedInError } from '../../services/linkedin/errors';

export function LinkedInCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');
      const storedState = sessionStorage.getItem('linkedin_state');

      // Vérifier l'état pour la sécurité
      if (state !== storedState) {
        setError('État invalide. Possible tentative de détournement.');
        return;
      }

      if (error) {
        setError('Authentification LinkedIn annulée');
        return;
      }

      if (!code) {
        setError('Code d\'autorisation manquant');
        return;
      }

      try {
        const token = await exchangeCodeForToken(code);
        localStorage.setItem('linkedin_token', token);
        sessionStorage.removeItem('linkedin_state'); // Nettoyer l'état
        navigate('/beneficiaires', { replace: true });
      } catch (err) {
        setError(err instanceof LinkedInError ? err.message : 'Erreur d\'authentification');
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <button
          onClick={() => navigate('/beneficiaires')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Retour aux bénéficiaires
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