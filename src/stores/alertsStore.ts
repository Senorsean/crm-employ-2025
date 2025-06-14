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
  appointmentId?: string; // Référence à l'ID du rendez-vous associé
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
}

interface AlertsState {
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
  addAlert: (alert: Omit<Alert, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
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
      // Vérifier si une alerte existe déjà pour ce rendez-vous
      if (alert.appointmentId) {
        const existingAlerts = get().alerts.filter(a => 
          a.appointmentId === alert.appointmentId && 
          a.type === 'rendez-vous'
        );
        
        if (existingAlerts.length > 0) {
          console.log('Une alerte existe déjà pour ce rendez-vous, mise à jour au lieu de création');
          await get().updateAlert(existingAlerts[0].id, alert);
          return;
        }
      }

      // Vérifier également les doublons potentiels basés sur company+date pour les rendez-vous
      if (alert.type === 'rendez-vous') {
        const existingAlerts = get().alerts.filter(a => 
          a.type === 'rendez-vous' && 
          a.company === alert.company && 
          a.date === alert.date
        );
        
        if (existingAlerts.length > 0) {
          console.log('Une alerte similaire existe déjà, mise à jour au lieu de création');
          await get().updateAlert(existingAlerts[0].id, {
            ...alert,
            appointmentId: alert.appointmentId || existingAlerts[0].appointmentId
          });
          return;
        }
      }

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

      toast.success('Alerte créée avec succès');
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

      toast.success('Alerte mise à jour avec succès');
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
      toast.success('Alerte supprimée avec succès');
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

      toast.success('Statut de l\'alerte mis à jour avec succès');
    } catch (error) {
      console.error('Error updating alert status:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du statut';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  }
}));