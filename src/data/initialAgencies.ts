import { Agency } from '../types/agency';

export const initialAgencies: Agency[] = [
  {
    id: '1',
    name: 'Marseille 4',
    address: '138 Boulevard Françoise Duparc, 13004 Marseille',
    phone: '04 91 16 48 02',
    email: 'marseille4@anthea.fr',
    status: 'active',
    stats: {
      beneficiaires: 324,
      offresActives: 45,
      tauxPlacement: 75
    },
    consultants: [
      {
        id: '1',
        name: 'Sophie Dubois',
        role: 'Consultante senior',
        phone: '06 XX XX XX XX',
        email: 'sophie.dubois@anthea.fr',
        beneficiairesCount: 120
      },
      {
        id: '2',
        name: 'Marc Lambert',
        role: 'Consultant',
        phone: '06 XX XX XX XX',
        email: 'marc.lambert@anthea.fr',
        beneficiairesCount: 85
      }
    ],
    notes: [
      {
        id: '1',
        content: 'Réunion d\'équipe productive. Nouveaux objectifs fixés pour le trimestre.',
        createdAt: new Date('2024-02-20'),
        author: 'Sophie Dubois'
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-02-20')
  },
  {
    id: '2',
    name: 'Marseille 16',
    address: '19 rue Gaston Castel, 13016 Marseille',
    phone: '04 91 17 99 53',
    email: 'marseille16@anthea.fr',
    status: 'active',
    stats: {
      beneficiaires: 256,
      offresActives: 38,
      tauxPlacement: 68
    },
    consultants: [
      {
        id: '3',
        name: 'Julie Martin',
        role: 'Consultante',
        phone: '06 XX XX XX XX',
        email: 'julie.martin@anthea.fr',
        beneficiairesCount: 95
      }
    ],
    notes: [],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-02-15')
  },
  {
    id: '3',
    name: 'Vitrolles',
    address: '2 Avenue de Londres, 13127 Vitrolles',
    phone: '04 42 89 63 20',
    email: 'vitrolles@anthea.fr',
    status: 'active',
    stats: {
      beneficiaires: 198,
      offresActives: 32,
      tauxPlacement: 72
    },
    consultants: [
      {
        id: '4',
        name: 'Thomas Bernard',
        role: 'Consultant senior',
        phone: '06 XX XX XX XX',
        email: 'thomas.bernard@anthea.fr',
        beneficiairesCount: 110
      },
      {
        id: '5',
        name: 'Emma Petit',
        role: 'Consultante',
        phone: '06 XX XX XX XX',
        email: 'emma.petit@anthea.fr',
        beneficiairesCount: 88
      }
    ],
    notes: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-02-18')
  }
];