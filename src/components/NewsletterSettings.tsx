import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useThemeStore } from '../stores/themeStore';

interface NewsletterSettingsProps {
  onClose: () => void;
}

function NewsletterSettings({ onClose }: NewsletterSettingsProps) {
  const { darkMode } = useThemeStore();
  
  const handleSave = () => {
    // Ici, ajoutez la logique pour sauvegarder les paramètres
    toast.success('Paramètres enregistrés avec succès');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl w-full max-w-lg`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Paramètres de la newsletter</h2>
            <button onClick={onClose} className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Fréquence d'envoi */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Fréquence d'envoi
              </label>
              <select className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}>
                <option value="weekly">Hebdomadaire</option>
                <option value="biweekly">Bi-mensuelle</option>
                <option value="monthly">Mensuelle</option>
              </select>
            </div>

            {/* Modèle de newsletter */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Objet de l'email
              </label>
              <input
                type="text"
                defaultValue="Nouveaux profils disponibles - [Date]"
                className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Introduction
              </label>
              <textarea
                rows={3}
                defaultValue="Découvrez les nouveaux talents disponibles cette semaine chez Anthea. Ces profils ont été sélectionnés en fonction de vos critères de recherche."
                className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                Message de désinscription
              </label>
              <textarea
                rows={2}
                defaultValue="Vous recevez cet email car vous êtes inscrit à notre newsletter. Pour vous désinscrire, cliquez ici : [Lien de désinscription]"
                className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
              />
            </div>

            {/* Options d'affichage */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Options d'affichage
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className={`rounded border-gray-300 text-blue-600 mr-2 ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`} />
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Afficher les compétences</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className={`rounded border-gray-300 text-blue-600 mr-2 ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`} />
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Afficher la disponibilité</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className={`rounded border-gray-300 text-blue-600 mr-2 ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`} />
                  <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Afficher la localisation</span>
                </label>
              </div>
            </div>

            {/* Rappel RGPD */}
            <div className={`${darkMode ? 'bg-yellow-900/30 border border-yellow-800' : 'bg-yellow-50 border border-yellow-100'} rounded-lg p-4`}>
              <div className="flex items-start">
                <AlertTriangle className={`w-5 h-5 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} mt-0.5 mr-3`} />
                <div>
                  <h4 className={`text-sm font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>Rappel RGPD</h4>
                  <ul className={`mt-2 text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-700'} list-disc list-inside space-y-1`}>
                    <li>Les destinataires doivent avoir explicitement consenti</li>
                    <li>Chaque email doit contenir un lien de désinscription</li>
                    <li>Les données des désabonnés doivent être supprimées</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-4`}>
            <button
              onClick={onClose}
              className={`px-4 py-2 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'} rounded-lg`}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-gradient-anthea text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewsletterSettings;