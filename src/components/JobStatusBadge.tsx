import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';

export type JobStatus = 'new' | 'open' | 'filled' | 'closed';

interface JobStatusBadgeProps {
  status: JobStatus;
}

function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const { darkMode } = useThemeStore();
  
  const getStatusConfig = () => {
    if (darkMode) {
      return {
        new: {
          color: 'text-green-300',
          bg: 'bg-green-900',
          border: 'border-green-800',
          label: 'En cours',
          icon: Clock
        },
        open: {
          color: 'text-green-300',
          bg: 'bg-green-900',
          border: 'border-green-800',
          label: 'En cours',
          icon: Clock
        },
        filled: {
          color: 'text-blue-300',
          bg: 'bg-blue-900',
          border: 'border-blue-800',
          label: 'Pourvue',
          icon: CheckCircle
        },
        closed: {
          color: 'text-gray-300',
          bg: 'bg-gray-800',
          border: 'border-gray-700',
          label: 'Fermée',
          icon: CheckCircle
        }
      };
    } else {
      return {
        new: {
          color: 'text-green-700',
          bg: 'bg-green-50',
          border: 'border-green-100',
          label: 'En cours',
          icon: Clock
        },
        open: {
          color: 'text-green-700',
          bg: 'bg-green-50',
          border: 'border-green-100',
          label: 'En cours',
          icon: Clock
        },
        filled: {
          color: 'text-blue-700',
          bg: 'bg-blue-50',
          border: 'border-blue-100',
          label: 'Pourvue',
          icon: CheckCircle
        },
        closed: {
          color: 'text-gray-700',
          bg: 'bg-gray-50',
          border: 'border-gray-100',
          label: 'Fermée',
          icon: CheckCircle
        }
      };
    }
  };

  const statusConfig = getStatusConfig();
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.color} ${config.border}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </div>
  );
}

export default JobStatusBadge;