export interface Experience {
  title: string;
  company: string;
  period: string;
  description: string;
}

export interface Education {
  degree: string;
  school: string;
  year: string;
}

export interface Beneficiaire {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  phone: string;
  email: string;
  location: string;
  availability: string;
  experiences: Experience[];
  education: Education[];
  skills: string[];
  languages: string[];
  // Nouveaux champs
  desiredPosition: string;
  currentPosition: string;
  yearsOfExperience: number;
  formation: string;
  cvOk: boolean;
  employed?: boolean; // Statut d'emploi
  employmentDate?: Date; // Date d'embauche
  employmentCompany?: string; // Entreprise d'embauche
  employmentType?: string; // Type de contrat
  mission?: string; // Nouveau champ mission
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
}

export interface FilterValues {
  jobTitles: string[];
  locations: string[];
  availabilities: string[];
  skills: string[];
  languages: string[];
  dateRange: {
    start: string;
    end: string;
  };
}