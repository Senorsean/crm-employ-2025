import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../config/firebase';
import { toast } from 'react-hot-toast';

export const firebaseStore = {
  // Generic CRUD operations
  create: async (collectionName: string, data: any) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    // 🔧 Fonction pour nettoyer les champs undefined
    const cleanData = (input: any) => {
      const cleaned: any = {};
      Object.entries(input).forEach(([key, value]) => {
        if (value !== undefined) {
          cleaned[key] = value;
        }
      });
      return cleaned;
    };

    try {
      const rawData = {
        ...data,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docData = cleanData(rawData);
      const docRef = await addDoc(collection(db, collectionName), docData);
      return { id: docRef.id, ...docData };
    } catch (error) {
      console.error(`Erreur lors de la création dans ${collectionName}:`, error);
      toast.error(`Erreur lors de la création`);
      throw error;
    }
  },

  update: async (collectionName: string, id: string, data: any) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    // 🔧 Même nettoyage ici
    const cleanData = (input: any) => {
      const cleaned: any = {};
      Object.entries(input).forEach(([key, value]) => {
        if (value !== undefined) {
          cleaned[key] = value;
        }
      });
      return cleaned;
    };

    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Document non trouvé');
      }

      if (docSnap.data().userId !== auth.currentUser.uid) {
        throw new Error('Non autorisé à modifier ce document');
      }

      const updateData = cleanData({
        ...data,
        updatedAt: new Date()
      });

      await updateDoc(docRef, updateData);
      return { id, ...updateData };
    } catch (error) {
      console.error(`Erreur lors de la mise à jour dans ${collectionName}:`, error);
      toast.error(`Erreur lors de la mise à jour`);
      throw error;
    }
  },

  delete: async (collectionName: string, id: string) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Document non trouvé');
      }

      if (docSnap.data().userId !== auth.currentUser.uid) {
        throw new Error('Non autorisé à supprimer ce document');
      }

      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Erreur lors de la suppression dans ${collectionName}:`, error);
      toast.error(`Erreur lors de la suppression`);
      throw error;
    }
  },

  getAll: async (collectionName: string) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const q = query(
        collection(db, collectionName),
        where('userId', '==', auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Erreur lors du chargement de ${collectionName}:`, error);
      toast.error(`Erreur lors du chargement des données`);
      throw error;
    }
  },

  getOne: async (collectionName: string, id: string) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Document non trouvé');
      }

      if (docSnap.data().userId !== auth.currentUser.uid) {
        throw new Error('Non autorisé à accéder à ce document');
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } catch (error) {
      console.error(`Erreur lors du chargement du document ${collectionName}:`, error);
      toast.error(`Erreur lors du chargement du document`);
      throw error;
    }
  },

  // File storage operations
  uploadFile: async (file: File, path: string) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const userPath = `users/${auth.currentUser.uid}/${path}`;
      const storageRef = ref(storage, userPath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      toast.error('Erreur lors du téléchargement');
      throw error;
    }
  },

  deleteFile: async (path: string) => {
    if (!auth.currentUser) {
      throw new Error('Authentification requise');
    }

    try {
      const userPath = `users/${auth.currentUser.uid}/`;
      if (!path.startsWith(userPath)) {
        throw new Error('Non autorisé à supprimer ce fichier');
      }

      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      toast.error('Erreur lors de la suppression');
      throw error;
    }
  }
};
