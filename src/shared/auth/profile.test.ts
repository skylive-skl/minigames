import { describe, expect, it } from 'vitest';
import { getCommentAuthorName, getInitials, getProfileName } from './profile';

describe('getProfileName', () => {
  it('uses the trimmed displayName', () => {
    expect(getProfileName({ displayName: '  John Doe ', email: 'john@mail.com' })).toBe('John Doe');
  });

  it('falls back to the email part before "@"', () => {
    expect(getProfileName({ displayName: ' '.repeat(3), email: 'cozy.gamer@mail.com' })).toBe(
      'cozy.gamer',
    );
  });

  it('falls back to a generic name when neither is usable', () => {
    expect(getProfileName({ displayName: '', email: '@mail.com' })).toBe('Player');
  });

  it('keeps markup-like names as plain strings', () => {
    expect(getProfileName({ displayName: '<img src=x>', email: 'a@b.co' })).toBe('<img src=x>');
  });
});

describe('getInitials', () => {
  it.each([
    ['John', 'J'],
    ['john doe', 'JD'],
    ['  John   Ronald Reuel Tolkien ', 'JR'],
    ['Иван Петров', 'ИП'],
    ['élodie', 'É'],
    ['007 agent', '0A'],
    ['_alex', 'A'],
    ['(Mary) [Jane]', 'MJ'],
    ['李 小龙', '李小'],
    ['🎮 Gamer', 'G'],
  ])('builds "%s" initials as "%s"', (name, expected) => {
    expect(getInitials(name)).toBe(expected);
  });

  it.each(['', ' '.repeat(3), '🎮', '--- !!!'])('returns undefined for "%s"', (name) => {
    expect(getInitials(name)).toBeUndefined();
  });
});

describe('getCommentAuthorName', () => {
  it('uses a displayName of a valid length', () => {
    expect(getCommentAuthorName({ displayName: 'CozyGamer99', email: 'c@mail.com' })).toBe(
      'CozyGamer99',
    );
  });

  it('truncates a long displayName to 30 characters', () => {
    const name = getCommentAuthorName({ displayName: 'A'.repeat(40), email: 'c@mail.com' });
    expect(name).toBe('A'.repeat(30));
  });

  it('falls back to the email name when displayName is too short', () => {
    expect(getCommentAuthorName({ displayName: 'J', email: 'john.doe@mail.com' })).toBe('john.doe');
  });

  it('falls back to a generic name when nothing else fits', () => {
    expect(getCommentAuthorName({ displayName: '', email: 'j@mail.com' })).toBe('Player');
  });
});
