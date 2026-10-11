import { describe, expect, it, vi } from 'vitest';
import {
  APP_SESSION_KEY,
  createSessionRecord,
  getSessionRemainingMs,
  isSessionExpired,
  parseSessionRecord,
  readSessionRecord,
  removeSessionRecord,
  SESSION_LIFETIME_MS,
  writeSessionRecord,
  type AppSession,
} from './app-session';

const NOW = 1_760_000_000_000;

function throwStorageDenied(): never {
  throw new DOMException('Denied', 'SecurityError');
}

const session: AppSession = {
  displayName: 'Alex',
  email: 'alex@mail.com',
  authenticatedAt: NOW,
};

describe('createSessionRecord', () => {
  it('stores the profile with the sign-in timestamp', () => {
    expect(createSessionRecord({ displayName: 'Alex', email: 'alex@mail.com' }, NOW)).toEqual(
      session,
    );
  });

  it('keeps avatarUrl only when the profile has one', () => {
    const record = createSessionRecord(
      { displayName: 'Alex', email: 'alex@mail.com', avatarUrl: 'https://a.png' },
      NOW,
    );

    expect(record).toEqual({ ...session, avatarUrl: 'https://a.png' });
    expect(Object.keys(createSessionRecord(session, NOW))).not.toContain('avatarUrl');
  });
});

describe('parseSessionRecord', () => {
  it('restores a valid record unchanged', () => {
    expect(parseSessionRecord(JSON.stringify(session))).toEqual(session);
    expect(parseSessionRecord(JSON.stringify({ ...session, avatarUrl: 'https://a.png' }))).toEqual({
      ...session,
      avatarUrl: 'https://a.png',
    });
  });

  it('ignores unrelated fields', () => {
    expect(parseSessionRecord(JSON.stringify({ ...session, token: 'secret' }))).toEqual(session);
  });

  it.each([
    ['missing value', undefined],
    ['invalid JSON', '{not json'],
    ['JSON primitive', '42'],
    ['JSON array', '[]'],
    ['JSON null', 'null'],
    ['missing email', JSON.stringify({ displayName: 'A', authenticatedAt: NOW })],
    ['empty email', JSON.stringify({ ...session, email: '' })],
    ['missing displayName', JSON.stringify({ email: 'a@b.co', authenticatedAt: NOW })],
    ['numeric displayName', JSON.stringify({ ...session, displayName: 1 })],
    ['string timestamp', JSON.stringify({ ...session, authenticatedAt: String(NOW) })],
    ['missing timestamp', JSON.stringify({ displayName: 'A', email: 'a@b.co' })],
    ['non-string avatar', JSON.stringify({ ...session, avatarUrl: 5 })],
  ])('rejects %s', (_label, raw) => {
    expect(parseSessionRecord(raw)).toBeUndefined();
  });
});

describe('session expiry', () => {
  it('reports the time left from the fixed sign-in timestamp', () => {
    expect(getSessionRemainingMs(session, NOW)).toBe(SESSION_LIFETIME_MS);
    expect(getSessionRemainingMs(session, NOW + 60_000)).toBe(SESSION_LIFETIME_MS - 60_000);
  });

  it('expires exactly five minutes after sign-in', () => {
    expect(SESSION_LIFETIME_MS).toBe(300_000);
    expect(isSessionExpired(session, NOW + SESSION_LIFETIME_MS - 1)).toBe(false);
    expect(isSessionExpired(session, NOW + SESSION_LIFETIME_MS)).toBe(true);
  });

  it('treats a timestamp from the future as expired', () => {
    expect(isSessionExpired(session, NOW - 1)).toBe(true);
  });
});

describe('session storage', () => {
  it('writes, reads and removes only the namespaced key', () => {
    localStorage.setItem('unrelated', 'keep me');

    writeSessionRecord(session);
    expect(localStorage.getItem(APP_SESSION_KEY)).toBe(JSON.stringify(session));
    expect(readSessionRecord()).toBe(JSON.stringify(session));

    removeSessionRecord();
    expect(readSessionRecord()).toBeUndefined();
    expect(localStorage.getItem('unrelated')).toBe('keep me');
  });

  it('survives storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(throwStorageDenied);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(throwStorageDenied);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(throwStorageDenied);

    expect(readSessionRecord()).toBeUndefined();
    expect(() => {
      writeSessionRecord(session);
    }).not.toThrow();
    expect(() => {
      removeSessionRecord();
    }).not.toThrow();
  });
});
