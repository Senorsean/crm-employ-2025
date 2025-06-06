import { create } from 'zustand';
import { firebaseStore } from './firebaseStore';

interface Document {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  path: string;
  size?: number;
  url?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DocumentsState {
  documents: Document[];
  addDocument: (doc: Omit<Document, 'id'>) => Promise<void>;
  updateDocument: (id: string, doc: Partial<Document>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  loadDocuments: () => Promise<void>;
}

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: [],

  addDocument: async (doc) => {
    try {
      let url;
      if (doc.type === 'file' && doc.content instanceof File) {
        url = await firebaseStore.uploadFile(doc.content, `documents/${doc.path}`);
      }

      const newDoc = await firebaseStore.create('documents', {
        ...doc,
        url,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      set(state => ({
        documents: [...state.documents, newDoc]
      }));
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  },

  updateDocument: async (id, updates) => {
    try {
      await firebaseStore.update('documents', id, {
        ...updates,
        updatedAt: new Date()
      });

      set(state => ({
        documents: state.documents.map(doc =>
          doc.id === id ? { ...doc, ...updates } : doc
        )
      }));
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  },

  deleteDocument: async (id) => {
    try {
      const doc = get().documents.find(d => d.id === id);
      if (doc?.url) {
        await firebaseStore.deleteFile(`documents/${doc.path}`);
      }
      await firebaseStore.delete('documents', id);

      set(state => ({
        documents: state.documents.filter(d => d.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  loadDocuments: async () => {
    try {
      const docs = await firebaseStore.getAll('documents');
      set({ documents: docs });
    } catch (error) {
      console.error('Error loading documents:', error);
      throw error;
    }
  }
}));