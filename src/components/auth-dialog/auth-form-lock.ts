import { createElement } from '@/shared/lib/dom';
import { createSpinner } from '@/shared/ui/spinner/spinner';
import type { AuthField } from './auth-field';

export type PendingAction = 'submit' | 'google';

export interface FormLockOptions {
  readonly fields: readonly AuthField[];
  readonly submitButton: HTMLButtonElement;
  readonly pendingSubmitLabel: string;
  readonly googleButton: HTMLButtonElement;
  readonly pendingGoogleLabel: string;
  readonly actions: readonly HTMLElement[];
  readonly isValid: () => boolean;
}

function setActionLocked(action: HTMLElement, isLocked: boolean): void {
  if (action instanceof HTMLButtonElement) {
    action.disabled = isLocked;
    return;
  }

  action.toggleAttribute('aria-disabled', isLocked);
  action.classList.toggle('auth-dialog__action--locked', isLocked);
  action.tabIndex = isLocked ? -1 : 0;
}

const idleContents = new WeakMap<HTMLButtonElement, ChildNode[]>();

function setButtonBusy(button: HTMLButtonElement, label: string): void {
  idleContents.set(button, [...button.childNodes]);
  button.replaceChildren(createSpinner(), createElement('span', { text: label }));
  button.setAttribute('aria-busy', 'true');
}

function restoreButton(button: HTMLButtonElement): void {
  const idleContent = idleContents.get(button);

  if (idleContent !== undefined) {
    button.replaceChildren(...idleContent);
    idleContents.delete(button);
  }
  button.removeAttribute('aria-busy');
}

export function createFormLock(
  options: FormLockOptions,
): (pending: PendingAction | undefined) => void {
  return (pending) => {
    const isLocked = pending !== undefined;

    for (const field of options.fields) {
      field.setDisabled(isLocked);
    }
    for (const action of options.actions) {
      setActionLocked(action, isLocked);
    }

    restoreButton(options.submitButton);
    restoreButton(options.googleButton);

    if (pending === 'submit') {
      setButtonBusy(options.submitButton, options.pendingSubmitLabel);
    } else if (pending === 'google') {
      setButtonBusy(options.googleButton, options.pendingGoogleLabel);
    }

    options.googleButton.disabled = isLocked;
    options.submitButton.disabled = isLocked || !options.isValid();
  };
}
