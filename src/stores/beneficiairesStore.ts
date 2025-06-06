import { create } from 'zustand';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import type { Beneficiaire } from '../types/beneficiaire';
import { toast } from 'react-hot-toast';

interface BeneficiairesState {
  beneficiaires: Beneficiaire[];
  isLoading: boolean;
  error: string | null;
  addBeneficiaire: (beneficiaire: Omit<Beneficiaire, 'id'>) => Promise<void>;
  updateBeneficiaire: (id: string, beneficiaire: Partial<Beneficiaire>) => Promise<void>;
  deleteBeneficiaire: (id: string) => Promise<void>;
  loadBeneficiaires: () => Promise<void>;
}

export const useBeneficiairesStore = create<BeneficiairesState>((set) => ({
  beneficiaires: [],
  isLoading: false,
  error: null,

  addBeneficiaire: async (beneficiaire) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const docRef = await addDoc(collection(db, 'beneficiaires'), {
        ...beneficiaire,
        userId: auth.currentUser.uid,
        cvOk: beneficiaire.cvOk || false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      set(state => ({
        beneficiaires: [...state.beneficiaires, { id: docRef.id, ...beneficiaire }],
        error: null
      }));

      toast.success('Bénéficiaire ajouté avec succès');
    } catch (error) {
      console.error('Error adding beneficiaire:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'ajout du bénéficiaire';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  updateBeneficiaire: async (id, updates) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const docRef = doc(db, 'beneficiaires', id);
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: new Date()
      };

      await updateDoc(docRef, updatesWithTimestamp);

      set(state => ({
        beneficiaires: state.beneficiaires.map(b => 
          b.id === id ? { ...b, ...updates } : b
        ),
        error: null
      }));

      toast.success('Bénéficiaire mis à jour avec succès');
    } catch (error) {
      console.error('Error updating beneficiaire:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du bénéficiaire';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  deleteBeneficiaire: async (id) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      await deleteDoc(doc(db, 'beneficiaires', id));
      set(state => ({
        beneficiaires: state.beneficiaires.filter(b => b.id !== id),
        error: null
      }));
      toast.success('Bénéficiaire supprimé avec succès');
    } catch (error) {
      console.error('Error deleting beneficiaire:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression du bénéficiaire';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  loadBeneficiaires: async () => {
    if (!auth.currentUser) {
      set({ beneficiaires: [], error: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      // Load all beneficiaires without filtering by userId to allow sharing between roles
      const q = query(collection(db, 'beneficiaires'));
      const querySnapshot = await getDocs(q);
      const beneficiaires = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        cvOk: doc.data().cvOk || false,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Beneficiaire[];
      
      set({ beneficiaires, isLoading: false, error: null });
    } catch (error) {
      console.error('Error loading beneficiaires:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des bénéficiaires';
      set({ isLoading: false, error: message });
      toast.error(message);
      throw error;
    }
  }
}));