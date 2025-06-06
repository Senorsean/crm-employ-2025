import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, X } from 'lucide-react';
import { parseCV } from '../utils/cv';
import type { CVData } from '../utils/cv';

interface ImportCVProps {
  onImportComplete: (data: CVData) => void;
  onClose: () => void;
}

function ImportCV({ onImportComplete, onClose }: ImportCVProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileImport = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const extractedData = await parseCV(file);
      
      // Vérification des données essentielles
      if (!extractedData.firstName && !extractedData.lastName) {
        throw new Error('Impossible de détecter le nom et prénom. Veuillez vérifier le format du CV.');
      }

      onImportComplete(extractedData);
    } catch (error) {
      console.error('Erreur lors de l\'extraction du CV:', error);
      setError(error instanceof Error ? error.message : 'Impossible d\'extraire les informations du CV.');
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'application/pdf') {
      handleFileImport(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Importer un CV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          {...getRootProps()}
          className={`
            p-6 border-2 border-dashed rounded-lg text-center cursor-pointer
            transition-colors
            ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-gray-600">Analyse du CV en cours...</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-gray-600">
                  {isDragActive
                    ? 'Déposez le CV ici...'
                    : 'Glissez-déposez un CV au format PDF, ou cliquez pour sélectionner un fichier'}
                </p>
                <p className="text-sm text-gray-500">PDF uniquement</p>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default ImportCV;