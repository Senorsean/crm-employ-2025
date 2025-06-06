import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { useAgenciesStore } from '../stores/agenciesStore';
import { AgencyList } from '../components/agencies/AgencyList';
import { AgencyToolbar } from '../components/agencies/AgencyToolbar';
import AgencyForm from '../components/AgencyForm';
import AgencyDetails from '../components/AgencyDetails';
import AgencyExcelImport from '../components/agencies/AgencyExcelImport';
import type { Agency } from '../types/agency';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { Search, Filter, LayoutGrid, List, Plus, Upload, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';

export default function Agences() {
  const navigate = useNavigate();
  const { agencies, loadAgencies, addAgency, deleteAgency, deleteAgencies } = useAgenciesStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [selectedAgencies, setSelectedAgencies] = useState<Set<string>>(new Set());
  const { darkMode } = useThemeStore();
  
  // Pagination
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        navigate('/login');
        return;
      }
      loadAgencies();
    });

    return () => unsubscribe();
  }, [navigate, loadAgencies]);

  const filteredAgencies = agencies.filter(agency => {
    if (!searchTerm) return true;
    return agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           agency.address.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredAgencies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAgencies = filteredAgencies.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleImport = async (data: any[]) => {
    try {
      for (const agency of data) {
        await addAgency(agency);
      }
      setShowImport(false);
      toast.success(`${data.length} agence${data.length > 1 ? 's' : ''} importée${data.length > 1 ? 's' : ''} avec succès`);
    } catch (error) {
      console.error('Error importing agencies:', error);
      toast.error('Erreur lors de l\'import des agences');
    }
  };

  const handleExport = () => {
    if (!auth.currentUser) {
      toast.error('Vous devez être connecté pour exporter les données');
      return;
    }

    if (selectedAgencies.size === 0) {
      toast.error('Sélectionnez au moins une agence à exporter');
      return;
    }

    try {
      const selectedAgenciesList = agencies.filter(a => selectedAgencies.has(a.id));
      
      const data = selectedAgenciesList.map(a => ({
        'ID Utilisateur': auth.currentUser?.uid || '',
        'Utilisateur': auth.currentUser?.displayName || 'Non renseigné',
        'Nom': a.name,
        'Adresse': a.address,
        'Téléphone': a.phone,
        'Email': a.email,
        'Statut': a.status === 'active' ? 'Active' : 'Inactive',
        'Bénéficiaires': a.stats.beneficiaires,
        'Offres actives': a.stats.offresActives,
        'Taux de placement': `${a.stats.tauxPlacement}%`,
        'Consultants': a.consultants.map(c => 
          `${c.name} (${c.role}) - ${c.phone} - ${c.email}`
        ).join('\n'),
        'Date de création': new Date(a.createdAt).toLocaleDateString('fr-FR'),
        'Dernière mise à jour': new Date(a.updatedAt).toLocaleDateString('fr-FR')
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(20, key.length)
      }));
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Agences');
      XLSX.writeFile(wb, 'export_agences.xlsx');

      toast.success(`${selectedAgencies.size} agence${selectedAgencies.size > 1 ? 's' : ''} exportée${selectedAgencies.size > 1 ? 's' : ''} avec succès`);
    } catch (error) {
      console.error('Error exporting agencies:', error);
      toast.error('Erreur lors de l\'export des agences');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAgency(id);
      setSelectedAgency(null);
      toast.success('Agence supprimée avec succès');
    } catch (error) {
      console.error('Error deleting agency:', error);
      toast.error('Erreur lors de la suppression de l\'agence');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedAgencies.size === 0) return;

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedAgencies.size} agence${selectedAgencies.size > 1 ? 's' : ''} ?`)) {
      try {
        await deleteAgencies(Array.from(selectedAgencies));
        setSelectedAgencies(new Set());
      } catch (error) {
        console.error('Error deleting agencies:', error);
        toast.error('Erreur lors de la suppression des agences');
      }
    }
  };

  const toggleAgency = (id: string) => {
    setSelectedAgencies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedAgencies.size === paginatedAgencies.length) {
      setSelectedAgencies(new Set());
    } else {
      setSelectedAgencies(new Set(paginatedAgencies.map(a => a.id)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Agences</h1>
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            disabled={selectedAgencies.size === 0}
            className={`hidden md:flex items-center px-4 py-2 text-sm ${darkMode ? 'bg-green-700 text-white' : 'bg-green-600 text-white'} rounded-2xl hover:${darkMode ? 'bg-green-600' : 'bg-green-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter ({selectedAgencies.size})
          </button>
          <button
            onClick={() => setShowImport(true)}
            className={`hidden md:flex items-center px-4 py-2 border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600'} rounded-2xl hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}
          >
            <Upload className="w-5 h-5 mr-2" />
            Import
          </button>
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center px-4 py-2 bg-gradient-anthea text-white rounded-2xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle agence
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher une agence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-anthea-blue ${darkMode ? 'bg-gray-700 text-white border-gray-600' : ''}`}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(true)}
            className={`flex items-center px-4 py-2 border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-200'} rounded-2xl hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
          >
            <Filter className="w-5 h-5 mr-2" />
            Filtres
          </button>
          <div className={`flex gap-2 border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-2xl p-1`}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl ${viewMode === 'grid' ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50')}`}
            >
              <LayoutGrid className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl ${viewMode === 'list' ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50')}`}
            >
              <List className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>
      </div>

      <AgencyList
        agencies={paginatedAgencies}
        viewMode={viewMode}
        onAgencyClick={setSelectedAgency}
        selectedIds={selectedAgencies}
        onSelect={toggleAgency}
        onSelectAll={handleSelectAll}
        onDeleteSelected={handleDeleteSelected}
      />

      {/* Pagination controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
        <div className="flex items-center gap-2">
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Afficher</span>
          <select 
            value={itemsPerPage} 
            onChange={handleItemsPerPageChange}
            className={`border ${darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200'} rounded-lg p-1 text-sm`}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>agences par page</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {filteredAgencies.length > 0 ? `${startIndex + 1}-${Math.min(endIndex, filteredAgencies.length)} sur ${filteredAgencies.length}` : '0-0 sur 0'}
          </span>
          
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || filteredAgencies.length === 0}
              className={`p-2 border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} rounded-lg disabled:opacity-50`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Logic to show pages around current page
              let pageToShow;
              if (totalPages <= 5) {
                pageToShow = i + 1;
              } else if (currentPage <= 3) {
                pageToShow = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageToShow = totalPages - 4 + i;
              } else {
                pageToShow = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageToShow}
                  onClick={() => handlePageChange(pageToShow)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                    currentPage === pageToShow 
                      ? 'bg-blue-600 text-white' 
                      : `border ${darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50'}`
                  }`}
                >
                  {pageToShow}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || filteredAgencies.length === 0}
              className={`p-2 border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} rounded-lg disabled:opacity-50`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showNewForm && (
        <AgencyForm
          onSubmit={(data) => {
            addAgency(data);
            setShowNewForm(false);
          }}
          onClose={() => setShowNewForm(false)}
        />
      )}

      {selectedAgency && (
        <AgencyDetails
          agency={selectedAgency}
          onClose={() => setSelectedAgency(null)}
          onEdit={() => {
            setShowNewForm(true);
            setSelectedAgency(null);
          }}
          onDelete={() => handleDelete(selectedAgency.id)}
        />
      )}

      {showImport && (
        <AgencyExcelImport
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}