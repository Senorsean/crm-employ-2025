import React, { useState } from 'react';
import { Linkedin, Loader2, AlertCircle } from 'lucide-react';
import { validateLinkedInUrl, formatLinkedInUrl } from '../utils/linkedin/validator';
import { fetchLinkedInProfile } from '../utils/linkedin/api';
import { LinkedInError } from '../utils/linkedin/errors';
import type { CVData } from '../utils/cvParser';

interface LinkedInImportProps {
  onExtractedData: (data: CVData) => void;
  isLoading: boolean;
}

export default function LinkedInImport({ onExtractedData, isLoading }: LinkedInImportProps) {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setLinkedinUrl(url);
    setError(null);

    // Validation en temps réel
    if (url && !validateLinkedInUrl(url)) {
      setError('Format d\'URL LinkedIn invalide. Exemple: https://www.linkedin.com/in/username');
    }
  };

  const handleImport = async () => {
    if (!linkedinUrl || importing || isLoading) return;

    // Validation finale avant import
    if (!validateLinkedInUrl(linkedinUrl)) {
      setError('Format d\'URL LinkedIn invalide. Exemple: https://www.linkedin.com/in/username');
      return;
    }

    setError(null);
    setImporting(true);

    try {
      // Formater l'URL avant l'import
      const formattedUrl = formatLinkedInUrl(linkedinUrl);
      const profile = await fetchLinkedInProfile(formattedUrl);
      onExtractedData(profile);
    } catch (err) {
      const message = err instanceof LinkedInError 
        ? err.message 
        : 'Erreur lors de l\'importation. Veuillez vérifier l\'URL et réessayer.';
      setError(message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Linkedin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="url"
            value={linkedinUrl}
            onChange={handleUrlChange}
            placeholder="https://www.linkedin.com/in/username"
            className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              error ? 'border-red-300' : 'border-gray-200'
            }`}
          />
        </div>
        <button
          onClick={handleImport}
          disabled={importing || isLoading || !linkedinUrl || !!error}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {(importing || isLoading) ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Importation...
            </>
          ) : (
            'Importer'
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <p className="text-sm text-gray-500">
        Format attendu: https://www.linkedin.com/in/username
      </p>
    </div>
  );
}