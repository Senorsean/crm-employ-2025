import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { X, Plus, Trash2 } from 'lucide-react';
import { useBeneficiairesStore } from '../stores/beneficiairesStore';
import type { Beneficiaire } from '../types/beneficiaire';
import { useThemeStore } from '../stores/themeStore';

interface BeneficiaireFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
  beneficiaire?: any;
  isEditing?: boolean;
}

export default function BeneficiaireForm({ onSubmit, onClose, beneficiaire, isEditing = false }: BeneficiaireFormProps) {
  const { addBeneficiaire, updateBeneficiaire } = useBeneficiairesStore();
  const { darkMode } = useThemeStore();

  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: isEditing && beneficiaire ? {
      firstName: beneficiaire.firstName || '',
      lastName: beneficiaire.lastName || '',
      email: beneficiaire.email || '',
      phone: beneficiaire.phone || '',
      title: beneficiaire.title || '',
      location: beneficiaire.location || '',
      availability: beneficiaire.availability || '',
      skills: Array.isArray(beneficiaire.skills) ? beneficiaire.skills.join(', ') : '',
      languages: Array.isArray(beneficiaire.languages) ? beneficiaire.languages.join(', ') : '',
      experiences: beneficiaire.experiences || [{ title: '', company: '', period: '', description: '' }],
      education: beneficiaire.education || [{ degree: '', school: '', year: '' }],
      desiredPosition: beneficiaire.desiredPosition || '',
      currentPosition: beneficiaire.currentPosition || '',
      yearsOfExperience: beneficiaire.yearsOfExperience || 0,
      formation: beneficiaire.formation || '',
      cvOk: beneficiaire.cvOk || false,
      employed: beneficiaire.employed || false,
      employmentDate: beneficiaire.employmentDate ? new Date(beneficiaire.employmentDate).toISOString().split('T')[0] : '',
      employmentCompany: beneficiaire.employmentCompany || '',
      employmentType: beneficiaire.employmentType || '',
      mission: beneficiaire.mission || ''
    } : {
      experiences: [{ title: '', company: '', period: '', description: '' }],
      education: [{ degree: '', school: '', year: '' }],
      yearsOfExperience: 0,
      cvOk: false,
      employed: false,
      mission: ''
    }
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control,
    name: "experiences"
  });

  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
    control,
    name: "education"
  });

  const handleFormSubmit = async (data: any) => {
    try {
      // Format skills and languages from comma-separated strings to arrays
      const formattedData = {
        ...data,
        skills: data.skills ? data.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        languages: data.languages ? data.languages.split(',').map((l: string) => l.trim()).filter(Boolean) : [],
        yearsOfExperience: parseInt(data.yearsOfExperience, 10) || 0,
        cvOk: data.cvOk === 'true' || data.cvOk === true,
        employed: data.employed === 'true' || data.employed === true
      };

      if (isEditing) {
        await updateBeneficiaire(beneficiaire.id, formattedData);
      } else {
        await addBeneficiaire(formattedData);
      }
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto`}>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {isEditing ? 'Modifier le bénéficiaire' : 'Nouveau bénéficiaire'}
              </h2>
              <button type="button" onClick={onClose} className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Informations personnelles */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Prénom *
                  </label>
                  <input
                    type="text"
                    {...register("firstName", { required: "Le prénom est requis" })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  />
                  {errors.firstName && (
                    <span className="text-sm text-red-600">{errors.firstName.message}</span>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Nom *
                  </label>
                  <input
                    type="text"
                    {...register("lastName", { required: "Le nom est requis" })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  />
                  {errors.lastName && (
                    <span className="text-sm text-red-600">{errors.lastName.message}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Email *
                  </label>
                  <input
                    type="email"
                    {...register("email", { required: "L'email est requis" })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  />
                  {errors.email && (
                    <span className="text-sm text-red-600">{errors.email.message}</span>
                  )}
                </div>
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
              </div>

              {/* Informations professionnelles */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Poste recherché *
                  </label>
                  <input
                    type="text"
                    {...register("desiredPosition", { required: "Ce champ est requis" })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  />
                  {errors.desiredPosition && (
                    <span className="text-sm text-red-600">{errors.desiredPosition.message}</span>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Poste actuel
                  </label>
                  <input
                    type="text"
                    {...register("currentPosition")}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Année(s) d'expérience *
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register("yearsOfExperience", { 
                      required: "Ce champ est requis",
                      min: {
                        value: 0,
                        message: "La valeur doit être supérieure ou égale à 0"
                      }
                    })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  />
                  {errors.yearsOfExperience && (
                    <span className="text-sm text-red-600">{errors.yearsOfExperience.message}</span>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Formation *
                  </label>
                  <input
                    type="text"
                    {...register("formation", { required: "Ce champ est requis" })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  />
                  {errors.formation && (
                    <span className="text-sm text-red-600">{errors.formation.message}</span>
                  )}
                </div>
              </div>

              {/* Mission */}
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Mission / Prestation
                </label>
                <input
                  type="text"
                  {...register("mission")}
                  placeholder="Ex: CSP Entreprise X, Outplacement Société Y..."
                  className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Localisation
                  </label>
                  <input
                    type="text"
                    {...register("location")}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Disponibilité
                  </label>
                  <select
                    {...register("availability")}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Immédiate">Immédiate</option>
                    <option value="Sous 15 jours">Sous 15 jours</option>
                    <option value="Sous 1 mois">Sous 1 mois</option>
                    <option value="Sous 2 mois">Sous 2 mois</option>
                    <option value="Sous 3 mois">Sous 3 mois</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    CV OK
                  </label>
                  <select
                    {...register("cvOk")}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  >
                    <option value="false">Non</option>
                    <option value="true">Oui</option>
                  </select>
                </div>
              </div>

              {/* Statut d'emploi */}
              <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-4`}>
                <h3 className={`text-md font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>Statut d'emploi</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      En emploi
                    </label>
                    <select
                      {...register("employed")}
                      className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                    >
                      <option value="false">Non</option>
                      <option value="true">Oui</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Date d'embauche
                    </label>
                    <input
                      type="date"
                      {...register("employmentDate")}
                      className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Entreprise d'embauche
                    </label>
                    <input
                      type="text"
                      {...register("employmentCompany")}
                      className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      Type de contrat
                    </label>
                    <select
                      {...register("employmentType")}
                      className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                    >
                      <option value="">Sélectionner...</option>
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                      <option value="Intérim">Intérim</option>
                      <option value="Stage">Stage</option>
                      <option value="Alternance">Alternance</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Compétences et langues */}
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Compétences
                </label>
                <input
                  type="text"
                  {...register("skills")}
                  placeholder="Séparez les compétences par des virgules"
                  className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Langues
                </label>
                <input
                  type="text"
                  {...register("languages")}
                  placeholder="Séparez les langues par des virgules"
                  className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                />
              </div>

              {/* Expériences */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Expériences professionnelles</h3>
                  <button
                    type="button"
                    onClick={() => appendExp({ title: '', company: '', period: '', description: '' })}
                    className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} flex items-center`}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter une expérience
                  </button>
                </div>
                {expFields.map((field, index) => (
                  <div key={field.id} className={`mb-4 p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg`}>
                    <div className="flex justify-between mb-4">
                      <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Expérience {index + 1}</h4>
                      {expFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExp(index)}
                          className={`${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        {...register(`experiences.${index}.title`)}
                        placeholder="Titre du poste"
                        className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                      />
                      <input
                        {...register(`experiences.${index}.company`)}
                        placeholder="Entreprise"
                        className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                      />
                    </div>
                    <input
                      {...register(`experiences.${index}.period`)}
                      placeholder="Période (ex: 2020 - 2022)"
                      className={`w-full mt-4 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                    />
                    <textarea
                      {...register(`experiences.${index}.description`)}
                      placeholder="Description"
                      className={`w-full mt-4 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                      rows={3}
                    />
                  </div>
                ))}
              </div>

              {/* Formation */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Formation</h3>
                  <button
                    type="button"
                    onClick={() => appendEdu({ degree: '', school: '', year: '' })}
                    className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} flex items-center`}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter une formation
                  </button>
                </div>
                {eduFields.map((field, index) => (
                  <div key={field.id} className={`mb-4 p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg`}>
                    <div className="flex justify-between mb-4">
                      <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Formation {index + 1}</h4>
                      {eduFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEdu(index)}
                          className={`${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        {...register(`education.${index}.degree`)}
                        placeholder="Diplôme"
                        className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                      />
                      <input
                        {...register(`education.${index}.school`)}
                        placeholder="École"
                        className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                      />
                    </div>
                    <input
                      {...register(`education.${index}.year`)}
                      placeholder="Année"
                      className={`w-full mt-4 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                    />
                  </div>
                ))}
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
              {isEditing ? 'Enregistrer les modifications' : 'Créer le bénéficiaire'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}