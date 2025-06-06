import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import app from '../../config/firebase';

type AuthCallback = (user: User | null) => void;
type ErrorCallback = (error: Error) => void;

class AuthService {
  private static instance: AuthService;
  private auth = getAuth(app);
  private listeners: Set<AuthCallback> = new Set();
  private errorListeners: Set<ErrorCallback> = new Set();
  private currentUser: User | null = null;

  private constructor() {
    onAuthStateChanged(
      this.auth,
      (user) => {
        this.currentUser = user;
        this.notifyListeners(user);
      },
      (error) => {
        console.error('Auth state change error:', error);
        this.notifyErrorListeners(error);
        toast.error('Erreur d\'authentification');
      }
    );
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  public getUserId(): string | null {
    return this.currentUser?.uid || null;
  }

  public subscribe(callback: AuthCallback): () => void {
    this.listeners.add(callback);
    callback(this.currentUser);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public subscribeToErrors(callback: ErrorCallback): () => void {
    this.errorListeners.add(callback);
    return () => {
      this.errorListeners.delete(callback);
    };
  }

  private notifyListeners(user: User | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }

  private notifyErrorListeners(error: Error): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (error) {
        console.error('Error in error listener:', error);
      }
    });
  }

  public hasPermission(permission: string): boolean {
    return this.isAuthenticated();
  }

  public hasRole(role: string): boolean {
    return this.isAuthenticated();
  }
}

export const authService = AuthService.getInstance();