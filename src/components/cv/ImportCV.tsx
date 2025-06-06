import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { FileUpload } from './FileUpload';
import { ParsedDataPreview } from './ParsedDataPreview';
import { parseCV } from '../../services/affinda/api';
import { AffindaError } from '../../services/affinda/errors';
import { initPdfWorker } from '../../utils/pdfWorker';
import type { CVData } from '../../types/cv';

interface ImportCVProps {
  onImportComplete: (data: CVData) => void;
  onClose: () => void;
}

export default function ImportCV({ onImportComplete, onClose }: ImportCVProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<CVData | null>(null);

  useEffect(() => {
    initPdfWorker().catch(error => {
      console.error('PDF worker initialization error:', error);
      setError('Erreur d\'initialisation du traitement PDF');
    });
  }, []);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setParsedData(null);

    try {
      console.log('Starting CV parsing...', { fileName: file.name, fileSize: file.size });
      const data = await parseCV(file);
      console.log('CV parsed successfully:', data);
      setParsedData(data);
      onImportComplete(data);
    } catch (err) {
      console.error('CV parsing error:', err);
      if (err instanceof AffindaError) {
        setError(err.message);
      } else {
        setError('Une erreur inattendue est survenue lors de l\'analyse du CV');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Importer un CV</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <FileUpload
            onFileSelect={handleFileSelect}
            isLoading={isLoading}
            error={error}
          />

          {parsedData && !error && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Données extraites</h3>
              <ParsedDataPreview data={parsedData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}