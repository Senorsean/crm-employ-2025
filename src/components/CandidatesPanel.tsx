import React, { useState } from 'react';
import { Search, UserPlus, CheckCircle, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useBeneficiairesStore } from '../stores/beneficiairesStore';
import { useOffersStore } from '../stores/offersStore';
import { toast } from 'react-hot-toast';
import { Alert } from './Alert';
import type { Beneficiaire } from '../types/beneficiaire';
import { useThemeStore } from '../stores/themeStore';
import { auth } from '../config/firebase';

interface CandidatesPanelProps {
  offerId: string;
  candidates: Array<{
    beneficiaireId: string;
    status: 'proposed' | 'placed';
    date: string;
  }>;
}

export function CandidatesPanel({ offerId, candidates }: CandidatesPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBeneficiaires, setSelectedBeneficiaires] = useState<Set<string>>(new Set());
  
  const { beneficiaires } = useBeneficiairesStore();
  const { addCandidate, removeCandidate, placeCandidate, offers } = useOffersStore();
  const { darkMode } = useThemeStore();

  // Vérifier si l'utilisateur est le créateur de l'offre
  const currentOffer = offers.find(o => o.id === offerId);
  const isOfferCreator = currentOffer?.userId === auth.currentUser?.uid;

  // Filtrer les bénéficiaires disponibles
  const filteredBeneficiaires = beneficiaires.filter(beneficiaire => {
    // Exclure les bénéficiaires déjà candidats
    if (candidates.some(c => c.beneficiaireId === beneficiaire.id)) {
      return false;
    }

    if (!searchTerm) return false;

    // Recherche sur plusieurs champs
    const searchFields = [
      beneficiaire.firstName,
      beneficiaire.lastName,
      beneficiaire.title,
      ...(beneficiaire.skills || [])
    ];

    return searchFields.some(field => 
      field?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getBeneficiaireById = (id: string): Beneficiaire | undefined => {
    return beneficiaires.find(b => b.id === id);
  };

  const handleAddCandidates = async () => {
    if (selectedBeneficiaires.size === 0) {
      toast.error('Sélectionnez au moins un bénéficiaire');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      for (const beneficiaireId of selectedBeneficiaires) {
        await addCandidate(offerId, beneficiaireId);
      }
      setSearchTerm('');
      setShowSearch(false);
      setSelectedBeneficiaires(new Set());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'ajout des candidats';
      console.error('Error adding candidates:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCandidate = async (beneficiaireId: string) => {
    if (isLoading) return;
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette candidature ?')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await removeCandidate(offerId, beneficiaireId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression du candidat';
      console.error('Error removing candidate:', error);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceCandidate = async (beneficiaireId: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      await placeCandidate(offerId, beneficiaireId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du placement du candidat';
      console.error('Error placing candidate:', error);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBeneficiaire = (id: string) => {
    setSelectedBeneficiaires(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Candidatures ({candidates.length})
        </h3>
        <button
          onClick={() => setShowSearch(true)}
          className={`flex items-center px-3 py-1.5 text-sm ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-600'} rounded-lg hover:${darkMode ? 'bg-blue-800' : 'bg-blue-100'} disabled:opacity-50`}
          disabled={isLoading}
        >
          <UserPlus className="w-4 h-4 mr-1" />
          Ajouter des candidats
        </button>
      </div>

      {error && (
        <Alert 
          type="error" 
          message={error} 
          onClose={() => setError(null)}
        />
      )}

      {showSearch && (
        <div className={`border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4`}>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un bénéficiaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} rounded-lg`}
              disabled={isLoading}
            />
          </div>

          {searchTerm && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredBeneficiaires.map((beneficiaire) => (
                <div
                  key={`search-${beneficiaire.id}`}
                  className={`flex justify-between items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedBeneficiaires.has(beneficiaire.id)
                      ? (darkMode ? 'border-blue-700 bg-blue-900/30' : 'border-blue-500 bg-blue-50')
                      : (darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50')
                  }`}
                  onClick={() => toggleBeneficiaire(beneficiaire.id)}
                >
                  <div>
                    <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {beneficiaire.firstName} {beneficiaire.lastName}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{beneficiaire.title}</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {beneficiaire.skills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} rounded-full text-xs`}
                        >
                          {skill}
                        </span>
                      ))}
                      {beneficiaire.skills.length > 3 && (
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          +{beneficiaire.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedBeneficiaires.has(beneficiaire.id) && (
                    <CheckCircle className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  )}
                </div>
              ))}
              {filteredBeneficiaires.length === 0 && (
                <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-4`}>
                  Aucun bénéficiaire trouvé
                </p>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setShowSearch(false);
                setSelectedBeneficiaires(new Set());
                setSearchTerm('');
              }}
              className={`px-4 py-2 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} rounded-lg`}
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              onClick={handleAddCandidates}
              disabled={isLoading || selectedBeneficiaires.size === 0}
              className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Ajouter ({selectedBeneficiaires.size})
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {candidates.map((candidate) => {
          const beneficiaire = getBeneficiaireById(candidate.beneficiaireId);
          if (!beneficiaire) return null;

          return (
            <div
              key={`candidate-${candidate.beneficiaireId}`}
              className={`flex justify-between items-center p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg`}
            >
              <div>
                <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {beneficiaire.firstName} {beneficiaire.lastName}
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{beneficiaire.title}</div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  Ajouté le {new Date(candidate.date).toLocaleDateString('fr-FR')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRemoveCandidate(candidate.beneficiaireId)}
                  className={`p-1.5 ${darkMode ? 'text-red-400 hover:bg-red-900' : 'text-red-600 hover:bg-red-50'} rounded-lg transition-colors disabled:opacity-50`}
                  title="Supprimer la candidature"
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {candidate.status === 'proposed' ? (
                  <button
                    onClick={() => handlePlaceCandidate(candidate.beneficiaireId)}
                    className={`flex items-center px-3 py-1.5 text-sm ${darkMode ? 'bg-green-900 text-green-300' : 'bg-green-50 text-green-600'} rounded-lg hover:${darkMode ? 'bg-green-800' : 'bg-green-100'} disabled:opacity-50`}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Placer
                      </>
                    )}
                  </button>
                ) : (
                  <span className={`flex items-center px-3 py-1.5 text-sm ${darkMode ? 'bg-green-900 text-green-300' : 'bg-green-50 text-green-600'} rounded-lg`}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Placé
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {candidates.length === 0 && (
          <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-4`}>
            Aucun candidat pour le moment
          </p>
        )}
      </div>
    </div>
  );
}