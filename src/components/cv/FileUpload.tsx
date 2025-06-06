import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';
import { validateCVFile } from '../../services/affinda/validators';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function FileUpload({ onFileSelect, isLoading, error }: FileUploadProps) {
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const validation = validateCVFile(file);
      if (!validation.isValid) {
        setValidationError(validation.error);
        return;
      }
      setValidationError(null);
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: isLoading
  });

  const displayError = validationError || error;

  return (
    <div
      {...getRootProps()}
      className={`
        p-6 border-2 border-dashed rounded-lg text-center cursor-pointer
        transition-colors
        ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        ${displayError ? 'border-red-300' : ''}
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
                ? 'Déposez le fichier ici...'
                : 'Glissez-déposez un CV, ou cliquez pour sélectionner'}
            </p>
            <p className="text-sm text-gray-500">Formats acceptés : PDF, DOC, DOCX</p>
          </>
        )}
      </div>

      {displayError && (
        <div className="mt-4 flex items-start gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>{displayError}</p>
        </div>
      )}
    </div>
  );
}