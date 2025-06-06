import React from 'react';
import { Plus, Printer, Upload, Download } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';

interface BeneficiaireHeaderProps {
  onPrint: () => void;
  onImportExcel: () => void;
  onNew: () => void;
  onExport: () => void;
  selectedCount: number;
}

export function BeneficiaireHeader({ onPrint, onImportExcel, onNew, onExport, selectedCount }: BeneficiaireHeaderProps) {
  const { darkMode } = useThemeStore();
  
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Bénéficiaires</h1>
      <div className="flex gap-4">
        <button
          onClick={onExport}
          disabled={selectedCount === 0}
          className={`hidden md:flex items-center px-4 py-2 text-sm ${darkMode ? 'bg-green-700 text-white' : 'bg-green-600 text-white'} rounded-2xl hover:${darkMode ? 'bg-green-600' : 'bg-green-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Download className="w-4 h-4 mr-2" />
          Exporter ({selectedCount})
        </button>
        <button
          onClick={onPrint}
          className={`hidden md:flex items-center px-4 py-2 border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600'} rounded-2xl hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}
        >
          <Printer className="w-5 h-5 mr-2" />
          Imprimer
        </button>
        <button
          onClick={onImportExcel}
          className={`hidden md:flex items-center px-4 py-2 border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600'} rounded-2xl hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}
        >
          <Upload className="w-5 h-5 mr-2" />
          Import
        </button>
        <button
          onClick={onNew}
          className="flex items-center px-4 py-2 bg-gradient-anthea text-white rounded-2xl hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouveau bénéficiaire
        </button>
      </div>
    </div>
  );
}