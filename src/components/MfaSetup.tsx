import React, { useEffect, useState } from "react";
import {
  getAuth,
  multiFactor,
  PhoneAuthProvider,
  RecaptchaVerifier,
  PhoneMultiFactorGenerator
} from "firebase/auth";
import { toast } from "react-hot-toast";
import { Phone, Shield, CheckCircle, Loader2 } from "lucide-react";
import { useThemeStore } from '../stores/themeStore';

const MfaSetup: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const { darkMode } = useThemeStore();

  useEffect(() => {
    checkMfaStatus();
  }, []);

  // Separate useEffect for RecaptchaVerifier initialization
  useEffect(() => {
    let verifier: RecaptchaVerifier | null = null;

    // Only initialize if window is defined
    if (typeof window !== 'undefined') {
      try {
        const auth = getAuth();
        verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
        setRecaptchaVerifier(verifier);
      } catch (error) {
        console.error("Error initializing RecaptchaVerifier:", error);
      }
    }

    // Cleanup function
    return () => {
      if (verifier) {
        verifier.clear();
      }
    };
  }, []); // Empty dependency array as we only want this to run once on mount

  const checkMfaStatus = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const enrolledFactors = multiFactor(user).enrolledFactors;
        setIsEnrolled(enrolledFactors.length > 0);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut MFA:", error);
    }
  };

  const handleSendVerificationCode = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setError("Aucun utilisateur connecté.");
      return;
    }

    if (!phoneNumber || !phoneNumber.match(/(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/)) {
      setError("Veuillez entrer un numéro de téléphone français valide.");
      return;
    }

    if (!recaptchaVerifier) {
      setError("Erreur d'initialisation du reCAPTCHA. Veuillez rafraîchir la page.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create a new instance of PhoneAuthProvider
      const phoneAuthProvider = new PhoneAuthProvider(auth);

      // Send verification code
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier
      );

      setVerificationId(verificationId);
      setVerificationSent(true);
      toast.success("Code de vérification envoyé par SMS");
    } catch (error: any) {
      console.error("Erreur lors de l'envoi du code:", error);
      setError(error.message || "Erreur lors de l'envoi du code de vérification");
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
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationId || !verificationCode) {
      setError("Code de vérification requis");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("Aucun utilisateur connecté");
      }

      // Créer les informations d'identification avec le code de vérification
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      
      // Créer l'assertion multifacteur
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      
      // Enrôler le facteur
      await multiFactor(user).enroll(multiFactorAssertion, "Téléphone principal");
      
      toast.success("Authentification à deux facteurs activée avec succès");
      setIsEnrolled(true);
    } catch (error: any) {
      console.error("Erreur lors de la vérification du code:", error);
      setError(error.message || "Erreur lors de la vérification du code");
      toast.error("Erreur lors de la vérification du code");
    } finally {
      setLoading(false);
    }
  };

  if (isEnrolled) {
    return (
      <div className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white'} rounded-xl shadow-sm p-8`}>
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3 ${darkMode ? 'bg-green-900' : 'bg-green-100'} rounded-full`}>
            <Shield className={`w-8 h-8 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Authentification à deux facteurs</h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Votre compte est sécurisé</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-3 p-4 ${darkMode ? 'bg-green-900/30 border-green-800' : 'bg-green-50 border-green-100'} rounded-lg border`}>
          <CheckCircle className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
          <p className={`${darkMode ? 'text-green-400' : 'text-green-700'}`}>L'authentification à deux facteurs est activée pour votre compte.</p>
        </div>
        
        <p className={`mt-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Lors de votre prochaine connexion, vous recevrez un code par SMS pour confirmer votre identité.
        </p>
      </div>
    );
  }

  return (
    <div className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white'} rounded-xl shadow-sm p-6`}>
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 ${darkMode ? 'bg-blue-900/50' : 'bg-blue-100'} rounded-full`}>
          <Shield className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Authentification à deux facteurs</h2>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sécurisez votre compte avec la validation par SMS</p>
        </div>
      </div>

      {error && (
        <div className={`mb-6 p-4 ${darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-50 text-red-600'} rounded-lg text-sm`}>
          {error}
        </div>
      )}

      {!verificationSent ? (
        <div className="space-y-6">
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Numéro de téléphone
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              </div>
              <input
                type="tel"
                placeholder="+33 6 12 34 56 78"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                  darkMode 
                    ? 'border-gray-700 bg-gray-700 text-gray-100' 
                    : 'border-gray-300 text-gray-900'
                } rounded-xl focus:outline-none focus:ring-2 focus:ring-anthea-blue focus:border-anthea-blue`}
              />
            </div>
            <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Nous vous enverrons un code de vérification par SMS à ce numéro.
            </p>
          </div>

          <button
            onClick={handleSendVerificationCode}
            disabled={loading || !phoneNumber}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-anthea hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-anthea-blue disabled:opacity-50"
          >
            {loading ? (
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
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Code de vérification
            </label>
            <input
              type="text"
              placeholder="123456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className={`appearance-none block w-full py-2 px-3 border ${
                darkMode 
                  ? 'border-gray-700 bg-gray-700 text-gray-100' 
                  : 'border-gray-300 text-gray-900'
              } rounded-xl focus:outline-none focus:ring-2 focus:ring-anthea-blue focus:border-anthea-blue`}
            />
            <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Entrez le code à 6 chiffres que nous avons envoyé à {phoneNumber}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setVerificationSent(false);
                setVerificationId(null);
                setVerificationCode("");
              }}
              className={`flex-1 py-2 px-4 border ${
                darkMode 
                  ? 'border-gray-700 text-gray-300 bg-gray-800 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              } rounded-xl shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-anthea-blue`}
            >
              Retour
            </button>
            <button
              onClick={handleVerifyCode}
              disabled={loading || !verificationCode}
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-anthea hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-anthea-blue disabled:opacity-50"
            >
              {loading ? (
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
  );
};

export default MfaSetup;