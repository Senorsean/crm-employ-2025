import React, { useState } from 'react';
import { X, Download, Filter, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { auth } from '../../config/firebase';
import type { Beneficiaire } from '../../types/beneficiaire';
import { useThemeStore } from '../../stores/themeStore';

interface BeneficiaireExportProps {
  beneficiaires: Beneficiaire[];
  selectedIds: Set<string>;
  onClose: () => void;
}

interface ExportFilters {
  missions: string[];
  formations: string[];
  disponibilites: string[];
  cvStatus: 'all' | 'ok' | 'not_ok';
  dateRange: {
    start: string;
    end: string;
  };
}

export default function BeneficiaireExport({ beneficiaires, selectedIds, onClose }: BeneficiaireExportProps) {
  const [filters, setFilters] = useState<ExportFilters>({
    missions: [],
    formations: [],
    disponibilites: [],
    cvStatus: 'all',
    dateRange: {
      start: '',
      end: ''
    }
  });
  const { darkMode } = useThemeStore();

  // Extraire les valeurs uniques pour les filtres
  const uniqueMissions = [...new Set(beneficiaires.map(b => b.mission).filter(Boolean))];
  const uniqueFormations = [...new Set(beneficiaires.map(b => b.formation))];
  const uniqueDisponibilites = [...new Set(beneficiaires.map(b => b.availability))];

  const handleExport = () => {
    if (!auth.currentUser) {
      toast.error('Vous devez être connecté pour exporter les données');
      return;
    }

    // Vérifier qu'il y a des bénéficiaires sélectionnés
    if (selectedIds.size === 0) {
      toast.error('Veuillez sélectionner au moins un bénéficiaire à exporter');
      return;
    }

    try {
      // Ne prendre que les bénéficiaires sélectionnés
      let selectedBeneficiaires = beneficiaires.filter(b => selectedIds.has(b.id));

      // Appliquer les filtres
      selectedBeneficiaires = selectedBeneficiaires.filter(b => {
        // Filtre par mission
        if (filters.missions.length > 0 && !filters.missions.includes(b.mission || '')) {
          return false;
        }

        // Filtre par formation
        if (filters.formations.length > 0 && !filters.formations.includes(b.formation)) {
          return false;
        }

        // Filtre par disponibilité
        if (filters.disponibilites.length > 0 && !filters.disponibilites.includes(b.availability)) {
          return false;
        }

        // Filtre par statut CV
        if (filters.cvStatus === 'ok' && !b.cvOk) return false;
        if (filters.cvStatus === 'not_ok' && b.cvOk) return false;

        // Filtre par date
        if (filters.dateRange.start || filters.dateRange.end) {
          const createdAt = new Date(b.createdAt);
          if (filters.dateRange.start && createdAt < new Date(filters.dateRange.start)) return false;
          if (filters.dateRange.end && createdAt > new Date(filters.dateRange.end)) return false;
        }

        return true;
      });

      // Formater les données pour l'export
      const data = selectedBeneficiaires.map(b => ({
        'ID Utilisateur': auth.currentUser?.uid || '',
        'Utilisateur': auth.currentUser?.displayName || 'Non renseigné',
        'Prénom': b.firstName,
        'Nom': b.lastName,
        'Email': b.email,
        'Téléphone': b.phone,
        'Titre': b.title,
        'Mission / Prestation': b.mission || '',
        'Localisation': b.location,
        'Disponibilité': b.availability,
        'Poste recherché': b.desiredPosition,
        'Poste actuel': b.currentPosition,
        'Années d\'expérience': b.yearsOfExperience,
        'Formation': b.formation,
        'CV OK': b.cvOk ? 'Oui' : 'Non',
        'Compétences': b.skills.join(', '),
        'Langues': b.languages.join(', '),
        'Date de création': new Date(b.createdAt).toLocaleDateString('fr-FR'),
        'Dernière mise à jour': new Date(b.updatedAt).toLocaleDateString('fr-FR')
      }));

      // Créer et télécharger le fichier Excel
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Ajuster la largeur des colonnes
      const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(20, key.length)
      }));
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Bénéficiaires');
      XLSX.writeFile(wb, `export_beneficiaires_${new Date().toISOString().split('T')[0]}.xlsx`);

      toast.success(`${data.length} bénéficiaire${data.length > 1 ? 's' : ''} exporté${data.length > 1 ? 's' : ''} avec succès`);
      onClose();
    } catch (error) {
      console.error('Error exporting beneficiaires:', error);
      toast.error('Erreur lors de l\'export des bénéficiaires');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Filter className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Filtres d'export</h2>
            </div>
            <button onClick={onClose} className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Mission / Prestation */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Mission / Prestation
              </label>
              <select
                multiple
                className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                value={filters.missions}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map(opt => opt.value);
                  setFilters(prev => ({ ...prev, missions: values }));
                }}
              >
                {uniqueMissions.map(mission => (
                  <option key={mission} value={mission}>{mission}</option>
                ))}
              </select>
              <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Maintenez Ctrl (Windows) ou Cmd (Mac) pour sélectionner plusieurs missions
              </p>
            </div>

            {/* Formation */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Formation
              </label>
              <select
                multiple
                className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                value={filters.formations}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map(opt => opt.value);
                  setFilters(prev => ({ ...prev, formations: values }));
                }}
              >
                {uniqueFormations.map(formation => (
                  <option key={formation} value={formation}>{formation}</option>
                ))}
              </select>
            </div>

            {/* Disponibilité */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Disponibilité
              </label>
              <select
                multiple
                className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                value={filters.disponibilites}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions).map(opt => opt.value);
                  setFilters(prev => ({ ...prev, disponibilites: values }));
                }}
              >
                {uniqueDisponibilites.map(dispo => (
                  <option key={dispo} value={dispo}>{dispo}</option>
                ))}
              </select>
            </div>

            {/* Statut CV */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Statut CV
              </label>
              <select
                className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                value={filters.cvStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, cvStatus: e.target.value as 'all' | 'ok' | 'not_ok' }))}
              >
                <option value="all">Tous</option>
                <option value="ok">CV OK</option>
                <option value="not_ok">CV Non OK</option>
              </select>
            </div>

            {/* Période */}
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Période de création
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Du</label>
                  <input
                    type="date"
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                    value={filters.dateRange.start}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className={`block text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Au</label>
                  <input
                    type="date"
                    className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2`}
                    value={filters.dateRange.end}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={onClose}
              className={`px-4 py-2 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} rounded-lg`}
            >
              Annuler
            </button>
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter ({selectedIds.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}