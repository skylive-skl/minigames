import { createElement } from '@/shared/lib/dom';
import { createEyeIcon, createEyeOffIcon } from '@/shared/ui/icon/icon';
import type { FieldError } from './auth-validation';

export interface AuthFieldOptions {
  readonly id: string;
  readonly label: string;
  readonly type: string;
  readonly autocomplete: string;
  readonly placeholder: string;
  readonly icon: SVGElement;
  readonly withPasswordToggle?: boolean;
}

export interface AuthField {
  readonly element: HTMLElement;
  readonly input: HTMLInputElement;
  readonly setError: (error: FieldError) => void;
  readonly setDisabled: (isDisabled: boolean) => void;
  readonly reset: () => void;
}

export function createAuthField(options: AuthFieldOptions): AuthField {
  const errorId = `${options.id}-error`;

  const label = createElement('label', {
    className: 'auth-dialog__label',
    text: options.label,
    attributes: { for: options.id },
  });

  const input = createElement('input', {
    className: 'auth-dialog__input',
    attributes: {
      id: options.id,
      name: options.id,
      type: options.type,
      autocomplete: options.autocomplete,
      placeholder: options.placeholder,
      'aria-describedby': errorId,
    },
  });

  const iconWrap = createElement('span', {
    className: 'auth-dialog__input-icon',
    attributes: { 'aria-hidden': 'true' },
    children: [options.icon],
  });

  const inputWrapChildren: Node[] = [iconWrap, input];
  let toggle: HTMLButtonElement | undefined;

  function setPasswordVisible(isVisible: boolean): void {
    if (toggle === undefined) {
      return;
    }
    input.type = isVisible ? 'text' : 'password';
    toggle.replaceChildren(isVisible ? createEyeOffIcon() : createEyeIcon());
    toggle.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password');
  }

  if (options.withPasswordToggle === true) {
    toggle = createElement('button', {
      className: 'auth-dialog__toggle-password',
      attributes: { type: 'button', 'aria-label': 'Show password' },
      children: [createEyeIcon()],
      onClick: () => {
        setPasswordVisible(input.type === 'password');
      },
    });

    inputWrapChildren.push(toggle);
  }

  const inputWrap = createElement('div', {
    className: 'auth-dialog__input-wrap',
    children: inputWrapChildren,
  });

  const errorText = createElement('p', {
    className: 'auth-dialog__error',
    attributes: { id: errorId },
  });
  errorText.hidden = true;

  const element = createElement('div', {
    className: 'auth-dialog__field',
    children: [label, inputWrap, errorText],
  });

  function setError(error: FieldError): void {
    errorText.textContent = error ?? '';
    errorText.hidden = error === undefined;
    input.setAttribute('aria-invalid', String(error !== undefined));
    element.classList.toggle('auth-dialog__field--invalid', error !== undefined);
  }

  return {
    element,
    input,
    setError,
    setDisabled: (isDisabled: boolean): void => {
      input.disabled = isDisabled;
      if (toggle !== undefined) {
        toggle.disabled = isDisabled;
      }
    },
    reset: (): void => {
      input.value = '';
      input.removeAttribute('aria-invalid');
      errorText.textContent = '';
      errorText.hidden = true;
      element.classList.remove('auth-dialog__field--invalid');
      setPasswordVisible(false);
    },
  };
}
