import { useState, useMemo } from 'react';
import { Beneficiaire, FilterValues } from '../types/beneficiaire';
import { auth } from '../config/firebase';

export function useBeneficiaireFilters(beneficiaires: Beneficiaire[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterValues | null>(null);

  const filteredProfiles = useMemo(() => {
    const currentUserId = auth.currentUser?.uid;

    return beneficiaires.filter(profile => {
      // Par défaut, ne montrer que les bénéficiaires de l'utilisateur courant
      const isOwnProfile = profile.userId === currentUserId;

      // Si une recherche est en cours avec au moins 3 caractères
      if (searchTerm.length >= 3) {
        const searchTermLower = searchTerm.toLowerCase();
        const searchFields = [
          profile.firstName,
          profile.lastName,
          profile.title,
          profile.location,
          profile.email,
          profile.phone,
          ...(Array.isArray(profile.skills) ? profile.skills : []),
          ...(Array.isArray(profile.languages) ? profile.languages : []),
          profile.availability
        ];

        const experienceFields = profile.experiences?.flatMap(exp => [
          exp.title,
          exp.company,
          exp.description
        ]) || [];

        const educationFields = profile.education?.flatMap(edu => [
          edu.degree,
          edu.school
        ]) || [];

        const allSearchableFields = [
          ...searchFields,
          ...experienceFields,
          ...educationFields
        ];

        // Recherche par les trois premières lettres
        return allSearchableFields.some(field => {
          if (!field) return false;
          const fieldLower = field.toLowerCase();
          return fieldLower.startsWith(searchTermLower.slice(0, 3));
        });
      }

      // Si pas de recherche ou moins de 3 caractères, ne montrer que ses propres bénéficiaires
      if (!activeFilters) {
        return isOwnProfile;
      }

      // Active filters
      if (activeFilters) {
        // Job title filter
        if (activeFilters.jobTitles.length && !activeFilters.jobTitles.some(title =>
          profile.title?.toLowerCase().includes(title.toLowerCase())
        )) {
          return false;
        }

        // Location filter
        if (activeFilters.locations.length && !activeFilters.locations.includes(profile.location)) {
          return false;
        }

        // Availability filter
        if (activeFilters.availabilities.length && !activeFilters.availabilities.includes(profile.availability)) {
          return false;
        }

        // Employment status filter
        if (activeFilters.employmentStatus) {
          if (activeFilters.employmentStatus === 'employed' && !profile.employed) {
            return false;
          }
          if (activeFilters.employmentStatus === 'unemployed' && profile.employed) {
            return false;
          }
        }

        // Skills filter
        if (activeFilters.skills.length) {
          const profileSkills = Array.isArray(profile.skills) ? profile.skills : [];
          if (!activeFilters.skills.some(skill => 
            profileSkills.some(profileSkill => 
              profileSkill.toLowerCase().includes(skill.toLowerCase())
            )
          )) {
            return false;
          }
        }

        // Languages filter
        if (activeFilters.languages.length) {
          const profileLanguages = Array.isArray(profile.languages) ? profile.languages : [];
          if (!activeFilters.languages.some(language => 
            profileLanguages.some(profileLanguage => 
              profileLanguage.toLowerCase().includes(language.toLowerCase())
            )
          )) {
            return false;
          }
        }

        // Date range filter
        if (activeFilters.dateRange.start || activeFilters.dateRange.end) {
          const profileDate = new Date(profile.createdAt);
          if (activeFilters.dateRange.start && profileDate < new Date(activeFilters.dateRange.start)) {
            return false;
          }
          if (activeFilters.dateRange.end && profileDate > new Date(activeFilters.dateRange.end)) {
            return false;
          }
        }
      }

      return isOwnProfile;
    });
  }, [beneficiaires, searchTerm, activeFilters]);

  return {
    searchTerm,
    setSearchTerm,
    activeFilters,
    setActiveFilters,
    filteredProfiles
  };
}