import React, { useState, useEffect } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { auth } from '../config/firebase';
import { updateProfile, updatePassword } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import UserPhotoUploader from './UserPhotoUploader';
import { useThemeStore } from '../stores/themeStore';

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isDarkMode } = useThemeStore();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setFullName(user.displayName || '');
      setPhotoURL(user.photoURL);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || isLoading) return;

    setIsLoading(true);
    setError('');

    try {
      const updateData: { displayName: string; photoURL?: string | null } = {
        displayName: fullName,
        photoURL: photoURL
      };

      await updateProfile(auth.currentUser, updateData);

      if (newPassword) {
        await updatePassword(auth.currentUser, newPassword);
      }

      await auth.currentUser.reload();
      toast.success('Profil mis à jour avec succès');
      onClose();
    } catch (err) {
      console.error('Erreur mise à jour profil:', err);
      setError('Erreur lors de la mise à jour du profil');
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpdate = (url: string | null) => {
    setPhotoURL(url);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
      <div className={`${isDarkMode ? 'bg-gray-800 text-gray-100' : 'bg-white'} rounded-xl shadow-xl w-full max-w-md`}>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Mon Profil</h2>
              <button 
                type="button" 
                onClick={onClose} 
                className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="flex flex-col items-center mb-6">
                <UserPhotoUploader
                  currentPhotoURL={photoURL}
                  displayName={fullName}
                  onPhotoUpdate={handlePhotoUpdate}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Nom complet
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full rounded-lg border ${
                    isDarkMode 
                      ? 'border-gray-700 bg-gray-700 text-gray-100' 
                      : 'border-gray-200 text-gray-900'
                  } p-2.5`}
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Email
                </label>
                <input
                  type="email"
                  value={auth.currentUser?.email || ''}
                  className={`w-full rounded-lg border ${
                    isDarkMode 
                      ? 'border-gray-700 bg-gray-700 text-gray-500' 
                      : 'border-gray-200 bg-gray-50 text-gray-500'
                  } p-2.5`}
                  disabled
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Laisser vide pour ne pas modifier"
                    className={`w-full rounded-lg border ${
                      isDarkMode 
                        ? 'border-gray-700 bg-gray-700 text-gray-100' 
                        : 'border-gray-200 text-gray-900'
                    } p-2.5 pr-10`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-400'
                    }`}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={`px-6 py-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-b-xl flex justify-end gap-4`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-600' 
                  : 'text-gray-700 hover:bg-gray-100'
              } rounded-lg`}
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-anthea text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}