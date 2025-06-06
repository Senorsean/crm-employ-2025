import React, { useState } from 'react';
import { X } from 'lucide-react';
import { businessSectors } from '../../data/sectors';
import { useThemeStore } from '../../stores/themeStore';

interface FilterValues {
  sectors: string[];
  cities: string[];
  status: ('active' | 'inactive')[];
}

interface CompanyFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterValues) => void;
  currentFilters?: FilterValues;
}

const defaultFilters: FilterValues = {
  sectors: [],
  cities: [],
  status: []
};

export default function CompanyFilters({ isOpen, onClose, onApplyFilters, currentFilters = defaultFilters }: CompanyFiltersProps) {
  const [filters, setFilters] = useState<FilterValues>(currentFilters);
  const { darkMode } = useThemeStore();

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl w-full max-w-2xl`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Filtres</h2>
            <button onClick={onClose} className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Secteur d'activité */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Secteur d'activité
              </label>
              <select
                multiple
                className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                value={filters.sectors}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map(opt => opt.value);
                  setFilters(prev => ({ ...prev, sectors: values }));
                }}
              >
                {businessSectors.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>

            {/* Ville */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Ville
              </label>
              <input
                type="text"
                className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                placeholder="Filtrer par ville..."
                onChange={(e) => {
                  const value = e.target.value.trim();
                  setFilters(prev => ({
                    ...prev,
                    cities: value ? [value] : []
                  }));
                }}
              />
            </div>

            {/* Statut */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Statut
              </label>
              <div className="space-y-2">
                {['active', 'inactive'].map((status) => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      className={`rounded border-gray-300 text-blue-600 mr-2 ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`}
                      checked={filters.status.includes(status as 'active' | 'inactive')}
                      onChange={(e) => {
                        setFilters(prev => ({
                          ...prev,
                          status: e.target.checked
                            ? [...prev.status, status as 'active' | 'inactive']
                            : prev.status.filter(s => s !== status)
                        }));
                      }}
                    />
                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={onClose}
              className={`px-4 py-2 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} rounded-lg`}
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