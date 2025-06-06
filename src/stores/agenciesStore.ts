import { create } from 'zustand';
import { Agency } from '../types/agency';
import { firebaseStore } from './firebaseStore';
import { auth, db } from '../config/firebase';
import { toast } from 'react-hot-toast';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';

interface AgenciesState {
  agencies: Agency[];
  isLoading: boolean;
  error: string | null;
  addAgency: (agency: Omit<Agency, 'id'>) => Promise<void>;
  updateAgency: (id: string, agency: Partial<Agency>) => Promise<void>;
  deleteAgency: (id: string) => Promise<void>;
  deleteAgencies: (ids: string[]) => Promise<void>;
  loadAgencies: () => Promise<void>;
}

export const useAgenciesStore = create<AgenciesState>((set) => ({
  agencies: [],
  isLoading: false,
  error: null,

  addAgency: async (agency) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const docRef = await addDoc(collection(db, 'agencies'), {
        ...agency,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const newAgency = {
        id: docRef.id,
        ...agency,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      set(state => ({ 
        agencies: [...state.agencies, newAgency],
        error: null
      }));
      toast.success('Agence ajoutée avec succès');
    } catch (error) {
      console.error('Error adding agency:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'ajout de l\'agence';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  updateAgency: async (id, updates) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const docRef = doc(db, 'agencies', id);
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: new Date()
      };

      await updateDoc(docRef, updatesWithTimestamp);

      set(state => ({
        agencies: state.agencies.map(a => 
          a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a
        ),
        error: null
      }));
      toast.success('Agence mise à jour avec succès');
    } catch (error) {
      console.error('Error updating agency:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'agence';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  deleteAgency: async (id) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      await deleteDoc(doc(db, 'agencies', id));
      set(state => ({
        agencies: state.agencies.filter(a => a.id !== id),
        error: null
      }));
      toast.success('Agence supprimée avec succès');
    } catch (error) {
      console.error('Error deleting agency:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'agence';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  deleteAgencies: async (ids) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      // Supprimer chaque agence
      await Promise.all(ids.map(id => deleteDoc(doc(db, 'agencies', id))));
      
      // Mettre à jour le state
      set(state => ({
        agencies: state.agencies.filter(a => !ids.includes(a.id)),
        error: null
      }));
      
      toast.success(`${ids.length} agence${ids.length > 1 ? 's' : ''} supprimée${ids.length > 1 ? 's' : ''} avec succès`);
    } catch (error) {
      console.error('Error deleting agencies:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression des agences';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  loadAgencies: async () => {
    if (!auth.currentUser) {
      set({ agencies: [], error: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const q = query(collection(db, 'agencies'));
      const querySnapshot = await getDocs(q);
      const agencies = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Agency[];
      
      set({ 
        agencies,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading agencies:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des agences';
      set({ isLoading: false, error: message });
      toast.error(message);
      throw error;
    }
  }
}));