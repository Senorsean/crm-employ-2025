import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Loader2, 
  AlertCircle, 
  FileText, 
  File, 
  Folder,
  Plus,
  FolderPlus,
  Search,
  LayoutGrid,
  List,
  ChevronLeft,
  Trash2,
  Download,
  X,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { storage, db, auth } from '../../config/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt']
};

// Utiliser un chemin partagé pour tous les utilisateurs
const STORAGE_BASE_PATH = 'shared/documents';

interface Document {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: Date;
  url: string;
  userId: string;
}

interface Folder {
  id: string;
  name: string;
  path: string;
  createdAt: Date;
  userId: string;
}

export default function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [currentPath]);

  const loadDocuments = async () => {
    if (!auth.currentUser) return;

    const path = currentPath.join('/');
    const docsQuery = query(
      collection(db, 'documents'),
      where('path', '==', path)
    );

    const foldersQuery = query(
      collection(db, 'folders'),
      where('path', '==', path)
    );

    try {
      const [docsSnapshot, foldersSnapshot] = await Promise.all([
        getDocs(docsQuery),
        getDocs(foldersQuery)
      ]);

      setDocuments(docsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Document[]);

      setFolders(foldersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Folder[]);
    } catch (err) {
      console.error('Error loading documents:', err);
      toast.error('Erreur lors du chargement des documents');
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!auth.currentUser) return;

    for (const file of acceptedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`Le fichier ${file.name} dépasse la limite de 10 Mo`);
        continue;
      }

      setIsUploading(true);
      setError(null);

      try {
        const path = [...currentPath, file.name].join('/');
        const storageRef = ref(storage, `${STORAGE_BASE_PATH}/${path}`);
        
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            setError('Erreur lors du téléchargement du fichier');
            setIsUploading(false);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            
            await addDoc(collection(db, 'documents'), {
              name: file.name,
              path: currentPath.join('/'),
              size: file.size,
              type: file.type,
              uploadedAt: new Date(),
              url,
              userId: auth.currentUser?.uid
            });

            setIsUploading(false);
            setUploadProgress(0);
            loadDocuments();
            toast.success('Document téléchargé avec succès');
          }
        );
      } catch (err) {
        console.error('Error uploading file:', err);
        setError('Erreur lors du téléchargement du fichier');
        setIsUploading(false);
      }
    }
  }, [currentPath]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_TYPES,
    maxSize: MAX_FILE_SIZE
  });

  const handleCreateFolder = async () => {
    if (!auth.currentUser) return;

    const folderName = prompt('Nom du dossier :');
    if (!folderName) return;

    try {
      await addDoc(collection(db, 'folders'), {
        name: folderName,
        path: currentPath.join('/'),
        createdAt: new Date(),
        userId: auth.currentUser.uid
      });

      loadDocuments();
      toast.success('Dossier créé avec succès');
    } catch (err) {
      console.error('Error creating folder:', err);
      toast.error('Erreur lors de la création du dossier');
    }
  };

  const handleDelete = async (item: Document | Folder) => {
    if (!auth.currentUser) return;

    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      return;
    }

    try {
      if ('url' in item) {
        // Delete document
        const storageRef = ref(storage, `${STORAGE_BASE_PATH}/${item.path}/${item.name}`);
        await deleteObject(storageRef);
        await deleteDoc(doc(db, 'documents', item.id));
      } else {
        // Delete folder
        await deleteDoc(doc(db, 'folders', item.id));
      }

      loadDocuments();
      toast.success('Élément supprimé avec succès');
    } catch (err) {
      console.error('Error deleting item:', err);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleDownload = (document: Document) => {
    window.open(document.url, '_blank');
  };

  const navigateToFolder = (folder: Folder) => {
    setCurrentPath([...currentPath, folder.name]);
  };

  const navigateUp = () => {
    setCurrentPath(prev => prev.slice(0, -1));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const filteredItems = [...folders, ...documents].filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {currentPath.length > 0 && (
            <button
              onClick={navigateUp}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-lg font-semibold">Documents</h2>
            <div className="text-sm text-gray-500">
              {currentPath.length > 0 ? currentPath.join(' / ') : 'Racine'}
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleCreateFolder}
            className="hidden md:flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <FolderPlus className="w-5 h-5 mr-2" />
            Nouveau dossier
          </button>
          <div className="relative hidden md:block">
            <input
              type="file"
              id="fileInput"
              className="hidden"
              multiple
              accept={Object.values(ALLOWED_TYPES).flat().join(',')}
              onChange={(e) => {
                if (e.target.files) {
                  onDrop(Array.from(e.target.files));
                }
              }}
            />
            <label
              htmlFor="fileInput"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              <Upload className="w-5 h-5 mr-2" />
              Télécharger
            </label>
          </div>
          
          {/* Menu pour mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            {showMobileMenu && (
              <div className="absolute right-4 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 py-1">
                <button
                  onClick={() => {
                    handleCreateFolder();
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Nouveau dossier
                </button>
                <label className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Télécharger
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept={Object.values(ALLOWED_TYPES).flat().join(',')}
                    onChange={(e) => {
                      if (e.target.files) {
                        onDrop(Array.from(e.target.files));
                        setShowMobileMenu(false);
                      }
                    }}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher un document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
          />
        </div>
        <div className="flex gap-2 border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            <LayoutGrid className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            <List className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div {...getRootProps()} className="min-h-[200px] relative">
        <input {...getInputProps()} />
        
        {isUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Téléchargement en cours... {Math.round(uploadProgress)}%</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-2 sm:p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer"
                onClick={() => 'url' in item ? handleDownload(item) : navigateToFolder(item as Folder)}
              >
                <div className="flex items-start justify-between mb-1 sm:mb-2">
                  {'url' in item ? (
                    <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  ) : (
                    <Folder className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                    className="p-1 hover:bg-red-50 rounded-lg text-red-600"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
                <p className="font-medium truncate text-xs sm:text-sm">{item.name}</p>
                {'size' in item && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {formatFileSize(item.size)}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {format(new Date('uploadedAt' in item ? item.uploadedAt : item.createdAt), 'dd/MM/yyyy', { locale: fr })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg divide-y">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => 'url' in item ? handleDownload(item) : navigateToFolder(item as Folder)}
              >
                <div className="flex items-center gap-2 sm:gap-4">
                  {'url' in item ? (
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  ) : (
                    <Folder className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  )}
                  <div>
                    <p className="font-medium text-xs sm:text-sm">{item.name}</p>
                    {'size' in item && (
                      <p className="text-xs sm:text-sm text-gray-500">
                        {formatFileSize(item.size)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                    {format(new Date('uploadedAt' in item ? item.uploadedAt : item.createdAt), 'dd/MM/yyyy', { locale: fr })}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                    className="p-1 hover:bg-red-50 rounded-lg text-red-600"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {isDragActive ? (
              <p>Déposez vos fichiers ici...</p>
            ) : (
              <p>Aucun document dans ce dossier</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}