import { create } from 'zustand';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import type { JobOffer } from '../types/jobOffer';
import { toast } from 'react-hot-toast';

interface OffersState {
  offers: JobOffer[];
  isLoading: boolean;
  error: string | null;
  addOffer: (offer: Omit<JobOffer, 'id' | 'createdAt' | 'candidates'>) => Promise<void>;
  updateOffer: (id: string, offer: Partial<JobOffer>) => Promise<void>;
  deleteOffer: (id: string) => Promise<void>;
  loadOffers: () => Promise<void>;
  addCandidate: (offerId: string, beneficiaireId: string) => Promise<void>;
  removeCandidate: (offerId: string, beneficiaireId: string) => Promise<void>;
  placeCandidate: (offerId: string, beneficiaireId: string) => Promise<void>;
}

export const useOffersStore = create<OffersState>((set, get) => ({
  offers: [],
  isLoading: false,
  error: null,

  addOffer: async (offer) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const newOffer = {
        ...offer,
        userId: auth.currentUser.uid,
        candidates: [],
        createdAt: new Date().toISOString(),
        createdBy: offer.createdBy || auth.currentUser?.displayName || 'Utilisateur inconnu'
      };

      const docRef = await addDoc(collection(db, 'offers'), newOffer);
      
      set(state => ({
        offers: [...state.offers, { ...newOffer, id: docRef.id }],
        error: null
      }));

      toast.success('Offre ajoutée avec succès');
    } catch (error) {
      console.error('Error adding offer:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'ajout de l\'offre';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  updateOffer: async (id, updates) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const docRef = doc(db, 'offers', id);
      await updateDoc(docRef, updates);

      set(state => ({
        offers: state.offers.map(o => 
          o.id === id ? { ...o, ...updates } : o
        ),
        error: null
      }));

      toast.success('Offre mise à jour avec succès');
    } catch (error) {
      console.error('Error updating offer:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'offre';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  deleteOffer: async (id) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      await deleteDoc(doc(db, 'offers', id));
      set(state => ({
        offers: state.offers.filter(o => o.id !== id),
        error: null
      }));
      toast.success('Offre supprimée avec succès');
    } catch (error) {
      console.error('Error deleting offer:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'offre';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  loadOffers: async () => {
    if (!auth.currentUser) {
      set({ offers: [], error: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      // Load all offers without filtering by userId to allow sharing between roles
      const q = query(collection(db, 'offers'));
      const querySnapshot = await getDocs(q);
      const offers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        candidates: doc.data().candidates || []
      })) as JobOffer[];
      
      set({ offers, isLoading: false, error: null });
    } catch (error) {
      console.error('Error loading offers:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des offres';
      set({ isLoading: false, error: message });
      toast.error(message);
      throw error;
    }
  },

  addCandidate: async (offerId: string, beneficiaireId: string) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const docRef = doc(db, 'offers', offerId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Offre non trouvée');
      }

      const currentOffer = docSnap.data() as JobOffer;
      const currentCandidates = currentOffer.candidates || [];

      if (currentCandidates.some(c => c.beneficiaireId === beneficiaireId)) {
        throw new Error('Ce candidat est déjà ajouté à cette offre');
      }

      const newCandidate = {
        beneficiaireId,
        status: 'proposed' as const,
        date: new Date().toISOString()
      };

      await updateDoc(docRef, {
        candidates: [...currentCandidates, newCandidate]
      });

      set(state => ({
        offers: state.offers.map(o => 
          o.id === offerId 
            ? { ...o, candidates: [...o.candidates, newCandidate] }
            : o
        ),
        error: null
      }));

      toast.success('Candidat ajouté avec succès');
    } catch (error) {
      console.error('Error adding candidate:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'ajout du candidat';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  removeCandidate: async (offerId: string, beneficiaireId: string) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const docRef = doc(db, 'offers', offerId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Offre non trouvée');
      }

      const currentOffer = docSnap.data() as JobOffer;
      const updatedCandidates = currentOffer.candidates.filter(
        c => c.beneficiaireId !== beneficiaireId
      );

      await updateDoc(docRef, {
        candidates: updatedCandidates
      });

      set(state => ({
        offers: state.offers.map(o => 
          o.id === offerId 
            ? { ...o, candidates: updatedCandidates }
            : o
        ),
        error: null
      }));

      toast.success('Candidat retiré avec succès');
    } catch (error) {
      console.error('Error removing candidate:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression du candidat';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  placeCandidate: async (offerId: string, beneficiaireId: string) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const docRef = doc(db, 'offers', offerId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Offre non trouvée');
      }

      const currentOffer = docSnap.data() as JobOffer;
      const updatedCandidates = currentOffer.candidates.map(c => 
        c.beneficiaireId === beneficiaireId 
          ? { ...c, status: 'placed' as const }
          : c
      );

      await updateDoc(docRef, {
        candidates: updatedCandidates,
        status: 'filled'
      });

      set(state => ({
        offers: state.offers.map(o => 
          o.id === offerId 
            ? { ...o, candidates: updatedCandidates, status: 'filled' }
            : o
        ),
        error: null
      }));

      toast.success('Candidat placé avec succès');
    } catch (error) {
      console.error('Error placing candidate:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors du placement du candidat';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  }
}));