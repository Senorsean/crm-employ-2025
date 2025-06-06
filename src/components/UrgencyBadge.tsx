import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';

export type UrgencyLevel = 'high' | 'medium' | 'low';

interface UrgencyBadgeProps {
  level: UrgencyLevel;
}

function UrgencyBadge({ level }: UrgencyBadgeProps) {
  const { darkMode } = useThemeStore();
  
  const urgencyConfig = {
    high: {
      color: darkMode ? 'text-red-300' : 'text-red-700',
      bg: darkMode ? 'bg-red-900' : 'bg-red-50',
      border: darkMode ? 'border-red-800' : 'border-red-100',
      label: 'Urgent'
    },
    medium: {
      color: darkMode ? 'text-orange-300' : 'text-orange-700',
      bg: darkMode ? 'bg-orange-900' : 'bg-orange-50',
      border: darkMode ? 'border-orange-800' : 'border-orange-100',
      label: 'Prioritaire'
    },
    low: {
      color: darkMode ? 'text-green-300' : 'text-green-700',
      bg: darkMode ? 'bg-green-900' : 'bg-green-50',
      border: darkMode ? 'border-green-800' : 'border-green-100',
      label: 'Normal'
    }
  };
  
  const config = urgencyConfig[level];
  
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.color} ${config.border}`}>
      <AlertCircle className="w-3.5 h-3.5" />
      {config.label}
    </div>
  );
}

export default UrgencyBadge;