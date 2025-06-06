import React, { useState, useRef, useEffect } from 'react';
import { Mail, Search, Check, Building2, MapPin, Users, Calendar, X, Plus } from 'lucide-react';
import { useCompaniesStore } from '../stores/companiesStore';
import { useOffersStore } from '../stores/offersStore';
import { useBeneficiairesStore } from '../stores/beneficiairesStore';
import type { Company } from '../types/company';
import type { Beneficiaire } from '../types/beneficiaire';
import type { JobOffer } from '../types/jobOffer';
import { useThemeStore } from '../stores/themeStore';

interface NewsletterTemplatesProps {
  onSelect: (template: any) => void;
  onClose: () => void;
}

export default function NewsletterTemplates({ onSelect, onClose }: NewsletterTemplatesProps) {
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
  const { companies } = useCompaniesStore();

  // Extract all company emails and contact emails
  const allEmails = React.useMemo(() => {
    const emails: string[] = [];
    
    // Add company emails
    companies.forEach(company => {
      if (company.email) emails.push(company.email);
      
      // Add contact emails
      company.contacts?.forEach(contact => {
        if (contact.email) emails.push(contact.email);
      });
    });
    
    // Remove duplicates and sort
    return [...new Set(emails)].sort();
  }, [companies]);

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
      id: 'presentation',
      title: 'Présentation Anthea RH',
      subject: 'Découvrez Anthea RH - Votre partenaire recrutement',
      content: `Bonjour,

Nous sommes ravis de vous présenter Anthea RH, votre cabinet de reclassement professionnel. Notre mission est de faciliter la rencontre entre les talents et les entreprises, en proposant un accompagnement personnalisé et des profils qualifiés.

Nos services incluent :
- Un accompagnement personnalisé
- Une sélection rigoureuse des candidats
- Un suivi régulier post-placement

N'hésitez pas à nous contacter pour plus d'informations.

Cordialement,
L'équipe Anthea RH`
    },
    {
      id: 'candidates',
      title: 'Présentation de Candidats',
      subject: 'Profils disponibles - Anthea RH',
      content: `Bonjour,

Nous avons le plaisir de vous présenter une sélection de profils qualifiés qui pourraient correspondre à vos besoins en recrutement.

[Liste des profils]

Tous nos candidats sont :
- Immédiatement disponibles
- Qualifiés et expérimentés
- Motivés et prêts à s'investir

Si certains profils retiennent votre attention, nous pouvons organiser rapidement des entretiens.

N'hésitez pas à nous contacter pour plus d'informations sur ces candidats.

Cordialement,
L'équipe Anthea RH`
    },
    {
      id: 'candidate_follow_up',
      title: 'Suivi des Candidats',
      subject: 'Point sur les candidatures en cours - Anthea RH',
      content: `Bonjour,

Nous souhaitons faire un point sur les candidatures que nous vous avons présentées récemment.

[Liste des profils]

Pour chaque candidat, voici un récapitulatif de sa situation :
- Statut de la candidature
- Retours des entretiens
- Prochaines étapes

[Liste des candidatures]

Nous restons à votre disposition pour organiser de nouveaux entretiens ou fournir des informations complémentaires sur ces profils.

Cordialement,
L'équipe Anthea RH`
    }
  ];

  const handleSendEmail = () => {
    let emailContent = customIntro;

    if (selectedTemplate === 'candidates' || selectedTemplate === 'candidate_follow_up') {
      // Format candidates for email
      const selectedCandidates = beneficiaires
        .filter(b => selectedBeneficiaires.includes(b.id))
        .map(b => {
          const candidateOffers = offers.filter(o => 
            o.candidates?.some(c => c.beneficiaireId === b.id)
          );

          return `
=== ${b.firstName} ${b.lastName} - ${b.title} ===
Localisation : ${b.location}
Disponibilité : ${b.availability}
Expérience : ${b.yearsOfExperience} année(s)
Formation : ${b.formation}

${candidateOffers.length > 0 ? `Candidatures en cours :
${candidateOffers.map(o => `- ${o.title} chez ${o.company}
  Statut : ${o.candidates?.find(c => c.beneficiaireId === b.id)?.status === 'placed' ? 'Placé(e)' : 'En cours'}`).join('\n')}` : ''}

Compétences clés :
${b.skills.join(', ')}

Langues :
${b.languages.join(', ')}
          `.trim();
        })
        .join('\n\n-------------------\n\n');

      // Initialize candidateOffers as an empty string before potentially replacing it
      let candidateOffers = '';
      
      // Only try to get candidate offers if there are selected beneficiaires
      if (selectedBeneficiaires.length > 0) {
        const allCandidateOffers = offers.filter(o =>
          o.candidates?.some(c => selectedBeneficiaires.includes(c.beneficiaireId))
        );
        
        candidateOffers = allCandidateOffers
          .map(o => {
            const candidates = o.candidates?.filter(c => selectedBeneficiaires.includes(c.beneficiaireId)) || [];
            return `
=== ${o.title} chez ${o.company} ===
${candidates.map(c => {
  const beneficiaire = beneficiaires.find(b => b.id === c.beneficiaireId);
  return `- ${beneficiaire?.firstName} ${beneficiaire?.lastName}: ${c.status === 'placed' ? 'Placé(e)' : 'En cours'}`;
}).join('\n')}
            `.trim();
          })
          .join('\n\n');
      }

      emailContent = emailContent.replace('[Liste des candidatures]', candidateOffers);
      emailContent = emailContent.replace('[Liste des profils]', selectedCandidates);
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
                placeholder="email@entreprise.fr"
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

          {(selectedTemplate === 'candidates' || selectedTemplate === 'candidate_follow_up') && (
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                Sélectionner les candidats à inclure
              </label>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher un candidat..."
                    className={`w-full pl-10 pr-4 py-2 border ${darkMode ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-200'} rounded-lg`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {beneficiaires
                  .filter(b => 
                    b.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    b.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    b.title.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((beneficiaire) => (
                    <div
                      key={beneficiaire.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedBeneficiaires.includes(beneficiaire.id)
                          ? darkMode ? 'border-blue-500 bg-blue-900/30' : 'border-blue-500 bg-blue-50'
                          : darkMode ? 'border-gray-700 hover:border-blue-500' : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => {
                        setSelectedBeneficiaires(prev => 
                          prev.includes(beneficiaire.id)
                            ? prev.filter(id => id !== beneficiaire.id)
                            : [...prev, beneficiaire.id]
                        );
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {beneficiaire.firstName} {beneficiaire.lastName}
                          </h4>
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{beneficiaire.title}</p>
                          <div className={`mt-2 space-y-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              {beneficiaire.location}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              {beneficiaire.availability}
                            </div>
                          </div>
                        </div>
                        {selectedBeneficiaires.includes(beneficiaire.id) && (
                          <Check className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        )}
                      </div>
                    </div>
                  ))}
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
                ((selectedTemplate === 'candidates' || selectedTemplate === 'candidate_follow_up') && selectedBeneficiaires.length === 0)}
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