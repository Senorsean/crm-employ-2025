import React, { useEffect, useState } from 'react';
import { auth, storage, db } from '../config/firebase';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  orderBy
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type?: string;
  category?: string;
}

const DocumentUploader: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [category, setCategory] = useState("CV");

  const fetchFiles = async () => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'documents'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UploadedFile[];

    setFiles(data);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!auth.currentUser || selectedFiles.length === 0) return;

    setUploading(true);
    const userId = auth.currentUser.uid;

    for (const file of selectedFiles) {
      try {
        const filePath = `users/${userId}/documents/${file.name}`;
        const fileRef = ref(storage, filePath);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);

        await addDoc(collection(db, 'documents'), {
          name: file.name,
          url,
          userId,
          type: file.type,
          category,
          createdAt: new Date()
        });

      } catch (error) {
        console.error("Erreur fichier :", file.name, error);
        toast.error(`Erreur pour ${file.name}`);
      }
    }

    toast.success("Fichier(s) ajouté(s) !");
    fetchFiles();
    setUploading(false);
  };

  const handleDelete = async (file: UploadedFile) => {
    if (!auth.currentUser) return;

    try {
      const storageRef = ref(storage, `users/${auth.currentUser.uid}/documents/${file.name}`);
      await deleteObject(storageRef);

      const docRef = doc(db, 'documents', file.id);
      await deleteDoc(docRef);

      toast.success("Document supprimé !");
      fetchFiles();
    } catch (err) {
      console.error(err);
      toast.error("Erreur de suppression");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <select
          onChange={(e) => setCategory(e.target.value)}
          value={category}
          className="border border-gray-300 px-2 py-1 rounded text-sm"
        >
          <option value="CV">CV</option>
          <option value="Lettre">Lettre</option>
          <option value="Autre">Autre</option>
        </select>

        <input
          type="file"
          accept=".pdf,.doc,.docx"
          multiple
          onChange={handleUpload}
          disabled={uploading}
        />
      </div>

      {uploading && <p className="text-blue-600 text-sm">Chargement en cours...</p>}

      <ul className="text-sm space-y-1">
        {files.map((file) => (
          <li key={file.id} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span>{file.type?.includes('pdf') ? '📄' : '📝'}</span>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {file.name} <span className="text-gray-400 text-xs ml-1">({file.category})</span>
              </a>
            </div>
            <button
              onClick={() => handleDelete(file)}
              className="text-red-500 hover:underline text-xs"
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>

      {files.length === 0 && !uploading && (
        <p className="text-gray-500 text-sm">Aucun document ajouté pour le moment.</p>
      )}
    </div>
  );
};

export default DocumentUploader;
