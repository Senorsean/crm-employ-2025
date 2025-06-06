import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '../config/firebase';
import { updateProfile } from 'firebase/auth'; // ✅ Import ajouté

interface UserPhotoUploadProps {
  currentPhotoURL: string | null;
  displayName?: string | null;
  onPhotoUpdate: (url: string | null) => void;
}

export default function UserPhotoUpload({
  currentPhotoURL,
  displayName,
  onPhotoUpdate,
}: UserPhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    const user = auth.currentUser;
    if (!file || !user) return;

    setIsUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const safeName = file.name.replace(/\s+/g, '_').replace(/[^\w.-]/g, '');
      const ext = safeName.split('.').pop();
      const path = `profile-photos/${user.uid}/photo_${Date.now()}.${ext}`;
      const fileRef = ref(storage, path);

      await uploadBytes(fileRef, file);
      const publicUrl = await getDownloadURL(fileRef);

      // ✅ Mise à jour du profil utilisateur Firebase
      await updateProfile(user, {
        photoURL: publicUrl,
      });

      onPhotoUpdate(publicUrl);
      toast.success('Photo de profil mise à jour');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Erreur lors du téléchargement : ${error.message}`);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La taille du fichier dépasse 5 Mo');
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Format non supporté. Utilisez JPG ou PNG');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 200 || img.height < 200) {
          toast.error('L\'image doit faire au moins 200x200 pixels');
          return;
        }
        handleUpload(file);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleRemovePhoto = () => {
    onPhotoUpdate(null);
    setPreviewUrl(null);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div {...getRootProps()} className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group">
          <input {...getInputProps()} />
          {(previewUrl || currentPhotoURL) ? (
            <img
              src={previewUrl || currentPhotoURL || ''}
              alt="Photo de profil"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>

        {(currentPhotoURL || previewUrl) && !isUploading && (
          <button
            onClick={handleRemovePhoto}
            className="absolute -top-1 -right-1 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-full">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        )}
      </div>

      <p className="mt-2 text-sm text-gray-500">Cliquez pour modifier la photo</p>
    </div>
  );
}
