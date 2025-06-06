import React, { useState } from 'react';
import { Linkedin, Loader2, AlertCircle } from 'lucide-react';
import { LinkedInButton } from './LinkedInButton';
import type { CVData } from '../../utils/cvParser';

interface LinkedInImportProps {
  onExtractedData: (data: CVData) => void;
  isLoading: boolean;
}

export default function LinkedInImport({ onExtractedData, isLoading }: LinkedInImportProps) {
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  // Vérifie si un token LinkedIn est présent
  const hasLinkedInToken = !!localStorage.getItem('linkedin_token');

  const handleImport = async () => {
    if (!hasLinkedInToken || importing) return;
    
    setImporting(true);
    setError(null);

    try {
      // Simule l'import pour la démo
      const mockData: CVData = {
        firstName: "Marie",
        lastName: "Martin",
        title: "Développeuse Full Stack",
        location: "Marseille",
        experiences: [{
          title: "Développeuse Full Stack",
          company: "Tech Solutions",
          period: "2022 - Present",
          description: "Développement d'applications web avec React et Node.js"
        }],
        education: [{
          degree: "Master en Développement Web",
          school: "École Numérique",
          year: "2020"
        }],
        skills: ["React", "Node.js", "TypeScript"],
        languages: ["Français", "Anglais"]
      };

      onExtractedData(mockData);
    } catch (err) {
      setError('Erreur lors de l\'import des données LinkedIn');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {!hasLinkedInToken ? (
        <LinkedInButton />
      ) : (
        <button
          onClick={handleImport}
          disabled={importing || isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#0077B5] text-white rounded-lg hover:bg-[#006097] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {importing || isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Importation...
            </>
          ) : (
            <>
              <Linkedin className="w-5 h-5" />
              Importer depuis LinkedIn
            </>
          )}
        </button>
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <p className="text-sm text-gray-500">
        Note: Pour des raisons de sécurité, l'email et le téléphone devront être saisis manuellement.
      </p>
    </div>
  );
}