export interface LinkedInProfile {
  id?: string;
  localizedFirstName?: string;
  localizedLastName?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  email?: string;
  headline?: string;
  location?: {
    defaultLocale?: {
      country: string;
      language: string;
    };
  };
  positions?: Array<{
    title: string;
    companyName: string;
    startDate?: {
      year: number;
      month: number;
    };
    endDate?: {
      year: number;
      month: number;
    };
    description?: string;
  }>;
  education?: Array<{
    degreeName: string;
    schoolName: string;
    startDate?: {
      year: number;
    };
    endDate?: {
      year: number;
    };
  }>;
  skills?: Array<{
    name: string;
    proficiency?: string;
  }>;
  languages?: Array<{
    name: string;
    proficiency?: string;
  }>;
}

export interface LinkedInError {
  status: number;
  message: string;
  code: string;
}