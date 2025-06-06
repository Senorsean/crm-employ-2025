import React from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAgenciesStore } from '../stores/agenciesStore';
import type { Agency } from '../types/agency';
import { useThemeStore } from '../stores/themeStore';

interface AgencyFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
  agency?: Agency;
  isEditing?: boolean;
}

function AgencyForm({ onSubmit, onClose, agency, isEditing = false }: AgencyFormProps) {
  const { deleteAgency } = useAgenciesStore();
  const { darkMode } = useThemeStore();

  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: isEditing && agency ? {
      name: agency.name,
      address: agency.address,
      phone: agency.phone,
      email: agency.email,
      consultants: agency.consultants || []
    } : {
      consultants: [{ name: '', role: '', email: '', phone: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "consultants"
  });

  const handleDelete = () => {
    if (agency && window.confirm('Êtes-vous sûr de vouloir supprimer cette agence ?')) {
      deleteAgency(agency.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl w-full max-w-2xl`}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-anthea-blue'}`}>
                {isEditing ? 'Modifier l\'agence' : 'Nouvelle agence'}
              </h2>
              <div className="flex items-center gap-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className={`flex items-center px-3 py-1.5 text-sm ${darkMode ? 'bg-red-900 text-red-300' : 'bg-red-50 text-red-600'} rounded-lg hover:${darkMode ? 'bg-red-800' : 'bg-red-100'}`}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Supprimer
                  </button>
                )}
                <button type="button" onClick={onClose} className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Nom de l'agence *
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
                    Adresse *
                  </label>
                  <input
                    type="text"
                    {...register("address", { required: "L'adresse est requise" })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  />
                  {errors.address && (
                    <span className="text-sm text-red-600">{errors.address.message}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    {...register("phone", { required: "Le téléphone est requis" })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  />
                  {errors.phone && (
                    <span className="text-sm text-red-600">{errors.phone.message}</span>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Email
                  </label>
                  <input
                    type="email"
                    {...register("email", {
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Format d'email invalide"
                      }
                    })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  />
                  {errors.email && (
                    <span className="text-sm text-red-600">{errors.email.message}</span>
                  )}
                </div>
              </div>

              {/* Consultants */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Consultants</h3>
                  <button
                    type="button"
                    onClick={() => append({ name: '', role: '', email: '', phone: '' })}
                    className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} flex items-center`}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter un consultant
                  </button>
                </div>
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className={`p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg`}>
                      <div className="flex justify-between mb-4">
                        <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Consultant {index + 1}</h4>
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
                            {...register(`consultants.${index}.name`)}
                            className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Fonction</label>
                          <input
                            type="text"
                            {...register(`consultants.${index}.role`)}
                            className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Email</label>
                          <input
                            type="email"
                            {...register(`consultants.${index}.email`)}
                            className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                          />
                        </div>
                        <div>
                          <label className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Téléphone</label>
                          <input
                            type="tel"
                            {...register(`consultants.${index}.phone`)}
                            className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={`px-6 py-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-b-xl flex justify-end gap-4`}>
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
              {isEditing ? 'Enregistrer les modifications' : 'Créer l\'agence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AgencyForm;