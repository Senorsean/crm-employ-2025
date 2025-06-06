import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, AlertCircle, X, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { useOffersStore } from '../../stores/offersStore';
import { useThemeStore } from '../../stores/themeStore';

interface JobOffersImportProps {
  onImport: (data: any[]) => void;
  onClose: () => void;
}

export default function JobOffersImport({ onImport, onClose }: JobOffersImportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const { offers } = useOffersStore();
  const { darkMode } = useThemeStore();

  const downloadTemplate = () => {
    const template = [
      {
        'Titre': 'Développeur Full Stack',
        'Entreprise': 'Tech Solutions',
        'Localisation': 'Marseille',
        'Type de contrat': 'CDI',
        'Niveau d\'urgence': 'high',
        'Description': 'Nous recherchons un développeur Full Stack expérimenté...',
        'Salaire': '45-55k€',
        'Contact - Nom': 'Marie Martin',
        'Contact - Fonction': 'Responsable RH',
        'Contact - Email': 'marie.martin@techsolutions.fr',
        'Contact - Téléphone': '06 XX XX XX XX',
        'Compétences requises': 'React, Node.js, TypeScript, MongoDB',
        'Expérience requise': '3 ans minimum',
        'Date de début': 'Dès que possible'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(template);

    // Ajuster la largeur des colonnes
    const colWidths = Object.keys(template[0]).map(key => ({
      wch: Math.max(20, key.length)
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Offres');
    XLSX.writeFile(wb, 'modele_import_offres.xlsx');
  };

  const validateData = (data: any[]) => {
    const valid: any[] = [];
    const duplicates: any[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
      const lineNumber = index + 2;

      // Validation des champs requis
      if (!row['Titre']?.toString().trim()) {
        errors.push(`Ligne ${lineNumber} : Le titre est requis`);
        return;
      }

      if (!row['Entreprise']?.toString().trim()) {
        errors.push(`Ligne ${lineNumber} : L'entreprise est requise`);
        return;
      }

      if (!row['Localisation']?.toString().trim()) {
        errors.push(`Ligne ${lineNumber} : La localisation est requise`);
        return;
      }

      if (!row['Type de contrat']?.toString().trim()) {
        errors.push(`Ligne ${lineNumber} : Le type de contrat est requis`);
        return;
      }

      // Validation du type de contrat
      const contractType = row['Type de contrat'].toString().trim().toUpperCase();
      if (!['CDI', 'CDD', 'INTÉRIM', 'INTERIM', 'STAGE', 'ALTERNANCE'].includes(contractType)) {
        errors.push(`Ligne ${lineNumber} : Type de contrat invalide (CDI, CDD, Intérim, Stage, Alternance)`);
        return;
      }

      // Validation du niveau d'urgence
      const urgencyLevel = row['Niveau d\'urgence']?.toString().toLowerCase();
      if (urgencyLevel && !['high', 'medium', 'low'].includes(urgencyLevel)) {
        errors.push(`Ligne ${lineNumber} : Niveau d'urgence invalide (high, medium, low)`);
        return;
      }

      // Vérification des doublons
      const isDuplicate = offers.some(o => 
        o.title.toLowerCase() === row['Titre'].toString().toLowerCase() &&
        o.company.toLowerCase() === row['Entreprise'].toString().toLowerCase()
      );

      if (isDuplicate) {
        duplicates.push(row);
        return;
      }

      // Si toutes les validations sont passées
      valid.push({
        title: row['Titre'].toString().trim(),
        company: row['Entreprise'].toString().trim(),
        location: row['Localisation'].toString().trim(),
        type: row['Type de contrat'].toString().trim(),
        urgencyLevel: row['Niveau d\'urgence']?.toString().toLowerCase() || 'low',
        description: row['Description']?.toString().trim() || '',
        salary: row['Salaire']?.toString().trim() || '',
        contact: {
          name: row['Contact - Nom']?.toString().trim() || '',
          role: row['Contact - Fonction']?.toString().trim() || '',
          email: row['Contact - Email']?.toString().trim() || '',
          phone: row['Contact - Téléphone']?.toString().trim() || ''
        },
        requirements: row['Compétences requises']?.toString().split(',').map(s => s.trim()) || [],
        experience: row['Expérience requise']?.toString().trim() || '',
        startDate: row['Date de début']?.toString().trim() || '',
        status: 'new',
        candidates: [],
        createdAt: new Date().toISOString()
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
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Importer des offres</h2>
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
                    Aperçu des données ({preview.length} offres)
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
                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Titre</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Entreprise</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Type</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Localisation</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase`}>Urgence</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                      {preview.map((offer, index) => (
                        <tr key={index}>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{offer.title}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{offer.company}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{offer.type}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{offer.location}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            {offer.urgencyLevel === 'high' ? 'Urgent' : 
                             offer.urgencyLevel === 'medium' ? 'Prioritaire' : 
                             'Normal'}
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