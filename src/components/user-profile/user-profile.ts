import type { AppSession } from '@/shared/auth/app-session';
import { getInitials, getProfileName } from '@/shared/auth/profile';
import { createElement } from '@/shared/lib/dom';
import { createPersonIcon } from '@/shared/ui/icon/icon';
import './user-profile.scss';

export type UserProfileVariant = 'header' | 'menu';

export interface UserProfile {
  readonly element: HTMLElement;
  readonly update: (session: AppSession) => void;
}

function createInitialsOrGenericAvatar(name: string): Node {
  const initials = getInitials(name);

  if (initials === undefined) {
    const icon = createPersonIcon();
    icon.classList.add('user-profile__generic-icon');
    return icon;
  }

  return document.createTextNode(initials);
}

export function createUserProfile(variant: UserProfileVariant): UserProfile {
  const name = createElement('span', { className: 'user-profile__name' });
  const avatar = createElement('span', {
    className: 'user-profile__avatar',
    attributes: { 'aria-hidden': 'true' },
  });

  const element = createElement('div', {
    className: `user-profile user-profile--${variant}`,
    children: [name, avatar],
  });

  function showFallback(profileName: string): void {
    avatar.classList.remove('user-profile__avatar--photo');
    avatar.replaceChildren(createInitialsOrGenericAvatar(profileName));
  }

  function showPhoto(url: string, profileName: string): void {
    const image = createElement('img', {
      className: 'user-profile__photo',
      attributes: { src: url, alt: '', referrerpolicy: 'no-referrer' },
    });
    image.addEventListener(
      'error',
      () => {
        showFallback(profileName);
      },
      { once: true },
    );
    avatar.classList.add('user-profile__avatar--photo');
    avatar.replaceChildren(image);
  }

  return {
    element,
    update: (session: AppSession): void => {
      const profileName = getProfileName(session);
      name.textContent = profileName;

      if (session.avatarUrl === undefined) {
        showFallback(profileName);
      } else {
        showPhoto(session.avatarUrl, profileName);
      }
    },
  };
}
