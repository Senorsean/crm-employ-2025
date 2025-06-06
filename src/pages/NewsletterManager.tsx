import React, { useState } from 'react';
import { AlertCircle, Settings, Users, Building } from 'lucide-react';
import NewsletterTemplatesBeneficiaires from '../components/NewsletterTemplatesBeneficiaires';
import NewsletterTemplates from '../components/NewsletterTemplates';
import NewsletterSettings from '../components/NewsletterSettings';
import NewsletterPreview from '../components/NewsletterPreview';
import { useThemeStore } from '../stores/themeStore';

function NewsletterManager() {
  const [showSettings, setShowSettings] = useState(false);
  const [showBeneficiairesTemplates, setShowBeneficiairesTemplates] = useState(false);
  const [showCompanyTemplates, setShowCompanyTemplates] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [previewContent, setPreviewContent] = useState<string>('');
  const { darkMode } = useThemeStore();

  const handleBeneficiairesTemplateSelect = (template: any) => {
    setPreviewContent(template.content);
    setShowBeneficiairesTemplates(false);
  };

  const handleCompanyTemplateSelect = (template: any) => {
    setPreviewContent(template.content);
    setShowCompanyTemplates(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Newsletter</h1>
        <button
          onClick={() => setShowSettings(true)}
          className={`flex items-center px-4 py-2 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} rounded-2xl transition-colors`}
        >
          <Settings className="w-5 h-5 mr-2" />
          Paramètres
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Newsletter Entreprises */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Building className="w-5 h-5 text-anthea-blue mr-2" />
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Newsletter Entreprises</h2>
              </div>
              <button
                onClick={() => setShowCompanyTemplates(true)}
                className="px-4 py-2 bg-gradient-anthea text-white rounded-2xl hover:opacity-90 transition-opacity"
              >
                Créer une newsletter
              </button>
            </div>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Envoyez une newsletter aux entreprises pour présenter les profils disponibles.
            </p>
          </div>
        </div>

        {/* Newsletter Bénéficiaires */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-anthea-purple mr-2" />
                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Newsletter Bénéficiaires</h2>
              </div>
              <button
                onClick={() => setShowBeneficiairesTemplates(true)}
                className="px-4 py-2 bg-gradient-anthea text-white rounded-2xl hover:opacity-90 transition-opacity"
              >
                Créer une newsletter
              </button>
            </div>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Informez les bénéficiaires des nouvelles offres d'emploi disponibles.
            </p>
          </div>
        </div>
      </div>

      {/* Aperçu de la newsletter */}
      {previewContent && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm`}>
          <div className="p-6">
            <h2 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Aperçu de la newsletter</h2>
            <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-6`}>
              <div className="prose max-w-none">
                {previewContent.split('\n').map((line, index) => (
                  <p key={index} className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modales */}
      {showSettings && (
        <NewsletterSettings onClose={() => setShowSettings(false)} />
      )}

      {showBeneficiairesTemplates && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Modèles de newsletter pour les bénéficiaires</h2>
              <button
                onClick={() => setShowBeneficiairesTemplates(false)}
                className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}
              >
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>
            <NewsletterTemplatesBeneficiaires 
              onSelect={handleBeneficiairesTemplateSelect}
              onClose={() => setShowBeneficiairesTemplates(false)}
            />
          </div>
        </div>
      )}

      {showCompanyTemplates && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Modèles de newsletter pour les entreprises</h2>
              <button
                onClick={() => setShowCompanyTemplates(false)}
                className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}
              >
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>
            <NewsletterTemplates 
              onSelect={handleCompanyTemplateSelect}
              onClose={() => setShowCompanyTemplates(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default NewsletterManager;