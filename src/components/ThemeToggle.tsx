import React from 'react';
import { Sun } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';

export default function ThemeToggle() {
  const { darkMode, toggleDarkMode } = useThemeStore();

  return (
    <div className="flex items-center justify-between w-full">
      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Thème</span>
      <button
        onClick={toggleDarkMode}
        className={`p-2 rounded-full transition-colors ${
          darkMode 
            ? 'bg-gray-700 text-yellow-300' 
            : 'bg-gray-100 text-yellow-500'
        }`}
        aria-label={darkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
      >
        <Sun className="w-5 h-5" />
      </button>
    </div>
  );
}