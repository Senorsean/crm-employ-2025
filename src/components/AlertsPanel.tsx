import React from 'react';
import { Bell, Calendar, Building2, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useThemeStore } from '../stores/themeStore';

export interface Alert {
  id: string;
  type: 'relance' | 'rendez-vous';
  company: string;
  date: Date;
  agency: string;
  status: 'pending' | 'completed' | 'late';
  step: number;
  description?: string;
  action?: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
  onUpdateStatus: (alertId: string, status: Alert['status']) => void;
}

function AlertsPanel({ alerts, onUpdateStatus }: AlertsPanelProps) {
  const sortedAlerts = [...alerts].sort((a, b) => a.date.getTime() - b.date.getTime());
  const { darkMode } = useThemeStore();

  const getStepLabel = (step: number) => {
    switch (step) {
      case 1:
        return 'Premier contact - Présentation Anthea';
      case 2:
        return 'Newsletter - Profils disponibles';
      case 3:
        return 'Newsletter - Candidatures multi-agences';
      default:
        return 'Relance';
    }
  };

  const getAlertStatus = (alert: Alert) => {
    if (alert.status === 'completed') return 'completed';
    if (alert.status === 'late') return 'late';
    if (isPast(alert.date) && !isToday(alert.date)) return 'late';
    return 'pending';
  };

  const getStatusConfig = (status: string) => {
    if (darkMode) {
      switch (status) {
        case 'completed':
          return {
            border: 'border-green-800',
            bg: 'bg-green-900',
            icon: <CheckCircle className="w-4 h-4 text-green-400" />,
            text: 'Effectué'
          };
        case 'late':
          return {
            border: 'border-red-800',
            bg: 'bg-red-900',
            icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
            text: 'En retard'
          };
        default:
          return {
            border: 'border-orange-800',
            bg: 'bg-orange-900',
            icon: <Clock className="w-4 h-4 text-orange-400" />,
            text: 'En attente'
          };
      }
    } else {
      switch (status) {
        case 'completed':
          return {
            border: 'border-green-100',
            bg: 'bg-green-50',
            icon: <CheckCircle className="w-4 h-4 text-green-600" />,
            text: 'Effectué'
          };
        case 'late':
          return {
            border: 'border-red-100',
            bg: 'bg-red-50',
            icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
            text: 'En retard'
          };
        default:
          return {
            border: 'border-orange-100',
            bg: 'bg-orange-50',
            icon: <Clock className="w-4 h-4 text-orange-600" />,
            text: 'En attente'
          };
      }
    }
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-semibold flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <Bell className="w-5 h-5 mr-2 text-blue-600" />
            Alertes de relance
          </h2>
          <div className="flex gap-2">
            <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
              {alerts.filter(a => getAlertStatus(a) === 'pending').length} en attente
            </span>
            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-sm">
              {alerts.filter(a => getAlertStatus(a) === 'late').length} en retard
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {sortedAlerts.map((alert) => {
            const status = getAlertStatus(alert);
            const statusConfig = getStatusConfig(status);

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${statusConfig.border} ${statusConfig.bg}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`} />
                      <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{alert.company}</h3>
                    </div>
                    <div className={`mt-1 flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      <Clock className="w-4 h-4" />
                      <span>{format(alert.date, 'd MMMM yyyy', { locale: fr })}</span>
                    </div>
                    <div className={`mt-1 flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      <Calendar className="w-4 h-4" />
                      <span>{getStepLabel(alert.step)}</span>
                    </div>
                    {alert.description && (
                      <p className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{alert.description}</p>
                    )}
                    {alert.action && (
                      <p className={`mt-1 text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{alert.action}</p>
                    )}
                  </div>

                  {status !== 'completed' && (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => onUpdateStatus(alert.id, 'completed')}
                        className={`px-3 py-1.5 text-sm ${darkMode ? 'bg-gray-700 text-green-400 border border-green-700 hover:bg-green-900' : 'bg-white text-green-600 border border-green-200 hover:bg-green-50'} rounded-lg`}
                      >
                        Marquer effectué
                      </button>
                      {status === 'pending' && (
                        <button
                          onClick={() => onUpdateStatus(alert.id, 'late')}
                          className={`px-3 py-1.5 text-sm ${darkMode ? 'bg-gray-700 text-red-400 border border-red-700 hover:bg-red-900' : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'} rounded-lg`}
                        >
                          Marquer en retard
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2 text-sm">
                  {statusConfig.icon}
                  <span className={status === 'completed' ? (darkMode ? 'text-green-400' : 'text-green-600') : 
                          status === 'late' ? (darkMode ? 'text-red-400' : 'text-red-600') : 
                          (darkMode ? 'text-orange-400' : 'text-orange-600')}>
                    {statusConfig.text}
                  </span>
                </div>

                {alert.step === 1 && status !== 'completed' && (
                  <div className={`mt-3 p-3 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg text-sm`}>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Actions suggérées :</p>
                    <ul className={`mt-1 space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <li>• Présenter les services Anthea</li>
                      <li>• Proposer un rendez-vous de découverte</li>
                      <li>• Envoyer la documentation par email</li>
                    </ul>
                  </div>
                )}
              </div>
            );
          })}

          {alerts.length === 0 && (
            <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-4`}>
              Aucune alerte de relance pour le moment
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AlertsPanel;