import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from './firebase';

// The minimum identity data the app keeps after Firebase authenticates a user.
export interface AuthProfile {
  readonly displayName: string;
  readonly email: string;
  readonly avatarUrl?: string;
}

export interface RegistrationData {
  readonly username: string;
  readonly email: string;
  readonly password: string;
}

const CANCELLED_ERROR_CODES: ReadonlySet<string> = new Set([
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/user-cancelled',
]);

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/invalid-email': 'The email address is not valid.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'The password is too weak.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/popup-blocked': 'The sign-in popup was blocked by the browser. Allow popups and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
  'auth/user-cancelled': 'Google sign-in was cancelled.',
  'auth/account-exists-with-different-credential':
    'An account with this email already exists with a different sign-in method.',
  'auth/unauthorized-domain': 'Sign-in is not allowed from this domain.',
};

const DEFAULT_ERROR_MESSAGE = 'Authentication failed. Please try again.';

function getErrorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

export function getAuthErrorMessage(error: unknown): string {
  const code = getErrorCode(error);
  return (code !== undefined && ERROR_MESSAGES[code]) || DEFAULT_ERROR_MESSAGE;
}

// True when the user closed or cancelled the provider popup themselves.
export function isAuthCancelledError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code !== undefined && CANCELLED_ERROR_CODES.has(code);
}

function toAuthProfile(user: User, displayName = user.displayName ?? ''): AuthProfile {
  const profile = { displayName, email: user.email ?? '' };
  return user.photoURL ? { ...profile, avatarUrl: user.photoURL } : profile;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthProfile> {
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  return toAuthProfile(credential.user);
}

export async function registerWithEmail(data: RegistrationData): Promise<AuthProfile> {
  const credential = await createUserWithEmailAndPassword(
    getFirebaseAuth(),
    data.email,
    data.password,
  );
  await updateProfile(credential.user, { displayName: data.username });
  return toAuthProfile(credential.user, data.username);
}

export async function signInWithGoogle(): Promise<AuthProfile> {
  const credential = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
  return toAuthProfile(credential.user);
}

export function signOutUser(): Promise<void> {
  return signOut(getFirebaseAuth());
}
