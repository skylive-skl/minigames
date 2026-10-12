import { describe, expect, it } from 'vitest';
import type { AppSession } from '@/shared/auth/app-session';
import { createUserProfile } from './user-profile';

const session: AppSession = {
  displayName: 'John Doe',
  email: 'john@mail.com',
  authenticatedAt: 0,
};

function avatarOf(profile: ReturnType<typeof createUserProfile>): HTMLElement {
  const avatar = profile.element.querySelector<HTMLElement>('.user-profile__avatar');
  if (avatar === null) {
    throw new Error('Avatar is missing');
  }
  return avatar;
}

function nameOf(profile: ReturnType<typeof createUserProfile>): HTMLElement {
  const name = profile.element.querySelector<HTMLElement>('.user-profile__name');
  if (name === null) {
    throw new Error('Name is missing');
  }
  return name;
}

describe('createUserProfile', () => {
  it('shows the display name and its initials', () => {
    const profile = createUserProfile('header');

    profile.update(session);

    expect(nameOf(profile).textContent).toBe('John Doe');
    expect(avatarOf(profile).textContent).toBe('JD');
    expect(profile.element.classList.contains('user-profile--header')).toBe(true);
  });

  it('renders the name as text, never as HTML', () => {
    const profile = createUserProfile('menu');

    profile.update({ ...session, displayName: '<img src=x onerror=alert(1)>' });

    expect(nameOf(profile).textContent).toBe('<img src=x onerror=alert(1)>');
    expect(nameOf(profile).childElementCount).toBe(0);
  });

  it('uses the email name when displayName is empty', () => {
    const profile = createUserProfile('header');

    profile.update({ ...session, displayName: '' });

    expect(nameOf(profile).textContent).toBe('john');
    expect(avatarOf(profile).textContent).toBe('J');
  });

  it('shows the profile photo when avatarUrl is present', () => {
    const profile = createUserProfile('header');

    profile.update({ ...session, avatarUrl: 'https://example.com/john.png' });

    const photo = avatarOf(profile).querySelector('img');
    expect(photo?.getAttribute('src')).toBe('https://example.com/john.png');
    expect(avatarOf(profile).textContent).toBe('');
  });

  it('falls back to initials when the photo fails to load', () => {
    const profile = createUserProfile('header');
    profile.update({ ...session, avatarUrl: 'https://example.com/broken.png' });

    avatarOf(profile).querySelector('img')?.dispatchEvent(new Event('error'));

    expect(avatarOf(profile).querySelector('img')).toBeNull();
    expect(avatarOf(profile).textContent).toBe('JD');
  });

  it('shows a generic avatar when the name has no letters or digits', () => {
    const profile = createUserProfile('header');

    profile.update({ ...session, displayName: '🎮 ---' });

    expect(avatarOf(profile).textContent).toBe('');
    expect(avatarOf(profile).querySelector('svg')).not.toBeNull();
  });

  it('replaces the previous user on update', () => {
    const profile = createUserProfile('header');
    profile.update({ ...session, avatarUrl: 'https://example.com/john.png' });

    profile.update({ ...session, displayName: 'Ann' });

    expect(nameOf(profile).textContent).toBe('Ann');
    expect(avatarOf(profile).querySelector('img')).toBeNull();
    expect(avatarOf(profile).textContent).toBe('A');
  });
});
