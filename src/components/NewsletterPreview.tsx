import React from 'react';
import { Search, Trash2 } from 'lucide-react';
import ProfileCard from './ProfileCard';
import { useThemeStore } from '../stores/themeStore';

interface NewsletterPreviewProps {
  selectedProfiles: string[];
  onProfileSelect: (profiles: string[]) => void;
}

// Données de test pour les profils
const mockProfiles = [
  {
    id: '1',
    firstName: 'Marie',
    lastName: 'Martin',
    title: 'Développeuse Full Stack',
    phone: '06 12 34 56 78',
    email: 'marie.martin@email.com',
    location: 'Marseille',
    availability: 'Disponible immédiatement',
    experiences: [
      {
        title: 'Développeuse Full Stack',
        company: 'Tech Solutions',
        period: 'Jan 2022 - Déc 2023',
        description: 'Développement d\'applications web avec React et Node.js'
      }
    ],
    education: [
      {
        degree: 'Master en Développement Web',
        school: 'École Numérique',
        year: '2020'
      }
    ],
    skills: ['React', 'TypeScript', 'Node.js', 'SQL'],
    languages: ['Français', 'Anglais']
  },
  {
    id: '2',
    firstName: 'Thomas',
    lastName: 'Dubois',
    title: 'Commercial B2B',
    phone: '06 98 76 54 32',
    email: 'thomas.dubois@email.com',
    location: 'Aix-en-Provence',
    availability: 'Disponible sous 1 mois',
    experiences: [
      {
        title: 'Commercial B2B',
        company: 'Business Corp',
        period: 'Jan 2021 - Déc 2023',
        description: 'Développement commercial et gestion de portefeuille clients'
      }
    ],
    education: [
      {
        degree: 'Master en Commerce',
        school: 'École de Commerce',
        year: '2019'
      }
    ],
    skills: ['Négociation', 'CRM', 'Prospection', 'Vente B2B'],
    languages: ['Français', 'Anglais', 'Espagnol']
  }
];

function NewsletterPreview({ selectedProfiles, onProfileSelect }: NewsletterPreviewProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const { darkMode } = useThemeStore();

  const filteredProfiles = mockProfiles.filter(profile =>
    profile.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleProfile = (profileId: string) => {
    if (selectedProfiles.includes(profileId)) {
      onProfileSelect(selectedProfiles.filter(id => id !== profileId));
    } else {
      onProfileSelect([...selectedProfiles, profileId]);
    }
  };

  const handleDeleteSelected = () => {
    onProfileSelect([]);
  };

  return (
    <div>
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher des profils par compétences ou titre..."
            className={`w-full pl-10 pr-4 py-2 border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {selectedProfiles.length > 0 && (
          <div className={`flex justify-between items-center px-4 py-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {selectedProfiles.length} profil{selectedProfiles.length > 1 ? 's' : ''} sélectionné{selectedProfiles.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={handleDeleteSelected}
              className={`flex items-center text-sm ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Supprimer la sélection
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filteredProfiles.map((profile) => (
          <div key={profile.id} className="relative">
            <input
              type="checkbox"
              checked={selectedProfiles.includes(profile.id)}
              onChange={() => toggleProfile(profile.id)}
              className={`absolute top-4 right-4 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${darkMode ? 'bg-gray-600 border-gray-500' : ''}`}
            />
            <ProfileCard profile={profile} compact />
          </div>
        ))}

        {filteredProfiles.length === 0 && (
          <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Aucun profil ne correspond à votre recherche
          </div>
        )}
      </div>
    </div>
  );
}

export default NewsletterPreview;