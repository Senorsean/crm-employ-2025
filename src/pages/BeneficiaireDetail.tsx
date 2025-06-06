import React from 'react';
import { ArrowLeft, User, MapPin, Phone, Mail, Building2, UserCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import NotesSection from '../components/NotesSection';
import ProfileCard from '../components/ProfileCard';

// Données de test pour le profil
const mockProfile = {
  id: '1',
  firstName: 'Marie',
  lastName: 'Martin',
  title: 'Développeuse Full Stack',
  phone: '06 12 34 56 78',
  email: 'marie.martin@email.com',
  location: 'Marseille',
  availability: 'Disponible immédiatement',
  consultant: {
    name: 'Sophie Dubois',
    email: 'sophie.dubois@anthea.fr',
    phone: '06 XX XX XX XX'
  },
  experiences: [
    {
      title: 'Développeuse Full Stack',
      company: 'Tech Solutions',
      period: 'Jan 2022 - Déc 2023',
      description: 'Développement d\'applications web avec React et Node.js, gestion de bases de données SQL.'
    },
    {
      title: 'Développeuse Front-end',
      company: 'Digital Agency',
      period: 'Jan 2020 - Déc 2021',
      description: 'Création d\'interfaces utilisateur réactives avec React et TypeScript.'
    }
  ],
  education: [
    {
      degree: 'Master en Développement Web',
      school: 'École Numérique',
      year: '2020'
    },
    {
      degree: 'Licence en Informatique',
      school: 'Université de Marseille',
      year: '2018'
    }
  ],
  skills: ['React', 'TypeScript', 'Node.js', 'SQL', 'Git', 'Agile'],
  languages: ['Français (natif)', 'Anglais (courant)', 'Espagnol (intermédiaire)']
};

// Simuler des données pour les notes
const mockNotes = [
  {
    id: '1',
    content: "Très motivée et excellentes compétences techniques. A montré un grand intérêt pour les projets innovants.",
    createdAt: new Date('2024-02-20T10:30:00'),
    author: "Sophie Dubois"
  },
  {
    id: '2',
    content: "Entretien positif avec Tech Solutions. L'entreprise apprécie son profil et son expérience en React.",
    createdAt: new Date('2024-02-19T14:15:00'),
    author: "Sophie Dubois"
  },
  {
    id: '3',
    content: "A suivi une formation en gestion de projet agile. Disponible immédiatement pour des missions.",
    createdAt: new Date('2024-02-18T09:45:00'),
    author: "Sophie Dubois"
  }
];

function BeneficiaireDetail() {
  const { id } = useParams();
  const [notes, setNotes] = React.useState(mockNotes);

  const handleAddNote = (content: string) => {
    const newNote = {
      id: Date.now().toString(),
      content,
      createdAt: new Date(),
      author: "Sophie Dubois" // À remplacer par l'utilisateur connecté
    };
    setNotes(prevNotes => [newNote, ...prevNotes]);
  };

  return (
    <div>
      <div className="mb-8">
        <Link
          to="/beneficiaires"
          className="flex items-center text-gray-600 hover:text-blue-600"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour à la liste
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ProfileCard profile={mockProfile} />
          
          {/* Section Notes */}
          <div className="mt-8">
            <NotesSection notes={notes} onAddNote={handleAddNote} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Informations du consultant */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
                  Consultant référent
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {mockProfile.consultant.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{mockProfile.consultant.name}</p>
                      <p className="text-sm text-gray-500">Consultant(e) en reclassement</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <a href={`mailto:${mockProfile.consultant.email}`} className="flex items-center text-gray-600 hover:text-blue-600">
                      <Mail className="w-4 h-4 mr-2" />
                      {mockProfile.consultant.email}
                    </a>
                    <a href={`tel:${mockProfile.consultant.phone}`} className="flex items-center text-gray-600 hover:text-blue-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {mockProfile.consultant.phone}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Autres informations */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Informations complémentaires
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Agence</h3>
                    <p className="text-gray-600">Marseille 4</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Statut</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Actif
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Dernière mise à jour</h3>
                    <p className="text-gray-600">Il y a 2 jours</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BeneficiaireDetail;