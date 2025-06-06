import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, AlertCircle, X, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useBeneficiairesStore } from '../../stores/beneficiairesStore';
import type { Beneficiaire } from '../../types/beneficiaire';
import { useThemeStore } from '../../stores/themeStore';

interface BeneficiaireExcelImportProps {
  onImport: (data: Partial<Beneficiaire>[]) => void;
  onClose: () => void;
}

export default function BeneficiaireExcelImport({ onImport, onClose }: BeneficiaireExcelImportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Partial<Beneficiaire>[] | null>(null);
  const { beneficiaires } = useBeneficiairesStore();
  const { darkMode } = useThemeStore();

  const downloadTemplate = () => {
    const template = [
      {
        'Prénom': 'Jean',
        'Nom': 'Dupont',
        'Email': 'jean.dupont@example.com',
        'Téléphone': '06 12 34 56 78',
        'Titre': 'Développeur Full Stack',
        'Localisation': 'Marseille',
        'Disponibilité': 'Immédiate',
        'Poste recherché': 'Développeur React',
        'Poste actuel': 'Développeur JavaScript',
        'Années d\'expérience': '5',
        'Formation': 'Master en Informatique',
        'Compétences': 'React, TypeScript, Node.js',
        'Langues': 'Français, Anglais',
        'Mission / Prestation': 'CSP Entreprise X'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(template);

    // Ajuster la largeur des colonnes
    const colWidths = Object.keys(template[0]).map(key => ({
      wch: Math.max(20, key.length)
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Bénéficiaires');
    XLSX.writeFile(wb, 'modele_import_beneficiaires.xlsx');
  };

  const validateData = (jsonData: any[]): { 
    valid: Partial<Beneficiaire>[];
    duplicates: any[];
    errors: string[];
  } => {
    const valid: Partial<Beneficiaire>[] = [];
    const duplicates: any[] = [];
    const errors: string[] = [];

    jsonData.forEach((row, index) => {
      const lineNumber = index + 2;

      // Validation des champs requis
      if (!row['Prénom']?.toString().trim() && !row.prenom?.toString().trim()) {
        errors.push(`Ligne ${lineNumber} : Le prénom est requis`);
        return;
      }

      if (!row['Nom']?.toString().trim() && !row.nom?.toString().trim()) {
        errors.push(`Ligne ${lineNumber} : Le nom est requis`);
        return;
      }

      if (!row['Email']?.toString().trim() && !row.email?.toString().trim()) {
        errors.push(`Ligne ${lineNumber} : L'email est requis`);
        return;
      }

      const email = (row['Email'] || row.email)?.toString().trim();
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(email)) {
        errors.push(`Ligne ${lineNumber} : Format d'email invalide`);
        return;
      }

      // Validation des nouveaux champs requis
      if (!row['Poste recherché']?.toString().trim() && !row.poste_recherche?.toString().trim()) {
        errors.push(`Ligne ${lineNumber} : Le poste recherché est requis`);
        return;
      }

      if (!row['Formation']?.toString().trim() && !row.formation?.toString().trim()) {
        errors.push(`Ligne ${lineNumber} : La formation est requise`);
        return;
      }

      const yearsOfExperience = Number(row["Années d'expérience"] || row.annees_experience);
      if (isNaN(yearsOfExperience) || yearsOfExperience < 0) {
        errors.push(`Ligne ${lineNumber} : Le nombre d'années d'expérience doit être un nombre positif`);
        return;
      }

      // Vérification des doublons
      const isDuplicate = beneficiaires.some(b => 
        b.email.toLowerCase() === email.toLowerCase()
      );

      if (isDuplicate) {
        duplicates.push(row);
        return;
      }

      // Si toutes les validations sont passées
      valid.push({
        firstName: (row['Prénom'] || row.prenom).toString().trim(),
        lastName: (row['Nom'] || row.nom).toString().trim(),
        email: email,
        phone: (row['Téléphone'] || row.telephone)?.toString().trim() || '',
        title: (row['Titre'] || row.titre)?.toString().trim() || '',
        location: (row['Localisation'] || row.localisation)?.toString().trim() || '',
        availability: (row['Disponibilité'] || row.disponibilite)?.toString().trim() || '',
        desiredPosition: (row['Poste recherché'] || row.poste_recherche).toString().trim(),
        currentPosition: (row['Poste actuel'] || row.poste_actuel)?.toString().trim() || '',
        yearsOfExperience: yearsOfExperience,
        formation: (row['Formation'] || row.formation).toString().trim(),
        mission: (row['Mission / Prestation'] || row.mission)?.toString().trim() || '',
        experiences: [],
        education: [],
        skills: (row['Compétences'] || row.competences)?.toString().split(',').map((s: string) => s.trim()) || [],
        languages: (row['Langues'] || row.langues)?.toString().split(',').map((l: string) => l.trim()) || []
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
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Importer des bénéficiaires</h2>
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
                    Aperçu des données ({preview.length} bénéficiaires)
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
                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Email</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Poste recherché</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Formation</th>
                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Mission</th>
                      </tr>
                    </thead>
                    <tbody className={`${darkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                      {preview.map((beneficiaire, index) => (
                        <tr key={index}>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {beneficiaire.firstName} {beneficiaire.lastName}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            {beneficiaire.email}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            {beneficiaire.desiredPosition}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            {beneficiaire.formation}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                            {beneficiaire.mission || '-'}
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