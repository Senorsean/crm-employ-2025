import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { useBeneficiairesStore } from '../stores/beneficiairesStore';
import { BeneficiaireHeader } from '../components/beneficiaires/BeneficiaireHeader';
import { BeneficiaireToolbar } from '../components/beneficiaires/BeneficiaireToolbar';
import { BeneficiaireList } from '../components/beneficiaires/BeneficiaireList';
import BeneficiaireFilters from '../components/BeneficiaireFilters';
import BeneficiaireForm from '../components/BeneficiaireForm';
import BeneficiaireExcelImport from '../components/beneficiaires/BeneficiaireExcelImport';
import BeneficiaireExport from '../components/beneficiaires/BeneficiaireExport';
import { useBeneficiaireFilters } from '../hooks/useBeneficiaireFilters';
import { toast } from 'react-hot-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemeStore } from '../stores/themeStore';

export default function Beneficiaires() {
  const navigate = useNavigate();
  const { beneficiaires, loadBeneficiaires, deleteBeneficiaire, addBeneficiaire } = useBeneficiairesStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showImportExcel, setShowImportExcel] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editingBeneficiaire, setEditingBeneficiaire] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { darkMode } = useThemeStore();
  
  // Pagination
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    searchTerm,
    setSearchTerm,
    activeFilters,
    setActiveFilters,
    filteredProfiles
  } = useBeneficiaireFilters(beneficiaires);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        navigate('/login');
        return;
      }
      loadBeneficiaires();
    });

    return () => unsubscribe();
  }, [navigate, loadBeneficiaires]);

  // Pagination logic
  const totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProfiles = filteredProfiles.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleEdit = (beneficiaire: any) => {
    setEditingBeneficiaire(beneficiaire);
    setShowNewForm(true);
  };

  const handleDelete = async (beneficiaire: any) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce bénéficiaire ?')) {
      try {
        await deleteBeneficiaire(beneficiaire.id);
        toast.success('Bénéficiaire supprimé avec succès');
      } catch (error) {
        console.error('Error deleting beneficiaire:', error);
        toast.error('Erreur lors de la suppression du bénéficiaire');
      }
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
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
    if (selectedIds.size === paginatedProfiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProfiles.map(p => p.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.size} bénéficiaire${selectedIds.size > 1 ? 's' : ''} ?`)) {
      try {
        const promises = Array.from(selectedIds).map(id => deleteBeneficiaire(id));
        await Promise.all(promises);
        toast.success(`${selectedIds.size} bénéficiaire${selectedIds.size > 1 ? 's' : ''} supprimé${selectedIds.size > 1 ? 's' : ''} avec succès`);
        setSelectedIds(new Set());
      } catch (error) {
        console.error('Error deleting beneficiaires:', error);
        toast.error('Erreur lors de la suppression des bénéficiaires');
      }
    }
  };

  const handleImportExcel = async (data: any[]) => {
    try {
      for (const beneficiaire of data) {
        await addBeneficiaire(beneficiaire);
      }
      setShowImportExcel(false);
      toast.success(`${data.length} bénéficiaire${data.length > 1 ? 's' : ''} importé${data.length > 1 ? 's' : ''} avec succès`);
    } catch (error) {
      console.error('Error importing beneficiaires:', error);
      toast.error('Erreur lors de l\'import des bénéficiaires');
    }
  };

  return (
    <div className="space-y-6">
      <BeneficiaireHeader
        onPrint={() => window.print()}
        onImportExcel={() => setShowImportExcel(true)}
        onNew={() => setShowNewForm(true)}
        onExport={() => setShowExport(true)}
        selectedCount={selectedIds.size}
      />

      <BeneficiaireToolbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onFilterClick={() => setShowFilters(true)}
        activeFilters={activeFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <BeneficiaireList
        profiles={paginatedProfiles}
        viewMode={viewMode}
        onEdit={handleEdit}
        onDelete={handleDelete}
        selectedIds={selectedIds}
        onSelect={handleSelect}
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
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>bénéficiaires par page</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {filteredProfiles.length > 0 ? `${startIndex + 1}-${Math.min(endIndex, filteredProfiles.length)} sur ${filteredProfiles.length}` : '0-0 sur 0'}
          </span>
          
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || filteredProfiles.length === 0}
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
              disabled={currentPage === totalPages || filteredProfiles.length === 0}
              className={`p-2 border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} rounded-lg disabled:opacity-50`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <BeneficiaireFilters
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          onApplyFilters={setActiveFilters}
          currentFilters={activeFilters}
        />
      )}

      {showNewForm && (
        <BeneficiaireForm
          onSubmit={(data) => {
            setShowNewForm(false);
          }}
          onClose={() => {
            setShowNewForm(false);
            setEditingBeneficiaire(null);
          }}
          beneficiaire={editingBeneficiaire}
          isEditing={!!editingBeneficiaire}
        />
      )}

      {showImportExcel && (
        <BeneficiaireExcelImport
          onImport={handleImportExcel}
          onClose={() => setShowImportExcel(false)}
        />
      )}

      {showExport && (
        <BeneficiaireExport
          beneficiaires={beneficiaires}
          selectedIds={selectedIds}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}