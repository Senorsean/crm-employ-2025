import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, AlertCircle, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Company } from '../../types/company';

interface ExcelImportProps {
  onImportComplete: (companies: Partial<Company>[]) => void;
  onClose: () => void;
}

export default function ExcelImport({ onImportComplete, onClose }: ExcelImportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Partial<Company>[]>([]);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await parseExcelFile(file);
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import du fichier');
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const handleImport = () => {
    if (preview.length > 0) {
      onImportComplete(preview);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Importer des entreprises</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            {...getRootProps()}
            className={`
              p-6 border-2 border-dashed rounded-lg text-center cursor-pointer
              transition-colors mb-6
              ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-gray-600">Analyse du fichier en cours...</p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400" />
                  <p className="text-gray-600">
                    {isDragActive
                      ? 'Déposez le fichier ici...'
                      : 'Glissez-déposez un fichier Excel ou CSV, ou cliquez pour sélectionner'}
                  </p>
                  <p className="text-sm text-gray-500">Formats acceptés : XLSX, XLS, CSV</p>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2 text-sm text-red-600 bg-red-50 p-4 rounded-lg">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {preview.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Aperçu des données ({preview.length} entreprises)</h3>
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Secteur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ville
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.map((company, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {company.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {company.sector}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {company.city}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {company.email}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={handleImport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Importer {preview.length} entreprises
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

async function parseExcelFile(file: File): Promise<Partial<Company>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Map Excel columns to Company type
        const companies = jsonData.map((row: any) => ({
          name: row.name || row.nom || row.entreprise || '',
          sector: row.sector || row.secteur || '',
          size: row.size || row.taille || '',
          address: row.address || row.adresse || '',
          city: row.city || row.ville || '',
          phone: row.phone || row.telephone || '',
          email: row.email || row.courriel || '',
          status: 'active' as const,
          contacts: [],
          newsletter_consent: false
        }));

        resolve(companies);
      } catch (error) {
        reject(new Error('Erreur lors de la lecture du fichier Excel'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    reader.readAsBinaryString(file);
  });
}