import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const uploadToFirebaseStorage = async (file: File, userId: string): Promise<string> => {
  try {
    console.log("Début de l'upload, taille du fichier:", file.size, "type:", file.type);
    
    const storage = getStorage();
    console.log("Configuration storage:", storage.app.options);
    
    // Essayer un chemin très simple
    const storagePath = `test.txt`;
    console.log("Tentative avec chemin simple:", storagePath);
    
    const storageRef = ref(storage, storagePath);
    
    // Créer un petit fichier texte pour tester
    const testBlob = new Blob(["Test"], { type: "text/plain" });
    
    console.log("Tentative d'upload d'un fichier texte simple...");
    try {
      const testSnapshot = await uploadBytes(storageRef, testBlob);
      console.log("Upload de test réussi!");
    } catch (testError) {
      console.error("Échec de l'upload de test:", testError);
    }
    
    // Maintenant essayer avec le fichier réel
    console.log("Tentative avec le fichier réel...");
    const timestamp = new Date().getTime();
    const realPath = `users/${userId}/${timestamp}_${file.name}`;
    const realRef = ref(storage, realPath);
    
    const snapshot = await uploadBytes(realRef, file);
    console.log("Upload réussi!");
    
    return await getDownloadURL(snapshot.ref);
  } catch (error: any) {
    console.error("Erreur détaillée:", error);
    if (error.serverResponse) {
      console.error("Réponse serveur:", error.serverResponse);
    }
    console.error("Stack trace:", error.stack);
    throw error;
  }
};

// Fonction pour uploader vers Google Cloud Storage
export async function uploadToGCS(file: File, userId: string): Promise<string> {
  const bucketName = 'bolt-upload-crm-samuel';
  const objectName = `profile-photos/${userId}.jpg`;
  const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(objectName)}`;

  try {
    let retries = 3;
    let response;

    while (retries > 0) {
      try {
        response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Content-Type': file.type,
            'Access-Control-Allow-Origin': '*',
            'X-Goog-Content-Length-Range': '0,5242880', // 5MB max
          },
          body: file
        });

        if (response.ok) {
          break; // Exit the loop if the upload is successful
        } else {
          console.warn(`Upload failed with status ${response.status}: ${response.statusText}. Retrying...`);
          retries--;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
        }
      } catch (fetchError) {
        console.warn(`Fetch error during upload: ${fetchError}. Retrying...`);
        retries--;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      }
    }

    if (!response || !response.ok) {
      throw new Error(`Upload failed after all retries. Status: ${response?.status}, StatusText: ${response?.statusText}`);
    }

    const data = await response.json();
    return `https://storage.googleapis.com/${bucketName}/${data.name}`;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}