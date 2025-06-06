import React from 'react';
import { Calendar, Mail, Phone, Send } from 'lucide-react';
import { format, addWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useThemeStore } from '../stores/themeStore';

interface FollowUpStep {
  id: number;
  date: Date;
  type: 'call' | 'email' | 'newsletter';
  status: 'pending' | 'completed' | 'skipped';
  description: string;
}

interface FollowUpSchedulerProps {
  initialContactDate: Date;
  onScheduleAction: (step: FollowUpStep) => void;
}

function FollowUpScheduler({ initialContactDate, onScheduleAction }: FollowUpSchedulerProps) {
  const { darkMode } = useThemeStore();
  
  const followUpSteps: FollowUpStep[] = [
    {
      id: 1,
      date: addWeeks(initialContactDate, 1),
      type: 'call',
      status: 'pending',
      description: 'Premier suivi - Présentation des services Anthea'
    },
    {
      id: 2,
      date: addWeeks(initialContactDate, 2),
      type: 'email',
      status: 'pending',
      description: 'Newsletter - Profils disponibles'
    },
    {
      id: 3,
      date: addWeeks(initialContactDate, 3),
      type: 'newsletter',
      status: 'pending',
      description: 'Présentation des candidatures multi-agences'
    }
  ];

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-5 h-5" />;
      case 'email':
        return <Mail className="w-5 h-5" />;
      case 'newsletter':
        return <Send className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm`}>
      <div className="p-6">
        <h2 className={`text-lg font-semibold mb-6 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Planning de suivi
        </h2>

        <div className="space-y-6">
          {followUpSteps.map((step) => (
            <div
              key={step.id}
              className={`flex items-start space-x-4 p-4 rounded-lg border ${
                darkMode 
                  ? 'border-gray-700 hover:border-blue-800 hover:bg-blue-900/20' 
                  : 'border-gray-100 hover:border-blue-100 hover:bg-blue-50'
              } transition-colors`}
            >
              <div className={`p-2 rounded-lg ${
                step.type === 'call' 
                  ? darkMode ? 'bg-green-900 text-green-400' : 'bg-green-100 text-green-600' 
                  : step.type === 'email' 
                  ? darkMode ? 'bg-blue-900 text-blue-400' : 'bg-blue-100 text-blue-600' 
                  : darkMode ? 'bg-purple-900 text-purple-400' : 'bg-purple-100 text-purple-600'
              }`}>
                {getActionIcon(step.type)}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{step.description}</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Prévu le {format(step.date, 'd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onScheduleAction(step)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Planifier
                    </button>
                  </div>
                </div>

                {step.type === 'newsletter' && (
                  <div className={`mt-3 p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p>Contenu de la newsletter :</p>
                    <ul className="list-disc ml-4 mt-1">
                      <li>Présentation du cabinet Anthea</li>
                      <li>Profils disponibles dans votre secteur</li>
                      <li>Succès stories et témoignages</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Premier contact : {format(initialContactDate, 'd MMMM yyyy', { locale: fr })}
            </span>
            <button className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'} hover:${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              Personnaliser le planning
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FollowUpScheduler;