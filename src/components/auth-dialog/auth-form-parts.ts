import { createElement } from '@/shared/lib/dom';
import { createGoogleIcon } from '@/shared/ui/icon/icon';

export function createDivider(): HTMLElement {
  return createElement('div', {
    className: 'auth-dialog__divider',
    children: [createElement('span', { text: 'OR' })],
  });
}

export function createGoogleButton(label: string): HTMLButtonElement {
  return createElement('button', {
    className: 'auth-dialog__google-button',
    attributes: { type: 'button' },
    children: [createGoogleIcon(), createElement('span', { text: label })],
  });
}

export function createSubmitButton(label: string): HTMLButtonElement {
  return createElement('button', {
    className: 'auth-dialog__submit',
    text: label,
    attributes: { type: 'submit' },
  });
}

export function createSwitchText(
  prompt: string,
  linkLabel: string,
  onClick: () => void,
): { readonly element: HTMLElement; readonly button: HTMLButtonElement } {
  const button = createElement('button', {
    className: 'auth-dialog__switch-link',
    text: linkLabel,
    attributes: { type: 'button' },
    onClick,
  });

  const element = createElement('p', {
    className: 'auth-dialog__switch-text',
    children: [document.createTextNode(prompt), button],
  });

  return { element, button };
}
