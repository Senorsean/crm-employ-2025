import React from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Consultant } from '../types/agency';
import { useThemeStore } from '../stores/themeStore';

interface ConsultantFormData {
  name: string;
  role: string;
  phone: string;
  email: string;
}

interface ConsultantFormProps {
  agencyId: string;
  onSubmit: (data: ConsultantFormData) => void;
  onClose: () => void;
  consultant?: Consultant;
  isEditing?: boolean;
}

function ConsultantForm({ agencyId, onSubmit, onClose, consultant, isEditing = false }: ConsultantFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<ConsultantFormData>({
    defaultValues: isEditing && consultant ? {
      name: consultant.name,
      role: consultant.role,
      phone: consultant.phone,
      email: consultant.email
    } : undefined
  });
  const { darkMode } = useThemeStore();

  // Format phone number for tel: links by removing spaces, dots, etc.
  const formatPhoneForLink = (phone: string) => {
    if (!phone) return '';
    return phone.replace(/[\s\.\-\(\)]/g, '');
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-[60] flex items-center justify-center">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl w-full max-w-2xl`}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-anthea-blue'}`}>
                {isEditing ? 'Modifier le consultant' : 'Nouveau consultant'}
              </h2>
              <button type="button" onClick={onClose} className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Nom complet *
                </label>
                <input
                  type="text"
                  {...register("name", { required: "Le nom est requis" })}
                  className={`w-full rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5 focus:ring-2 focus:ring-anthea-blue focus:border-transparent`}
                />
                {errors.name && (
                  <span className="text-sm text-red-600">{errors.name.message}</span>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Fonction *
                </label>
                <select
                  {...register("role", { required: "La fonction est requise" })}
                  className={`w-full rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5 focus:ring-2 focus:ring-anthea-blue focus:border-transparent`}
                >
                  <option value="">Sélectionner une fonction</option>
                  <option value="Consultant(e)">Consultant(e)</option>
                  <option value="Consultant(e) senior">Consultant(e) senior</option>
                  <option value="Responsable d'agence">Responsable d'agence</option>
                </select>
                {errors.role && (
                  <span className="text-sm text-red-600">{errors.role.message}</span>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Téléphone *
                </label>
                <input
                  type="tel"
                  {...register("phone", {
                    required: "Le téléphone est requis",
                    pattern: {
                      value: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
                      message: "Format de téléphone invalide"
                    }
                  })}
                  className={`w-full rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5 focus:ring-2 focus:ring-anthea-blue focus:border-transparent`}
                  placeholder="06 XX XX XX XX"
                />
                {errors.phone && (
                  <span className="text-sm text-red-600">{errors.phone.message}</span>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Email professionnel *
                </label>
                <input
                  type="email"
                  {...register("email", {
                    required: "L'email est requis",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Format d'email invalide"
                    }
                  })}
                  className={`w-full rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5 focus:ring-2 focus:ring-anthea-blue focus:border-transparent`}
                  placeholder="prenom.nom@anthea.fr"
                />
                {errors.email && (
                  <span className="text-sm text-red-600">{errors.email.message}</span>
                )}
              </div>
            </div>
          </div>

          <div className={`px-6 py-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-b-2xl flex justify-end gap-4`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'} rounded-xl transition-colors`}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-anthea text-white rounded-xl hover:opacity-90 transition-opacity"
            >
              {isEditing ? 'Enregistrer les modifications' : 'Ajouter le consultant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ConsultantForm;