import React from 'react';
import { Search, Filter, LayoutGrid, List } from 'lucide-react';
import { FilterValues } from '../../types/beneficiaire';
import { useThemeStore } from '../../stores/themeStore';

interface BeneficiaireToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFilterClick: () => void;
  activeFilters: FilterValues | null;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export function BeneficiaireToolbar({
  searchTerm,
  onSearchChange,
  onFilterClick,
  activeFilters,
  viewMode,
  onViewModeChange
}: BeneficiaireToolbarProps) {
  const { darkMode } = useThemeStore();
  
  return (
    <div className="flex gap-4 mb-6 print:hidden">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Rechercher un bénéficiaire..."
          className={`w-full pl-10 pr-4 py-2 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-anthea-blue ${darkMode ? 'bg-gray-700 text-white border-gray-600' : ''}`}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <button 
          onClick={onFilterClick}
          className={`flex items-center px-4 py-2 border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600'} rounded-2xl hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
        >
          <Filter className="w-5 h-5 mr-2" />
          Filtres
          {activeFilters && Object.values(activeFilters).some(v => 
            Array.isArray(v) ? v.length > 0 : Object.values(v).some(d => d !== '')
          ) && (
            <span className="ml-2 w-2 h-2 bg-anthea-blue rounded-full"></span>
          )}
        </button>
        <div className={`flex gap-2 border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-2xl p-1`}>
          <button
            onClick={() => onViewModeChange('grid')}
            className={`p-2 rounded-xl ${viewMode === 'grid' ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50')}`}
          >
            <LayoutGrid className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`p-2 rounded-xl ${viewMode === 'list' ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50')}`}
          >
            <List className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}