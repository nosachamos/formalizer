import { Dispatch, FormEvent, SetStateAction, RefObject } from 'react';
interface ValidatorSettings {
  invalidAttr?: {
    error: boolean;
  };
  invalidHelperTextAttr?: string;
}
export declare const GLOBAL_VALIDATOR_SETTINGS: ValidatorSettings;
export declare const ValidatorDefaults: {
  [key: string]: Formalizer | string;
};
declare type ValidatorFunction = (
  value: any,
  options: object | undefined
) => boolean;
interface Formalizer {
  errorMessage?: string;
  negate?: boolean;
  options?: object;
  validator?: ValidatorFunction;
}
interface FormData {
  [key: string]: any;
}
declare type FormSubmitHandler = (
  e: Event,
  formValues: {
    [ley: string]: any;
  }
) => boolean;
interface ValidationConfigs {
  [key: string]: Formalizer;
}
declare type ValidationErrorUpdater = (
  name: string,
  unmetRuleKey?: string,
  errorMessage?: string
) => void;
interface FormInputParams {
  name: string;
  formHandler: [FormData, Dispatch<SetStateAction<FormData>>];
  updateError: ValidationErrorUpdater;
  invalidAttr?: object;
  validation: ValidationConfigs;
  helperTextAttr?: string;
}
interface InputAttributes {
  value: any;
  name: string;
  onChange: (e: FormEvent<HTMLInputElement>) => any;
  onBlur: () => any;
  helperTextObj?: {
    [key: string]: string;
  };
  invalidAttr?: object;
}
export declare const useFormInput: ({
  name,
  formHandler,
  validation,
  updateError,
  invalidAttr,
  helperTextAttr
}: FormInputParams) => InputAttributes;
export declare const useForm: (
  formRef: RefObject<HTMLFormElement>,
  defaultValues: FormData,
  handleSubmit: FormSubmitHandler,
  invalidAttr?:
    | {
        error: boolean;
      }
    | undefined,
  helperTextAttr?: string | undefined
) => {
  errors: {
    [key: string]: string;
  };
  formValues: FormData;
  isValid: boolean;
  setValues: Dispatch<SetStateAction<FormData>>;
  useInput: (
    name: string,
    validationConfigs: ValidationConfigs
  ) => InputAttributes;
  validateForm: () => boolean;
};
/**
 * Returns either unmet rule, or null
 * @param value
 * @param validation
 * @returns {*}
 */
export declare const validate: (
  value: any,
  validation: {
    [key: string]: string | Formalizer;
  }
) => (string | undefined)[] | null;
export {};
