export interface LoginValues {
  readonly email: string;
  readonly password: string;
}

export interface RegisterValues {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
}

// undefined means the field is valid.
export type FieldError = string | undefined;

export type FormErrors<T> = Readonly<Record<keyof T, FieldError>>;

export const PASSWORD_MIN_LENGTH = 6;
export const USERNAME_MIN_LENGTH = 2;
export const USERNAME_MAX_LENGTH = 30;

const EMAIL_PATTERN =
  /^[\w.%+-]+@[a-z\d](?:[a-z\d-]*[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]*[a-z\d])?)*\.[a-z]{2,}$/iu;
const UPPERCASE_PATTERN = /[A-Z]/u;
const DIGIT_PATTERN = /\d/u;
// Printable ASCII punctuation: !"#$%&'()*+,-./ :;<=>?@ [\]^_` {|}~
const SPECIAL_CHARACTER_PATTERN = /[!-/:-@[-`{-~]/u;
const PASSWORD_ALLOWED_PATTERN = /^[A-Za-z\d!-/:-@[-`{-~]+$/u;
const USERNAME_FIRST_CHARACTER_PATTERN = /^[A-Z]/u;
const USERNAME_ALLOWED_PATTERN = /^[A-Za-z\d]+$/u;

export function validateEmail(value: string): FieldError {
  if (value === '') {
    return 'Email is required.';
  }
  return EMAIL_PATTERN.test(value) ? undefined : 'Enter a valid email address.';
}

export function validateUsername(value: string): FieldError {
  if (value === '') {
    return 'Username is required.';
  }
  if (!USERNAME_ALLOWED_PATTERN.test(value)) {
    return 'Username may contain English letters and digits only.';
  }
  if (!USERNAME_FIRST_CHARACTER_PATTERN.test(value)) {
    return 'Username must start with an uppercase English letter.';
  }
  return value.length < USERNAME_MIN_LENGTH || value.length > USERNAME_MAX_LENGTH
    ? `Username must be ${String(USERNAME_MIN_LENGTH)}–${String(USERNAME_MAX_LENGTH)} characters long.`
    : undefined;
}

// Login only checks presence and length: strength rules apply at registration.
export function validateLoginPassword(value: string): FieldError {
  if (value === '') {
    return 'Password is required.';
  }
  return value.length < PASSWORD_MIN_LENGTH
    ? `Password must be at least ${String(PASSWORD_MIN_LENGTH)} characters long.`
    : undefined;
}

export function validateRegisterPassword(value: string): FieldError {
  const basicError = validateLoginPassword(value);

  if (basicError !== undefined) {
    return basicError;
  }
  if (!PASSWORD_ALLOWED_PATTERN.test(value)) {
    return 'Password may contain English letters, digits and special characters only.';
  }
  if (!UPPERCASE_PATTERN.test(value)) {
    return 'Password must contain at least one uppercase English letter.';
  }
  if (!DIGIT_PATTERN.test(value)) {
    return 'Password must contain at least one digit.';
  }
  return SPECIAL_CHARACTER_PATTERN.test(value)
    ? undefined
    : 'Password must contain at least one special character.';
}

// Only the match is checked; the password rules are not repeated here.
export function validateConfirmPassword(password: string, confirmPassword: string): FieldError {
  if (confirmPassword === '') {
    return 'Please confirm your password.';
  }
  return confirmPassword === password ? undefined : 'Passwords do not match.';
}

export function validateLoginForm(values: LoginValues): FormErrors<LoginValues> {
  return {
    email: validateEmail(values.email),
    password: validateLoginPassword(values.password),
  };
}

export function validateRegisterForm(values: RegisterValues): FormErrors<RegisterValues> {
  return {
    username: validateUsername(values.username),
    email: validateEmail(values.email),
    password: validateRegisterPassword(values.password),
    confirmPassword: validateConfirmPassword(values.password, values.confirmPassword),
  };
}

export function hasNoErrors<T>(errors: FormErrors<T>): boolean {
  return Object.values<FieldError>(errors).every((error) => error === undefined);
}
