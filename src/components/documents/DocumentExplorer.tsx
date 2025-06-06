import React, { useState, useCallback } from 'react';
import { 
  Folder, 
  File, 
  MoreVertical, 
  Plus, 
  FolderPlus, 
  Upload, 
  Edit2, 
  Trash2,
  LayoutGrid,
  List,
  ArrowLeft,
  FileText,
  Download,
  Search,
  X,
  Eye,
  ExternalLink,
  FileQuestion
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import JSZip from 'jszip';
import { storage, db, auth } from '../../config/firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';

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
  extension?: string;
  content?: Blob;
  selected?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = {
  // Documents
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'text/plain': ['.txt'],
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png']
};

// Service de proxy CORS pour contourner les restrictions
const CORS_PROXY = 'https://corsproxy.io/?';

export default function DocumentExplorer() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedDoc, setDraggedDoc] = useState<Document | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);

  const generateDocumentKey = (doc: Document) => {
    const timestamp = doc.updatedAt?.getTime() || doc.createdAt?.getTime() || Date.now();
    return `${doc.type}-${doc.id}-${doc.path.replace(/\//g, '-')}-${timestamp}`;
  };

  const getCurrentParentId = () => {
    if (currentPath.length === 0) return null;
    return documents.find(d => d.path === currentPath.join('/'))?.id || null;
  };

  const getCurrentDocuments = () => {
    const currentParentId = getCurrentParentId();
    return documents
      .filter(doc => doc.parentId === currentParentId)
      .filter(doc => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        // First sort by type (folders first)
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        // Then sort by name using natural sort
        return a.name.localeCompare(b.name, undefined, { 
          numeric: true,
          sensitivity: 'base'
        });
      });
  };

  const loadDocuments = async () => {
    if (!auth.currentUser) return;

    try {
      const q = query(
        collection(db, 'documents'),
        where('userId', '==', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      })) as Document[];
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Erreur lors du chargement des documents');
    }
  };

  React.useEffect(() => {
    loadDocuments();
  }, []);

  // Cleanup preview object URL when component unmounts or preview changes
  React.useEffect(() => {
    return () => {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }
    };
  }, [previewObjectUrl]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!auth.currentUser) {
      toast.error('Vous devez être connecté pour télécharger des fichiers');
      return;
    }

    setIsUploading(true);

    for (const file of acceptedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`Le fichier ${file.name} dépasse la limite de 10 Mo`);
        continue;
      }

      try {
        const path = [...currentPath, file.name].join('/');
        const storageRef = ref(storage, `users/${auth.currentUser.uid}/${path}`);
        
        // Add CORS metadata
        const metadata = {
          contentType: file.type,
          customMetadata: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        };
        
        const uploadTask = uploadBytesResumable(storageRef, file, metadata);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            toast.error(`Erreur lors du téléchargement de ${file.name}`);
          },
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            
            const docData = {
              name: file.name,
              type: 'file',
              parentId: getCurrentParentId(),
              path: path,
              size: file.size,
              extension: file.name.split('.').pop(),
              createdAt: new Date(),
              updatedAt: new Date(),
              url: url,
              userId: auth.currentUser?.uid
            };

            await addDoc(collection(db, 'documents'), docData);
            loadDocuments();
            toast.success(`${file.name} téléchargé avec succès`);
          }
        );
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error(`Erreur lors du téléchargement de ${file.name}`);
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
  }, [currentPath]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_TYPES,
    maxSize: MAX_FILE_SIZE,
    noClick: true,
    noKeyboard: true
  });

  const handleCreateFolder = async () => {
    if (!auth.currentUser) return;

    const folderName = prompt('Nom du dossier :');
    if (!folderName) return;

    try {
      const path = [...currentPath, folderName].join('/');
      const docData = {
        name: folderName,
        type: 'folder',
        parentId: getCurrentParentId(),
        path: path,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: auth.currentUser.uid
      };

      await addDoc(collection(db, 'documents'), docData);
      loadDocuments();
      toast.success('Dossier créé avec succès');
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Erreur lors de la création du dossier');
    }
  };

  const handleRename = async (doc: Document) => {
    if (!auth.currentUser || !editingName.trim()) return;

    try {
      if (doc.type === 'file' && doc.url) {
        // Rename in Storage
        const oldRef = ref(storage, `users/${auth.currentUser.uid}/${doc.path}`);
        const newPath = [...currentPath, editingName].join('/');
        const newRef = ref(storage, `users/${auth.currentUser.uid}/${newPath}`);
        
        const response = await fetch(doc.url);
        const blob = await response.blob();
        await uploadBytesResumable(newRef, blob);
        await deleteObject(oldRef);
        
        const url = await getDownloadURL(newRef);

        // Update in Firestore
        await addDoc(collection(db, 'documents'), {
          ...doc,
          name: editingName,
          path: newPath,
          url: url,
          updatedAt: new Date()
        });
      } else {
        // Update folder in Firestore
        await addDoc(collection(db, 'documents'), {
          ...doc,
          name: editingName,
          path: [...currentPath, editingName].join('/'),
          updatedAt: new Date()
        });
      }

      loadDocuments();
      setEditingId(null);
      setEditingName('');
      toast.success('Renommé avec succès');
    } catch (error) {
      console.error('Error renaming:', error);
      toast.error('Erreur lors du renommage');
    }
  };

  const handleDelete = async (docId: string) => {
    if (!auth.currentUser || !window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;

    try {
      const docToDelete = documents.find(d => d.id === docId);
      if (!docToDelete) return;

      if (docToDelete.type === 'file' && docToDelete.url) {
        try {
          const storageRef = ref(storage, `users/${auth.currentUser.uid}/${docToDelete.path}`);
          await deleteObject(storageRef);
        } catch (storageError) {
          console.log('Storage object may already be deleted or not exist:', storageError);
          // Continue with Firestore deletion even if Storage deletion fails
        }
      }

      const docRef = doc(db, 'documents', docId);
      await deleteDoc(docRef);

      loadDocuments();
      toast.success('Supprimé avec succès');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const forceDownload = (url: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownload = async (doc: Document) => {
    if (!doc.url) return;

    try {
      forceDownload(doc.url, doc.name);
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleExport = async () => {
    if (selectedDocs.size === 0) {
      toast.error('Sélectionnez au moins un fichier à exporter');
      return;
    }

    try {
      const zip = new JSZip();
      const selectedDocuments = documents.filter(doc => selectedDocs.has(doc.id));
      
      for (const doc of selectedDocuments) {
        if (doc.url) {
          const response = await fetch(doc.url);
          const blob = await response.blob();
          zip.file(doc.name, blob);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documents.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  const handleDragStart = (doc: Document) => {
    setDraggedDoc(doc);
  };

  const handleDragOver = (e: React.DragEvent, targetDoc?: Document) => {
    e.preventDefault();
    if (targetDoc?.type === 'folder') {
      e.currentTarget.classList.add('bg-blue-50');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-blue-50');
  };

  const handleDrop = async (e: React.DragEvent, targetDoc?: Document) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50');

    if (!auth.currentUser || !draggedDoc || !targetDoc || targetDoc.type !== 'folder') return;

    try {
      if (draggedDoc.type === 'file' && draggedDoc.url) {
        // Move file in Storage
        const oldRef = ref(storage, `users/${auth.currentUser.uid}/${draggedDoc.path}`);
        const newPath = `${targetDoc.path}/${draggedDoc.name}`;
        const newRef = ref(storage, `users/${auth.currentUser.uid}/${newPath}`);
        
        const response = await fetch(draggedDoc.url);
        const blob = await response.blob();
        await uploadBytesResumable(newRef, blob);
        await deleteObject(oldRef);
        
        const url = await getDownloadURL(newRef);

        // Update in Firestore
        await addDoc(collection(db, 'documents'), {
          ...draggedDoc,
          parentId: targetDoc.id,
          path: newPath,
          url: url,
          updatedAt: new Date()
        });
      } else {
        // Move folder in Firestore
        await addDoc(collection(db, 'documents'), {
          ...draggedDoc,
          parentId: targetDoc.id,
          path: `${targetDoc.path}/${draggedDoc.name}`,
          updatedAt: new Date()
        });
      }

      loadDocuments();
      setDraggedDoc(null);
      toast.success('Déplacé avec succès');
    } catch (error) {
      console.error('Error moving document:', error);
      toast.error('Erreur lors du déplacement');
    }
  };

  const navigateToFolder = (folder: Document) => {
    setCurrentPath([...currentPath, folder.name]);
    setShowMenu(null);
  };

  const navigateUp = () => {
    setCurrentPath(path => path.slice(0, -1));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handlePreviewDocument = (doc: Document) => {
    if (doc.type === 'file') {
      if (isPreviewable(doc)) {
        loadPreview(doc);
      } else {
        // Si le document n'est pas prévisualisable, on le télécharge directement
        handleDownload(doc);
      }
    } else {
      navigateToFolder(doc);
    }
  };

  const loadPreview = async (doc: Document) => {
    if (!doc.url) return;
    
    setPreviewDocument(doc);
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewBlob(null);
    setPreviewObjectUrl(null);
    
    try {
      // Utiliser un proxy CORS pour contourner les restrictions
      const proxyUrl = `${CORS_PROXY}${encodeURIComponent(doc.url)}`;
      
      // Télécharger le fichier en tant que blob via le proxy
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      setPreviewBlob(blob);
      setPreviewObjectUrl(objectUrl);
    } catch (error) {
      console.error('Error loading preview:', error);
      setPreviewError('Impossible de charger l\'aperçu. Erreur CORS ou fichier inaccessible.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }
    setPreviewDocument(null);
    setPreviewBlob(null);
    setPreviewObjectUrl(null);
    setPreviewError(null);
  };

  const isPreviewable = (doc: Document) => {
    if (doc.type !== 'file') return false;
    
    const extension = doc.extension?.toLowerCase();
    return extension === 'pdf' || 
           extension === 'jpg' || 
           extension === 'jpeg' || 
           extension === 'png';
  };

  const renderPreview = () => {
    if (!previewDocument) return null;
    
    const extension = previewDocument.extension?.toLowerCase();
    
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium text-lg">{previewDocument.name}</h3>
            <div className="flex items-center gap-2">
              <a 
                href={previewDocument.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                title="Ouvrir dans un nouvel onglet"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
              <button 
                onClick={() => handleDownload(previewDocument)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                title="Télécharger"
              >
                <Download className="w-5 h-5" />
              </button>
              <button 
                onClick={closePreview}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 bg-gray-100">
            {previewLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-anthea-blue"></div>
              </div>
            ) : previewError ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <FileQuestion className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-red-500 mb-2">{previewError}</p>
                <p className="text-gray-600">Vous pouvez télécharger le document pour le consulter.</p>
                <button 
                  onClick={() => handleDownload(previewDocument)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Télécharger le document
                </button>
              </div>
            ) : previewObjectUrl ? (
              extension === 'pdf' ? (
                <iframe 
                  src={previewObjectUrl}
                  className="w-full h-full border-0 rounded"
                  title={previewDocument.name}
                />
              ) : ['jpg', 'jpeg', 'png'].includes(extension || '') ? (
                <div className="flex items-center justify-center h-full">
                  <img 
                    src={previewObjectUrl} 
                    alt={previewDocument.name} 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Aperçu non disponible pour ce type de fichier</p>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Impossible de charger l'aperçu</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div {...getRootProps()} className="h-full">
      <input {...getInputProps()} />
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6">
          {/* Header and navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {currentPath.length > 0 && (
                <button
                  onClick={navigateUp}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h2 className="text-lg font-semibold">Documents</h2>
                <div className="text-sm text-gray-500">
                  {currentPath.length > 0 ? currentPath.join(' / ') : 'Racine'}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="hidden md:flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                disabled={selectedDocs.size === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter ({selectedDocs.size})
              </button>
              <button
                onClick={handleCreateFolder}
                className="hidden md:flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Nouveau dossier
              </button>
              <label className="hidden md:flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                Importer
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      onDrop(Array.from(e.target.files));
                    }
                  }}
                />
              </label>
              
              {/* Menu pour mobile */}
              <div className="md:hidden">
                <button
                  onClick={() => setShowMenu(showMenu ? null : 'actions')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                
                {showMenu === 'actions' && (
                  <div className="absolute right-4 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 py-1">
                    <button
                      onClick={() => {
                        handleExport();
                        setShowMenu(null);
                      }}
                      disabled={selectedDocs.size === 0}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exporter ({selectedDocs.size})
                    </button>
                    <button
                      onClick={() => {
                        handleCreateFolder();
                        setShowMenu(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <FolderPlus className="w-4 h-4 mr-2" />
                      Nouveau dossier
                    </button>
                    <label className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Importer
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            onDrop(Array.from(e.target.files));
                            setShowMenu(null);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search and view mode */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-anthea-blue"
              />
            </div>
            <div className="flex gap-2 border border-gray-200 rounded-2xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <LayoutGrid className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              >
                <List className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Téléchargement en cours... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          {/* Document list */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {getCurrentDocuments().map((doc) => (
                <div
                  key={generateDocumentKey(doc)}
                  draggable
                  onDragStart={() => handleDragStart(doc)}
                  onDragOver={(e) => handleDragOver(e, doc)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, doc)}
                  className={`
                    relative p-2 sm:p-4 border rounded-lg cursor-pointer transition-all
                    ${doc.type === 'folder' ? 'hover:bg-blue-50' : 'hover:bg-gray-50'}
                  `}
                  onClick={() => handlePreviewDocument(doc)}
                >
                  <input
                    type="checkbox"
                    checked={selectedDocs.has(doc.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedDocs);
                      if (e.target.checked) {
                        newSelected.add(doc.id);
                      } else {
                        newSelected.delete(doc.id);
                      }
                      setSelectedDocs(newSelected);
                      e.stopPropagation();
                    }}
                    className="absolute top-1 left-1 sm:top-2 sm:left-2 z-10 h-3 w-3 sm:h-4 sm:w-4"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex items-center justify-between mb-1 sm:mb-2 mt-3 sm:mt-0">
                    {doc.type === 'folder' ? (
                      <Folder className="w-6 h-6 sm:w-10 sm:h-10 text-blue-600" />
                    ) : (
                      getFileIcon(doc.extension)
                    )}
                    <div className="flex items-center gap-1 sm:gap-2">
                      {doc.type === 'file' && (
                        <>
                          {isPreviewable(doc) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                loadPreview(doc);
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Aperçu"
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(doc);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Télécharger"
                          >
                            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(doc.id);
                          setEditingName(doc.name);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Renommer"
                      >
                        <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                  {editingId === doc.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleRename(doc)}
                      onKeyPress={(e) => e.key === 'Enter' && handleRename(doc)}
                      className="w-full border rounded px-2 py-1 text-xs sm:text-sm"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="truncate font-medium text-xs sm:text-sm">{doc.name}</div>
                  )}
                  {doc.size && (
                    <div className="text-xs sm:text-sm text-gray-500 mt-1">
                      {formatFileSize(doc.size)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {getCurrentDocuments().map((doc) => (
                <div
                  key={generateDocumentKey(doc)}
                  draggable
                  onDragStart={() => handleDragStart(doc)}
                  onDragOver={(e) => handleDragOver(e, doc)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, doc)}
                  className={`
                    relative flex items-center justify-between p-2 sm:p-4 border rounded-lg cursor-pointer transition-all
                    ${doc.type === 'folder' ? 'hover:bg-blue-50' : 'hover:bg-gray-50'}
                  `}
                  onClick={() => handlePreviewDocument(doc)}
                >
                  <input
                    type="checkbox"
                    checked={selectedDocs.has(doc.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedDocs);
                      if (e.target.checked) {
                        newSelected.add(doc.id);
                      } else {
                        newSelected.delete(doc.id);
                      }
                      setSelectedDocs(newSelected);
                      e.stopPropagation();
                    }}
                    className="absolute top-1 left-1 sm:top-2 sm:left-2 z-10 h-3 w-3 sm:h-4 sm:w-4"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex items-center gap-2 sm:gap-3 ml-5 sm:ml-8">
                    {doc.type === 'folder' ? (
                      <Folder className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    ) : (
                      getFileIcon(doc.extension)
                    )}
                    {editingId === doc.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleRename(doc)}
                        onKeyPress={(e) => e.key === 'Enter' && handleRename(doc)}
                        className="border rounded px-2 py-1 text-xs sm:text-sm"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div>
                        <span className="font-medium text-xs sm:text-sm">{doc.name}</span>
                        <div className="text-xs sm:text-sm text-gray-500">
                          {doc.size ? formatFileSize(doc.size) : ''}
                          {doc.createdAt && (
                            <span className="ml-2 hidden sm:inline">
                              Modifié le {format(doc.createdAt, 'dd/MM/yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {doc.type === 'file' && (
                      <>
                        {isPreviewable(doc) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              loadPreview(doc);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Aperçu"
                          >
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(doc);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Télécharger"
                        >
                          <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(doc.id);
                        setEditingName(doc.name);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Renommer"
                    >
                      <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                      className="p-1 hover:bg-gray-100 rounded text-red-600"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {getCurrentDocuments().length === 0 && (
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

      {/* Document Preview Modal */}
      {previewDocument && renderPreview()}
    </div>
  );
}

function getFileIcon(extension?: string) {
  switch (extension?.toLowerCase()) {
    case 'pdf':
      return <FileText className="w-6 h-6 sm:w-10 sm:h-10 text-red-600" />;
    case 'doc':
    case 'docx':
      return <FileText className="w-6 h-6 sm:w-10 sm:h-10 text-blue-600" />;
    case 'xls':
    case 'xlsx':
      return <FileText className="w-6 h-6 sm:w-10 sm:h-10 text-green-600" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
      return <FileText className="w-6 h-6 sm:w-10 sm:h-10 text-purple-600" />;
    default:
      return <File className="w-6 h-6 sm:w-10 sm:h-10 text-gray-600" />;
  }
}