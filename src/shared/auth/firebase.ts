import { initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// The web config is public by design: Firebase restricts its use through the
// project's authorized domains, not by keeping these values secret.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const instances: { auth?: Auth } = {};

// Firebase only provides the identity; whether the UI treats the user as
// signed in is decided by the app session, not by Firebase's own persistence.
export function getFirebaseAuth(): Auth {
  instances.auth ??= getAuth(initializeApp(firebaseConfig));
  return instances.auth;
}
