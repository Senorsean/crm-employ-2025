import React from 'react';
import { X } from 'lucide-react';

interface CompanyFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterValues) => void;
  currentFilters?: FilterValues;
}

export interface FilterValues {
  names: string[];
  sectors: string[];
  cities: string[];
}

const defaultFilters: FilterValues = {
  names: [],
  sectors: [],
  cities: []
};

// Liste complète des secteurs d'activité
const commonSectors = [
  'Aéronautique',
  'Agriculture',
  'Agroalimentaire',
  'Artisanat',
  'Assurance',
  'Automobile',
  'Banque',
  'BTP / Construction',
  'Commerce de détail',
  'Commerce de gros',
  'Communication',
  'Conseil',
  'Culture / Arts',
  'Défense / Sécurité',
  'E-commerce',
  'Éducation / Formation',
  'Énergie',
  'Environnement',
  'Finance',
  'Hôtellerie',
  'Immobilier',
  'Industrie chimique',
  'Industrie manufacturière',
  'Industrie pharmaceutique',
  'Informatique / Digital',
  'Logistique',
  'Luxe',
  'Marketing / Publicité',
  'Médias',
  'Mode / Textile',
  'Recherche et Développement',
  'Ressources humaines',
  'Restauration',
  'Santé',
  'Services aux entreprises',
  'Services aux particuliers',
  'Sport / Loisirs',
  'Télécommunications',
  'Tourisme',
  'Transport'
].sort(); // Tri alphabétique

function CompanyFilters({ isOpen, onClose, onApplyFilters, currentFilters = defaultFilters }: CompanyFiltersProps) {
  const [filters, setFilters] = React.useState<FilterValues>(currentFilters);
  const [customSector, setCustomSector] = React.useState('');

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleAddCustomSector = () => {
    if (customSector.trim()) {
      setFilters(prev => ({
        ...prev,
        sectors: [...prev.sectors, customSector.trim()]
      }));
      setCustomSector('');
    }
  };

  const handleRemoveSector = (sector: string) => {
    setFilters(prev => ({
      ...prev,
      sectors: prev.sectors.filter(s => s !== sector)
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
            {/* Nom de l'entreprise */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'entreprise
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-200 p-2"
                placeholder="Rechercher par nom..."
                onChange={(e) => {
                  const value = e.target.value.trim();
                  setFilters(prev => ({
                    ...prev,
                    names: value ? [value] : []
                  }));
                }}
              />
            </div>

            {/* Secteur d'activité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Secteur d'activité
              </label>
              
              {/* Liste des secteurs sélectionnés */}
              {filters.sectors.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {filters.sectors.map(sector => (
                    <span
                      key={sector}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700"
                    >
                      {sector}
                      <button
                        onClick={() => handleRemoveSector(sector)}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Sélection des secteurs communs */}
              <select
                className="w-full rounded-lg border border-gray-200 p-2 mb-2"
                onChange={(e) => {
                  if (e.target.value && !filters.sectors.includes(e.target.value)) {
                    setFilters(prev => ({
                      ...prev,
                      sectors: [...prev.sectors, e.target.value]
                    }));
                  }
                  e.target.value = '';
                }}
                value=""
              >
                <option value="">Sélectionner un secteur...</option>
                {commonSectors
                  .filter(sector => !filters.sectors.includes(sector))
                  .map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))
                }
              </select>

              {/* Ajout d'un secteur personnalisé */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Autre secteur..."
                  className="flex-1 rounded-lg border border-gray-200 p-2"
                  value={customSector}
                  onChange={(e) => setCustomSector(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSector();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomSector}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={!customSector.trim()}
                >
                  Ajouter
                </button>
              </div>
            </div>

            {/* Ville */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-200 p-2"
                placeholder="Rechercher par ville..."
                onChange={(e) => {
                  const value = e.target.value.trim();
                  setFilters(prev => ({
                    ...prev,
                    cities: value ? [value] : []
                  }));
                }}
              />
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

export default CompanyFilters;