import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDLqmwvD6u0HA9jXzxuNIBceJMSY5j_4mU",
  authDomain: "bdd-crm-emploi.firebaseapp.com",
  projectId: "bdd-crm-emploi",
  storageBucket: "bdd-crm-emploi.firebasestorage.app", // ✅ important
  messagingSenderId: "137239504456",
  appId: "1:137239504456:web:ee25b5aef7197a3701da7d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app, "gs://bdd-crm-emploi.firebasestorage.app"); // ✅ Forçage du bucket correct

export default app;
