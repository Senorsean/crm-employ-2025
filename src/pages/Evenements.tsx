import React, { useState, useEffect } from 'react';
import { Plus, Upload, Download, Search, Filter, Trash2, LayoutGrid, List, Calendar, MapPin, Users, Building2, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { useEventsStore } from '../stores/eventsStore';
import EventForm from '../components/events/EventForm';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../stores/themeStore';

export default function Evenements() {
  const navigate = useNavigate();
  const { events, loadEvents, addEvent, deleteEvent, updateEvent } = useEventsStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const { darkMode } = useThemeStore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        navigate('/login');
        return;
      }
      loadEvents();
    });

    return () => unsubscribe();
  }, [navigate, loadEvents]);

  const filteredEvents = events.filter(event => {
    if (!searchTerm) return true;
    return event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           event.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
           event.location.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleImport = () => {
    // TODO: Implémenter l'import
    toast.success('Import des événements');
  };

  const handleExport = () => {
    if (!auth.currentUser) {
      toast.error('Vous devez être connecté pour exporter les données');
      return;
    }

    if (selectedEvents.size === 0) {
      toast.error('Sélectionnez au moins un événement à exporter');
      return;
    }

    try {
      const selectedEventsList = events.filter(e => selectedEvents.has(e.id));
      
      const data = selectedEventsList.map(e => ({
        'ID Utilisateur': auth.currentUser?.uid || '',
        'Utilisateur': auth.currentUser?.displayName || 'Non renseigné',
        'Nom': e.name,
        'Type': e.type === 'job_dating' ? 'Job Dating' :
               e.type === 'salon' ? 'Salon pour l\'emploi' :
               e.type === 'workshop' ? 'Atelier' :
               e.type === 'conference' ? 'Conférence' : 'Autre',
        'Date': new Date(e.date).toLocaleDateString('fr-FR'),
        'Heure de début': e.startTime,
        'Heure de fin': e.endTime,
        'Lieu': e.location,
        'Adresse': e.address,
        'Description': e.description || '',
        'Participants max': e.maxParticipants || '',
        'Bénéficiaires invités': e.invitedBeneficiaires.length,
        'Entreprises participantes': e.partners.join(', '),
        'Statut': e.status === 'upcoming' ? 'À venir' :
                 e.status === 'ongoing' ? 'En cours' :
                 e.status === 'completed' ? 'Terminé' : 'Annulé',
        'Notes': e.notes || '',
        'Date de création': new Date(e.createdAt).toLocaleDateString('fr-FR')
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Ajuster la largeur des colonnes
      const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(20, key.length)
      }));
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Événements');
      XLSX.writeFile(wb, 'export_evenements.xlsx');

      toast.success(`${selectedEvents.size} événement${selectedEvents.size > 1 ? 's' : ''} exporté${selectedEvents.size > 1 ? 's' : ''} avec succès`);
    } catch (error) {
      console.error('Error exporting events:', error);
      toast.error('Erreur lors de l\'export des événements');
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, data);
        setEditingEvent(null);
        toast.success('Événement mis à jour avec succès');
      } else {
        await addEvent({
          ...data,
          status: 'upcoming'
        });
        toast.success('Événement créé avec succès');
      }
      setShowNewForm(false);
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Erreur lors de l\'enregistrement de l\'événement');
    }
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setShowNewForm(true);
  };

  const handleDeleteSelected = async () => {
    if (selectedEvents.size === 0) return;

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedEvents.size} événement${selectedEvents.size > 1 ? 's' : ''} ?`)) {
      try {
        for (const id of selectedEvents) {
          await deleteEvent(id);
        }
        setSelectedEvents(new Set());
        toast.success(`${selectedEvents.size} événement${selectedEvents.size > 1 ? 's' : ''} supprimé${selectedEvents.size > 1 ? 's' : ''} avec succès`);
      } catch (error) {
        console.error('Error deleting events:', error);
        toast.error('Erreur lors de la suppression des événements');
      }
    }
  };

  const toggleEvent = (id: string) => {
    setSelectedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Événements</h1>
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            disabled={selectedEvents.size === 0}
            className={`hidden md:flex items-center px-4 py-2 text-sm ${darkMode ? 'bg-green-700 text-white' : 'bg-green-600 text-white'} rounded-2xl hover:${darkMode ? 'bg-green-600' : 'bg-green-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter ({selectedEvents.size})
          </button>
          <button
            onClick={handleImport}
            className={`hidden md:flex items-center px-4 py-2 border ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-200 text-gray-600'} rounded-2xl hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors`}
          >
            <Upload className="w-5 h-5 mr-2" />
            Import
          </button>
          <button
            onClick={() => {
              setEditingEvent(null);
              setShowNewForm(true);
            }}
            className="flex items-center px-4 py-2 bg-gradient-anthea text-white rounded-2xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouvel événement
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un événement..."
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

      {selectedEvents.size > 0 && (
        <div className={`flex justify-between items-center p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl`}>
          <div className="flex items-center gap-4">
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {selectedEvents.size} événement{selectedEvents.size > 1 ? 's' : ''} sélectionné{selectedEvents.size > 1 ? 's' : ''}
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
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer relative`}
            >
              <div className="absolute top-4 left-4 z-10">
                <input
                  type="checkbox"
                  checked={selectedEvents.has(event.id)}
                  onChange={() => toggleEvent(event.id)}
                  className={`h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${darkMode ? 'bg-gray-600 border-gray-500' : ''}`}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditEvent(event);
                  }}
                  className={`p-1.5 ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-600'} rounded-lg hover:${darkMode ? 'bg-blue-800' : 'bg-blue-100'} transition-colors`}
                  title="Modifier l'événement"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4 mt-6">
                  <div>
                    <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{event.name}</h3>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} capitalize`}>{event.type.replace('_', ' ')}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    event.status === 'upcoming' ? (darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800') :
                    event.status === 'ongoing' ? (darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800') :
                    event.status === 'completed' ? (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800') :
                    (darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800')
                  }`}>
                    {event.status === 'upcoming' ? 'À venir' :
                     event.status === 'ongoing' ? 'En cours' :
                     event.status === 'completed' ? 'Terminé' :
                     'Annulé'}
                  </span>
                </div>

                <div className={`space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(event.date).toLocaleDateString('fr-FR')} ({event.startTime} - {event.endTime})
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {event.location}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    {event.invitedBeneficiaires.length} bénéficiaire{event.invitedBeneficiaires.length > 1 ? 's' : ''}
                  </div>
                  {(event.type === 'job_dating' || event.type === 'salon') && (
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 mr-2" />
                      {event.partners.length} entreprise{event.partners.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`flex items-center p-4 hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors cursor-pointer`}
            >
              <input
                type="checkbox"
                checked={selectedEvents.has(event.id)}
                onChange={() => toggleEvent(event.id)}
                className={`h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-4 ${darkMode ? 'bg-gray-600 border-gray-500' : ''}`}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{event.name}</h3>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} capitalize`}>{event.type.replace('_', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEvent(event);
                      }}
                      className={`p-1.5 ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-600'} rounded-lg hover:${darkMode ? 'bg-blue-800' : 'bg-blue-100'} transition-colors`}
                      title="Modifier l'événement"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      event.status === 'upcoming' ? (darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800') :
                      event.status === 'ongoing' ? (darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800') :
                      event.status === 'completed' ? (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800') :
                      (darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800')
                    }`}>
                      {event.status === 'upcoming' ? 'À venir' :
                      event.status === 'ongoing' ? 'En cours' :
                      event.status === 'completed' ? 'Terminé' :
                      'Annulé'}
                    </span>
                  </div>
                </div>
                <div className={`mt-2 grid grid-cols-3 gap-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(event.date).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {event.location}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    {event.invitedBeneficiaires.length} bénéficiaire{event.invitedBeneficiaires.length > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewForm && (
        <EventForm
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowNewForm(false);
            setEditingEvent(null);
          }}
          event={editingEvent}
          isEditing={!!editingEvent}
        />
      )}
    </div>
  );
}