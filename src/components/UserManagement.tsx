import React, { useState, useEffect } from 'react';
import { UserPlus, Users, Shield, X, AlertCircle, Eye, EyeOff, Edit2, Trash2, Users as UsersIcon, Upload, Download, KeyRound, Phone } from 'lucide-react';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, serverTimestamp, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { useUserStore } from '../stores/userStore';
import { toast } from 'react-hot-toast';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, updatePassword, signInWithEmailAndPassword } from 'firebase/auth';
import UserPhotoUploader from './UserPhotoUploader';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import UserExcelImport from './UserExcelImport';
import * as XLSX from 'xlsx';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth, PhoneAuthProvider, RecaptchaVerifier, PhoneMultiFactorGenerator, multiFactor } from 'firebase/auth';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'manager' | 'analyst' | 'user';
  lastLogin?: Date;
  photoURL?: string;
  deleted?: boolean;
  deletedAt?: Date;
  initialPassword?: string;
  loginHistory?: {
    date: Date;
    count: number;
  }[];
  firebaseUid?: string;
  mfaEnabled?: boolean;
  mfaPhone?: string;
}

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'analyst' | 'user';
  photoURL?: string;
  newPassword?: string;
}

function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin, userData } = useUserStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'user',
    newPassword: ''
  });
  const [hasPermission, setHasPermission] = useState(false);
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [mfaPhone, setMfaPhone] = useState('');
  const [mfaVerificationId, setMfaVerificationId] = useState<string | null>(null);
  const [mfaVerificationCode, setMfaVerificationCode] = useState('');
  const [mfaVerificationSent, setMfaVerificationSent] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!auth.currentUser) {
        setHasPermission(false);
        return;
      }

      // Check if user is admin or has special email
      const hasAccess = isAdmin || 
                        userData?.role === 'admin' || 
                        userData?.email === 'slucas@anthea-rh.com' ||
                        auth.currentUser.email === 'slucas@anthea-rh.com';
      
      setHasPermission(hasAccess);
      
      if (hasAccess) {
        loadUsers();
      } else {
        setError('Vous n\'avez pas les permissions nécessaires pour accéder à cette page');
      }
    };

    checkPermissions();
  }, [isAdmin, userData]);

  // Initialize RecaptchaVerifier
  useEffect(() => {
    let verifier: RecaptchaVerifier | null = null;

    if (typeof window !== 'undefined' && showMfaSetup && !recaptchaVerifier) {
      try {
        const auth = getAuth();
        verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
        setRecaptchaVerifier(verifier);
      } catch (error) {
        console.error("Error initializing RecaptchaVerifier:", error);
        setMfaError("Erreur d'initialisation du reCAPTCHA. Veuillez rafraîchir la page.");
      }
    }

    return () => {
      if (verifier) {
        verifier.clear();
      }
    };
  }, [showMfaSetup]);

  const loadUsers = async () => {
    if (!auth.currentUser) {
      setError('Vous devez être connecté pour accéder à cette page');
      return;
    }

    setIsLoading(true);
    try {
      // Récupérer tous les utilisateurs
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      
      const userMap = new Map<string, User>();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Filtrer les utilisateurs supprimés si nécessaire
        if (!showDeleted && data.deleted === true) {
          return;
        }

        const email = data.email;
        
        if (!userMap.has(email)) {
          if (email === 'slucas@anthea-rh.com') {
            userMap.set(email, {
              id: doc.id,
              ...data,
              role: 'admin',
              lastLogin: data.lastLogin?.toDate(),
              createdAt: data.createdAt?.toDate(),
              deletedAt: data.deletedAt?.toDate(),
              initialPassword: data.initialPassword,
              firebaseUid: data.uid,
              mfaEnabled: data.mfaEnabled || false,
              mfaPhone: data.mfaPhone || '',
              loginHistory: data.loginHistory?.map((login: any) => ({
                date: login.date.toDate(),
                count: login.count
              })) || []
            });
          } else {
            userMap.set(email, {
              id: doc.id,
              ...data,
              lastLogin: data.lastLogin?.toDate(),
              createdAt: data.createdAt?.toDate(),
              deletedAt: data.deletedAt?.toDate(),
              initialPassword: data.initialPassword,
              firebaseUid: data.uid,
              mfaEnabled: data.mfaEnabled || false,
              mfaPhone: data.mfaPhone || '',
              loginHistory: data.loginHistory?.map((login: any) => ({
                date: login.date.toDate(),
                count: login.count
              })) || []
            });
          }
        }
      });

      const uniqueUsers = Array.from(userMap.values());
      setUsers(uniqueUsers as User[]);
      setError(null);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) {
      toast.error('Veuillez sélectionner au moins un utilisateur');
      return;
    }

    // Vérifier si l'administrateur principal est sélectionné
    const selectedUsersList = users.filter(user => selectedUsers.has(user.id));
    if (selectedUsersList.some(user => user.email === 'slucas@anthea-rh.com')) {
      toast.error('Impossible de supprimer le compte administrateur principal');
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${selectedUsers.size} utilisateur${selectedUsers.size > 1 ? 's' : ''} ?`)) {
      return;
    }

    setIsLoading(true);
    try {
      // Créer un tableau de promesses pour chaque suppression
      const deletePromises = Array.from(selectedUsers).map(async (userId) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        // Supprimer l'utilisateur de Firestore
        const userRef = doc(db, 'users', userId);
        await deleteDoc(userRef);

        // Si l'utilisateur a un UID Firebase, essayer de le supprimer de Firebase Auth
        if (user.firebaseUid) {
          try {
            // Appeler une fonction Cloud pour supprimer l'utilisateur Firebase
            // (Nécessite une fonction Cloud Firebase configurée)
            const functions = getFunctions();
            const deleteUser = httpsCallable(functions, 'deleteUser');
            await deleteUser({ uid: user.firebaseUid });
          } catch (authError) {
            console.error('Error deleting Firebase Auth user:', authError);
          }
        }
      });

      // Attendre que toutes les suppressions soient terminées
      await Promise.all(deletePromises);
      
      // Recharger la liste des utilisateurs
      await loadUsers();
      
      // Vider la sélection
      setSelectedUsers(new Set());
      
      const count = selectedUsers.size;
      toast.success(`${count} utilisateur${count > 1 ? 's' : ''} supprimé${count > 1 ? 's' : ''} définitivement`);
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      toast.error('Erreur lors de la suppression des utilisateurs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!auth.currentUser) {
      toast.error('Vous devez être connecté pour exporter les données');
      return;
    }

    try {
      const selectedUsersList = selectedUsers.size > 0 
        ? users.filter(user => selectedUsers.has(user.id))
        : users;

      const data = selectedUsersList.map(user => ({
        'ID Utilisateur': auth.currentUser?.uid || '',
        'ID Firebase': user.firebaseUid || '',
        'Prénom': user.firstName,
        'Nom': user.lastName,
        'Email': user.email,
        'Mot de passe initial': user.initialPassword || 'Non disponible',
        'Rôle': user.role === 'admin' ? 'Administrateur' : 
                user.role === 'manager' ? 'Manager' :
                user.role === 'analyst' ? 'Analyste' :
                'Utilisateur',
        'Dernière connexion': user.lastLogin ? format(user.lastLogin, 'dd/MM/yyyy HH:mm', { locale: fr }) : '-',
        'Connexions ce mois': getMonthlyConnections(user),
        'Statut': user.deleted ? 'Supprimé' : 'Actif',
        'Date de suppression': user.deletedAt ? format(user.deletedAt, 'dd/MM/yyyy HH:mm', { locale: fr }) : '-',
        'MFA activé': user.mfaEnabled ? 'Oui' : 'Non',
        'Téléphone MFA': user.mfaPhone || '-'
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Ajuster la largeur des colonnes
      const colWidths = Object.keys(data[0]).map(key => ({
        wch: Math.max(20, key.length)
      }));
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Utilisateurs');
      XLSX.writeFile(wb, `export_utilisateurs_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

      toast.success(`${data.length} utilisateur${data.length > 1 ? 's' : ''} exporté${data.length > 1 ? 's' : ''} avec succès`);
    } catch (error) {
      console.error('Error exporting users:', error);
      toast.error('Erreur lors de l\'export des utilisateurs');
    }
  };

  const getMonthlyConnections = (user: User): number => {
    if (!user.loginHistory) return 0;
    
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    
    return user.loginHistory
      .filter(login => {
        const loginDate = new Date(login.date);
        return loginDate >= start && loginDate <= end;
      })
      .reduce((total, login) => total + login.count, 0);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      role: user.role,
      photoURL: user.photoURL,
      newPassword: ''
    });
    setShowAddUser(true);
  };

  const handleDelete = async (user: User) => {
    if (user.email === 'slucas@anthea-rh.com') {
      toast.error('Impossible de supprimer le compte administrateur principal');
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur ${user.firstName} ${user.lastName} ?`)) {
      return;
    }

    setIsLoading(true);
    try {
      // Supprimer l'utilisateur de Firestore
      const userRef = doc(db, 'users', user.id);
      await deleteDoc(userRef);

      // Si l'utilisateur a un UID Firebase, essayer de le supprimer de Firebase Auth
      if (user.firebaseUid) {
        try {
          // Appeler une fonction Cloud pour supprimer l'utilisateur Firebase
          // (Nécessite une fonction Cloud Firebase configurée)
          const functions = getFunctions();
          const deleteUser = httpsCallable(functions, 'deleteUser');
          await deleteUser({ uid: user.firebaseUid });
        } catch (authError) {
          console.error('Error deleting Firebase Auth user:', authError);
        }
      }

      await loadUsers();
      toast.success('Utilisateur supprimé définitivement');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erreur lors de la suppression de l\'utilisateur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async (user: User) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir restaurer l'utilisateur ${user.firstName} ${user.lastName} ?`)) {
      return;
    }

    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        deleted: false,
        deletedAt: null
      });
      await loadUsers();
      toast.success('Utilisateur restauré avec succès');
    } catch (error) {
      console.error('Error restoring user:', error);
      toast.error('Erreur lors de la restauration de l\'utilisateur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsLoading(true);
    setError(null);

    try {
      if (editingUser) {
        const userRef = doc(db, 'users', editingUser.id);
        
        // Préparer les données à mettre à jour
        const updateData: any = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          photoURL: formData.photoURL,
          updatedAt: serverTimestamp()
        };

        // Si un nouveau mot de passe a été défini par l'admin
        if (formData.newPassword) {
          updateData.initialPassword = formData.newPassword;
          updateData.passwordSetByAdmin = true;
          updateData.passwordSetAt = serverTimestamp();
        }

        await updateDoc(userRef, updateData);

        toast.success('Utilisateur mis à jour avec succès');
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        await addDoc(collection(db, 'users'), {
          uid: userCredential.user.uid,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          photoURL: formData.photoURL,
          initialPassword: formData.password,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          loginHistory: [],
          deleted: false,
          mfaEnabled: false
        });

        toast.success('Utilisateur ajouté avec succès');
      }

      setShowAddUser(false);
      setEditingUser(null);
      await loadUsers(); // Recharger immédiatement la liste des utilisateurs
    } catch (error) {
      console.error('Error managing user:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la gestion de l\'utilisateur';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpdate = (url: string | null) => {
    setFormData(prev => ({
      ...prev,
      photoURL: url || undefined
    }));
  };

  const handleImport = async (users: any[]) => {
    try {
      setIsLoading(true);
      for (const userData of users) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          userData.email,
          userData.password
        );

        await addDoc(collection(db, 'users'), {
          uid: userCredential.user.uid,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          role: userData.role,
          initialPassword: userData.password,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          loginHistory: [],
          deleted: false,
          mfaEnabled: false
        });
      }

      setShowImport(false);
      await loadUsers(); // Recharger immédiatement la liste des utilisateurs
      toast.success(`${users.length} utilisateur${users.length > 1 ? 's' : ''} importé${users.length > 1 ? 's' : ''} avec succès`);
    } catch (error) {
      console.error('Error importing users:', error);
      toast.error('Erreur lors de l\'import des utilisateurs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Email de réinitialisation envoyé avec succès');
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast.error('Erreur lors de l\'envoi de l\'email de réinitialisation');
    }
  };

  // Fonction pour définir un nouveau mot de passe pour l'utilisateur
  const handleSetNewPassword = async () => {
    if (!editingUser || !formData.newPassword) {
      toast.error('Veuillez entrer un nouveau mot de passe');
      return;
    }

    try {
      setIsLoading(true);
      
      // 1. Mettre à jour le mot de passe dans Firestore
      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, {
        initialPassword: formData.newPassword,
        passwordSetByAdmin: true,
        passwordSetAt: serverTimestamp()
      });
      
      // 2. Mettre à jour le mot de passe dans Firebase Auth
      if (editingUser.firebaseUid) {
        try {
          // Utiliser la fonction Cloud pour mettre à jour le mot de passe
          const functions = getFunctions();
          const updateUserPassword = httpsCallable(functions, 'updateUserPassword');
          const result = await updateUserPassword({ 
            uid: editingUser.firebaseUid, 
            newPassword: formData.newPassword 
          });
          
          console.log('Password update result:', result);
          toast.success('Mot de passe mis à jour dans Firebase Auth');
        } catch (authError) {
          console.error('Error updating Firebase Auth password:', authError);
          toast.error('Erreur lors de la mise à jour du mot de passe dans Firebase Auth');
          throw authError;
        }
      } else {
        toast.warning('UID Firebase non trouvé, mot de passe mis à jour uniquement dans Firestore');
      }

      toast.success('Mot de passe défini avec succès');
      
      // Fermer le modal après avoir défini le mot de passe
      setShowAddUser(false);
      setEditingUser(null);
      await loadUsers(); // Recharger la liste des utilisateurs
    } catch (error) {
      console.error('Error setting new password:', error);
      toast.error('Erreur lors de la définition du nouveau mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonctions pour la gestion de l'authentification à deux facteurs
  const handleSetupMfa = (user: User) => {
    setEditingUser(user);
    setMfaPhone('');
    setMfaVerificationId(null);
    setMfaVerificationCode('');
    setMfaVerificationSent(false);
    setMfaError(null);
    setShowMfaSetup(true);
  };

  const handleSendVerificationCode = async () => {
    if (!editingUser || !editingUser.firebaseUid) {
      setMfaError("Utilisateur non valide pour la configuration MFA");
      return;
    }

    if (!mfaPhone || !mfaPhone.match(/(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/)) {
      setMfaError("Veuillez entrer un numéro de téléphone français valide");
      return;
    }

    if (!recaptchaVerifier) {
      setMfaError("Erreur d'initialisation du reCAPTCHA. Veuillez rafraîchir la page.");
      return;
    }

    setMfaLoading(true);
    setMfaError(null);

    try {
      // Pour configurer le MFA d'un autre utilisateur, nous devons utiliser une fonction Cloud
      const functions = getFunctions();
      const setupMfaForUser = httpsCallable(functions, 'setupMfaForUser');
      
      const result = await setupMfaForUser({
        uid: editingUser.firebaseUid,
        phoneNumber: mfaPhone
      });
      
      // @ts-ignore
      const verificationId = result.data?.verificationId;
      
      if (!verificationId) {
        throw new Error("Impossible d'obtenir l'ID de vérification");
      }
      
      setMfaVerificationId(verificationId);
      setMfaVerificationSent(true);
      
      // Mettre à jour le numéro de téléphone dans Firestore
      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, {
        mfaPhone: mfaPhone
      });
      
      toast.success("Code de vérification envoyé par SMS");
    } catch (error: any) {
      console.error("Erreur lors de l'envoi du code:", error);
      setMfaError(error.message || "Erreur lors de l'envoi du code de vérification");
      toast.error("Erreur lors de l'envoi du code");
      
      // Reset recaptcha on error
      if (recaptchaVerifier) {
        await recaptchaVerifier.clear();
        const auth = getAuth();
        const newVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
        setRecaptchaVerifier(newVerifier);
      }
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!editingUser || !editingUser.firebaseUid || !mfaVerificationId || !mfaVerificationCode) {
      setMfaError("Informations manquantes pour la vérification");
      return;
    }

    setMfaLoading(true);
    setMfaError(null);

    try {
      // Appeler une fonction Cloud pour vérifier le code et activer MFA
      const functions = getFunctions();
      const verifyMfaCode = httpsCallable(functions, 'verifyMfaCode');
      
      await verifyMfaCode({
        uid: editingUser.firebaseUid,
        verificationId: mfaVerificationId,
        verificationCode: mfaVerificationCode,
        phoneNumber: mfaPhone
      });
      
      // Mettre à jour le statut MFA dans Firestore
      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, {
        mfaEnabled: true,
        mfaPhone: mfaPhone,
        updatedAt: serverTimestamp()
      });
      
      toast.success("Authentification à deux facteurs activée avec succès");
      setShowMfaSetup(false);
      loadUsers(); // Recharger la liste des utilisateurs
    } catch (error: any) {
      console.error("Erreur lors de la vérification du code:", error);
      setMfaError(error.message || "Erreur lors de la vérification du code");
      toast.error("Erreur lors de la vérification du code");
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableMfa = async (user: User) => {
    if (!user.firebaseUid) {
      toast.error("UID Firebase non trouvé pour cet utilisateur");
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir désactiver l'authentification à deux facteurs pour ${user.firstName} ${user.lastName} ?`)) {
      return;
    }

    setIsLoading(true);
    try {
      // Appeler une fonction Cloud pour désactiver MFA
      const functions = getFunctions();
      const disableMfa = httpsCallable(functions, 'disableMfa');
      
      await disableMfa({
        uid: user.firebaseUid
      });
      
      // Mettre à jour le statut MFA dans Firestore
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        mfaEnabled: false,
        updatedAt: serverTimestamp()
      });
      
      toast.success("Authentification à deux facteurs désactivée avec succès");
      loadUsers(); // Recharger la liste des utilisateurs
    } catch (error) {
      console.error("Erreur lors de la désactivation de MFA:", error);
      toast.error("Erreur lors de la désactivation de l'authentification à deux facteurs");
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasPermission) {
    return (
      <div className="p-6 bg-yellow-50 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">Accès restreint</h3>
            <p className="mt-1 text-yellow-700">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Shield className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold">Gestion des utilisateurs</h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setEditingUser(null);
                setFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  password: '',
                  role: 'user',
                  newPassword: ''
                });
                setShowAddUser(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Nouvel utilisateur</span>
              <span className="sm:hidden">Ajouter</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {selectedUsers.size > 0 && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedUsers.size === users.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedUsers(new Set(users.map(u => u.id)));
                  } else {
                    setSelectedUsers(new Set());
                  }
                }}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">
                {selectedUsers.size} utilisateur{selectedUsers.size > 1 ? 's' : ''} sélectionné{selectedUsers.size > 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={handleBulkDelete}
              className="flex items-center px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Supprimer la sélection</span>
              <span className="sm:hidden">Supprimer</span>
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === users.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(new Set(users.map(u => u.id)));
                      } else {
                        setSelectedUsers(new Set());
                      }
                    }}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernière connexion
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MFA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedUsers);
                        if (e.target.checked) {
                          newSelected.add(user.id);
                        } else {
                          newSelected.delete(user.id);
                        }
                        setSelectedUsers(newSelected);
                      }}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      disabled={user.email === 'slucas@anthea-rh.com'}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {user.firstName && user.lastName 
                                ? `${user.firstName[0]}${user.lastName[0]}`
                                : 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : 'Utilisateur'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.email === 'slucas@anthea-rh.com' || user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'analyst' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.email === 'slucas@anthea-rh.com' ? 'Administrateur' :
                       user.role === 'admin' ? 'Administrateur' :
                       user.role === 'manager' ? 'Manager' :
                       user.role === 'analyst' ? 'Analyste' :
                       'Utilisateur'}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin ? format(user.lastLogin, 'dd/MM/yyyy HH:mm', { locale: fr }) : '-'}
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                    {user.mfaEnabled ? (
                      <div className="flex items-center">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Activé
                        </span>
                        <button
                          onClick={() => handleDisableMfa(user)}
                          className="ml-2 text-xs text-red-600 hover:text-red-800"
                          title="Désactiver MFA"
                        >
                          Désactiver
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSetupMfa(user)}
                        className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 hover:bg-blue-100 hover:text-blue-800"
                      >
                        Configurer
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      {showDeleted ? (
                        <button
                          onClick={() => handleRestore(user)}
                          className="p-1 hover:bg-green-50 rounded-lg text-green-600"
                          title="Restaurer"
                          disabled={user.email === 'slucas@anthea-rh.com'}
                        >
                          <UsersIcon className="w-4 h-4" />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-1 hover:bg-blue-50 rounded-lg text-blue-600"
                            disabled={user.email === 'slucas@anthea-rh.com'}
                            title={user.email === 'slucas@anthea-rh.com' ? 'Impossible de modifier le compte administrateur principal' : 'Modifier'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-1 hover:bg-red-50 rounded-lg text-red-600"
                            disabled={user.email === 'slucas@anthea-rh.com'}
                            title={user.email === 'slucas@anthea-rh.com' ? 'Impossible de supprimer le compte administrateur principal' : 'Supprimer'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showAddUser && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddUser(false);
                        setEditingUser(null);
                      }}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <UserPhotoUploader
                        currentPhotoURL={formData.photoURL}
                        displayName={`${formData.firstName} ${formData.lastName}`}
                        onPhotoUpdate={handlePhotoUpdate}
                        userId={editingUser?.id}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 p-2"
                      />
                    </div>

                    {!editingUser && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mot de passe
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full rounded-lg border border-gray-200 p-2 pr-10"
                            minLength={6}
                            placeholder="Minimum 6 caractères"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {editingUser && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <KeyRound className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-blue-900">
                              Réinitialisation du mot de passe
                            </h4>
                            <p className="mt-1 text-xs text-blue-700">
                              Envoyer un email permettant à l'utilisateur de réinitialiser son mot de passe.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleResetPassword(formData.email)}
                              className="mt-2 flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              <KeyRound className="w-3 h-3 mr-1" />
                              Envoyer le lien de réinitialisation
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Ajout du champ pour définir un nouveau mot de passe */}
                    {editingUser && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <KeyRound className="w-4 h-4 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-green-900">
                              Définir un nouveau mot de passe
                            </h4>
                            <p className="mt-1 text-xs text-green-700">
                              En tant qu'administrateur, vous pouvez définir un nouveau mot de passe.
                            </p>
                            <div className="mt-2 relative">
                              <input
                                type={showNewPassword ? "text" : "password"}
                                value={formData.newPassword || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                                className="w-full rounded-lg border border-gray-200 p-1.5 pr-8 text-sm"
                                placeholder="Nouveau mot de passe"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute inset-y-0 right-0 pr-2 flex items-center"
                              >
                                {showNewPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={handleSetNewPassword}
                              disabled={!formData.newPassword}
                              className="mt-2 flex items-center px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                              <KeyRound className="w-3 h-3 mr-1" />
                              Définir le mot de passe
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rôle
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          role: e.target.value as 'admin' | 'manager' | 'analyst' | 'user'
                        }))}
                        className="w-full rounded-lg border border-gray-200 p-2"
                      >
                        <option value="user">Utilisateur</option>
                        <option value="manager">Manager</option>
                        <option value="analyst">Analyste</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 rounded-b-xl flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddUser(false);
                      setEditingUser(null);
                    }}
                    className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Traitement...' : editingUser ? 'Enregistrer' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showMfaSetup && editingUser && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">
                    Configuration de l'authentification à deux facteurs
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowMfaSetup(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600">
                    Configurer l'authentification à deux facteurs pour <strong>{editingUser.firstName} {editingUser.lastName}</strong> ({editingUser.email})
                  </p>
                </div>

                {mfaError && (
                  <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                    {mfaError}
                  </div>
                )}

                {!mfaVerificationSent ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numéro de téléphone
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          placeholder="+33 6 12 34 56 78"
                          value={mfaPhone}
                          onChange={(e) => setMfaPhone(e.target.value)}
                          className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-anthea-blue focus:border-anthea-blue"
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Un code de vérification sera envoyé par SMS à ce numéro.
                      </p>
                    </div>

                    <button
                      onClick={handleSendVerificationCode}
                      disabled={mfaLoading || !mfaPhone}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-anthea hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-anthea-blue disabled:opacity-50"
                    >
                      {mfaLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        "Envoyer le code de vérification"
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Code de vérification
                      </label>
                      <input
                        type="text"
                        placeholder="123456"
                        value={mfaVerificationCode}
                        onChange={(e) => setMfaVerificationCode(e.target.value)}
                        className="appearance-none block w-full py-2 px-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-anthea-blue focus:border-anthea-blue"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Entrez le code à 6 chiffres envoyé au {mfaPhone}
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setMfaVerificationSent(false);
                          setMfaVerificationId(null);
                          setMfaVerificationCode("");
                        }}
                        className="flex-1 py-2 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-anthea-blue"
                      >
                        Retour
                      </button>
                      <button
                        onClick={handleVerifyCode}
                        disabled={mfaLoading || !mfaVerificationCode}
                        className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-anthea hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-anthea-blue disabled:opacity-50"
                      >
                        {mfaLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Vérification...
                          </>
                        ) : (
                          "Vérifier le code"
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Place the recaptcha container at the end of the component */}
                <div id="recaptcha-container" className="mt-4"></div>
              </div>
            </div>
          </div>
        )}

        {showImport && (
          <UserExcelImport
            onImport={handleImport}
            onClose={() => setShowImport(false)}
          />
        )}
      </div>
    </div>
  );
}

export default UserManagement;