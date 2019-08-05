import { InputValidationConfig, Options } from './formalizer';

export const mustMatch = <T extends { [key: string]: any }>(
  fieldName: string
): InputValidationConfig<T> => ({
  errorMessage: `Must match the ${fieldName} field.`,
  validator: (value: string, options: Options<T>) =>
    value === options.formData[fieldName]
});
