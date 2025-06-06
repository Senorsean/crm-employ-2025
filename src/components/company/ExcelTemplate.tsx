import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, AlertCircle, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useCompaniesStore } from '../../stores/companiesStore';
import { auth } from '../../config/firebase';
import { useThemeStore } from '../../stores/themeStore';

interface ExcelTemplateProps {
  onImport: (data: any[]) => void;
}

// Validation helpers
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return phoneRegex.test(phone);
};

// Normalisation des chaînes pour la comparaison
const normalizeString = (str: string): string => {
  return str.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

export default function ExcelTemplate({ onImport }: ExcelTemplateProps) {
  const { companies } = useCompaniesStore();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    added: number;
    duplicates: number;
    errors: number;
  } | null>(null);
  const { darkMode } = useThemeStore();

  const downloadTemplate = () => {
    const template = [
      {
        name: 'Exemple Entreprise',
        sector: 'Informatique',
        size: 'TPE (1-9 employés)',
        address: '123 rue Example',
        city: 'Marseille',
        phone: '04 91 00 00 00',
        email: 'contact@exemple.fr',
        contacts: 'Joe la frite',
        'Contact - téléphone': '06 00 00 00 00',
        'Contact - email': 'contact@exemple.fr'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(template);

    // Ajuster la largeur des colonnes
    const colWidths = Object.keys(template[0]).map(key => ({
      wch: Math.max(20, key.length)
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Entreprises');
    XLSX.writeFile(wb, 'modele_import_entreprises.xlsx');
  };

  const checkDuplicates = (companyName: string): boolean => {
    const normalizedName = normalizeString(companyName);
    return companies.some(existingCompany => 
      normalizeString(existingCompany.name) === normalizedName
    );
  };

  const validateData = (data: any[]) => {
    const valid: any[] = [];
    const duplicates: any[] = [];
    const errors: string[] = [];

    // Vérifier que le fichier n'est pas vide
    if (!data || data.length === 0) {
      errors.push('Le fichier est vide');
      return { valid, duplicates, errors };
    }

    data.forEach((row, index) => {
      const lineNumber = index + 2; // +2 car Excel commence à 1 et il y a l'en-tête

      // Validation des champs requis
      if (!row['name']?.toString().trim()) {
        errors.push(`Ligne ${lineNumber} : Le nom de l'entreprise est requis`);
        return;
      }

      // Vérification des doublons dans le fichier
      const normalizedName = normalizeString(row['name']);
      if (checkDuplicates(row['name'])) {
        duplicates.push(row);
        return;
      }

      // Si toutes les validations sont passées
      valid.push({
        userId: auth.currentUser?.uid,
        userName: auth.currentUser?.displayName || 'Non renseigné',
        name: row['name'].toString().trim(),
        sector: row['sector']?.toString().trim() || '',
        size: row['size']?.toString().trim() || '',
        address: row['address']?.toString().trim() || '',
        city: row['city']?.toString().trim() || '',
        phone: row['phone']?.toString().trim() || '',
        email: row['email']?.toString().trim() || '',
        status: 'active',
        contacts: row['contacts'] ? [{
          name: row['contacts']?.toString().trim(),
          role: 'Contact principal',
          phone: row['Contact - téléphone']?.toString().trim() || '',
          email: row['Contact - email']?.toString().trim() || ''
        }] : [],
        newsletter_consent: false
      });
    });

    return { valid, duplicates, errors };
  };

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setPreview(null);
    setImportSummary(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Validation des données
      const { valid, duplicates, errors } = validateData(jsonData);

      if (errors.length > 0) {
        setError(`Erreurs de validation:\n${errors.join('\n')}`);
        setImporting(false);
        return;
      }

      // Formater les données valides
      const formattedData = valid.map(company => ({
        ...company,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      setPreview(formattedData);
      setImportSummary({
        total: jsonData.length,
        added: formattedData.length,
        duplicates: duplicates.length,
        errors: errors.length
      });

    } catch (error) {
      console.error('Error parsing Excel file:', error);
      setError('Erreur lors de la lecture du fichier. Vérifiez le format du fichier.');
    } finally {
      setImporting(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: importing
  });

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);

    try {
      await onImport(preview);
      setPreview(null);
      setImportSummary(null);
    } catch (error) {
      setError('Erreur lors de l\'import des données');
    } finally {
      setImporting(false);
    }
  };

  return (
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
            ${importing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          {importing ? (
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

      {importSummary && (
        <div className={`p-4 ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'} rounded-lg`}>
          <h3 className="font-medium mb-2">Résumé de l'import</h3>
          <ul className="space-y-1">
            <li>Total d'entreprises dans le fichier : {importSummary.total}</li>
            <li>Entreprises à ajouter : {importSummary.added}</li>
            <li>Doublons détectés : {importSummary.duplicates}</li>
            <li>Erreurs de validation : {importSummary.errors}</li>
          </ul>
        </div>
      )}

      {preview && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Aperçu des données ({preview.length} entreprises)
            </h3>
            <button
              onClick={handleImport}
              disabled={importing}
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
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Secteur</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Ville</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Contact</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Téléphone</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Email</th>
                </tr>
              </thead>
              <tbody className={`${darkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                {preview.map((company, index) => (
                  <tr key={index}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{company.name}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{company.sector}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{company.city}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      {company.contacts[0]?.name || '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      {company.contacts[0]?.phone || '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      {company.contacts[0]?.email || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}