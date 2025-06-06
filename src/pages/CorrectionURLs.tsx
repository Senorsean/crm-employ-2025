import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { Loader2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DocumentWithUrl {
  id: string;
  name?: string;
  displayName?: string;
  url: string;
  collection: string;
}

export default function CorrectionURLs() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [documentsToFix, setDocumentsToFix] = useState<DocumentWithUrl[]>([]);
  const [usersToFix, setUsersToFix] = useState<DocumentWithUrl[]>([]);
  const [candidatesToFix, setCandidatesToFix] = useState<DocumentWithUrl[]>([]);
  const [offersToFix, setOffersToFix] = useState<DocumentWithUrl[]>([]);
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());
  const [processingCollection, setProcessingCollection] = useState<string | null>(null);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }

      try {
        // Check if user has admin role in Firestore
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userDoc.data();
        
        const isAdmin = userData?.role === 'admin' || auth.currentUser.email === 'slucas@anthea-rh.com';
        setHasPermission(isAdmin);
        
        if (isAdmin) {
          loadDocumentsToFix();
        } else {
          setError('Vous n\'avez pas les permissions nécessaires pour accéder à cette page');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
        setError('Erreur lors de la vérification des permissions');
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, [navigate]);

  const loadDocumentsToFix = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load documents with URL containing appspot.com
      await loadCollectionWithUrl('documents', setDocumentsToFix);
      await loadCollectionWithUrl('users', setUsersToFix);
      await loadCollectionWithUrl('candidates', setCandidatesToFix);
      await loadCollectionWithUrl('offers', setOffersToFix);
    } catch (error) {
      console.error('Error loading documents to fix:', error);
      setError('Erreur lors du chargement des documents à corriger');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCollectionWithUrl = async (
    collectionName: string, 
    setItems: React.Dispatch<React.SetStateAction<DocumentWithUrl[]>>
  ) => {
    try {
      const q = query(collection(db, collectionName));
      const querySnapshot = await getDocs(q);
      
      const itemsToFix: DocumentWithUrl[] = [];
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        
        // Check if the document has a url field containing appspot.com
        if (data.url && typeof data.url === 'string' && data.url.includes('appspot.com')) {
          itemsToFix.push({
            id: doc.id,
            name: data.name || data.firstName || '',
            displayName: data.displayName || '',
            url: data.url,
            collection: collectionName
          });
        }
        
        // For users, also check photoURL
        if (collectionName === 'users' && data.photoURL && 
            typeof data.photoURL === 'string' && 
            data.photoURL.includes('appspot.com')) {
          itemsToFix.push({
            id: doc.id,
            name: data.name || data.firstName || '',
            displayName: data.displayName || '',
            url: data.photoURL,
            collection: 'users_photo'
          });
        }
      });
      
      setItems(itemsToFix);
    } catch (error) {
      console.error(`Error loading ${collectionName}:`, error);
      throw error;
    }
  };

  const fixUrl = (url: string): string => {
    return url.replace('bdd-crm-emploi.appspot.com', 'bdd-crm-emploi.firebasestorage.app');
  };

  const handleFixSingleUrl = async (item: DocumentWithUrl) => {
    setProcessingItems(prev => new Set(prev).add(item.id));
    
    try {
      const collectionName = item.collection === 'users_photo' ? 'users' : item.collection;
      const docRef = doc(db, collectionName, item.id);
      
      if (item.collection === 'users_photo') {
        // Update photoURL field
        await updateDoc(docRef, {
          photoURL: fixUrl(item.url)
        });
      } else {
        // Update url field
        await updateDoc(docRef, {
          url: fixUrl(item.url)
        });
      }
      
      // Update the state to reflect the change
      const updateStateFunction = getStateUpdateFunction(item.collection);
      if (updateStateFunction) {
        updateStateFunction(prev => 
          prev.filter(i => !(i.id === item.id && i.url === item.url))
        );
      }
      
      toast.success('URL corrigée avec succès');
    } catch (error) {
      console.error('Error fixing URL:', error);
      toast.error('Erreur lors de la correction de l\'URL');
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const handleFixAllUrls = async (collection: string) => {
    setProcessingCollection(collection);
    
    try {
      const items = getItemsByCollection(collection);
      let successCount = 0;
      let errorCount = 0;
      
      for (const item of items) {
        try {
          const collectionName = item.collection === 'users_photo' ? 'users' : item.collection;
          const docRef = doc(db, collectionName, item.id);
          
          if (item.collection === 'users_photo') {
            await updateDoc(docRef, {
              photoURL: fixUrl(item.url)
            });
          } else {
            await updateDoc(docRef, {
              url: fixUrl(item.url)
            });
          }
          
          successCount++;
        } catch (error) {
          console.error(`Error fixing URL for ${item.id}:`, error);
          errorCount++;
        }
      }
      
      // Update the state to reflect all changes
      const updateStateFunction = getStateUpdateFunction(collection);
      if (updateStateFunction) {
        updateStateFunction([]);
      }
      
      if (errorCount === 0) {
        toast.success(`${successCount} URL(s) corrigée(s) avec succès`);
      } else {
        toast.success(`${successCount} URL(s) corrigée(s) avec succès, ${errorCount} erreur(s)`);
      }
    } catch (error) {
      console.error(`Error fixing all URLs for ${collection}:`, error);
      toast.error('Erreur lors de la correction des URLs');
    } finally {
      setProcessingCollection(null);
    }
  };

  const getStateUpdateFunction = (collection: string) => {
    switch (collection) {
      case 'documents':
        return setDocumentsToFix;
      case 'users':
      case 'users_photo':
        return setUsersToFix;
      case 'candidates':
        return setCandidatesToFix;
      case 'offers':
        return setOffersToFix;
      default:
        return null;
    }
  };

  const getItemsByCollection = (collection: string): DocumentWithUrl[] => {
    switch (collection) {
      case 'documents':
        return documentsToFix;
      case 'users':
      case 'users_photo':
        return usersToFix;
      case 'candidates':
        return candidatesToFix;
      case 'offers':
        return offersToFix;
      default:
        return [];
    }
  };

  const getDisplayName = (item: DocumentWithUrl): string => {
    if (item.displayName) return item.displayName;
    if (item.name) return item.name;
    return `Document ${item.id}`;
  };

  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="bg-red-50 rounded-xl p-6 text-center max-w-lg">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Accès refusé</h2>
          <p className="text-red-600">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page. 
            Veuillez contacter un administrateur si vous pensez qu'il s'agit d'une erreur.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="mt-4 text-gray-600">Chargement des documents à corriger...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Erreur</h3>
            <p className="mt-1 text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const renderCollectionSection = (
    title: string, 
    collection: string, 
    items: DocumentWithUrl[]
  ) => {
    const isProcessing = processingCollection === collection;
    
    return (
      <div className="bg-white rounded-xl shadow-sm mb-8">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={() => handleFixAllUrls(collection)}
              disabled={isProcessing || items.length === 0}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Correction en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Corriger toutes les URLs ({items.length})
                </>
              )}
            </button>
          </div>

          {items.length === 0 ? (
            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <p>Aucune URL à corriger dans cette collection</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      URL actuelle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={`${item.id}-${item.url}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getDisplayName(item)}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {item.id}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-md overflow-hidden text-ellipsis">
                          {item.url}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleFixSingleUrl(item)}
                          disabled={processingItems.has(item.id) || isProcessing}
                          className="flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                        >
                          {processingItems.has(item.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Corriger l'URL"
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Correction des URLs</h1>
        <button
          onClick={loadDocumentsToFix}
          className="flex items-center px-4 py-2 bg-gradient-anthea text-white rounded-xl hover:opacity-90 transition-opacity"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Actualiser
        </button>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-blue-700">
          Cet outil permet de corriger les URLs Firebase Storage qui pointent vers l'ancien domaine (appspot.com) 
          vers le nouveau domaine (firebasestorage.app).
        </p>
      </div>

      {renderCollectionSection('Documents', 'documents', documentsToFix)}
      {renderCollectionSection('Utilisateurs', 'users', usersToFix)}
      {renderCollectionSection('Candidats', 'candidates', candidatesToFix)}
      {renderCollectionSection('Offres', 'offers', offersToFix)}
    </div>
  );
}