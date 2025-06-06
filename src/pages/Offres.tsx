import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { useOffersStore } from '../stores/offersStore';
import JobOfferForm from '../components/JobOfferForm';
import JobOfferDetails from '../components/JobOfferDetails';
import JobFilters from '../components/JobFilters';
import JobOffersImport from '../components/offers/JobOffersImport';
import JobStatusBadge from '../components/JobStatusBadge';
import UrgencyBadge from '../components/UrgencyBadge';
import { Building2, MapPin, Calendar, Upload, Plus, Search, Filter, Trash2, Download, Users, LayoutGrid, List, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { useThemeStore } from '../stores/themeStore';

export default function Offres() {
  const navigate = useNavigate();
  const { offers, loadOffers, addOffer, updateOffer, deleteOffer } = useOffersStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showNewForm, setShowNewForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOffers, setSelectedOffers] = useState<Set<string>>(new Set());
  const { darkMode } = useThemeStore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        navigate('/login');
        return;
      }
      loadOffers();
    });

    return () => unsubscribe();
  }, [navigate, loadOffers]);

  const filteredOffers = offers.filter(offer => {
    if (!searchTerm) return true;
    return offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           offer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
           offer.location.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleEdit = (offer: any) => {
    setEditingOffer(offer);
    setShowNewForm(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingOffer) {
        await updateOffer(editingOffer.id, data);
        toast.success('Offre mise à jour avec succès');
      } else {
        await addOffer({
          ...data,
          status: 'new',
          candidates: [],
          createdAt: new Date().toISOString()
        });
        toast.success('Offre créée avec succès');
      }
      setShowNewForm(false);
      setEditingOffer(null);
    } catch (error) {
      console.error('Error submitting offer:', error);
      toast.error('Erreur lors de l\'enregistrement de l\'offre');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) {
      try {
        await deleteOffer(id);
        setSelectedOffer(null);
        toast.success('Offre supprimée avec succès');
      } catch (error) {
        console.error('Error deleting offer:', error);
        toast.error('Erreur lors de la suppression de l\'offre');
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedOffers.size === 0) return;

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedOffers.size} offre${selectedOffers.size > 1 ? 's' : ''} ?`)) {
      try {
        const promises = Array.from(selectedOffers).map(id => deleteOffer(id));
        await Promise.all(promises);
        setSelectedOffers(new Set());
        toast.success(`${selectedOffers.size} offre${selectedOffers.size > 1 ? 's' : ''} supprimée${selectedOffers.size > 1 ? 's' : ''} avec succès`);
      } catch (error) {
        console.error('Error deleting offers:', error);
        toast.error('Erreur lors de la suppression des offres');
      }
    }
  };

  const handleImport = async (data: any[]) => {
    try {
      for (const offer of data) {
        await addOffer(offer);
      }
      setShowImport(false);
      toast.success(`${data.length} offre${data.length > 1 ? 's' : ''} importée${data.length > 1 ? 's' : ''} avec succès`);
    } catch (error) {
      console.error('Error importing offers:', error);
      toast.error('Erreur lors de l\'import des offres');
    }
  };

  const handleExport = () => {
    if (!auth.currentUser) {
      toast.error('Vous devez être connecté pour exporter les données');
      return;
    }

    if (selectedOffers.size === 0) {
      toast.error('Sélectionnez au moins une offre à exporter');
      return;
    }

    try {
      const selectedOffersList = offers.filter(o => selectedOffers.has(o.id));
      
      const data = selectedOffersList.map(o => ({
        'ID Utilisateur': auth.currentUser?.uid || '',
        'Utilisateur': auth.currentUser?.displayName || 'Non renseigné',
        'Titre': o.title,
        'Entreprise': o.company,
        'Localisation': o.location,
        'Type de contrat': o.type,
        'Niveau d\'urgence': o.urgencyLevel === 'high' ? 'Urgent' : 
                           o.urgencyLevel === 'medium' ? 'Prioritaire' : 
                           'Normal',
        'Statut': o.status === 'new' ? 'Nouvelle' :
                 o.status === 'open' ? 'En cours' :
                 o.status === 'filled' ? 'Pourvue' :
                 'Fermée',
        'Description': o.description,
        'Salaire': o.salary || '',
        'Candidatures': o.candidates?.length || 0,
        'Créée par': o.createdBy || 'Non spécifié',
        'Contact - Nom': o.contact?.name || '',
        'Contact - Fonction': o.contact?.role || '',
        'Contact - Email': o.contact?.email || '',
        'Contact - Téléphone': o.contact?.phone || '',
        'Date de création': new Date(o.createdAt).toLocaleDateString('fr-FR')
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Ajuster la largeur des colonnes
      const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(20, key.length)
      }));
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Offres');
      XLSX.writeFile(wb, 'export_offres.xlsx');

      toast.success(`${selectedOffers.size} offre${selectedOffers.size > 1 ? 's' : ''} exportée${selectedOffers.size > 1 ? 's' : ''} avec succès`);
    } catch (error) {
      console.error('Error exporting offers:', error);
      toast.error('Erreur lors de l\'export des offres');
    }
  };

  const toggleOffer = (id: string) => {
    setSelectedOffers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Fonction pour obtenir les initiales d'une personne
  const getInitials = (name: string): string => {
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Offres d'emploi</h1>
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            disabled={selectedOffers.size === 0}
            className={`hidden md:flex items-center px-4 py-2 text-sm ${darkMode ? 'bg-green-700 text-white' : 'bg-green-600 text-white'} rounded-2xl hover:${darkMode ? 'bg-green-600' : 'bg-green-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter ({selectedOffers.size})
          </button>
          <button
            onClick={() => setShowImport(true)}
            className={`hidden md:flex items-center px-4 py-2 border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600'} rounded-2xl hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}
          >
            <Upload className="w-5 h-5 mr-2" />
            Import
          </button>
          <button
            onClick={() => {
              setEditingOffer(null);
              setShowNewForm(true);
            }}
            className="flex items-center px-4 py-2 bg-gradient-anthea text-white rounded-2xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle offre
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher une offre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-anthea-blue ${darkMode ? 'bg-gray-700 text-white border-gray-600' : ''}`}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(true)}
            className={`flex items-center px-4 py-2 border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600'} rounded-2xl hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
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

      {selectedOffers.size > 0 && (
        <div className={`flex justify-between items-center p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl`}>
          <div className="flex items-center gap-4">
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {selectedOffers.size} offre{selectedOffers.size > 1 ? 's' : ''} sélectionnée{selectedOffers.size > 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={handleDeleteSelected}
            className={`flex items-center px-3 py-1.5 text-sm ${darkMode ? 'bg-red-900 text-red-300' : 'bg-red-50 text-red-600'} rounded-lg hover:${darkMode ? 'bg-red-800' : 'bg-red-100'}`}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Supprimer la sélection
          </button>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => {
            const initials = getInitials(offer.createdBy || '');
            
            return (
              <div
                key={offer.id}
                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer relative`}
                onClick={() => setSelectedOffer(offer)}
              >
                <div className="absolute top-4 left-4 z-10">
                  <div onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedOffers.has(offer.id)}
                      onChange={() => toggleOffer(offer.id)}
                      className={`h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${darkMode ? 'bg-gray-600 border-gray-500' : ''}`}
                    />
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{offer.title}</h3>
                      <div className="flex items-center gap-2">
                        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{offer.company}</p>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                          {initials}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <UrgencyBadge level={offer.urgencyLevel} />
                      <JobStatusBadge status={offer.status} />
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-blue-900 text-blue-300 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                        <Users className="w-3.5 h-3.5" />
                        {offer.candidates?.length || 0} candidature{(offer.candidates?.length || 0) > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  <div className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 mr-2" />
                      {offer.type}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {offer.location}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(offer.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {filteredOffers.map((offer) => {
            const initials = getInitials(offer.createdBy || '');
            
            return (
              <div
                key={offer.id}
                className={`flex items-center p-4 hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors cursor-pointer`}
                onClick={() => setSelectedOffer(offer)}
              >
                <div className="mr-4" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedOffers.has(offer.id)}
                    onChange={() => toggleOffer(offer.id)}
                    className={`h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${darkMode ? 'bg-gray-600 border-gray-500' : ''}`}
                  />
                </div>
                <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{offer.title}</h3>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                        {initials}
                      </div>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{offer.company}</p>
                  </div>
                  <div className={`col-span-2 flex items-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Building2 className="w-4 h-4 mr-2" />
                    {offer.type}
                  </div>
                  <div className={`col-span-2 flex items-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <MapPin className="w-4 h-4 mr-2" />
                    {offer.location}
                  </div>
                  <div className="col-span-4 flex items-center gap-2">
                    <UrgencyBadge level={offer.urgencyLevel} />
                    <JobStatusBadge status={offer.status} />
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-blue-900 text-blue-300 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                      <Users className="w-3.5 h-3.5" />
                      {offer.candidates?.length || 0} candidature{(offer.candidates?.length || 0) > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNewForm && (
        <JobOfferForm
          onSubmit={handleSubmit}
          onClose={() => {
            setShowNewForm(false);
            setEditingOffer(null);
          }}
          offer={editingOffer}
          isEditing={!!editingOffer}
        />
      )}

      {selectedOffer && !showNewForm && (
        <JobOfferDetails
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
          onEdit={() => handleEdit(selectedOffer)}
          onDelete={() => handleDelete(selectedOffer.id)}
        />
      )}

      {showFilters && (
        <JobFilters
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          onApplyFilters={() => {
            setShowFilters(false);
          }}
        />
      )}

      {showImport && (
        <JobOffersImport
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}