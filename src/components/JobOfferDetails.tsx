import React from 'react';
import { X, MapPin, Building2, Clock, Calendar, Users, Euro, FileText, Edit, Trash2, User } from 'lucide-react';
import { UrgencyLevel } from './UrgencyBadge';
import UrgencyBadge from './UrgencyBadge';
import JobStatusBadge from './JobStatusBadge';
import { CandidatesPanel } from './CandidatesPanel';
import { useOffersStore } from '../stores/offersStore';
import { useThemeStore } from '../stores/themeStore';
import type { JobOffer } from '../types/jobOffer';
import { toast } from 'react-hot-toast';

interface JobOfferDetailsProps {
  offer: JobOffer;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function JobOfferDetails({ offer, onClose, onEdit, onDelete }: JobOfferDetailsProps) {
  const { darkMode } = useThemeStore();
  
  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
      onDelete();
      toast.success('Offre supprimée avec succès');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold dark:text-white">{offer.title}</h2>
              <p className="text-gray-500 dark:text-gray-400">{offer.company}</p>
            </div>
            <div className="flex items-center gap-3">
              <UrgencyBadge level={offer.urgencyLevel} />
              <JobStatusBadge status={offer.status} />
              <button
                onClick={handleDelete}
                className="flex items-center px-3 py-1.5 text-sm bg-red-50 text-red-600 dark:bg-red-900 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-800"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Supprimer
              </button>
              <button
                onClick={onEdit}
                className="flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800"
              >
                <Edit className="w-4 h-4 mr-1" />
                Modifier
              </button>
              <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <MapPin className="w-5 h-5 mr-2" />
              <span>{offer.location}</span>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Clock className="w-5 h-5 mr-2" />
              <span>{offer.type}</span>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Building2 className="w-5 h-5 mr-2" />
              <span>{offer.company}</span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Description du poste */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center dark:text-white">
                <FileText className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Description du poste
              </h3>
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{offer.description}</p>
            </div>

            {/* Créateur de l'offre */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium mb-3 flex items-center dark:text-white">
                <User className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Créée par
              </h3>
              <p className="text-gray-600 dark:text-gray-300">{offer.createdBy || 'Non spécifié'}</p>
            </div>

            {/* Candidatures */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <CandidatesPanel
                offerId={offer.id}
                candidates={offer.candidates || []}
              />
            </div>

            {/* Informations complémentaires */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div>
                <h3 className="font-medium mb-2 dark:text-white">Rémunération</h3>
                <p className="flex items-center text-gray-600 dark:text-gray-300">
                  <Euro className="w-4 h-4 mr-2" />
                  {offer.salary || 'Non spécifié'}
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2 dark:text-white">Candidatures</h3>
                <p className="flex items-center text-gray-600 dark:text-gray-300">
                  <Users className="w-4 h-4 mr-2" />
                  {(offer.candidates || []).length} candidature{(offer.candidates || []).length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Contact */}
            {offer.contact && (
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <h3 className="font-medium mb-3 dark:text-white">Contact</h3>
                <div className="space-y-2">
                  <p className="text-gray-600 dark:text-gray-300">{offer.contact.name}</p>
                  <p className="text-gray-500 dark:text-gray-400">{offer.contact.role}</p>
                  <div className="flex flex-col space-y-1">
                    <a
                      href={`mailto:${offer.contact.email}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      {offer.contact.email}
                    </a>
                    <a
                      href={`tel:${offer.contact.phone}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      {offer.contact.phone}
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Publiée le {new Date(offer.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobOfferDetails;