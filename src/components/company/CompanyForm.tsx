import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { X, Plus, Trash2, Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { businessSectors } from '../data/sectors';
import { companySizes } from '../data/companySizes';
import { auth } from '../config/firebase';
import { useThemeStore } from '../stores/themeStore';

interface CompanyFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
  company?: any;
  isEditing?: boolean;
}

export default function CompanyForm({ onSubmit, onClose, company, isEditing = false }: CompanyFormProps) {
  const { register, control, handleSubmit, formState: { errors }, setValue } = useForm({
    defaultValues: isEditing && company ? {
      name: company.name,
      address: company.address,
      city: company.city,
      phone: company.phone,
      email: company.email,
      sector: company.sector,
      size: company.size,
      contacts: company.contacts || [{ name: '', role: '', email: '', phone: '' }],
      newsletter_consent: company.newsletter_consent || false,
      status: company.status || 'active',
      createdBy: company.createdBy || auth.currentUser?.displayName || 'Utilisateur inconnu'
    } : {
      contacts: [{ name: '', role: '', email: '', phone: '' }],
      status: 'active',
      createdBy: auth.currentUser?.displayName || 'Utilisateur inconnu'
    }
  });
  const { darkMode } = useThemeStore();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "contacts"
  });

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setValue('logo', file);
    }
  }, [setValue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.svg']
    },
    maxFiles: 1,
    multiple: false
  });

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto`}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {isEditing ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}
              </h2>
              <button type="button" onClick={onClose} className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    {...register("name", { required: "Le nom est requis" })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  />
                  {errors.name && (
                    <span className="text-sm text-red-600">{errors.name.message}</span>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Statut
                  </label>
                  <select
                    {...register("status")}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Secteur d'activité *
                  </label>
                  <select
                    {...register("sector", { required: "Le secteur est requis" })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  >
                    <option value="">Sélectionner un secteur...</option>
                    {businessSectors.map(sector => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                  {errors.sector && (
                    <span className="text-sm text-red-600">{errors.sector.message}</span>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Taille de l'entreprise *
                  </label>
                  <select
                    {...register("size", { required: "La taille est requise" })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  >
                    <option value="">Sélectionner une taille...</option>
                    {companySizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  {errors.size && (
                    <span className="text-sm text-red-600">{errors.size.message}</span>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Adresse
                </label>
                <input
                  type="text"
                  {...register("address")}
                  className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Ville
                  </label>
                  <input
                    type="text"
                    {...register("city")}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    {...register("phone")}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Email
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                />
              </div>

              {/* Contacts */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Contacts</h3>
                  <button
                    type="button"
                    onClick={() => append({ name: '', role: '', email: '', phone: '' })}
                    className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} flex items-center`}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter un contact
                  </button>
                </div>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className={`p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg`}>
                      <div className="flex justify-between mb-4">
                        <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Contact {index + 1}</h4>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className={`${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Nom</label>
                          <input
                            type="text"
                            {...register(`contacts.${index}.name`)}
                            className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Fonction</label>
                          <input
                            type="text"
                            {...register(`contacts.${index}.role`)}
                            className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Email</label>
                          <input
                            type="email"
                            {...register(`contacts.${index}.email`)}
                            className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Téléphone</label>
                          <input
                            type="tel"
                            {...register(`contacts.${index}.phone`)}
                            className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Champ caché pour stocker le créateur */}
              <input type="hidden" {...register("createdBy")} />

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register("newsletter_consent")}
                    className={`rounded border-gray-300 text-blue-600 mr-2 ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`}
                  />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Accepte de recevoir la newsletter
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className={`px-6 py-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-b-xl flex justify-end gap-4`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 ${darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'} rounded-lg`}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isEditing ? 'Enregistrer les modifications' : 'Créer l\'entreprise'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}