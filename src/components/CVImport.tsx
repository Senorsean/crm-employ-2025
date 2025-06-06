import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { parseCV } from '../utils/cv';
import type { CVData } from '../types/cv';

interface CVImportProps {
  onExtractedData: (data: CVData) => void;
  isLoading: boolean;
}

export default function CVImport({ onExtractedData, isLoading }: CVImportProps) {
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setParsing(true);
    setError(null);

    try {
      const data = await parseCV(file);
      onExtractedData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'analyse du CV';
      setError(message);
      console.error('Erreur CV:', err);
    } finally {
      setParsing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isLoading || parsing
  });

  return (
    <div
      {...getRootProps()}
      className={`
        p-6 border-2 border-dashed rounded-lg text-center cursor-pointer
        transition-colors
        ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
        ${(isLoading || parsing) ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        {(isLoading || parsing) ? (
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
                : 'Glissez-déposez un CV, ou cliquez pour sélectionner'}
            </p>
            <p className="text-sm text-gray-500">PDF uniquement</p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}