import { create } from 'zustand';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { toast } from 'react-hot-toast';

export interface Event {
  id: string;
  name: string;
  type: 'job_dating' | 'salon' | 'workshop' | 'conference' | 'other';
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  address: string;
  description?: string;
  maxParticipants?: number;
  invitedBeneficiaires: string[];
  partners: string[];
  notes?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

interface EventsState {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  addEvent: (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  loadEvents: () => Promise<void>;
}

export const useEventsStore = create<EventsState>((set) => ({
  events: [],
  isLoading: false,
  error: null,

  addEvent: async (event) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const docRef = await addDoc(collection(db, 'events'), {
        ...event,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      set(state => ({
        events: [...state.events, { 
          id: docRef.id, 
          ...event, 
          userId: auth.currentUser!.uid,
          createdAt: new Date(), 
          updatedAt: new Date() 
        }],
        error: null
      }));
      toast.success('Événement créé avec succès');
    } catch (error) {
      console.error('Error adding event:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la création de l\'événement';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  updateEvent: async (id, updates) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const docRef = doc(db, 'events', id);
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: new Date()
      };

      await updateDoc(docRef, updatesWithTimestamp);

      set(state => ({
        events: state.events.map(e => 
          e.id === id ? { ...e, ...updatesWithTimestamp } : e
        ),
        error: null
      }));
      toast.success('Événement mis à jour avec succès');
    } catch (error) {
      console.error('Error updating event:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'événement';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  deleteEvent: async (id) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      await deleteDoc(doc(db, 'events', id));
      set(state => ({
        events: state.events.filter(e => e.id !== id),
        error: null
      }));
      toast.success('Événement supprimé avec succès');
    } catch (error) {
      console.error('Error deleting event:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'événement';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  loadEvents: async () => {
    if (!auth.currentUser) {
      set({ events: [], error: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      // Load all events without filtering by userId to allow sharing between roles
      const q = query(collection(db, 'events'));
      const querySnapshot = await getDocs(q);
      const events = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      })) as Event[];
      
      set({ events, isLoading: false, error: null });
    } catch (error) {
      console.error('Error loading events:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des événements';
      set({ isLoading: false, error: message });
      toast.error(message);
      throw error;
    }
  }
}));