import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAgenciesStore } from './agenciesStore';
import { useBeneficiairesStore } from './beneficiairesStore';
import { useCompaniesStore } from './companiesStore';
import { useOffersStore } from './offersStore';

interface DashboardState {
  getStats: () => {
    activeOffers: number;
    totalBeneficiaires: number;
    activeCompanies: number;
  };
}

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  getStats: () => {
    const { offers } = useOffersStore.getState();
    const { beneficiaires } = useBeneficiairesStore.getState();
    const { companies } = useCompaniesStore.getState();

    return {
      activeOffers: offers.filter(offer => 
        offer.status === 'new' || offer.status === 'open'
      ).length,
      totalBeneficiaires: beneficiaires.length,
      activeCompanies: companies.filter(company => 
        company.status === 'active'
      ).length
    };
  }
}));