import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { useCompaniesStore } from '../stores/companiesStore';
import { useOffersStore } from '../stores/offersStore';
import CompanyForm from '../components/CompanyForm';
import CompanyDetails from '../components/CompanyDetails';
import CompanyFilters from '../components/company/CompanyFilters';
import ExcelTemplate from '../components/company/ExcelTemplate';
import { Upload, Plus, Search, Filter, Trash2, Download, LayoutGrid, List, Building2, MapPin, Briefcase, Phone, Mail, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { useThemeStore } from '../stores/themeStore';

export default function Entreprises() {
  const navigate = useNavigate();
  const { companies, loadCompanies, addCompany, deleteCompany } = useCompaniesStore();
  const { offers } = useOffersStore();
  const [showNewForm, setShowNewForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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
      loadCompanies();
    });

    return () => unsubscribe();
  }, [navigate, loadCompanies]);

  const getCompanyOffers = (companyName: string) => {
    return offers.filter(offer => offer.company === companyName);
  };

  const filteredCompanies = companies.filter(company => {
    if (!searchTerm) return true;
    return company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           company.sector?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCompanies = filteredCompanies.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleImport = async (companies: any[]) => {
    try {
      for (const company of companies) {
        await addCompany(company);
      }
      setShowImport(false);
      toast.success(`${companies.length} entreprise${companies.length > 1 ? 's' : ''} importée${companies.length > 1 ? 's' : ''} avec succès`);
    } catch (error) {
      console.error('Error importing companies:', error);
      toast.error('Erreur lors de l\'import des entreprises');
    }
  };

  const handleSelectCompany = (id: string) => {
    setSelectedCompanies(prev => {
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
    if (selectedCompanies.size === paginatedCompanies.length) {
      setSelectedCompanies(new Set());
    } else {
      setSelectedCompanies(new Set(paginatedCompanies.map(c => c.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCompanies.size === 0) return;
    
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedCompanies.size} entreprise${selectedCompanies.size > 1 ? 's' : ''} ?`)) {
      try {
        for (const id of selectedCompanies) {
          await deleteCompany(id);
        }
        setSelectedCompanies(new Set());
        toast.success(`${selectedCompanies.size} entreprise${selectedCompanies.size > 1 ? 's' : ''} supprimée${selectedCompanies.size > 1 ? 's' : ''} avec succès`);
      } catch (error) {
        console.error('Error deleting companies:', error);
        toast.error('Erreur lors de la suppression des entreprises');
      }
    }
  };

  const handleExport = () => {
    if (!auth.currentUser) {
      toast.error('Vous devez être connecté pour exporter les données');
      return;
    }

    if (selectedCompanies.size === 0) {
      toast.error('Sélectionnez au moins une entreprise à exporter');
      return;
    }

    try {
      const selectedCompaniesList = companies.filter(c => selectedCompanies.has(c.id));
      
      const data = selectedCompaniesList.map(c => ({
        'ID Utilisateur': auth.currentUser?.uid || '',
        'Utilisateur': auth.currentUser?.displayName || 'Non renseigné',
        'Nom': c.name,
        'Secteur': c.sector || '',
        'Taille': c.size || '',
        'Adresse': c.address || '',
        'Ville': c.city || '',
        'Téléphone': c.phone || '',
        'Email': c.email || '',
        'Statut': c.status === 'active' ? 'Active' : 'Inactive',
        'Contacts': c.contacts.map(contact => 
          `${contact.name} (${contact.role}) - ${contact.phone} - ${contact.email}`
        ).join('\n'),
        'Créée par': c.createdBy || 'Non spécifié',
        'Newsletter': c.newsletter_consent ? 'Oui' : 'Non',
        'Date de création': new Date(c.createdAt).toLocaleDateString('fr-FR'),
        'Dernière mise à jour': new Date(c.updatedAt).toLocaleDateString('fr-FR')
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Ajuster la largeur des colonnes
      const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(20, key.length)
      }));
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Entreprises');
      XLSX.writeFile(wb, 'export_entreprises.xlsx');

      toast.success(`${selectedCompanies.size} entreprise${selectedCompanies.size > 1 ? 's' : ''} exportée${selectedCompanies.size > 1 ? 's' : ''} avec succès`);
    } catch (error) {
      console.error('Error exporting companies:', error);
      toast.error('Erreur lors de l\'export des entreprises');
    }
  };

  const handleCardClick = (company: any) => {
    if (!selectedCompanies.size) {
      setSelectedCompany(company);
    }
  };

  // Format phone number for display
  const formatPhone = (phone: string) => {
    if (!phone) return 'Non renseigné';
    return phone;
  };

  // Get primary contact from company
  const getPrimaryContact = (company: any) => {
    if (!company.contacts || company.contacts.length === 0) {
      return null;
    }
    return company.contacts[0];
  };

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
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Entreprises</h1>
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            disabled={selectedCompanies.size === 0}
            className={`hidden md:flex items-center px-4 py-2 text-sm ${darkMode ? 'bg-green-700 text-white' : 'bg-green-600 text-white'} rounded-2xl hover:${darkMode ? 'bg-green-600' : 'bg-green-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter ({selectedCompanies.size})
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
            Nouvelle entreprise
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher une entreprise..."
            className={`w-full pl-10 pr-4 py-2 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-anthea-blue ${darkMode ? 'bg-gray-700 text-white border-gray-600' : ''}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

      {selectedCompanies.size > 0 && (
        <div className={`flex justify-between items-center p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl`}>
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={selectedCompanies.size === paginatedCompanies.length}
              onChange={handleSelectAll}
              className={`h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${darkMode ? 'bg-gray-600 border-gray-500' : ''}`}
            />
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {selectedCompanies.size} entreprise{selectedCompanies.size > 1 ? 's' : ''} sélectionnée{selectedCompanies.size > 1 ? 's' : ''}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {paginatedCompanies.map((company) => {
            const companyOffers = getCompanyOffers(company.name);
            const primaryContact = getPrimaryContact(company);
            const fullAddress = [company.address, company.city].filter(Boolean).join(', ');
            const initials = getInitials(company.createdBy || '');
            
            return (
              <div
                key={company.id}
                className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer relative`}
                onClick={() => handleCardClick(company)}
              >
                <div className="absolute top-4 left-4 z-10">
                  <div onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedCompanies.has(company.id)}
                      onChange={() => handleSelectCompany(company.id)}
                      className={`h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${darkMode ? 'bg-gray-600 border-gray-500' : ''}`}
                    />
                  </div>
                </div>
                <div className="absolute top-4 right-4 z-10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                    {initials}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className={`font-semibold text-lg mt-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{company.name}</h3>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{company.sector}</p>
                  <div className={`mt-4 space-y-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                      {fullAddress ? (
                        <a 
                          href={getMapsUrl(fullAddress)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`hover:${darkMode ? 'text-blue-400' : 'text-blue-600'} underline`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="truncate">{fullAddress}</span>
                        </a>
                      ) : (
                        <span className="truncate">Adresse non renseignée</span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                      <a 
                        href={`tel:${formatPhoneForLink(company.phone)}`} 
                        className={`hover:${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {formatPhone(company.phone)}
                      </a>
                    </div>
                    {primaryContact && (
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                        <a 
                          href={`mailto:${primaryContact.email || company.email}`} 
                          className={`hover:${darkMode ? 'text-blue-400' : 'text-blue-600'} truncate`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {primaryContact.email || company.email}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{company.contacts?.length || 0} contact{company.contacts?.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{companyOffers.length} offre{companyOffers.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
          {paginatedCompanies.map((company) => {
            const companyOffers = getCompanyOffers(company.name);
            const primaryContact = getPrimaryContact(company);
            const fullAddress = [company.address, company.city].filter(Boolean).join(', ');
            const initials = getInitials(company.createdBy || '');
            
            return (
              <div
                key={company.id}
                className={`flex items-center p-4 hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'} transition-colors cursor-pointer`}
                onClick={() => handleCardClick(company)}
              >
                <div className="mr-4" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedCompanies.has(company.id)}
                    onChange={() => handleSelectCompany(company.id)}
                    className={`h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 ${darkMode ? 'bg-gray-600 border-gray-500' : ''}`}
                  />
                </div>
                <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-4">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{company.name}</h3>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                        {initials}
                      </div>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{company.sector}</p>
                    {fullAddress && (
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center mt-1`}>
                        <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                        <a 
                          href={getMapsUrl(fullAddress)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`hover:${darkMode ? 'text-blue-400' : 'text-blue-600'} underline`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="truncate">{fullAddress}</span>
                        </a>
                      </p>
                    )}
                  </div>
                  <div className={`col-span-3 flex flex-col text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                      <a 
                        href={`tel:${formatPhoneForLink(company.phone)}`} 
                        className={`hover:${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {formatPhone(company.phone)}
                      </a>
                    </div>
                    {primaryContact && (
                      <div className="flex items-center mt-1">
                        <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                        <a 
                          href={`mailto:${primaryContact.email || company.email}`} 
                          className={`hover:${darkMode ? 'text-blue-400' : 'text-blue-600'} truncate`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {primaryContact.email || company.email}
                        </a>
                      </div>
                    )}
                  </div>
                  <div className={`col-span-2 flex items-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
                    {company.contacts?.length || 0} contact{company.contacts?.length !== 1 ? 's' : ''}
                  </div>
                  <div className={`col-span-3 flex items-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Briefcase className="w-4 h-4 mr-2 flex-shrink-0" />
                    {companyOffers.length} offre{companyOffers.length !== 1 ? 's' : ''}
                    {primaryContact && (
                      <span className={`ml-3 text-xs ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} px-2 py-0.5 rounded-full`}>
                        {primaryContact.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>entreprises par page</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {startIndex + 1}-{Math.min(endIndex, filteredCompanies.length)} sur {filteredCompanies.length}
          </span>
          
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
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
                      : `border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`
                  }`}
                >
                  {pageToShow}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} rounded-lg disabled:opacity-50`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showNewForm && (
        <CompanyForm
          onSubmit={(data) => {
            addCompany(data);
            setShowNewForm(false);
          }}
          onClose={() => setShowNewForm(false)}
        />
      )}

      {selectedCompany && (
        <CompanyDetails
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}

      {showFilters && (
        <CompanyFilters
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          onApplyFilters={() => {
            setShowFilters(false);
          }}
        />
      )}

      {showImport && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm p-6`}>
          <ExcelTemplate onImport={handleImport} />
        </div>
      )}
    </div>
  );
}