import { describe, expect, it } from 'vitest';
import {
  hasNoErrors,
  validateConfirmPassword,
  validateEmail,
  validateLoginForm,
  validateLoginPassword,
  validateRegisterForm,
  validateRegisterPassword,
  validateUsername,
} from './auth-validation';

describe('validateEmail', () => {
  it.each(['alex@minigames.com', 'first.last+tag@sub.domain.io', 'a_b-c@x-y.co'])(
    'accepts %s',
    (email) => {
      expect(validateEmail(email)).toBeUndefined();
    },
  );

  it('requires a value', () => {
    expect(validateEmail('')).toBe('Email is required.');
  });

  it.each(['alex', 'alex@', '@mail.com', 'alex@mail', 'alex@mail.c', 'al ex@mail.com', 'a@-x.com'])(
    'rejects %s',
    (email) => {
      expect(validateEmail(email)).toBe('Enter a valid email address.');
    },
  );
});

describe('validateUsername', () => {
  it.each(['Al', 'Alex', 'CozyGamer99', `A${'b'.repeat(29)}`])('accepts %s', (username) => {
    expect(validateUsername(username)).toBeUndefined();
  });

  it.each([
    ['', 'Username is required.'],
    ['alex', 'Username must start with an uppercase English letter.'],
    ['1Alex', 'Username must start with an uppercase English letter.'],
    ['Alex_99', 'Username may contain English letters and digits only.'],
    ['Alex 99', 'Username may contain English letters and digits only.'],
    ['Алекс', 'Username may contain English letters and digits only.'],
    ['A', 'Username must be 2–30 characters long.'],
    [`A${'b'.repeat(30)}`, 'Username must be 2–30 characters long.'],
  ])('rejects "%s"', (username, message) => {
    expect(validateUsername(username)).toBe(message);
  });
});

describe('validateLoginPassword', () => {
  it('accepts any password of six or more characters', () => {
    expect(validateLoginPassword('abcdef')).toBeUndefined();
  });

  it('requires a value and a minimum length', () => {
    expect(validateLoginPassword('')).toBe('Password is required.');
    expect(validateLoginPassword('abcde')).toBe('Password must be at least 6 characters long.');
  });
});

describe('validateRegisterPassword', () => {
  it.each(['Abc1!x', 'Secret123$', 'P@ssw0rd', 'Zz9~zz'])('accepts %s', (password) => {
    expect(validateRegisterPassword(password)).toBeUndefined();
  });

  it.each([
    ['', 'Password is required.'],
    ['Ab1!', 'Password must be at least 6 characters long.'],
    ['abc1!x', 'Password must contain at least one uppercase English letter.'],
    ['Abcde!', 'Password must contain at least one digit.'],
    ['Abcde1', 'Password must contain at least one special character.'],
    ['Abc 1!x', 'Password may contain English letters, digits and special characters only.'],
    ['Пароль1!A', 'Password may contain English letters, digits and special characters only.'],
  ])('rejects "%s"', (password, message) => {
    expect(validateRegisterPassword(password)).toBe(message);
  });
});

describe('validateConfirmPassword', () => {
  it('requires a value', () => {
    expect(validateConfirmPassword('Abc1!x', '')).toBe('Please confirm your password.');
  });

  it('checks only that both values match', () => {
    expect(validateConfirmPassword('Abc1!x', 'Abc1!x')).toBeUndefined();
    expect(validateConfirmPassword('weak', 'weak')).toBeUndefined();
    expect(validateConfirmPassword('Abc1!x', 'Abc1!y')).toBe('Passwords do not match.');
  });
});

describe('form validation', () => {
  it('validates every login field', () => {
    expect(validateLoginForm({ email: 'bad', password: '' })).toEqual({
      email: 'Enter a valid email address.',
      password: 'Password is required.',
    });
    expect(hasNoErrors(validateLoginForm({ email: 'a@b.co', password: 'abcdef' }))).toBe(true);
  });

  it('applies registration rules and the confirm match', () => {
    const errors = validateRegisterForm({
      username: 'Alex',
      email: 'alex@mail.com',
      password: 'Abc1!x',
      confirmPassword: 'Abc1!',
    });

    expect(errors).toEqual({
      username: undefined,
      email: undefined,
      password: undefined,
      confirmPassword: 'Passwords do not match.',
    });
    expect(hasNoErrors(errors)).toBe(false);
  });
});
