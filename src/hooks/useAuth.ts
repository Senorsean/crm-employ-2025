import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useUserStore } from '../stores/userStore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { loadUserData, checkAdminStatus } = useUserStore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(
      async (user) => {
        setUser(user);
        if (user) {
          try {
            await loadUserData();
            await checkAdminStatus();
          } catch (error) {
            console.error('Error loading user data:', error);
          }
        }
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Auth error:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [loadUserData, checkAdminStatus]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user
  };
}