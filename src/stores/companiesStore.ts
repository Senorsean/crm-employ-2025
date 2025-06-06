import { create } from 'zustand';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import type { Company } from '../types/company';
import { toast } from 'react-hot-toast';

interface CompaniesState {
  companies: Company[];
  isLoading: boolean;
  error: string | null;
  addCompany: (company: Omit<Company, 'id'>) => Promise<void>;
  updateCompany: (id: string, company: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  loadCompanies: () => Promise<void>;
}

export const useCompaniesStore = create<CompaniesState>((set) => ({
  companies: [],
  isLoading: false,
  error: null,

  addCompany: async (company) => {
    try {
      const companyWithTimestamps = {
        ...company,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: company.status || 'active',
        contacts: company.contacts || [],
        newsletter_consent: company.newsletter_consent || false,
        createdBy: company.createdBy || auth.currentUser?.displayName || 'Utilisateur inconnu'
      };

      const docRef = await addDoc(collection(db, 'companies'), companyWithTimestamps);
      
      set(state => ({
        companies: [...state.companies, { id: docRef.id, ...companyWithTimestamps }],
        error: null
      }));

      toast.success('Entreprise ajoutée avec succès');
    } catch (error) {
      console.error('Error adding company:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'ajout de l\'entreprise';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  updateCompany: async (id, updates) => {
    try {
      const docRef = doc(db, 'companies', id);
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: new Date()
      };

      await updateDoc(docRef, updatesWithTimestamp);

      set(state => ({
        companies: state.companies.map(c => 
          c.id === id ? { ...c, ...updatesWithTimestamp } : c
        ),
        error: null
      }));

      toast.success('Entreprise mise à jour avec succès');
    } catch (error) {
      console.error('Error updating company:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'entreprise';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  deleteCompany: async (id) => {
    try {
      await deleteDoc(doc(db, 'companies', id));
      set(state => ({
        companies: state.companies.filter(c => c.id !== id),
        error: null
      }));
      toast.success('Entreprise supprimée avec succès');
    } catch (error) {
      console.error('Error deleting company:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'entreprise';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  loadCompanies: async () => {
    set({ isLoading: true, error: null });
    try {
      // Load all companies without filtering by userId to allow sharing between roles
      const querySnapshot = await getDocs(collection(db, 'companies'));
      const companies = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Company[];
      
      set({ companies, isLoading: false, error: null });
    } catch (error) {
      console.error('Error loading companies:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des entreprises';
      set({ isLoading: false, error: message });
      toast.error(message);
      throw error;
    }
  }
}));