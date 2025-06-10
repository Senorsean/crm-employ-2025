import { create } from 'zustand';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { toast } from 'react-hot-toast';
import { useAlertsStore } from './alertsStore';

export interface Appointment {
  id: string;
  title: string;
  date: string; // ISO string format
  time: string;
  agency: string;
  contact: string;
  priority: 'high' | 'medium' | 'normal';
  status: 'pending' | 'completed' | 'late';
  alert?: {
    enabled: boolean;
    time: string;
    type: 'email' | 'notification' | 'both';
  };
  alertDate?: string; // ISO string format
  userId: string;
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
}

interface AppointmentsState {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  loadAppointments: () => Promise<void>;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<void>;
}

export const useAppointmentsStore = create<AppointmentsState>((set, get) => ({
  appointments: [],
  isLoading: false,
  error: null,

  addAppointment: async (appointment) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const now = new Date().toISOString();
      const newAppointment = {
        ...appointment,
        userId: auth.currentUser.uid,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, 'appointments'), newAppointment);
      
      set(state => ({
        appointments: [...state.appointments, { id: docRef.id, ...newAppointment }],
        error: null
      }));

      // Créer une alerte de relance correspondante
      if (appointment.alert?.enabled) {
        const { addAlert } = useAlertsStore.getState();
        await addAlert({
          type: 'rendez-vous',
          company: appointment.title,
          date: appointment.date,
          agency: appointment.agency,
          status: 'pending',
          step: 1,
          description: `Rendez-vous avec ${appointment.contact} (${appointment.agency})`,
          action: `Prévu le ${new Date(appointment.date).toLocaleDateString('fr-FR')} à ${appointment.time}`
        });
      }

      toast.success('Rendez-vous créé avec succès');
    } catch (error) {
      console.error('Error adding appointment:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la création du rendez-vous';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  updateAppointment: async (id, updates) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const docRef = doc(db, 'appointments', id);
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(docRef, updatesWithTimestamp);

      // Récupérer l'ancien rendez-vous pour comparer
      const oldAppointment = get().appointments.find(a => a.id === id);
      
      set(state => ({
        appointments: state.appointments.map(a => 
          a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
        ),
        error: null
      }));

      // Mettre à jour l'alerte correspondante si nécessaire
      if (updates.status && oldAppointment) {
        const { updateAlertStatus } = useAlertsStore.getState();
        const { alerts } = useAlertsStore.getState();
        
        // Trouver l'alerte correspondante
        const matchingAlert = alerts.find(alert => 
          alert.type === 'rendez-vous' && 
          alert.company === oldAppointment.title &&
          new Date(alert.date).toDateString() === new Date(oldAppointment.date).toDateString()
        );
        
        if (matchingAlert) {
          await updateAlertStatus(matchingAlert.id, updates.status);
        }
      }

      toast.success('Rendez-vous mis à jour avec succès');
    } catch (error) {
      console.error('Error updating appointment:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du rendez-vous';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  deleteAppointment: async (id) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      // Récupérer le rendez-vous avant de le supprimer
      const appointmentToDelete = get().appointments.find(a => a.id === id);
      
      await deleteDoc(doc(db, 'appointments', id));
      set(state => ({
        appointments: state.appointments.filter(a => a.id !== id),
        error: null
      }));
      
      // Supprimer l'alerte correspondante si elle existe
      if (appointmentToDelete) {
        const { alerts, deleteAlert } = useAlertsStore.getState();
        
        // Trouver l'alerte correspondante
        const matchingAlert = alerts.find(alert => 
          alert.type === 'rendez-vous' && 
          alert.company === appointmentToDelete.title &&
          new Date(alert.date).toDateString() === new Date(appointmentToDelete.date).toDateString()
        );
        
        if (matchingAlert) {
          await deleteAlert(matchingAlert.id);
        }
      }
      
      toast.success('Rendez-vous supprimé avec succès');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression du rendez-vous';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  loadAppointments: async () => {
    if (!auth.currentUser) {
      set({ appointments: [], error: null });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const q = query(
        collection(db, 'appointments'),
        where('userId', '==', auth.currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const appointments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];
      
      set({ appointments, isLoading: false, error: null });
    } catch (error) {
      console.error('Error loading appointments:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement des rendez-vous';
      set({ isLoading: false, error: message });
      toast.error(message);
      throw error;
    }
  },

  updateAppointmentStatus: async (id, status) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const docRef = doc(db, 'appointments', id);
      await updateDoc(docRef, { 
        status,
        updatedAt: new Date().toISOString()
      });

      // Récupérer le rendez-vous pour mettre à jour l'alerte correspondante
      const updatedAppointment = get().appointments.find(a => a.id === id);

      set(state => ({
        appointments: state.appointments.map(a => 
          a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a
        ),
        error: null
      }));

      // Mettre à jour l'alerte correspondante
      if (updatedAppointment) {
        const { updateAlertStatus } = useAlertsStore.getState();
        const { alerts } = useAlertsStore.getState();
        
        // Trouver l'alerte correspondante
        const matchingAlert = alerts.find(alert => 
          alert.type === 'rendez-vous' && 
          alert.company === updatedAppointment.title &&
          new Date(alert.date).toDateString() === new Date(updatedAppointment.date).toDateString()
        );
        
        if (matchingAlert) {
          await updateAlertStatus(matchingAlert.id, status);
        }
      }

      toast.success('Statut du rendez-vous mis à jour avec succès');
    } catch (error) {
      console.error('Error updating appointment status:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du statut';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  }
}));