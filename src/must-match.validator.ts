import { InputValidationConfig, Options } from './formalizer';

export const mustMatch = (fieldName: string): InputValidationConfig => ({
  errorMessage: `Must match the ${fieldName} field.`,
  validator: (value: string, options: Options) =>
    value === options.formData[fieldName]
});
