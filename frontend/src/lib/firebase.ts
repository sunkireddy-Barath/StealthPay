import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let googleProviderInstance: GoogleAuthProvider | null = null;

if (isConfigured) {
  app = initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  googleProviderInstance = new GoogleAuthProvider();
} else if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    "Firebase env vars are missing — Google sign-in is disabled. " +
      "Set VITE_FIREBASE_* in frontend/.env to enable.",
  );
}

export const auth = authInstance;
export const googleProvider = googleProviderInstance;
export const isFirebaseConfigured = isConfigured;
export default app;
