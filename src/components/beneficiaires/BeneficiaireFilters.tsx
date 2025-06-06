import React from 'react';
import { X } from 'lucide-react';

interface FilterValues {
  jobTitles: string[];
  locations: string[];
  availabilities: string[];
  skills: string[];
  languages: string[];
  employmentStatus?: string;
  dateRange: {
    start: string;
    end: string;
  };
}

interface BeneficiaireFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterValues) => void;
  currentFilters?: FilterValues;
}

const defaultFilters: FilterValues = {
  jobTitles: [],
  locations: [],
  availabilities: [],
  skills: [],
  languages: [],
  employmentStatus: 'all',
  dateRange: {
    start: '',
    end: ''
  }
};

// Liste des titres de postes communs
const commonJobTitles = [
  'Développeur Full Stack',
  'Développeur Front-end',
  'Développeur Back-end',
  'Commercial B2B',
  'Commercial B2C',
  'Assistant(e) administratif',
  'Responsable RH',
  'Chef de projet',
  'Technicien de maintenance',
  'Comptable',
  'Responsable marketing',
  'Ingénieur système',
  'Consultant IT',
  'Business Analyst'
];

function BeneficiaireFilters({ isOpen, onClose, onApplyFilters, currentFilters = defaultFilters }: BeneficiaireFiltersProps) {
  const [filters, setFilters] = React.useState<FilterValues>(currentFilters);
  const [customJobTitle, setCustomJobTitle] = React.useState('');

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleAddCustomJobTitle = () => {
    if (customJobTitle.trim()) {
      setFilters(prev => ({
        ...prev,
        jobTitles: [...prev.jobTitles, customJobTitle.trim()]
      }));
      setCustomJobTitle('');
    }
  };

  const handleRemoveJobTitle = (title: string) => {
    setFilters(prev => ({
      ...prev,
      jobTitles: prev.jobTitles.filter(t => t !== title)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Filtres</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Titre du poste */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre du poste
              </label>
              <div className="space-y-4">
                {/* Liste des titres sélectionnés */}
                {filters.jobTitles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {filters.jobTitles.map(title => (
                      <span
                        key={title}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700"
                      >
                        {title}
                        <button
                          onClick={() => handleRemoveJobTitle(title)}
                          className="ml-2 text-blue-500 hover:text-blue-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Sélection des titres communs */}
                <select
                  className="w-full rounded-lg border border-gray-200 p-2"
                  onChange={(e) => {
                    if (e.target.value && !filters.jobTitles.includes(e.target.value)) {
                      setFilters(prev => ({
                        ...prev,
                        jobTitles: [...prev.jobTitles, e.target.value]
                      }));
                    }
                    e.target.value = '';
                  }}
                  value=""
                >
                  <option value="">Sélectionner un titre de poste...</option>
                  {commonJobTitles
                    .filter(title => !filters.jobTitles.includes(title))
                    .map(title => (
                      <option key={title} value={title}>{title}</option>
                    ))
                  }
                </select>

                {/* Ajout d'un titre personnalisé */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Autre titre de poste..."
                    className="flex-1 rounded-lg border border-gray-200 p-2"
                    value={customJobTitle}
                    onChange={(e) => setCustomJobTitle(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomJobTitle();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomJobTitle}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    disabled={!customJobTitle.trim()}
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>

            {/* Localisation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localisation
              </label>
              <select
                multiple
                className="w-full rounded-lg border border-gray-200 p-2"
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map(opt => opt.value);
                  setFilters(prev => ({ ...prev, locations: values }));
                }}
                value={filters.locations}
              >
                {['Marseille', 'Aix-en-Provence', 'Vitrolles', 'Arles', 'Marignane'].map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            {/* Disponibilité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disponibilité
              </label>
              <div className="space-y-2">
                {[
                  'Immédiate',
                  'Sous 15 jours',
                  'Sous 1 mois',
                  'Sous 2 mois',
                  'Sous 3 mois'
                ].map(availability => (
                  <label key={availability} className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 mr-2"
                      checked={filters.availabilities.includes(availability)}
                      onChange={(e) => {
                        setFilters(prev => ({
                          ...prev,
                          availabilities: e.target.checked
                            ? [...prev.availabilities, availability]
                            : prev.availabilities.filter(a => a !== availability)
                        }));
                      }}
                    />
                    {availability}
                  </label>
                ))}
              </div>
            </div>

            {/* Statut d'emploi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut d'emploi
              </label>
              <select
                className="w-full rounded-lg border border-gray-200 p-2"
                value={filters.employmentStatus || 'all'}
                onChange={(e) => {
                  setFilters(prev => ({
                    ...prev,
                    employmentStatus: e.target.value
                  }));
                }}
              >
                <option value="all">Tous</option>
                <option value="employed">En emploi</option>
                <option value="unemployed">Sans emploi</option>
              </select>
            </div>

            {/* Compétences */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compétences
              </label>
              <input
                type="text"
                placeholder="Séparez les compétences par des virgules"
                className="w-full rounded-lg border border-gray-200 p-2"
                value={filters.skills.join(', ')}
                onChange={(e) => {
                  const skills = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  setFilters(prev => ({ ...prev, skills }));
                }}
              />
            </div>

            {/* Langues */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Langues
              </label>
              <input
                type="text"
                placeholder="Séparez les langues par des virgules"
                className="w-full rounded-lg border border-gray-200 p-2"
                value={filters.languages.join(', ')}
                onChange={(e) => {
                  const languages = e.target.value.split(',').map(l => l.trim()).filter(Boolean);
                  setFilters(prev => ({ ...prev, languages }));
                }}
              />
            </div>

            {/* Période d'inscription */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Période d'inscription
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Du</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-200 p-2"
                    value={filters.dateRange.start}
                    onChange={(e) => {
                      setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }));
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Au</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-200 p-2"
                    value={filters.dateRange.end}
                    onChange={(e) => {
                      setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: e.target.value }
                      }));
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BeneficiaireFilters;