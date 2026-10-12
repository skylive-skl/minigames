import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAuthErrorMessage,
  isAuthCancelledError,
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
} from './auth-service';

const fakeAuth = { name: 'fake-auth' };

vi.mock('./firebase', () => ({ getFirebaseAuth: (): unknown => fakeAuth }));
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  GoogleAuthProvider: vi.fn(),
}));

function credentialFor(user: Partial<User>): UserCredential {
  return { user } as UserCredential;
}

function firebaseError(code: string): Error & { code: string } {
  return Object.assign(new Error(code), { code });
}

describe('auth service', () => {
  beforeEach(() => {
    vi.mocked(updateProfile).mockResolvedValue();
  });

  it('signs in with email and password and maps the user to a profile', async () => {
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue(
      credentialFor({ displayName: 'Alex', email: 'alex@mail.com' }),
    );

    await expect(signInWithEmail('alex@mail.com', 'Secret1!')).resolves.toEqual({
      displayName: 'Alex',
      email: 'alex@mail.com',
    });
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(fakeAuth, 'alex@mail.com', 'Secret1!');
  });

  it('registers a user and saves the username as displayName', async () => {
    const credential = credentialFor({ email: 'new@mail.com' });
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValue(credential);

    const profile = await registerWithEmail({
      username: 'CozyGamer99',
      email: 'new@mail.com',
      password: 'Secret1!',
    });

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      fakeAuth,
      'new@mail.com',
      'Secret1!',
    );
    expect(updateProfile).toHaveBeenCalledWith(credential.user, { displayName: 'CozyGamer99' });
    expect(profile).toEqual({ displayName: 'CozyGamer99', email: 'new@mail.com' });
  });

  it('propagates registration failures without updating the profile', async () => {
    vi.mocked(createUserWithEmailAndPassword).mockRejectedValue(
      firebaseError('auth/email-already-in-use'),
    );

    await expect(
      registerWithEmail({ username: 'Alex', email: 'a@b.co', password: 'Secret1!' }),
    ).rejects.toMatchObject({ code: 'auth/email-already-in-use' });
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('signs in with a Google popup and keeps the photo as avatarUrl', async () => {
    vi.mocked(signInWithPopup).mockResolvedValue(
      credentialFor({
        displayName: 'Alex Doe',
        email: 'alex@gmail.com',
        photoURL: 'https://example.com/a.png',
      }),
    );

    await expect(signInWithGoogle()).resolves.toEqual({
      displayName: 'Alex Doe',
      email: 'alex@gmail.com',
      avatarUrl: 'https://example.com/a.png',
    });
    expect(signInWithPopup).toHaveBeenCalledWith(fakeAuth, expect.any(GoogleAuthProvider));
  });

  it('uses empty strings when Firebase has no name or email', async () => {
    vi.mocked(signInWithPopup).mockResolvedValue(credentialFor({}));

    await expect(signInWithGoogle()).resolves.toEqual({ displayName: '', email: '' });
  });

  it('signs out of Firebase', async () => {
    vi.mocked(signOut).mockResolvedValue();

    await signOutUser();

    expect(signOut).toHaveBeenCalledWith(fakeAuth);
  });
});

describe('getAuthErrorMessage', () => {
  it.each([
    ['auth/invalid-credential', 'Incorrect email or password.'],
    ['auth/email-already-in-use', 'An account with this email already exists.'],
    ['auth/too-many-requests', 'Too many attempts. Please wait a moment and try again.'],
    ['auth/network-request-failed', 'Network error. Check your connection and try again.'],
  ])('maps %s to a readable message', (code, message) => {
    expect(getAuthErrorMessage(firebaseError(code))).toBe(message);
  });

  it('falls back to a generic message for unknown errors', () => {
    expect(getAuthErrorMessage(firebaseError('auth/something-new'))).toBe(
      'Authentication failed. Please try again.',
    );
    expect(getAuthErrorMessage(new Error('boom'))).toBe('Authentication failed. Please try again.');
    expect(getAuthErrorMessage('boom')).toBe('Authentication failed. Please try again.');
  });
});

describe('isAuthCancelledError', () => {
  it('detects a closed or cancelled provider popup', () => {
    expect(isAuthCancelledError(firebaseError('auth/popup-closed-by-user'))).toBe(true);
    expect(isAuthCancelledError(firebaseError('auth/cancelled-popup-request'))).toBe(true);
  });

  it('does not treat real failures as cancellation', () => {
    expect(isAuthCancelledError(firebaseError('auth/network-request-failed'))).toBe(false);
    expect(isAuthCancelledError(undefined)).toBe(false);
  });
});
