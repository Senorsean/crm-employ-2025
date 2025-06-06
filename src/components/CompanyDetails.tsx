import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Phone, Mail, Calendar, Clock, FileText, Users, Edit, Trash2, UsersRound, Briefcase, User } from 'lucide-react';
import NotesSection from './NotesSection';
import CompanyForm from './CompanyForm';
import { useCompaniesStore } from '../stores/companiesStore';
import { useOffersStore } from '../stores/offersStore';
import type { Company } from '../stores/companiesStore';
import type { JobOffer } from '../types/jobOffer';
import JobStatusBadge from '../components/JobStatusBadge';
import { useThemeStore } from '../stores/themeStore';

interface CompanyDetailsProps {
  company: Company;
  onClose: () => void;
}

function CompanyDetails({ company, onClose }: CompanyDetailsProps) {
  const [showEditForm, setShowEditForm] = useState(false);
  const { updateCompany, deleteCompany } = useCompaniesStore();
  const { offers, loadOffers } = useOffersStore();
  const [companyOffers, setCompanyOffers] = useState<JobOffer[]>([]);
  const { darkMode } = useThemeStore();

  useEffect(() => {
    // Filtrer les offres pour cette entreprise
    const filteredOffers = offers.filter(offer => offer.company === company.name);
    setCompanyOffers(filteredOffers);
  }, [company.name, offers]);

  const handleEdit = (data: any) => {
    updateCompany(company.id, data);
    setShowEditForm(false);
  };

  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
      deleteCompany(company.id);
      onClose();
    }
  };

  // Format the full address
  const fullAddress = [company.address, company.city].filter(Boolean).join(', ');

  // Format phone number for tel: links by removing spaces, dots, etc.
  const formatPhoneForLink = (phone: string) => {
    if (!phone) return '';
    return phone.replace(/[\s\.\-\(\)]/g, '');
  };

  // Create a maps URL for the address
  const getMapsUrl = (address: string) => {
    // Encode the address for URL
    const encodedAddress = encodeURIComponent(address);
    
    return `https://maps.google.com/maps?q=${encodedAddress}`;
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
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{company.name}</h2>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>{company.sector}</p>
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
                onClick={() => setShowEditForm(true)}
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
                    {fullAddress ? (
                      <a 
                        href={getMapsUrl(fullAddress)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`hover:${darkMode ? 'text-blue-400' : 'text-blue-600'} underline`}
                      >
                        {fullAddress}
                      </a>
                    ) : (
                      'Adresse non renseignée'
                    )}
                  </div>
                  <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                    <a href={`tel:${formatPhoneForLink(company.phone)}`} className={`hover:${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {company.phone}
                    </a>
                  </div>
                  <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                    <a href={`mailto:${company.email}`} className={`hover:${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {company.email}
                    </a>
                  </div>
                  <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <UsersRound className="w-4 h-4 mr-2 flex-shrink-0" />
                    {company.size || 'Taille non spécifiée'}
                  </div>
                  <div className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <User className="w-4 h-4 mr-2 flex-shrink-0" />
                    Créée par: {company.createdBy || 'Non spécifié'}
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
                  <p className={`text-2xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>{company.stats?.beneficiaires || 0}</p>
                </div>
                <div className={`${darkMode ? 'bg-green-900' : 'bg-green-50'} rounded-lg p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                    <h4 className={`font-medium ${darkMode ? 'text-green-300' : 'text-gray-900'}`}>Offres actives</h4>
                  </div>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-green-300' : 'text-green-600'}`}>{company.stats?.offresActives || companyOffers.length}</p>
                </div>
                <div className={`${darkMode ? 'bg-purple-900' : 'bg-purple-50'} rounded-lg p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className={`w-5 h-5 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                    <h4 className={`font-medium ${darkMode ? 'text-purple-300' : 'text-gray-900'}`}>Taux placement</h4>
                  </div>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>{company.stats?.tauxPlacement || 0}%</p>
                </div>
              </div>

              {/* Contacts */}
              <div>
                <h3 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Contacts</h3>
                <div className="space-y-4">
                  {company.contacts.map((contact, index) => (
                    <div key={index} className={`border ${darkMode ? 'border-gray-700' : 'border-gray-200'} rounded-lg p-4`}>
                      <div className="flex justify-between">
                        <div>
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{contact.name}</p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{contact.role}</p>
                        </div>
                        <div className="text-right">
                          <a href={`tel:${formatPhoneForLink(contact.phone)}`} className={`text-sm ${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} block`}>
                            {contact.phone}
                          </a>
                          <a href={`mailto:${contact.email}`} className={`text-sm ${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} block`}>
                            {contact.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!company.contacts || company.contacts.length === 0) && (
                    <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-4`}>
                      Aucun contact pour le moment
                    </p>
                  )}
                </div>
              </div>

              {/* Offres d'emploi */}
              <div>
                <h3 className={`font-medium mb-3 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Briefcase className={`w-5 h-5 mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  Offres d'emploi ({companyOffers.length})
                </h3>
                <div className="space-y-2">
                  {companyOffers.length > 0 ? (
                    companyOffers.map((offer) => (
                      <div key={offer.id} className={`flex justify-between items-center p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                        <div>
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{offer.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{offer.type}</span>
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>• {offer.location}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <JobStatusBadge status={offer.status} />
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{new Date(offer.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-4`}>
                      Aucune offre d'emploi pour le moment
                    </p>
                  )}
                </div>
              </div>

              {/* Rendez-vous */}
              {company.appointments && company.appointments.length > 0 && (
                <div>
                  <h3 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Historique des rendez-vous</h3>
                  <div className="space-y-2">
                    {company.appointments.map((appointment, index) => (
                      <div key={index} className={`p-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{appointment.type}</p>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{appointment.date}</p>
                          </div>
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{appointment.outcome}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <NotesSection
                notes={company.notes || []}
                onAddNote={(content) => {
                  const newNote = {
                    id: crypto.randomUUID(),
                    content,
                    createdAt: new Date(),
                    author: "Admin" // Replace with actual user
                  };
                  updateCompany(company.id, {
                    notes: [...(company.notes || []), newNote]
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyDetails;