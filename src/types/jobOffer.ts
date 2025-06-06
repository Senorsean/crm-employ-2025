export interface JobOffer {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  urgencyLevel: 'high' | 'medium' | 'low';
  status: 'new' | 'open' | 'filled' | 'closed';
  description: string;
  salary?: string;
  contact?: {
    name: string;
    role: string;
    email: string;
    phone: string;
  };
  candidates: Array<{
    beneficiaireId: string;
    status: 'proposed' | 'placed';
    date: string;
  }>;
  createdAt: string;
  createdBy?: string;
  requirements?: string[];
  benefits?: string[];
  skills?: string[];
  userId?: string;
}