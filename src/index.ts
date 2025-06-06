import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

exports.setAdmin = functions.https.onCall(async (data, context) => {
  // Vérifier que l'appelant est un admin existant
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Seuls les administrateurs peuvent effectuer cette action'
    );
  }

  const { email } = data;
  if (!email) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'L\'email est requis'
    );
  }

  try {
    // Récupérer l'utilisateur par email
    const user = await admin.auth().getUserByEmail(email);
    
    // Définir les custom claims
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    // Mettre à jour le document utilisateur dans Firestore
    await admin.firestore().collection('users').doc(user.uid).update({
      role: 'admin',
      isAdmin: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: `${email} est maintenant administrateur` };
  } catch (error) {
    console.error('Error setting admin:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erreur lors de la définition de l\'administrateur'
    );
  }
});

// Fonction pour initialiser le premier admin
exports.initializeAdmin = functions.https.onRequest(async (req, res) => {
  // Vérifier la méthode
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    // Vérifier si l'utilisateur existe
    const user = await admin.auth().getUserByEmail('slucas@anthea-rh.com');

    // Définir les custom claims
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    // Mettre à jour ou créer le document utilisateur
    await admin.firestore().collection('users').doc(user.uid).set({
      email: 'slucas@anthea-rh.com',
      role: 'admin',
      isAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({ success: true, message: 'Admin initialisé avec succès' });
  } catch (error) {
    console.error('Error initializing admin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de l\'initialisation de l\'admin' 
    });
  }
});

// Fonction pour supprimer un utilisateur Firebase Auth
exports.deleteUser = functions.https.onCall(async (data, context) => {
  // Vérifier que l'appelant est authentifié et est un admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'L\'utilisateur doit être authentifié pour effectuer cette action'
    );
  }

  // Vérifier si l'appelant est admin
  const callerUid = context.auth.uid;
  const callerSnapshot = await admin.firestore().collection('users').doc(callerUid).get();
  const callerData = callerSnapshot.data();
  
  if (!callerData?.isAdmin && !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Seuls les administrateurs peuvent effectuer cette action'
    );
  }

  const { uid } = data;
  if (!uid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'L\'UID de l\'utilisateur est requis'
    );
  }

  try {
    // Vérifier que l'utilisateur n'est pas l'admin principal
    const userRecord = await admin.auth().getUser(uid);
    if (userRecord.email === 'slucas@anthea-rh.com') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Impossible de supprimer le compte administrateur principal'
      );
    }

    // Supprimer l'utilisateur de Firebase Auth
    await admin.auth().deleteUser(uid);
    
    return { success: true, message: 'Utilisateur supprimé avec succès' };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erreur lors de la suppression de l\'utilisateur'
    );
  }
});

// Nouvelle fonction pour mettre à jour le mot de passe d'un utilisateur
exports.updateUserPassword = functions.https.onCall(async (data, context) => {
  console.log('Début de la fonction updateUserPassword avec les données:', JSON.stringify(data));
  
  // Vérifier que l'appelant est authentifié
  if (!context.auth) {
    console.log('Erreur: Utilisateur non authentifié');
    throw new functions.https.HttpsError(
      'unauthenticated',
      'L\'utilisateur doit être authentifié pour effectuer cette action'
    );
  }

  // Vérifier les paramètres
  const { uid, newPassword } = data;
  if (!uid || !newPassword) {
    console.log('Erreur: Paramètres manquants', { uid: !!uid, newPassword: !!newPassword });
    throw new functions.https.HttpsError(
      'invalid-argument',
      'L\'UID de l\'utilisateur et le nouveau mot de passe sont requis'
    );
  }

  try {
    console.log('Vérification des permissions pour', context.auth.uid);
    
    // Vérifier si l'appelant est admin ou l'utilisateur lui-même
    const callerUid = context.auth.uid;
    const isAdmin = context.auth.token.admin === true;
    const isSelf = callerUid === uid;
    
    // Si ce n'est ni un admin ni l'utilisateur lui-même, vérifier dans Firestore
    if (!isAdmin && !isSelf) {
      console.log('Vérification des permissions dans Firestore');
      const callerSnapshot = await admin.firestore().collection('users').doc(callerUid).get();
      const callerData = callerSnapshot.data();
      
      if (!callerData?.isAdmin && callerData?.role !== 'admin') {
        console.log('Erreur: Permissions insuffisantes', callerData);
        throw new functions.https.HttpsError(
          'permission-denied',
          'Seuls les administrateurs ou l\'utilisateur lui-même peuvent effectuer cette action'
        );
      }
    }

    // Vérifier que l'utilisateur existe
    let userRecord;
    try {
      console.log('Vérification de l\'existence de l\'utilisateur', uid);
      userRecord = await admin.auth().getUser(uid);
      console.log('Utilisateur trouvé:', userRecord.email);
    } catch (userError) {
      console.error('Utilisateur non trouvé:', userError);
      throw new functions.https.HttpsError(
        'not-found',
        'Utilisateur non trouvé'
      );
    }

    // Mettre à jour le mot de passe de l'utilisateur
    console.log('Mise à jour du mot de passe pour', uid);
    await admin.auth().updateUser(uid, {
      password: newPassword
    });
    console.log('Mot de passe mis à jour avec succès dans Firebase Auth');
    
    // Mettre à jour le document Firestore
    try {
      console.log('Recherche du document Firestore pour', uid);
      // Trouver le document utilisateur par UID Firebase
      const usersQuery = await admin.firestore().collection('users')
        .where('uid', '==', uid)
        .limit(1)
        .get();
      
      if (!usersQuery.empty) {
        const userDoc = usersQuery.docs[0];
        console.log('Document Firestore trouvé, mise à jour:', userDoc.id);
        await admin.firestore().collection('users').doc(userDoc.id).update({
          initialPassword: newPassword,
          passwordSetByAdmin: true,
          passwordSetAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('Document Firestore mis à jour avec succès');
      } else {
        console.log('Aucun document Firestore trouvé pour cet UID');
      }
    } catch (firestoreError) {
      console.warn('Erreur lors de la mise à jour du document Firestore:', firestoreError);
      // Continue même si la mise à jour Firestore échoue
    }
    
    console.log('Opération terminée avec succès');
    return { 
      success: true, 
      message: 'Mot de passe mis à jour avec succès',
      uid: uid
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mot de passe:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erreur lors de la mise à jour du mot de passe: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
    );
  }
});

// Fonction pour configurer MFA pour un utilisateur
exports.setupMfaForUser = functions.https.onCall(async (data, context) => {
  // Vérifier que l'appelant est authentifié et est un admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'L\'utilisateur doit être authentifié pour effectuer cette action'
    );
  }

  // Vérifier si l'appelant est admin
  const callerUid = context.auth.uid;
  const callerSnapshot = await admin.firestore().collection('users').doc(callerUid).get();
  const callerData = callerSnapshot.data();
  
  if (!callerData?.isAdmin && !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Seuls les administrateurs peuvent effectuer cette action'
    );
  }

  const { uid, phoneNumber } = data;
  if (!uid || !phoneNumber) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'L\'UID de l\'utilisateur et le numéro de téléphone sont requis'
    );
  }

  try {
    // Vérifier que l'utilisateur existe
    const userRecord = await admin.auth().getUser(uid);
    
    // Envoyer un code de vérification par SMS
    // Note: Cette partie est simulée car elle nécessite une interaction utilisateur
    // Dans un environnement réel, vous devriez utiliser l'API Admin SDK pour envoyer un SMS
    
    // Simuler l'envoi d'un code de vérification
    const verificationId = `simulated-verification-id-${Date.now()}`;
    
    return { success: true, verificationId };
  } catch (error) {
    console.error('Error setting up MFA:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erreur lors de la configuration de l\'authentification à deux facteurs'
    );
  }
});

// Fonction pour vérifier le code MFA et activer l'authentification à deux facteurs
exports.verifyMfaCode = functions.https.onCall(async (data, context) => {
  // Vérifier que l'appelant est authentifié et est un admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'L\'utilisateur doit être authentifié pour effectuer cette action'
    );
  }

  // Vérifier si l'appelant est admin
  const callerUid = context.auth.uid;
  const callerSnapshot = await admin.firestore().collection('users').doc(callerUid).get();
  const callerData = callerSnapshot.data();
  
  if (!callerData?.isAdmin && !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Seuls les administrateurs peuvent effectuer cette action'
    );
  }

  const { uid, verificationId, verificationCode, phoneNumber } = data;
  if (!uid || !verificationId || !verificationCode || !phoneNumber) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Tous les paramètres sont requis'
    );
  }

  try {
    // Vérifier que l'utilisateur existe
    const userRecord = await admin.auth().getUser(uid);
    
    // Dans un environnement réel, vous vérifieriez le code ici
    // Pour cette simulation, nous considérons que le code est valide
    
    // Mettre à jour le document utilisateur dans Firestore
    const usersQuery = await admin.firestore().collection('users')
      .where('uid', '==', uid)
      .limit(1)
      .get();
    
    if (!usersQuery.empty) {
      const userDoc = usersQuery.docs[0];
      await admin.firestore().collection('users').doc(userDoc.id).update({
        mfaEnabled: true,
        mfaPhone: phoneNumber,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    return { success: true, message: 'Authentification à deux facteurs activée avec succès' };
  } catch (error) {
    console.error('Error verifying MFA code:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erreur lors de la vérification du code'
    );
  }
});

// Fonction pour désactiver MFA pour un utilisateur
exports.disableMfa = functions.https.onCall(async (data, context) => {
  // Vérifier que l'appelant est authentifié et est un admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'L\'utilisateur doit être authentifié pour effectuer cette action'
    );
  }

  // Vérifier si l'appelant est admin
  const callerUid = context.auth.uid;
  const callerSnapshot = await admin.firestore().collection('users').doc(callerUid).get();
  const callerData = callerSnapshot.data();
  
  if (!callerData?.isAdmin && !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Seuls les administrateurs peuvent effectuer cette action'
    );
  }

  const { uid } = data;
  if (!uid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'L\'UID de l\'utilisateur est requis'
    );
  }

  try {
    // Vérifier que l'utilisateur existe
    const userRecord = await admin.auth().getUser(uid);
    
    // Dans un environnement réel, vous désactiveriez MFA ici
    // Pour cette simulation, nous mettons simplement à jour Firestore
    
    // Mettre à jour le document utilisateur dans Firestore
    const usersQuery = await admin.firestore().collection('users')
      .where('uid', '==', uid)
      .limit(1)
      .get();
    
    if (!usersQuery.empty) {
      const userDoc = usersQuery.docs[0];
      await admin.firestore().collection('users').doc(userDoc.id).update({
        mfaEnabled: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    return { success: true, message: 'Authentification à deux facteurs désactivée avec succès' };
  } catch (error) {
    console.error('Error disabling MFA:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erreur lors de la désactivation de l\'authentification à deux facteurs'
    );
  }
});