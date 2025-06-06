export interface Contact {
  name: string;
  role: string;
  email: string; 
  phone: string;
}

export interface CompanyFormData {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  sector: string;
  size: string;
  contacts: Contact[];
  newsletter_consent: boolean;
  status: 'active' | 'inactive';
}