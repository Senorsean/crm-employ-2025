import React from 'react';
import ProfileCard from '../ProfileCard';
import { Trash2, Mail } from 'lucide-react';
import { Beneficiaire } from '../../types/beneficiaire';
import { useThemeStore } from '../../stores/themeStore';

interface BeneficiaireListProps {
  profiles: Beneficiaire[];
  viewMode: 'grid' | 'list';
  onEdit: (profile: Beneficiaire) => void;
  onDelete: (profile: Beneficiaire) => void;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeleteSelected: () => void;
}

export function BeneficiaireList({
  profiles,
  viewMode,
  onEdit,
  onDelete,
  selectedIds,
  onSelect,
  onSelectAll,
  onDeleteSelected
}: BeneficiaireListProps) {
  const { darkMode } = useThemeStore();
  
  if (profiles.length === 0) {
    return (
      <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-8`}>
        Aucun bénéficiaire ne correspond à votre recherche
      </p>
    );
  }

  const handleExportMiniCVs = () => {
    const selectedProfiles = profiles.filter(p => selectedIds.has(p.id));
    
    const miniCVContent = selectedProfiles.map(profile => `
=== Profil : ${profile.firstName} ${profile.lastName} ===
Poste : ${profile.title}
Localisation : ${profile.location}
Disponibilité : ${profile.availability}

Expérience : ${profile.yearsOfExperience} année(s)
Formation : ${profile.formation}

${profile.experiences[0] ? `Dernière expérience :
${profile.experiences[0].title} chez ${profile.experiences[0].company}
${profile.experiences[0].period}
${profile.experiences[0].description}` : ''}

Compétences clés :
${profile.skills.join(', ')}

Langues :
${profile.languages.join(', ')}
    `).join('\n\n-------------------\n\n');

    const mailtoUrl = `mailto:?subject=Profils sélectionnés - Anthea RH&body=${encodeURIComponent(
      `Bonjour,

Voici les profils sélectionnés :

${miniCVContent}

Pour plus d'informations sur ces profils, n'hésitez pas à nous contacter.

Cordialement,
L'équipe Anthea RH`
    )}`;

    window.location.href = mailtoUrl;
  };

  return (
    <div>
      {selectedIds.size > 0 && (
        <div className={`flex justify-between items-center p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl mb-6`}>
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={selectedIds.size === profiles.length}
              onChange={onSelectAll}
              className={`h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${darkMode ? 'bg-gray-600 border-gray-500' : ''}`}
            />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {selectedIds.size} bénéficiaire{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMiniCVs}
              className={`flex items-center px-3 py-1.5 text-sm ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-600'} rounded-lg hover:${darkMode ? 'bg-blue-800' : 'bg-blue-100'}`}
            >
              <Mail className="w-4 h-4 mr-1" />
              Exporter les mini CV
            </button>
            <button
              onClick={onDeleteSelected}
              className={`flex items-center px-3 py-1.5 text-sm ${darkMode ? 'bg-red-900 text-red-300' : 'bg-red-50 text-red-600'} rounded-lg hover:${darkMode ? 'bg-red-800' : 'bg-red-100'}`}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Supprimer la sélection
            </button>
          </div>
        </div>
      )}

      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
        {profiles.map((profile) => (
          <div key={profile.id} className="relative">
            <div className="absolute top-4 left-4 z-10">
              <input
                type="checkbox"
                checked={selectedIds.has(profile.id)}
                onChange={() => onSelect(profile.id)}
                className={`h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${darkMode ? 'bg-gray-600 border-gray-500' : ''}`}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <ProfileCard 
              profile={profile} 
              compact={viewMode === 'grid'}
              onEdit={() => !selectedIds.size && onEdit(profile)}
              onDelete={() => onDelete(profile)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}