import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
}

export function Alert({ type, message, onClose }: AlertProps) {
  const { darkMode } = useThemeStore();

  const getAlertStyles = () => {
    if (darkMode) {
      switch (type) {
        case 'success':
          return {
            bg: 'bg-green-900',
            text: 'text-green-300',
            border: 'border-green-800',
            icon: CheckCircle
          };
        case 'error':
          return {
            bg: 'bg-red-900',
            text: 'text-red-300',
            border: 'border-red-800',
            icon: XCircle
          };
        case 'warning':
          return {
            bg: 'bg-yellow-900',
            text: 'text-yellow-300',
            border: 'border-yellow-800',
            icon: AlertCircle
          };
        case 'info':
          return {
            bg: 'bg-blue-900',
            text: 'text-blue-300',
            border: 'border-blue-800',
            icon: Info
          };
      }
    } else {
      return {
        success: {
          bg: 'bg-green-50',
          text: 'text-green-700',
          border: 'border-green-100',
          icon: CheckCircle
        },
        error: {
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-100',
          icon: XCircle
        },
        warning: {
          bg: 'bg-yellow-50',
          text: 'text-yellow-700',
          border: 'border-yellow-100',
          icon: AlertCircle
        },
        info: {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-100',
          icon: Info
        }
      }[type];
    }
  };

  const style = getAlertStyles();
  const Icon = style.icon;

  return (
    <div className={`p-4 ${style.bg} ${style.text} rounded-lg border ${style.border} flex items-start gap-3`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1">{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 hover:opacity-80 transition-opacity"
          aria-label="Fermer"
        >
          <XCircle className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}