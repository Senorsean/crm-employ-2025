import React, { useState } from 'react';
import { X, Building2, MapPin, Phone, Mail, Users, Edit, BarChart3, Briefcase, UserPlus, Trash2 } from 'lucide-react';
import { useAgenciesStore } from '../stores/agenciesStore';
import NotesSection from './NotesSection';
import ConsultantForm from './ConsultantForm';
import { Agency, Consultant } from '../types/agency';
import { useThemeStore } from '../stores/themeStore';

interface AgencyDetailsProps {
  agency: Agency;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function AgencyDetails({ agency, onClose, onEdit, onDelete }: AgencyDetailsProps) {
  const [showConsultantForm, setShowConsultantForm] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const { updateAgency } = useAgenciesStore();
  const { darkMode } = useThemeStore();

  // Format phone number for tel: links by removing spaces, dots, etc.
  const formatPhoneForLink = (phone: string) => {
    if (!phone) return '';
    return phone.replace(/[\s\.\-\(\)]/g, '');
  };

  // Create a maps URL for the address
  const getMapsUrl = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    return `https://maps.google.com/maps?q=${encodedAddress}`;
  };

  const handleAddNote = (content: string) => {
    const newNote = {
      id: crypto.randomUUID(),
      content,
      createdAt: new Date(),
      author: "Admin" // Replace with actual user
    };

    updateAgency(agency.id, {
      notes: [...(agency.notes || []), newNote]
    });
  };

  const handleAddConsultant = (data: any) => {
    const newConsultant = {
      id: crypto.randomUUID(),
      ...data,
      beneficiairesCount: 0
    };

    updateAgency(agency.id, {
      consultants: [...(agency.consultants || []), newConsultant]
    });

    setShowConsultantForm(false);
  };

  const handleEditConsultant = (consultant: Consultant) => {
    setSelectedConsultant(consultant);
    setShowConsultantForm(true);
  };

  const handleUpdateConsultant = (data: any) => {
    if (!selectedConsultant) return;

    const updatedConsultants = agency.consultants.map(c => 
      c.id === selectedConsultant.id ? { ...c, ...data } : c
    );

    updateAgency(agency.id, {
      consultants: updatedConsultants
    });

    setShowConsultantForm(false);
    setSelectedConsultant(null);
  };

  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette agence ?')) {
      onDelete();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 ${darkMode ? 'bg-blue-900' : 'bg-blue-50'} rounded-lg`}>
                <Building2 className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <div>
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{agency.name}</h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  agency.status === 'active' 
                    ? darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800' 
                    : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                }`}>
                  {agency.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                className={`flex items-center px-3 py-1.5 text-sm ${darkMode ? 'bg-red-900 text-red-300' : 'bg-red-50 text-red-600'} rounded-lg hover:${darkMode ? 'bg-red-800' : 'bg-red-100'}`}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Supprimer
              </button>
              <button
                onClick={onEdit}
                className={`flex items-center px-3 py-1.5 text-sm ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-600'} rounded-lg hover:${darkMode ? 'bg-blue-800' : 'bg-blue-100'}`}
              >
                <Edit className="w-4 h-4 mr-1" />
                Modifier
              </button>
              <button onClick={onClose} className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Informations générales */}
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
                <h3 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Informations générales</h3>
                <div className="space-y-2">
                  <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <a 
                      href={getMapsUrl(agency.address)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`hover:${darkMode ? 'text-blue-400' : 'text-blue-600'} underline`}
                    >
                      {agency.address}
                    </a>
                  </div>
                  <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                    <a href={`tel:${formatPhoneForLink(agency.phone)}`} className={`hover:${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {agency.phone}
                    </a>
                  </div>
                  <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                    <a href={`mailto:${agency.email}`} className={`hover:${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {agency.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-3 gap-4">
                <div className={`${darkMode ? 'bg-blue-900' : 'bg-blue-50'} rounded-lg p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <h4 className={`font-medium ${darkMode ? 'text-blue-300' : 'text-gray-900'}`}>Bénéficiaires</h4>
                  </div>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>{agency.stats.beneficiaires}</p>
                </div>
                <div className={`${darkMode ? 'bg-green-900' : 'bg-green-50'} rounded-lg p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                    <h4 className={`font-medium ${darkMode ? 'text-green-300' : 'text-gray-900'}`}>Offres actives</h4>
                  </div>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-green-300' : 'text-green-600'}`}>{agency.stats.offresActives}</p>
                </div>
                <div className={`${darkMode ? 'bg-purple-900' : 'bg-purple-50'} rounded-lg p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    <h4 className={`font-medium ${darkMode ? 'text-purple-300' : 'text-gray-900'}`}>Taux placement</h4>
                  </div>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>{agency.stats.tauxPlacement}%</p>
                </div>
              </div>

              {/* Consultants */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Consultants</h3>
                  <button
                    onClick={() => {
                      setSelectedConsultant(null);
                      setShowConsultantForm(true);
                    }}
                    className={`flex items-center text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Ajouter un consultant
                  </button>
                </div>
                <div className="space-y-4">
                  {agency.consultants?.map((consultant) => (
                    <div key={consultant.id} className={`border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4`}>
                      <div className="flex justify-between">
                        <div>
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{consultant.name}</p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{consultant.role}</p>
                        </div>
                        <div className="text-right">
                          <a href={`tel:${formatPhoneForLink(consultant.phone)}`} className={`text-sm ${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} block`}>
                            {consultant.phone}
                          </a>
                          <a href={`mailto:${consultant.email}`} className={`text-sm ${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} block`}>
                            {consultant.email}
                          </a>
                        </div>
                      </div>
                      <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex justify-between items-center`}>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {consultant.beneficiairesCount} bénéficiaire{consultant.beneficiairesCount !== 1 ? 's' : ''}
                        </div>
                        <button
                          onClick={() => handleEditConsultant(consultant)}
                          className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                        >
                          Modifier
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!agency.consultants || agency.consultants.length === 0) && (
                    <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-4`}>
                      Aucun consultant pour le moment
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <NotesSection
                notes={agency.notes || []}
                onAddNote={handleAddNote}
              />
            </div>
          </div>
        </div>
      </div>

      {showConsultantForm && (
        <ConsultantForm
          agencyId={agency.id}
          onSubmit={selectedConsultant ? handleUpdateConsultant : handleAddConsultant}
          onClose={() => {
            setShowConsultantForm(false);
            setSelectedConsultant(null);
          }}
          consultant={selectedConsultant || undefined}
          isEditing={!!selectedConsultant}
        />
      )}
    </div>
  );
}

export default AgencyDetails;