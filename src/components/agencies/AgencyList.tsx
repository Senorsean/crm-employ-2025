import React from 'react';
import { AgencyCard } from './AgencyCard';
import { AgencyTableRow } from './AgencyTableRow';
import { Trash2 } from 'lucide-react';
import type { Agency } from '../../types/agency';
import { useThemeStore } from '../../stores/themeStore';

interface AgencyListProps {
  agencies: Agency[];
  viewMode: 'grid' | 'list';
  onAgencyClick: (agency: Agency) => void;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll?: () => void;
  onDeleteSelected?: () => void;
}

export function AgencyList({ 
  agencies, 
  viewMode, 
  onAgencyClick,
  selectedIds,
  onSelect,
  onSelectAll,
  onDeleteSelected
}: AgencyListProps) {
  const { darkMode } = useThemeStore();
  
  if (agencies.length === 0) {
    return (
      <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-8`}>
        Aucune agence trouvée
      </p>
    );
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSelectAll) {
      onSelectAll();
    }
  };

  return (
    <div className="space-y-4">
      {selectedIds.size > 0 && (
        <div className={`flex justify-between items-center p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl`}>
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={selectedIds.size === agencies.length}
              onChange={handleSelectAll}
              className={`h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${darkMode ? 'bg-gray-600 border-gray-500' : ''}`}
            />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {selectedIds.size} agence{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={onDeleteSelected}
            className={`flex items-center px-3 py-1.5 text-sm ${darkMode ? 'bg-red-900 text-red-300' : 'bg-red-50 text-red-600'} rounded-lg hover:${darkMode ? 'bg-red-800' : 'bg-red-100'}`}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Supprimer la sélection
          </button>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agencies.map((agency) => (
            <div key={agency.id} className="relative">
              <div className="absolute top-4 left-4 z-10">
                <input
                  type="checkbox"
                  checked={selectedIds.has(agency.id)}
                  onChange={() => onSelect(agency.id)}
                  className={`h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${darkMode ? 'bg-gray-600 border-gray-500' : ''}`}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <AgencyCard 
                agency={agency} 
                onClick={() => !selectedIds.size && onAgencyClick(agency)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className="w-8 px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === agencies.length}
                    onChange={handleSelectAll}
                    className={`h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${darkMode ? 'bg-gray-600 border-gray-500' : ''}`}
                  />
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Agence
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Adresse
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Contact
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Consultants
                </th>
              </tr>
            </thead>
            <tbody className={`${darkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
              {agencies.map((agency) => (
                <AgencyTableRow
                  key={agency.id}
                  agency={agency}
                  onClick={() => !selectedIds.size && onAgencyClick(agency)}
                  selected={selectedIds.has(agency.id)}
                  onSelect={() => onSelect(agency.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}