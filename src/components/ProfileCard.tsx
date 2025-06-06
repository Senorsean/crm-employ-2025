import React, { useState } from 'react';
import { Briefcase, GraduationCap, MapPin, Phone, Mail, Calendar, Edit, Trash2, FileCheck, Send, FileText, UserCheck } from 'lucide-react';
import { Beneficiaire } from '../types/beneficiaire';
import { useBeneficiairesStore } from '../stores/beneficiairesStore';
import { useOffersStore } from '../stores/offersStore';
import { toast } from 'react-hot-toast';
import { useThemeStore } from '../stores/themeStore';

interface ProfileCardProps {
  profile: Beneficiaire;
  compact?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

function ProfileCard({ profile, compact = false, onEdit, onDelete }: ProfileCardProps) {
  const { updateBeneficiaire } = useBeneficiairesStore();
  const { offers } = useOffersStore();
  const [showMiniCV, setShowMiniCV] = useState(false);
  const skillsList = Array.isArray(profile.skills) ? profile.skills : [];
  const languagesList = Array.isArray(profile.languages) ? profile.languages : [];
  const { darkMode } = useThemeStore();

  // Calculer le nombre d'offres proposées pour ce bénéficiaire
  const proposedOffersCount = offers.reduce((count, offer) => {
    const isProposed = offer.candidates?.some(
      candidate => candidate.beneficiaireId === profile.id
    );
    return isProposed ? count + 1 : count;
  }, 0);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce bénéficiaire ?')) {
      onDelete?.();
    }
  };

  const handleCvStatusChange = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateBeneficiaire(profile.id, { cvOk: !profile.cvOk });
      toast.success(`CV marqué comme ${!profile.cvOk ? 'OK' : 'Non OK'}`);
    } catch (error) {
      console.error('Error updating CV status:', error);
      toast.error('Erreur lors de la mise à jour du statut CV');
    }
  };

  const handleEmploymentStatusChange = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateBeneficiaire(profile.id, { employed: !profile.employed });
      toast.success(`Bénéficiaire marqué comme ${!profile.employed ? 'En emploi' : 'Sans emploi'}`);
    } catch (error) {
      console.error('Error updating employment status:', error);
      toast.error('Erreur lors de la mise à jour du statut d\'emploi');
    }
  };

  const handleMiniCVClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMiniCV(!showMiniCV);
  };

  const handleSendMiniCV = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const miniCVContent = `
Profil : ${profile.firstName} ${profile.lastName}
Poste : ${profile.title}
Localisation : ${profile.location}
Disponibilité : ${profile.availability}

Expérience : ${profile.yearsOfExperience} année(s)
Formation : ${profile.formation}

${profile.experiences[0] ? `Dernière expérience :
${profile.experiences[0].title} chez ${profile.experiences[0].company}
${profile.experiences[0].period}
${profile.experiences[0].description}` : ''}

Compétences clés :
${profile.skills.join(', ')}

Langues :
${profile.languages.join(', ')}

Pour plus d'informations sur ce profil, n'hésitez pas à nous contacter.

Cordialement,
L'équipe Anthea RH
    `.trim();

    const mailtoUrl = `mailto:?subject=Profil ${profile.firstName} ${profile.lastName} - ${profile.title}&body=${encodeURIComponent(miniCVContent)}`;
    window.location.href = mailtoUrl;
  };

  // Format phone number for tel: links
  const formatPhoneForLink = (phone: string) => {
    // Remove spaces, dots, dashes, and parentheses
    return phone.replace(/[\s\.\-\(\)]/g, '');
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl shadow-sm border hover:shadow-md transition-shadow`}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 rounded-full ${darkMode ? 'bg-blue-900' : 'bg-blue-100'} flex items-center justify-center ${darkMode ? 'text-blue-300' : 'text-blue-600'} text-xl font-semibold`}>
            {profile.firstName[0]}
            {profile.lastName[0]}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {profile.firstName} {profile.lastName}
                </h3>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{profile.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleCvStatusChange}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      profile.cvOk 
                        ? darkMode ? 'bg-green-900 text-green-300 hover:bg-green-800' : 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : darkMode ? 'bg-red-900 text-red-300 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    CV {profile.cvOk ? 'OK' : 'Non OK'}
                  </button>
                  <button
                    onClick={handleEmploymentStatusChange}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      profile.employed 
                        ? darkMode ? 'bg-green-900 text-green-300 hover:bg-green-800' : 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    {profile.employed ? 'En emploi' : 'Sans emploi'}
                  </button>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                    <Send className="w-3.5 h-3.5" />
                    {proposedOffersCount} offre{proposedOffersCount > 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={handleMiniCVClick}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-purple-900 text-purple-300 hover:bg-purple-800' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Mini CV
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className={`p-1.5 ${darkMode ? 'text-red-400 hover:bg-red-900' : 'text-red-600 hover:bg-red-50'} rounded-lg transition-colors`}
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className={`flex items-center px-3 py-1.5 text-sm ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-600'} rounded-lg hover:${darkMode ? 'bg-blue-800' : 'bg-blue-100'}`}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    {!compact && "Modifier"}
                  </button>
                )}
              </div>
            </div>
            <div className={`mt-2 flex flex-wrap gap-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profile.location}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {profile.availability}
              </div>
            </div>
          </div>
        </div>

        {showMiniCV && (
          <div className={`mt-4 p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
            <div className="space-y-3">
              <div>
                <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Informations clés</h4>
                <div className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p>• {profile.yearsOfExperience} année(s) d'expérience</p>
                  <p>• Formation : {profile.formation}</p>
                  {profile.employed && (
                    <p className={`${darkMode ? 'text-green-400' : 'text-green-600'} font-medium`}>• En emploi {profile.employmentCompany ? `chez ${profile.employmentCompany}` : ''} {profile.employmentType ? `(${profile.employmentType})` : ''}</p>
                  )}
                </div>
              </div>
              
              {profile.experiences[0] && (
                <div>
                  <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dernière expérience</h4>
                  <div className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <p className="font-medium">{profile.experiences[0].title}</p>
                    <p>{profile.experiences[0].company}</p>
                    <p className="text-sm">{profile.experiences[0].period}</p>
                  </div>
                </div>
              )}

              <div>
                <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Compétences clés</h4>
                <div className="mt-1 flex flex-wrap gap-1">
                  {skillsList.slice(0, 5).map((skill, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700'} rounded-full text-xs`}
                    >
                      {skill}
                    </span>
                  ))}
                  {skillsList.length > 5 && (
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      +{skillsList.length - 5}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSendMiniCV}
                  className={`flex items-center px-3 py-1.5 text-sm ${darkMode ? 'bg-blue-700 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'} rounded-lg`}
                >
                  <Mail className="w-4 h-4 mr-1" />
                  Envoyer par email
                </button>
              </div>
            </div>
          </div>
        )}

        {!compact && (
          <>
            <div className="mt-6 space-y-4">
              {profile.experiences.length > 0 && (
                <div>
                  <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2 flex items-center`}>
                    <Briefcase className="w-4 h-4 mr-2" />
                    Expérience professionnelle
                  </h4>
                  <div className="space-y-3">
                    {profile.experiences.map((exp, index) => (
                      <div key={index} className={`border-l-2 ${darkMode ? 'border-gray-700' : 'border-gray-100'} pl-4`}>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{exp.title}</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{exp.company}</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{exp.period}</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mt-1`}>{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile.education.length > 0 && (
                <div>
                  <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2 flex items-center`}>
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Formation
                  </h4>
                  <div className="space-y-3">
                    {profile.education.map((edu, index) => (
                      <div key={index} className={`border-l-2 ${darkMode ? 'border-gray-700' : 'border-gray-100'} pl-4`}>
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{edu.degree}</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{edu.school}</p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{edu.year}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {skillsList.length > 0 && (
                <div>
                  <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Compétences</h4>
                  <div className="flex flex-wrap gap-2">
                    {skillsList.map((skill, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700'} rounded-full text-sm`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {languagesList.length > 0 && (
                <div>
                  <h4 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Langues</h4>
                  <div className="flex flex-wrap gap-2">
                    {languagesList.map((language, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} rounded-full text-sm`}
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={`mt-6 pt-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex flex-wrap gap-4 text-sm">
                <a
                  href={`tel:${formatPhoneForLink(profile.phone)}`}
                  className={`flex items-center gap-2 ${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}
                >
                  <Phone className="w-4 h-4" />
                  {profile.phone}
                </a>
                <a
                  href={`mailto:${profile.email}`}
                  className={`flex items-center gap-2 ${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}
                >
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </a>
              </div>
            </div>
          </>
        )}

        {compact && (
          <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex flex-col gap-2 text-sm">
              <a
                href={`tel:${formatPhoneForLink(profile.phone)}`}
                className={`flex items-center ${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}
              >
                <Phone className="w-4 h-4 mr-2" />
                {profile.phone}
              </a>
              <a
                href={`mailto:${profile.email}`}
                className={`flex items-center ${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`}
              >
                <Mail className="w-4 h-4 mr-2" />
                {profile.email}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileCard;