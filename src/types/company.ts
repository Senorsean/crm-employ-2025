export interface Company {
  id: string;
  name: string;
  sector?: string;
  size?: string;
  address?: string;
  city?: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  contacts: Array<{
    name: string;
    role: string;
    email: string;
    phone: string;
  }>;
  newsletter_consent: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  notes?: Array<{
    id: string;
    content: string;
    createdAt: Date;
    author: string;
  }>;
}