import React from 'react';
import { X } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useBeneficiairesStore } from '../../stores/beneficiairesStore';
import { useThemeStore } from '../../stores/themeStore';

interface EventFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
  event?: any;
  isEditing?: boolean;
}

export default function EventForm({ onSubmit, onClose, event, isEditing = false }: EventFormProps) {
  const { beneficiaires } = useBeneficiairesStore();
  const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: isEditing && event ? {
      name: event.name,
      type: event.type,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      address: event.address,
      description: event.description,
      maxParticipants: event.maxParticipants,
      invitedBeneficiaires: event.invitedBeneficiaires || [],
      partners: event.partners || [''],
      notes: event.notes || ''
    } : {
      type: 'job_dating',
      partners: [''],
      invitedBeneficiaires: []
    }
  });
  const { darkMode } = useThemeStore();

  const { fields: partnerFields, append: appendPartner, remove: removePartner } = useFieldArray({
    control,
    name: "partners"
  });

  const eventType = watch('type');

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto`}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {isEditing ? 'Modifier l\'événement' : 'Nouvel événement'}
              </h2>
              <button type="button" onClick={onClose} className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Informations générales */}
              <div>
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>Informations générales</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Nom de l'événement *
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
                      Type d'événement *
                    </label>
                    <select
                      {...register("type", { required: "Le type est requis" })}
                      className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                    >
                      <option value="job_dating">Job Dating</option>
                      <option value="salon">Salon pour l'emploi</option>
                      <option value="workshop">Atelier</option>
                      <option value="conference">Conférence</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Date et heure */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Date *
                  </label>
                  <input
                    type="date"
                    {...register("date", { required: "La date est requise" })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  />
                  {errors.date && (
                    <span className="text-sm text-red-600">{errors.date.message}</span>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Heure de début *
                  </label>
                  <input
                    type="time"
                    {...register("startTime", { required: "L'heure de début est requise" })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  />
                  {errors.startTime && (
                    <span className="text-sm text-red-600">{errors.startTime.message}</span>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Heure de fin *
                  </label>
                  <input
                    type="time"
                    {...register("endTime", { required: "L'heure de fin est requise" })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  />
                  {errors.endTime && (
                    <span className="text-sm text-red-600">{errors.endTime.message}</span>
                  )}
                </div>
              </div>

              {/* Lieu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Lieu *
                  </label>
                  <input
                    type="text"
                    {...register("location", { required: "Le lieu est requis" })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                    placeholder="Nom du lieu"
                  />
                  {errors.location && (
                    <span className="text-sm text-red-600">{errors.location.message}</span>
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

              {/* Description */}
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={4}
                  className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  placeholder="Description de l'événement..."
                />
              </div>

              {/* Capacité */}
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Nombre maximum de participants
                </label>
                <input
                  type="number"
                  {...register("maxParticipants", { min: 1 })}
                  className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                />
              </div>

              {/* Bénéficiaires invités */}
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Bénéficiaires invités
                </label>
                <select
                  multiple
                  {...register("invitedBeneficiaires")}
                  className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  size={5}
                >
                  {beneficiaires.map((beneficiaire) => (
                    <option key={beneficiaire.id} value={beneficiaire.id}>
                      {beneficiaire.firstName} {beneficiaire.lastName} - {beneficiaire.title}
                    </option>
                  ))}
                </select>
                <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Maintenez Ctrl (Windows) ou Cmd (Mac) pour sélectionner plusieurs bénéficiaires
                </p>
              </div>

              {/* Partenaires/Entreprises */}
              {(eventType === 'job_dating' || eventType === 'salon') && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Entreprises participantes
                    </label>
                    <button
                      type="button"
                      onClick={() => appendPartner('')}
                      className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                    >
                      + Ajouter une entreprise
                    </button>
                  </div>
                  <div className="space-y-2">
                    {partnerFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2">
                        <input
                          {...register(`partners.${index}`)}
                          placeholder="Nom de l'entreprise"
                          className={`flex-1 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                        />
                        {partnerFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePartner(index)}
                            className={`px-3 py-2 ${darkMode ? 'text-red-400 hover:bg-red-900' : 'text-red-600 hover:bg-red-50'} rounded-lg`}
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Notes internes
                </label>
                <textarea
                  {...register("notes")}
                  rows={3}
                  className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  placeholder="Notes internes sur l'organisation..."
                />
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
              {isEditing ? 'Enregistrer les modifications' : 'Créer l\'événement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}