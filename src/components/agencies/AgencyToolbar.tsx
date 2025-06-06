import React from 'react';
import { Plus, Search, LayoutGrid, List } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

interface AgencyToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onNewAgency: () => void;
}

export function AgencyToolbar({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onNewAgency
}: AgencyToolbarProps) {
  const { darkMode } = useThemeStore();
  
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Agences</h1>
      <div className="flex gap-4">
        <div className="flex gap-2 border border-gray-200 rounded-2xl p-1">
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
        <button
          onClick={onNewAgency}
          className="flex items-center px-4 py-2 bg-gradient-anthea text-white rounded-2xl hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouvelle agence
        </button>
      </div>
    </div>
  );
}