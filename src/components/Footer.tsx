import React from 'react';
import { useThemeStore } from '../stores/themeStore';

function Footer() {
  const { darkMode } = useThemeStore();
  
  return (
    <div className={`fixed bottom-4 right-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} hidden lg:block`}>
      <p>
        Application créée par Samuel LUCAS
        <span className="ml-1">&copy; {new Date().getFullYear()}</span>
      </p>
    </div>
  );
}

export default Footer;