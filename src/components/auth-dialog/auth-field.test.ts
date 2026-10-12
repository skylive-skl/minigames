import { describe, expect, it } from 'vitest';
import { createLockIcon } from '@/shared/ui/icon/icon';
import { createAuthField, type AuthFieldOptions } from './auth-field';

function createField(
  overrides: Partial<AuthFieldOptions> = {},
): ReturnType<typeof createAuthField> {
  return createAuthField({
    id: 'test-password',
    label: 'Password',
    type: 'password',
    autocomplete: 'current-password',
    placeholder: 'Enter your password',
    icon: createLockIcon(),
    ...overrides,
  });
}

function getErrorText(field: ReturnType<typeof createAuthField>): HTMLElement {
  const errorText = field.element.querySelector<HTMLElement>('.auth-dialog__error');
  if (errorText === null) {
    throw new Error('Error element is missing');
  }
  return errorText;
}

function getToggle(field: ReturnType<typeof createAuthField>): HTMLButtonElement {
  const toggle = field.element.querySelector<HTMLButtonElement>('.auth-dialog__toggle-password');
  if (toggle === null) {
    throw new Error('Password toggle is missing');
  }
  return toggle;
}

describe('createAuthField', () => {
  it('links the label and the error message to the input', () => {
    const field = createField();

    expect(field.element.querySelector('label')?.getAttribute('for')).toBe('test-password');
    expect(field.input.getAttribute('aria-describedby')).toBe(getErrorText(field).id);
    expect(getErrorText(field).hidden).toBe(true);
  });

  it('shows an inline error as text and marks the input invalid', () => {
    const field = createField();

    field.setError('<b>Password is required.</b>');

    const errorText = getErrorText(field);
    expect(errorText.hidden).toBe(false);
    expect(errorText.textContent).toBe('<b>Password is required.</b>');
    expect(errorText.childElementCount).toBe(0);
    expect(field.input.getAttribute('aria-invalid')).toBe('true');
    expect(field.element.classList.contains('auth-dialog__field--invalid')).toBe(true);
  });

  it('clears the error once the value becomes valid', () => {
    const field = createField();
    field.setError('Password is required.');

    field.setError(undefined);

    expect(getErrorText(field).hidden).toBe(true);
    expect(field.input.getAttribute('aria-invalid')).toBe('false');
    expect(field.element.classList.contains('auth-dialog__field--invalid')).toBe(false);
  });

  it('toggles password visibility', () => {
    const field = createField({ withPasswordToggle: true });
    const toggle = getToggle(field);

    toggle.click();
    expect(field.input.type).toBe('text');
    expect(toggle.getAttribute('aria-label')).toBe('Hide password');

    toggle.click();
    expect(field.input.type).toBe('password');
    expect(toggle.getAttribute('aria-label')).toBe('Show password');
  });

  it('disables the input together with its toggle', () => {
    const field = createField({ withPasswordToggle: true });

    field.setDisabled(true);

    expect(field.input.disabled).toBe(true);
    expect(getToggle(field).disabled).toBe(true);
  });

  it('resets the value, the error and the revealed password', () => {
    const field = createField({ withPasswordToggle: true });
    field.input.value = 'secret';
    field.setError('Too short');
    getToggle(field).click();

    field.reset();

    expect(field.input.value).toBe('');
    expect(field.input.type).toBe('password');
    expect(field.input.hasAttribute('aria-invalid')).toBe(false);
    expect(getErrorText(field).hidden).toBe(true);
  });
});
