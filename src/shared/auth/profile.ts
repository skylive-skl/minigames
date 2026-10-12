import type { AppSession } from './app-session';

type ProfileIdentity = Pick<AppSession, 'displayName' | 'email'>;

export const FALLBACK_PROFILE_NAME = 'Player';
export const COMMENT_AUTHOR_MIN_LENGTH = 2;
export const COMMENT_AUTHOR_MAX_LENGTH = 30;

const ALPHANUMERIC_PATTERN = /[\p{L}\p{N}]/u;
const WHITESPACE_PATTERN = /\s+/u;

function getEmailLocalPart(email: string): string {
  const atIndex = email.indexOf('@');
  return (atIndex === -1 ? email : email.slice(0, atIndex)).trim();
}

// displayName, then the part of the email before "@", then a generic name.
export function getProfileName(profile: ProfileIdentity): string {
  const displayName = profile.displayName.trim();

  if (displayName !== '') {
    return displayName;
  }

  const emailName = getEmailLocalPart(profile.email);
  return emailName === '' ? FALLBACK_PROFILE_NAME : emailName;
}

// One word: its first letter or digit; two or more: the first letter or digit
// of each of the first two words. undefined means "show a generic avatar".
export function getInitials(name: string): string | undefined {
  const words = name.trim().split(WHITESPACE_PATTERN).slice(0, 2);
  const initials = words
    .map((word) => ALPHANUMERIC_PATTERN.exec(word)?.[0] ?? '')
    .join('')
    .toUpperCase();

  return initials === '' ? undefined : initials;
}

// The comment API accepts an authorName of 2–30 characters, while a profile
// name (e.g. from Google) can be shorter, longer or missing.
export function getCommentAuthorName(profile: ProfileIdentity): string {
  const candidates = [
    profile.displayName.trim(),
    getEmailLocalPart(profile.email),
    FALLBACK_PROFILE_NAME,
  ];

  for (const candidate of candidates) {
    // Same length rule as the API, which counts string length.
    const name = candidate.slice(0, COMMENT_AUTHOR_MAX_LENGTH).trim();
    if (name.length >= COMMENT_AUTHOR_MIN_LENGTH) {
      return name;
    }
  }

  return FALLBACK_PROFILE_NAME;
}
