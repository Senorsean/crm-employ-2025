import { create } from 'zustand';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { toast } from 'react-hot-toast';

interface Candidate {
  id: string;
  name: string;
  email: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CandidatesState {
  candidates: Candidate[];
  isLoading: boolean;
  error: string | null;
  addCandidate: (name: string, email: string) => Promise<void>;
  loadCandidates: () => Promise<void>;
}

export const useCandidatesStore = create<CandidatesState>((set) => ({
  candidates: [],
  isLoading: false,
  error: null,

  addCandidate: async (name: string, email: string) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      // Vérifier si le candidat existe déjà
      const q = query(
        collection(db, 'candidats'),
        where('email', '==', email),
        where('userId', '==', auth.currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        throw new Error('Un candidat avec cet email existe déjà');
      }

      // Créer le nouveau candidat
      const candidateData = {
        name,
        email,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'candidats'), candidateData);
      
      const newCandidate = {
        id: docRef.id,
        ...candidateData
      };

      set(state => ({
        candidates: [...state.candidates, newCandidate],
        error: null
      }));

      toast.success('Candidat ajouté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du candidat:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de l\'ajout du candidat';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  loadCandidates: async () => {
    if (!auth.currentUser) {
      set({ candidates: [], error: null });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const q = query(
        collection(db, 'candidats'),
        where('userId', '==', auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const candidates = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      })) as Candidate[];

      set({ 
        candidates,
        isLoading: false,
        error: null 
      });
    } catch (error) {
      console.error('Erreur lors du chargement des candidats:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des candidats';
      set({ 
        isLoading: false,
        error: message 
      });
      toast.error(message);
      throw error;
    }
  }
}));