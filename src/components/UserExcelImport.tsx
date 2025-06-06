import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, AlertCircle, X, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';

interface UserExcelImportProps {
  onImport: (data: any[]) => void;
  onClose: () => void;
}

export default function UserExcelImport({ onImport, onClose }: UserExcelImportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[] | null>(null);

  const downloadTemplate = () => {
    const template = [
      {
        'Prénom': 'Jean',
        'Nom': 'Dupont',
        'Email': 'jean.dupont@example.com',
        'Mot de passe': 'Temp123!',
        'Rôle': 'user'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(template);

    // Ajuster la largeur des colonnes
    const colWidths = Object.keys(template[0]).map(key => ({
      wch: Math.max(20, key.length)
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Utilisateurs');
    XLSX.writeFile(wb, 'modele_import_utilisateurs.xlsx');
  };

  const validateData = (data: any[]) => {
    const valid: any[] = [];
    const errors: string[] = [];

    // Vérifier que le fichier n'est pas vide
    if (!data || data.length === 0) {
      errors.push('Le fichier est vide');
      return { valid, errors };
    }

    data.forEach((row, index) => {
      const lineNumber = index + 2; // +2 car Excel commence à 1 et il y a l'en-tête

      // Validation des champs requis
      if (!row['Prénom']?.toString().trim()) {
        errors.push(`Ligne ${lineNumber} : Le prénom est requis`);
        return;
      }

      if (!row['Nom']?.toString().trim()) {
        errors.push(`Ligne ${lineNumber} : Le nom est requis`);
        return;
      }

      if (!row['Email']?.toString().trim()) {
        errors.push(`Ligne ${lineNumber} : L'email est requis`);
        return;
      }

      if (!row['Mot de passe']?.toString().trim()) {
        errors.push(`Ligne ${lineNumber} : Le mot de passe est requis`);
        return;
      }

      // Validation de l'email
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(row['Email'])) {
        errors.push(`Ligne ${lineNumber} : Format d'email invalide`);
        return;
      }

      // Validation du mot de passe
      const password = row['Mot de passe'].toString();
      if (password.length < 8) {
        errors.push(`Ligne ${lineNumber} : Le mot de passe doit contenir au moins 8 caractères`);
        return;
      }
      if (!/[A-Z]/.test(password)) {
        errors.push(`Ligne ${lineNumber} : Le mot de passe doit contenir au moins une majuscule`);
        return;
      }
      if (!/[0-9]/.test(password)) {
        errors.push(`Ligne ${lineNumber} : Le mot de passe doit contenir au moins un chiffre`);
        return;
      }
      if (!/[!@#$%^&*]/.test(password)) {
        errors.push(`Ligne ${lineNumber} : Le mot de passe doit contenir au moins un caractère spécial`);
        return;
      }

      // Validation du rôle
      const role = row['Rôle']?.toString().toLowerCase() || 'user';
      if (!['admin', 'manager', 'user'].includes(role)) {
        errors.push(`Ligne ${lineNumber} : Rôle invalide (admin, manager, user)`);
        return;
      }

      // Si toutes les validations sont passées
      valid.push({
        firstName: row['Prénom'].toString().trim(),
        lastName: row['Nom'].toString().trim(),
        email: row['Email'].toString().trim(),
        password: row['Mot de passe'].toString().trim(),
        role: role
      });
    });

    return { valid, errors };
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

      const { valid, errors } = validateData(jsonData);

      if (errors.length > 0) {
        setError(`Erreurs de validation:\n${errors.join('\n')}`);
        return;
      }

      setPreview(valid);
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Importer des utilisateurs</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <button
                onClick={downloadTemplate}
                className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Upload className="w-4 h-4 mr-2" />
                Télécharger le modèle
              </button>

              <div
                {...getRootProps()}
                className={`
                  flex-1 p-6 border-2 border-dashed rounded-lg text-center cursor-pointer
                  transition-colors
                  ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <input {...getInputProps()} />
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    <span className="ml-2">Import en cours...</span>
                  </div>
                ) : (
                  <div className="text-gray-600">
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
              <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="whitespace-pre-line">{error}</div>
              </div>
            )}

            {preview && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">
                    Aperçu des données ({preview.length} utilisateurs)
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
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {preview.map((user, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.firstName} {user.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.role}
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