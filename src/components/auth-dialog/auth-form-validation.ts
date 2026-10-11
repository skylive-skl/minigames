import type { AuthField } from './auth-field';
import { hasNoErrors, type FormErrors } from './auth-validation';

export interface FormValidationOptions<K extends string> {
  readonly fields: Readonly<Record<K, AuthField>>;
  readonly validate: (values: Readonly<Record<K, string>>) => FormErrors<Record<K, string>>;
  readonly submitButton: HTMLButtonElement;
}

export interface FormValidation<K extends string> {
  readonly getValues: () => Readonly<Record<K, string>>;
  readonly isValid: () => boolean;
  readonly revealAll: () => boolean;
  readonly reset: () => void;
}

export function createFormValidation<K extends string>(
  options: FormValidationOptions<K>,
): FormValidation<K> {
  const entries = Object.entries(options.fields) as [K, AuthField][];
  const touched = new Set<K>();

  function getValues(): Readonly<Record<K, string>> {
    return Object.fromEntries(entries.map(([key, field]) => [key, field.input.value])) as Record<
      K,
      string
    >;
  }

  function isValid(): boolean {
    return hasNoErrors(options.validate(getValues()));
  }

  function update(): void {
    const errors = options.validate(getValues());

    for (const [key, field] of entries) {
      field.setError(touched.has(key) ? errors[key] : undefined);
    }

    options.submitButton.disabled = !hasNoErrors(errors);
  }

  for (const [key, field] of entries) {
    const markTouchedAndUpdate = (): void => {
      touched.add(key);
      update();
    };
    field.input.addEventListener('input', markTouchedAndUpdate);
    field.input.addEventListener('blur', markTouchedAndUpdate);
  }

  update();

  return {
    getValues,
    isValid,
    revealAll: (): boolean => {
      for (const [key] of entries) {
        touched.add(key);
      }
      update();
      return isValid();
    },
    reset: (): void => {
      touched.clear();
      for (const [, field] of entries) {
        field.reset();
      }
      update();
    },
  };
}
