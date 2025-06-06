export interface Consultant {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  beneficiairesCount: number;
}

export interface Note {
  id: string;
  content: string;
  createdAt: Date;
  author: string;
}

export interface Agency {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  stats: {
    beneficiaires: number;
    offresActives: number;
    tauxPlacement: number;
  };
  consultants: Consultant[];
  notes?: Note[];
  createdAt: Date;
  updatedAt: Date;
}