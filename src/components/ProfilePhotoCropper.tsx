import React, { useRef, useState, useEffect } from "react";
import { Cropper } from "react-cropper";
import { X, Check, Loader2, AlertCircle } from "lucide-react";
import "cropperjs/dist/cropper.css";

interface ProfilePhotoCropperProps {
  selectedImage: File;
  onSave: (croppedImage: Blob) => Promise<void>;
  onClose: () => void;
}

const ProfilePhotoCropper: React.FC<ProfilePhotoCropperProps> = ({ selectedImage, onSave, onClose }) => {
  const cropperRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isCropperReady, setIsCropperReady] = useState(false);

  useEffect(() => {
    const url = URL.createObjectURL(selectedImage);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedImage]);

 const handleCrop = async () => {
  console.log("📸 Début du recadrage...");
  
  if (!cropperRef.current?.cropper || !isCropperReady) {
    setError("L'outil de recadrage n'est pas prêt. Veuillez réessayer.");
    console.error("❌ Cropper non prêt !");
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    console.log("✂️ Génération du canvas...");
    const canvas = cropperRef.current.cropper.getCroppedCanvas({
      width: 300,
      height: 300,
      fillColor: '#fff',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    });

    if (!canvas) {
      throw new Error("❌ Impossible de générer l'image recadrée !");
    }

    console.log("✅ Canvas généré avec succès !");

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log("✅ Blob créé avec succès :", blob);
            resolve(blob);
          } else {
            console.error("❌ Échec de la conversion en image");
            reject(new Error("Échec de la conversion en image"));
          }
        },
        'image/jpeg',
        0.9
      );
    });

    if (!blob) {
      throw new Error("❌ Aucune image générée après le recadrage !");
    }

    console.log("📤 Envoi de l'image recadrée...");
    
    await onSave(blob);

    console.log("✅ Image recadrée enregistrée !");
    
  } catch (err) {
    console.error("❌ Erreur lors du recadrage :", err);
    setError(err instanceof Error ? err.message : "Une erreur est survenue lors du recadrage");
  } finally {
    setIsLoading(false);
    console.log("⏳ Fin du processus de recadrage.");
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
              cropend={() => {
                if (error) setError(null);
              }}
            />
          )}
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Annuler
          </button>
          <button
            type="button"
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

export default ProfilePhotoCropper;