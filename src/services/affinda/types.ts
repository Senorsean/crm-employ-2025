export interface AffindaResponse {
  data: {
    name?: {
      given?: string;
      family?: string;
    };
    emails?: string[];
    phoneNumbers?: string[];
    jobTitle?: string;
    profession?: string;
    location?: {
      rawInput?: string;
    };
    workExperience?: Array<{
      jobTitle?: string;
      organization?: string;
      datesEmployed?: {
        start?: string;
        end?: string;
      };
      description?: string;
    }>;
    education?: Array<{
      accreditation?: {
        inputStr?: string;
      };
      organization?: string;
      dates?: {
        completionDate?: string;
      };
    }>;
    skills?: Array<{
      name: string;
    }>;
    languages?: Array<{
      name: string;
    }>;
  };
}

export interface CVParseOptions {
  language?: string;
  waitTime?: number;
}