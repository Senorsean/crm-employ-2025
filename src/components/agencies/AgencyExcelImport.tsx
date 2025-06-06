import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, AlertCircle, X, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAgenciesStore } from '../../stores/agenciesStore';
import { auth } from '../../config/firebase';
import type { Agency } from '../../types/agency';
import { useThemeStore } from '../../stores/themeStore';

interface AgencyExcelImportProps {
  onImport: (data: any[]) => void;
  onClose: () => void;
}

export default function AgencyExcelImport({ onImport, onClose }: AgencyExcelImportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const { agencies } = useAgenciesStore();
  const { darkMode } = useThemeStore();

  const downloadTemplate = () => {
    const template = [
      {
        'Nom': 'Agence Marseille',
        'Adresse': '123 rue Example, 13001 Marseille',
        'Téléphone': '04 91 XX XX XX',
        'Email': 'marseille@anthea.fr',
        'Consultants - Nom': 'Marie Martin',
        'Consultants - Fonction': 'Consultante senior',
        'Consultants - Email': 'marie.martin@anthea.fr',
        'Consultants - Téléphone': '06 XX XX XX XX'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(template);

    // Ajuster la largeur des colonnes
    const colWidths = Object.keys(template[0]).map(key => ({
      wch: Math.max(20, key.length)
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Agences');
    XLSX.writeFile(wb, 'modele_import_agences.xlsx');
  };

  const validateData = (data: any[]) => {
    const valid: any[] = [];
    const duplicates: any[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
      const lineNumber = index + 2;

      // Validation des champs requis
      if (!row['Nom']?.toString().trim()) {
        errors.push(`Ligne ${lineNumber} : Le nom est requis`);
        return;
      }

      if (!row['Adresse']?.toString().trim()) {
        errors.push(`Ligne ${lineNumber} : L'adresse est requise`);
        return;
      }

      if (!row['Téléphone']?.toString().trim()) {
        errors.push(`Ligne ${lineNumber} : Le téléphone est requis`);
        return;
      }

      if (!row['Email']?.toString().trim()) {
        errors.push(`Ligne ${lineNumber} : L'email est requis`);
        return;
      }

      // Vérification des doublons
      const isDuplicate = agencies.some(agency => 
        agency.name.toLowerCase() === row['Nom'].toString().toLowerCase()
      );

      if (isDuplicate) {
        duplicates.push(row);
        return;
      }

      // Formatage des consultants
      const consultants = [];
      if (row['Consultants - Nom']) {
        consultants.push({
          id: crypto.randomUUID(),
          name: row['Consultants - Nom'].toString().trim(),
          role: row['Consultants - Fonction']?.toString().trim() || 'Consultant',
          email: row['Consultants - Email']?.toString().trim() || '',
          phone: row['Consultants - Téléphone']?.toString().trim() || '',
          beneficiairesCount: 0
        });
      }

      // Si toutes les validations sont passées
      valid.push({
        name: row['Nom'].toString().trim(),
        address: row['Adresse'].toString().trim(),
        phone: row['Téléphone'].toString().trim(),
        email: row['Email'].toString().trim(),
        status: 'active',
        stats: {
          beneficiaires: 0,
          offresActives: 0,
          tauxPlacement: 0
        },
        consultants,
        notes: [],
        userId: auth.currentUser?.uid
      });
    });

    return { valid, duplicates, errors };
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setPreview(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const { valid, duplicates, errors } = validateData(jsonData);

      if (errors.length > 0) {
        setError(`Erreurs de validation:\n${errors.join('\n')}`);
        return;
      }

      setPreview(valid);

      if (duplicates.length > 0) {
        setError(`${duplicates.length} doublon(s) détecté(s) et ignoré(s)`);
      }
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      setError('Erreur lors de la lecture du fichier. Vérifiez le format du fichier.');
    } finally {
      setIsLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: isLoading
  });

  const handleImport = () => {
    if (!preview) return;
    onImport(preview);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Importer des agences</h2>
            <button onClick={onClose} className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <button
                onClick={downloadTemplate}
                className={`flex items-center px-4 py-2 ${darkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-700 bg-gray-100'} rounded-lg hover:${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
              >
                <Upload className="w-4 h-4 mr-2" />
                Télécharger le modèle
              </button>

              <div
                {...getRootProps()}
                className={`
                  flex-1 p-6 border-2 border-dashed rounded-lg text-center cursor-pointer
                  transition-colors
                  ${isDragActive ? (darkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-400 bg-blue-50') : (darkMode ? 'border-gray-600 hover:border-blue-500' : 'border-gray-300 hover:border-blue-400')}
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <input {...getInputProps()} />
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'} animate-spin`} />
                    <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Import en cours...</span>
                  </div>
                ) : (
                  <div className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {isDragActive ? (
                      'Déposez le fichier ici...'
                    ) : (
                      'Glissez-déposez un fichier Excel ou cliquez pour sélectionner'
                    )}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className={`p-4 ${darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-50 text-red-700'} rounded-lg flex items-start gap-2`}>
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="whitespace-pre-line">{error}</div>
              </div>
            )}

            {preview && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Aperçu des données ({preview.length} agences)
                  </h3>
                  <button
                    onClick={handleImport}
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Confirmer l'import
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <tr>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Nom</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Adresse</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Téléphone</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Email</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Consultants</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                      {preview.map((agency, index) => (
                        <tr key={index}>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{agency.name}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{agency.address}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{agency.phone}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{agency.email}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            {agency.consultants.length} consultant(s)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}