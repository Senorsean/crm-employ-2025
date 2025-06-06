import { auth } from '../config/firebase';

export async function checkAdminStatus(email: string): Promise<boolean> {
  try {
    // Vérifier que l'utilisateur est connecté
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    // Récupérer le token avec les claims
    const idTokenResult = await currentUser.getIdTokenResult();

    // Vérifier si l'utilisateur est admin
    return !!idTokenResult.claims.admin;
  } catch (error) {
    console.error('Erreur lors de la vérification du statut admin:', error);
    return false;
  }
}