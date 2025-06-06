import React, { useRef, useState, useEffect } from "react";
import { Cropper } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { X, Check, Loader2, AlertCircle } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, storage } from "../config/firebase"; // Updated import path
import { toast } from "react-hot-toast";

interface UserPhotoCropperProps {
  selectedImage: File;
  onSave: (croppedImageUrl: string) => void;
  onClose: () => void;
}

const UserPhotoCropper: React.FC<UserPhotoCropperProps> = ({
  selectedImage,
  onSave,
  onClose,
}) => {
  const cropperRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isCropperReady, setIsCropperReady] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(selectedImage);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedImage]);

  const handleCrop = async () => {
    if (!cropperRef.current?.cropper || !isCropperReady || !auth.currentUser) {
      setError("Le recadrage n'est pas prêt ou l'utilisateur est déconnecté.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const canvas = cropperRef.current.cropper.getCroppedCanvas({
        width: 300,
        height: 300,
        fillColor: "#fff",
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      });

      if (!canvas) throw new Error("Impossible de générer l'image.");

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Image vide ou invalide."));
        }, "image/jpeg", 0.95);
      });

      const userId = auth.currentUser.uid;
      const fileRef = ref(storage, `profile-photos/${userId}/photo.jpg`);

      await uploadBytes(fileRef, blob);
      const downloadURL = await getDownloadURL(fileRef);

      toast.success("Photo enregistrée !");
      onSave(downloadURL);
    } catch (err: any) {
      console.error("Erreur recadrage/upload :", err);
      setError(err.message || "Erreur inconnue");
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-[60] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Recadrer la photo</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={isLoading}
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">
            Déplacez et redimensionnez l'image pour définir votre photo de profil
          </p>
          {imageUrl && (
            <Cropper
              src={imageUrl}
              style={{ height: 400, width: "100%" }}
              aspectRatio={1}
              guides={true}
              viewMode={1}
              dragMode="move"
              scalable={true}
              zoomable={true}
              autoCropArea={1}
              background={false}
              responsive={true}
              checkOrientation={false}
              ref={cropperRef}
              ready={() => setIsCropperReady(true)}
              cropend={() => error && setError(null)}
            />
          )}
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Annuler
          </button>
          <button
            onClick={handleCrop}
            disabled={isLoading || !isCropperReady}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Recadrage...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Valider le recadrage
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPhotoCropper;