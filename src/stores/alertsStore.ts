import { create } from 'zustand';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { toast } from 'react-hot-toast';

export interface Alert {
  id: string;
  type: 'relance' | 'rendez-vous';
  company: string;
  date: string; // ISO string format
  agency: string;
  status: 'pending' | 'completed' | 'skipped' | 'late';
  step: number;
  description?: string;
  action?: string;
  userId: string;
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
}

interface AlertsState {
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
  addAlert: (alert: Omit<Alert, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateAlert: (id: string, alert: Partial<Alert>) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
  loadAlerts: () => Promise<void>;
  updateAlertStatus: (id: string, status: Alert['status']) => Promise<void>;
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
  alerts: [],
  isLoading: false,
  error: null,

  addAlert: async (alert) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const now = new Date().toISOString();
      const newAlert = {
        ...alert,
        userId: auth.currentUser.uid,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, 'alerts'), newAlert);
      
      set(state => ({
        alerts: [...state.alerts, { id: docRef.id, ...newAlert }],
        error: null
      }));

      return docRef.id;
    } catch (error) {
      console.error('Error adding alert:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la création de l\'alerte';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  updateAlert: async (id, updates) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const docRef = doc(db, 'alerts', id);
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(docRef, updatesWithTimestamp);

      set(state => ({
        alerts: state.alerts.map(a => 
          a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
        ),
        error: null
      }));
    } catch (error) {
      console.error('Error updating alert:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'alerte';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  deleteAlert: async (id) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      await deleteDoc(doc(db, 'alerts', id));
      set(state => ({
        alerts: state.alerts.filter(a => a.id !== id),
        error: null
      }));
    } catch (error) {
      console.error('Error deleting alert:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'alerte';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  loadAlerts: async () => {
    if (!auth.currentUser) {
      set({ alerts: [], error: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const q = query(
        collection(db, 'alerts'),
        where('userId', '==', auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const alerts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Alert[];
      
      set({ alerts, isLoading: false, error: null });
    } catch (error) {
      console.error('Error loading alerts:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des alertes';
      set({ isLoading: false, error: message });
      toast.error(message);
      throw error;
    }
  },

  updateAlertStatus: async (id, status) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const docRef = doc(db, 'alerts', id);
      await updateDoc(docRef, { 
        status,
        updatedAt: new Date().toISOString()
      });

      set(state => ({
        alerts: state.alerts.map(a => 
          a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a
        ),
        error: null
      }));
    } catch (error) {
      console.error('Error updating alert status:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du statut';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  }
}));