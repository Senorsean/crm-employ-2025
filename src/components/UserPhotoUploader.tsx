import { useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { updateProfile } from "firebase/auth"; // ✅ Ajouté
import { auth, storage } from "../config/firebase";

export default function UserPhotoUploader() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const user = auth.currentUser;
    if (!user) {
      setError("Vous devez être connecté pour uploader une photo.");
      return;
    }

    const safeName = file.name.replace(/\s+/g, "_").replace(/[^\w.-]/g, "");
    const extension = safeName.split(".").pop();
    const path = `profile-photos/${user.uid}/photo_${Date.now()}.${extension}`;
    const fileRef = ref(storage, path);

    try {
      setUploading(true);
      setError(null);
      console.log("→ Upload vers :", path);

      await uploadBytes(fileRef, file);

      const downloadURL = await getDownloadURL(fileRef);
      console.log("✔️ URL de téléchargement :", downloadURL);

      // ✅ Mise à jour du profil utilisateur avec l'URL de la photo
      await updateProfile(user, {
        photoURL: downloadURL,
      });

      setPhotoURL(downloadURL);
    } catch (err: any) {
      console.error("❌ Erreur d'upload :", err);
      setError(err.message || "Erreur inconnue.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2>Uploader votre photo</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {uploading && <p>Chargement...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {photoURL && <img src={photoURL} alt="Photo de profil" width={200} />}
    </div>
  );
}
