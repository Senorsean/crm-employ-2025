export interface CVData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  title?: string;
  location?: string;
  experiences: Array<{
    title: string;
    company: string;
    period: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
  skills: string[];
  languages: string[];
}