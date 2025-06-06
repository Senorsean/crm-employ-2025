import { create } from 'zustand';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../config/firebase';
import { toast } from 'react-hot-toast';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'analyst' | 'user';
  agency?: string;
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
  loginHistory: Array<{
    date: Date;
    count: number;
  }>;
  photoURL?: string;
}

interface UserStore {
  userData: UserData | null;
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  saveUserData: (data: Partial<UserData>) => Promise<void>;
  loadUserData: () => Promise<void>;
  checkAdminStatus: () => Promise<boolean>;
  updateLastLogin: () => Promise<void>;
  updateUserPhoto: (file: File) => Promise<void>;
}

export const useUserStore = create<UserStore>((set) => ({
  userData: null,
  isLoading: false,
  error: null,
  isAdmin: false,

  saveUserData: async (data: Partial<UserData>) => {
    if (!auth.currentUser) throw new Error('Authentification requise');

    try {
      const userId = auth.currentUser.uid;
      const userRef = doc(db, 'users', userId);
      const existingData = (await getDoc(userRef)).data() as UserData | undefined;

      const updatedData = {
        ...existingData,
        ...data,
        id: userId,
        updatedAt: new Date(),
        lastLogin: existingData?.lastLogin || new Date()
      };

      await setDoc(userRef, updatedData, { merge: true });

      set({ userData: updatedData, error: null });
      toast.success('Données utilisateur mises à jour');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la sauvegarde';
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  loadUserData: async () => {
    if (!auth.currentUser) {
      set({ userData: null, error: null, isAdmin: false });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const userId = auth.currentUser.uid;
      const userRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userRef);
      const idTokenResult = await auth.currentUser.getIdTokenResult();
      const isAdmin = !!idTokenResult.claims.admin;

      if (docSnap.exists()) {
        const userData = docSnap.data() as UserData;
        set({ userData, isAdmin, isLoading: false, error: null });
      } else {
        const initialData: UserData = {
          id: userId,
          name: auth.currentUser.displayName || '',
          email: auth.currentUser.email || '',
          role: isAdmin ? 'admin' : 'user',
          lastLogin: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          loginHistory: []
        };

        await setDoc(userRef, initialData);
        set({ userData: initialData, isAdmin, isLoading: false, error: null });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors du chargement';
      set({ isLoading: false, error: message });
      toast.error(message);
      throw error;
    }
  },

  checkAdminStatus: async () => {
    if (!auth.currentUser) {
      set({ isAdmin: false });
      return false;
    }

    try {
      const idTokenResult = await auth.currentUser.getIdTokenResult();
      const isAdmin = !!idTokenResult.claims.admin;
      set({ isAdmin });
      return isAdmin;
    } catch (error) {
      console.error('Erreur lors de la vérification du statut admin:', error);
      set({ isAdmin: false });
      return false;
    }
  },

  updateLastLogin: async () => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const docSnap = await getDoc(userRef);
      const userData = docSnap.data();
      const loginHistory = userData?.loginHistory || [];

      const todayEntry = loginHistory.find((entry: any) => {
        const entryDate = entry.date.toDate();
        return entryDate.getTime() === startOfDay.getTime();
      });

      if (todayEntry) {
        await updateDoc(userRef, {
          lastLogin: serverTimestamp(),
          loginHistory: loginHistory.map((entry: any) => {
            if (entry.date.toDate().getTime() === startOfDay.getTime()) {
              return { date: entry.date, count: entry.count + 1 };
            }
            return entry;
          })
        });
      } else {
        await updateDoc(userRef, {
          lastLogin: serverTimestamp(),
          loginHistory: arrayUnion({ date: startOfDay, count: 1 })
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la dernière connexion:', error);
    }
  },

  updateUserPhoto: async (file: File) => {
    if (!auth.currentUser) {
      toast.error("Vous devez être connecté pour modifier la photo");
      return;
    }

    const userId = auth.currentUser.uid;

    try {
      const filePath = `profile-photos/${userId}/photo_${Date.now()}.jpg`;
      const fileRef = ref(storage, filePath);

      // Add CORS headers to metadata
      const metadata = {
        contentType: file.type || 'image/jpeg',
        customMetadata: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      };

      await uploadBytes(fileRef, file, metadata);
      const photoURL = await getDownloadURL(fileRef);

      await updateDoc(doc(db, 'users', userId), {
        photoURL,
        updatedAt: new Date()
      });

      set((state) => ({
        userData: state.userData ? { ...state.userData, photoURL } : null
      }));

      toast.success("Photo mise à jour !");
    } catch (error) {
      console.error("Erreur lors de l'upload Firebase Storage :", error);
      toast.error("Échec de l'upload");
    }
  }
}));