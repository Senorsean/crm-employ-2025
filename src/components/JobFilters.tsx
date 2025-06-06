import React from 'react';
import { X } from 'lucide-react';
import { UrgencyLevel } from './UrgencyBadge';
import { useThemeStore } from '../stores/themeStore';

interface FilterProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterValues) => void;
}

export interface FilterValues {
  cities: string[];
  jobTypes: string[];
  contractTypes: string[];
  urgencyLevels: UrgencyLevel[];
  companies: string[];
  dateRange: {
    start: string;
    end: string;
  };
}

function JobFilters({ isOpen, onClose, onApplyFilters }: FilterProps) {
  const [filters, setFilters] = React.useState<FilterValues>({
    cities: [],
    jobTypes: [],
    contractTypes: [],
    urgencyLevels: [],
    companies: [],
    dateRange: {
      start: '',
      end: ''
    }
  });
  const { darkMode } = useThemeStore();

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Filtres</h2>
            <button onClick={onClose} className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Villes */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Villes
              </label>
              <select
                multiple
                className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map(opt => opt.value);
                  setFilters(prev => ({ ...prev, cities: values }));
                }}
              >
                {['Marseille', 'Aix-en-Provence', 'Vitrolles', 'Arles', 'Marignane'].map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Types de contrats */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Types de contrats
              </label>
              <div className="space-y-2">
                {['CDI', 'CDD', 'Intérim'].map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      className={`rounded border-gray-300 text-blue-600 mr-2 ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`}
                      onChange={(e) => {
                        setFilters(prev => ({
                          ...prev,
                          contractTypes: e.target.checked
                            ? [...prev.contractTypes, type]
                            : prev.contractTypes.filter(t => t !== type)
                        }));
                      }}
                    />
                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Niveau d'urgence */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Niveau d'urgence
              </label>
              <div className="space-y-2">
                {[
                  { value: 'high', label: 'Urgent' },
                  { value: 'medium', label: 'Prioritaire' },
                  { value: 'low', label: 'Normal' }
                ].map(({ value, label }) => (
                  <label key={value} className="flex items-center">
                    <input
                      type="checkbox"
                      className={`rounded border-gray-300 text-blue-600 mr-2 ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`}
                      onChange={(e) => {
                        setFilters(prev => ({
                          ...prev,
                          urgencyLevels: e.target.checked
                            ? [...prev.urgencyLevels, value as UrgencyLevel]
                            : prev.urgencyLevels.filter(l => l !== value)
                        }));
                      }}
                    />
                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Période */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Période
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Du</label>
                  <input
                    type="date"
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                    onChange={(e) => {
                      setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }));
                    }}
                  />
                </div>
                <div>
                  <label className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Au</label>
                  <input
                    type="date"
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
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

export default JobFilters;