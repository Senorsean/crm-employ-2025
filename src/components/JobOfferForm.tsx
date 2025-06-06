import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { X, Plus, Trash2 } from 'lucide-react';
import { useCompaniesStore } from '../stores/companiesStore';
import { auth } from '../config/firebase';
import type { JobOffer } from '../types/jobOffer';
import { useThemeStore } from '../stores/themeStore';

interface JobOfferFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
  offer?: JobOffer;
  isEditing?: boolean;
}

function JobOfferForm({ onSubmit, onClose, offer, isEditing = false }: JobOfferFormProps) {
  const { companies } = useCompaniesStore();
  const activeCompanies = companies.filter(c => c.status === 'active');
  const { darkMode } = useThemeStore();

  // Préparer les valeurs par défaut pour les tableaux
  const defaultRequirements = isEditing && offer?.requirements ? 
    offer.requirements : [''];
  const defaultBenefits = isEditing && offer?.benefits ? 
    offer.benefits : [''];
  const defaultSkills = isEditing && offer?.skills ? 
    offer.skills : [''];

  const { register, control, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: isEditing && offer ? {
      title: offer.title || '',
      company: offer.company || '',
      location: offer.location || '',
      type: offer.type || '',
      urgencyLevel: offer.urgencyLevel || 'low',
      status: offer.status || 'new',
      description: offer.description || '',
      salary: offer.salary || '',
      requirements: defaultRequirements,
      benefits: defaultBenefits,
      skills: defaultSkills,
      createdBy: offer.createdBy || auth.currentUser?.displayName || 'Utilisateur inconnu',
      contact: offer.contact || {
        name: '',
        role: '',
        email: '',
        phone: ''
      }
    } : {
      title: '',
      company: '',
      location: '',
      type: '',
      urgencyLevel: 'low',
      status: 'new',
      description: '',
      salary: '',
      requirements: [''],
      benefits: [''],
      skills: [''],
      createdBy: auth.currentUser?.displayName || 'Utilisateur inconnu',
      contact: {
        name: '',
        role: '',
        email: '',
        phone: ''
      }
    }
  });

  const { fields: reqFields, append: appendReq, remove: removeReq } = useFieldArray({
    control,
    name: "requirements"
  });

  const { fields: benFields, append: appendBen, remove: removeBen } = useFieldArray({
    control,
    name: "benefits"
  });

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control,
    name: "skills"
  });

  // Watch for company changes to auto-fill contact info
  const selectedCompany = watch('company');
  React.useEffect(() => {
    if (!isEditing) { // Ne pas auto-remplir si en mode édition
      const company = companies.find(c => c.name === selectedCompany);
      if (company && company.contacts.length > 0) {
        const mainContact = company.contacts[0];
        setValue('contact', {
          name: mainContact.name,
          role: mainContact.role,
          email: mainContact.email,
          phone: mainContact.phone
        });
        setValue('location', company.city || '');
      }
    }
  }, [selectedCompany, companies, setValue, isEditing]);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto`}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {isEditing ? 'Modifier l\'offre' : 'Nouvelle offre'}
              </h2>
              <button type="button" onClick={onClose} className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Titre du poste *
                  </label>
                  <input
                    type="text"
                    {...register("title", { required: "Ce champ est requis" })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  />
                  {errors.title && (
                    <span className="text-sm text-red-600">{errors.title.message}</span>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Entreprise *
                  </label>
                  <select
                    {...register("company", { required: "Ce champ est requis" })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  >
                    <option value="">Sélectionner une entreprise...</option>
                    {activeCompanies.map((company) => (
                      <option key={company.id} value={company.name}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  {errors.company && (
                    <span className="text-sm text-red-600">{errors.company.message}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Localisation *
                  </label>
                  <input
                    type="text"
                    {...register("location", { required: "Ce champ est requis" })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  />
                  {errors.location && (
                    <span className="text-sm text-red-600">{errors.location.message}</span>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Type de contrat *
                  </label>
                  <select
                    {...register("type", { required: "Ce champ est requis" })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  >
                    <option value="">Sélectionner...</option>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Intérim">Intérim</option>
                  </select>
                  {errors.type && (
                    <span className="text-sm text-red-600">{errors.type.message}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Niveau d'urgence *
                  </label>
                  <select
                    {...register("urgencyLevel", { required: "Ce champ est requis" })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  >
                    <option value="">Sélectionner...</option>
                    <option value="high">Urgent</option>
                    <option value="medium">Prioritaire</option>
                    <option value="low">Normal</option>
                  </select>
                  {errors.urgencyLevel && (
                    <span className="text-sm text-red-600">{errors.urgencyLevel.message}</span>
                  )}
                </div>
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Statut *
                  </label>
                  <select
                    {...register("status", { required: "Ce champ est requis" })}
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  >
                    <option value="new">Nouvelle offre</option>
                    <option value="open">Offre en cours</option>
                    <option value="filled">Offre pourvue</option>
                    <option value="closed">Offre fermée</option>
                  </select>
                  {errors.status && (
                    <span className="text-sm text-red-600">{errors.status.message}</span>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Description du poste *
                </label>
                <textarea
                  {...register("description", { required: "Ce champ est requis" })}
                  rows={5}
                  className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                />
                {errors.description && (
                  <span className="text-sm text-red-600">{errors.description.message}</span>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Salaire
                </label>
                <input
                  type="text"
                  {...register("salary")}
                  className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                  placeholder="ex: 35-40k€ + variable"
                />
              </div>

              {/* Champ caché pour stocker le créateur */}
              <input type="hidden" {...register("createdBy")} />

              {/* Prérequis */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Prérequis
                  </label>
                  <button
                    type="button"
                    onClick={() => appendReq('')}
                    className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} flex items-center`}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </button>
                </div>
                <div className="space-y-2">
                  {reqFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <input
                        {...register(`requirements.${index}`)}
                        className={`flex-1 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                      />
                      {reqFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeReq(index)}
                          className={`${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Avantages */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Avantages
                  </label>
                  <button
                    type="button"
                    onClick={() => appendBen('')}
                    className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} flex items-center`}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </button>
                </div>
                <div className="space-y-2">
                  {benFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <input
                        {...register(`benefits.${index}`)}
                        className={`flex-1 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                      />
                      {benFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBen(index)}
                          className={`${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Compétences */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Compétences
                  </label>
                  <button
                    type="button"
                    onClick={() => appendSkill('')}
                    className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} flex items-center`}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </button>
                </div>
                <div className="space-y-2">
                  {skillFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <input
                        {...register(`skills.${index}`)}
                        className={`flex-1 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                      />
                      {skillFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className={`${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Nom</label>
                    <input
                      type="text"
                      {...register("contact.name")}
                      className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Fonction</label>
                    <input
                      type="text"
                      {...register("contact.role")}
                      className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Email</label>
                    <input
                      type="email"
                      {...register("contact.email")}
                      className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Téléphone</label>
                    <input
                      type="tel"
                      {...register("contact.phone")}
                      className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                    />
                  </div>
                </div>
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
              {isEditing ? 'Enregistrer les modifications' : 'Créer l\'offre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JobOfferForm;