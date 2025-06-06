import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  PhoneAuthProvider,
  RecaptchaVerifier,
  multiFactor,
} from 'firebase/auth';
import { useUserStore } from '../stores/userStore';
import LoginForm from '../components/LoginForm';
import { toast } from 'react-hot-toast';

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { updateLastLogin } = useUserStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Mettre à jour la dernière connexion
        updateLastLogin().catch(console.error);
        navigate('/', { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate, updateLastLogin]);

  const handleAuth = async (data: { email: string; password: string }) => {
    try {
      setError('');

      // 🔐 Connexion
      try {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast.success('Connexion réussie');
      } catch (err: any) {
        if (err.code === 'auth/multi-factor-auth-required') {
          // 🔐 MFA requis
          const resolver = err.resolver;

          const recaptchaVerifier = new RecaptchaVerifier(
            'recaptcha-container',
            { size: 'invisible' },
            auth
          );

          const phoneInfoOptions = {
            multiFactorHint: resolver.hints[0],
            session: resolver.session,
          };

          const phoneAuthProvider = new PhoneAuthProvider(auth);
          const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifier);

          const verificationCode = window.prompt("Entrez le code reçu par SMS :");
          if (!verificationCode) return alert("Code requis.");

          const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
          const multiFactorAssertion = PhoneAuthProvider.multiFactor.assertion(cred);
          const finalUserCredential = await resolver.resolveSignIn(multiFactorAssertion);

          toast.success('Connexion MFA réussie');
          console.log("✅ Utilisateur connecté avec MFA :", finalUserCredential.user);
        } else {
          throw err;
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.code === 'auth/invalid-credential') {
        setError('Email ou mot de passe incorrect');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
      toast.error(error.message);
    }
  };

  return (
    <>
      <LoginForm onSubmit={handleAuth} error={error} />
      <div id="recaptcha-container" /> {/* ✅ nécessaire pour le challenge MFA */}
    </>
  );
}

export default Login;