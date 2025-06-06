import React, { useState, useRef, useEffect } from 'react';
import { Mail, Search, Check, Building2, MapPin, Users, Calendar, X, Plus } from 'lucide-react';
import { useBeneficiairesStore } from '../stores/beneficiairesStore';
import { useOffersStore } from '../stores/offersStore';
import { useEventsStore } from '../stores/eventsStore';
import type { Beneficiaire } from '../types/beneficiaire';
import { useThemeStore } from '../stores/themeStore';

interface NewsletterTemplatesBeneficiairesProps {
  onSelect: (template: any) => void;
  onClose: () => void;
}

export default function NewsletterTemplatesBeneficiaires({ onSelect, onClose }: NewsletterTemplatesBeneficiairesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customIntro, setCustomIntro] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBeneficiaires, setSelectedBeneficiaires] = useState<string[]>([]);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [filteredEmails, setFilteredEmails] = useState<string[]>([]);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const { darkMode } = useThemeStore();

  const { beneficiaires } = useBeneficiairesStore();
  const { offers } = useOffersStore();
  const { events } = useEventsStore();

  // Extract all beneficiary emails
  const allEmails = React.useMemo(() => {
    const emails: string[] = [];
    
    // Add beneficiary emails
    beneficiaires.forEach(beneficiaire => {
      if (beneficiaire.email) emails.push(beneficiaire.email);
    });
    
    // Remove duplicates and sort
    return [...new Set(emails)].sort();
  }, [beneficiaires]);

  // Filter emails based on input
  useEffect(() => {
    if (recipientEmail.length >= 1) {
      const filtered = allEmails
        .filter(email => 
          email.toLowerCase().includes(recipientEmail.toLowerCase()) && 
          !selectedRecipients.includes(email)
        );
      setFilteredEmails(filtered);
      setShowEmailSuggestions(filtered.length > 0);
    } else {
      setShowEmailSuggestions(false);
    }
  }, [recipientEmail, allEmails, selectedRecipients]);

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emailInputRef.current && !emailInputRef.current.contains(event.target as Node)) {
        setShowEmailSuggestions(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const templates = [
    {
      id: 'weekly_offers',
      title: 'Offres de la semaine',
      subject: 'Nouvelles offres d\'emploi - Anthea RH',
      content: `Bonjour,

Voici notre sélection d'offres d'emploi de la semaine, spécialement choisies pour vous :

[Liste des offres]

Ces opportunités correspondent à vos critères de recherche. N'hésitez pas à nous contacter pour plus d'informations ou pour postuler.

Cordialement,
Votre consultant Anthea RH`
    },
    {
      id: 'specific_offer',
      title: 'Offre spécifique',
      subject: 'Une opportunité pour vous - Anthea RH',
      content: `Bonjour,

Une nouvelle opportunité correspondant à votre profil vient d'être publiée :

[Détails de l'offre]

Cette offre pourrait vous intéresser compte tenu de votre expérience. Contactez-nous rapidement si vous souhaitez y postuler.

Cordialement,
Votre consultant Anthea RH`
    },
    {
      id: 'event_invitation',
      title: 'Invitation événements',
      subject: 'Invitation : Événement Anthea RH',
      content: `Bonjour,

Nous avons le plaisir de vous inviter à nos prochains événements :

[Liste des événements]

Ces événements sont une excellente opportunité pour développer votre réseau professionnel et rencontrer des entreprises qui recrutent.

Pour confirmer votre participation, merci de nous répondre à cet email.

Cordialement,
L'équipe Anthea RH`
    }
  ];

  const filteredOffers = offers.filter(offer => {
    if (!searchTerm) return true;
    return offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           offer.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
           offer.location.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredEvents = events.filter(event => {
    if (!searchTerm) return true;
    return event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
           event.type.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const toggleOffer = (id: string) => {
    setSelectedOffers(prev => 
      prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
    );
  };

  const toggleEvent = (id: string) => {
    setSelectedEvents(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleSendEmail = () => {
    let emailContent = customIntro;

    if (selectedTemplate === 'weekly_offers' || selectedTemplate === 'specific_offer') {
      // Format offers for email
      const offersDetails = offers
        .filter(o => selectedOffers.includes(o.id))
        .map(o => `
${o.title} - ${o.company}
Type de contrat : ${o.type}
Localisation : ${o.location}
Description : ${o.description}
        `).join('\n\n');

      // Replace placeholder with actual content
      emailContent = emailContent
        .replace('[Liste des offres]', offersDetails)
        .replace('[Détails de l\'offre]', offersDetails);
    } else if (selectedTemplate === 'event_invitation') {
      // Format events for email
      const eventsDetails = events
        .filter(e => selectedEvents.includes(e.id))
        .map(e => `
${e.name}
Type : ${e.type.replace('_', ' ').charAt(0).toUpperCase() + e.type.slice(1)}
Date : ${new Date(e.date).toLocaleDateString('fr-FR')}
Heure : ${e.startTime} - ${e.endTime}
Lieu : ${e.location}
Adresse : ${e.address}

${e.description ? `Description : ${e.description}\n` : ''}
${e.partners.length > 0 ? `Entreprises participantes : ${e.partners.join(', ')}\n` : ''}
        `).join('\n');

      // Replace placeholder with actual content
      emailContent = emailContent.replace('[Liste des événements]', eventsDetails);
    }

    // Create mailto URL with BCC recipients
    const bccList = selectedRecipients.join(',');
    const mailtoUrl = `mailto:?bcc=${encodeURIComponent(bccList)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailContent)}`;
    window.location.href = mailtoUrl;
    onClose();
  };

  const handleSelectEmail = (email: string) => {
    if (!selectedRecipients.includes(email)) {
      setSelectedRecipients([...selectedRecipients, email]);
    }
    setRecipientEmail('');
    setShowEmailSuggestions(false);
  };

  const handleRemoveRecipient = (email: string) => {
    setSelectedRecipients(selectedRecipients.filter(e => e !== email));
  };

  const handleAddRecipient = () => {
    if (recipientEmail && !selectedRecipients.includes(recipientEmail)) {
      setSelectedRecipients([...selectedRecipients, recipientEmail]);
      setRecipientEmail('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedTemplate === template.id
                ? darkMode ? 'border-blue-500 bg-blue-900/30' : 'border-blue-500 bg-blue-50'
                : darkMode ? 'border-gray-700 hover:border-blue-500' : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => {
              setSelectedTemplate(template.id);
              setEmailSubject(template.subject);
              setCustomIntro(template.content);
            }}
          >
            <h3 className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{template.title}</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} line-clamp-3`}>{template.content}</p>
          </div>
        ))}
      </div>

      {selectedTemplate && (
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Destinataires (en copie cachée)
            </label>
            <div className="mb-2">
              {selectedRecipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedRecipients.map(email => (
                    <div 
                      key={email} 
                      className={`flex items-center ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700'} px-2 py-1 rounded-full text-sm`}
                    >
                      <span className="mr-1">{email}</span>
                      <button 
                        onClick={() => handleRemoveRecipient(email)}
                        className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-700'}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="relative flex" ref={emailInputRef}>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                onFocus={() => {
                  if (recipientEmail.length >= 1 && filteredEmails.length > 0) {
                    setShowEmailSuggestions(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && recipientEmail) {
                    e.preventDefault();
                    handleAddRecipient();
                  }
                }}
                className={`flex-1 rounded-l-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
                placeholder="email@exemple.fr"
              />
              <button
                onClick={handleAddRecipient}
                disabled={!recipientEmail}
                className="px-3 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
              
              {showEmailSuggestions && (
                <div className={`absolute z-10 w-full mt-1 top-full ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border rounded-lg shadow-lg max-h-60 overflow-y-auto`}>
                  {filteredEmails.map((email, index) => (
                    <div
                      key={index}
                      className={`px-4 py-2 hover:${darkMode ? 'bg-gray-600' : 'bg-blue-50'} cursor-pointer text-sm ${darkMode ? 'text-gray-200' : ''}`}
                      onClick={() => handleSelectEmail(email)}
                    >
                      {email}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Les destinataires seront ajoutés en copie cachée (BCC) et ne verront pas les autres destinataires.
            </p>
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Objet de l'email
            </label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
            />
          </div>

          {/* Sélection des offres pour les templates d'offres */}
          {(selectedTemplate === 'weekly_offers' || selectedTemplate === 'specific_offer') && (
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                Sélectionner les offres à inclure
              </label>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher une offre..."
                    className={`w-full pl-10 pr-4 py-2 border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} rounded-lg`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedOffers.includes(offer.id)
                        ? darkMode ? 'border-blue-500 bg-blue-900/30' : 'border-blue-500 bg-blue-50'
                        : darkMode ? 'border-gray-700 hover:border-blue-500' : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => toggleOffer(offer.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{offer.title}</h4>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{offer.company}</p>
                        <div className={`mt-2 space-y-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
                      {selectedOffers.includes(offer.id) && (
                        <Check className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      )}
                    </div>
                  </div>
                ))}
                {filteredOffers.length === 0 && (
                  <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-4`}>
                    Aucune offre ne correspond à votre recherche
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Sélection des événements pour le template d'invitation */}
          {selectedTemplate === 'event_invitation' && (
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                Sélectionner les événements à inclure
              </label>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher un événement..."
                    className={`w-full pl-10 pr-4 py-2 border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} rounded-lg`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedEvents.includes(event.id)
                        ? darkMode ? 'border-blue-500 bg-blue-900/30' : 'border-blue-500 bg-blue-50'
                        : darkMode ? 'border-gray-700 hover:border-blue-500' : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => toggleEvent(event.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{event.name}</h4>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} capitalize`}>
                          {event.type.replace('_', ' ')}
                        </p>
                        <div className={`mt-2 space-y-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
                            {event.invitedBeneficiaires.length} participant(s)
                          </div>
                        </div>
                      </div>
                      {selectedEvents.includes(event.id) && (
                        <Check className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      )}
                    </div>
                  </div>
                ))}
                {filteredEvents.length === 0 && (
                  <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-4`}>
                    Aucun événement ne correspond à votre recherche
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Contenu de l'email
            </label>
            <textarea
              value={customIntro}
              onChange={(e) => setCustomIntro(e.target.value)}
              rows={10}
              className={`w-full rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} p-2.5`}
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className={`px-4 py-2 ${darkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-700 bg-gray-100'} rounded-lg hover:${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}
            >
              Fermer
            </button>
            <button
              onClick={handleSendEmail}
              disabled={selectedRecipients.length === 0 || !emailSubject || !customIntro || 
                ((selectedTemplate === 'weekly_offers' || selectedTemplate === 'specific_offer') && selectedOffers.length === 0) ||
                (selectedTemplate === 'event_invitation' && selectedEvents.length === 0)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Mail className="w-4 h-4 mr-2" />
              Envoyer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}