import { Dispatch, FormEvent, SetStateAction, RefObject } from 'react';
interface ValidatorSettingsType {
  invalidAttr?: {
    error: boolean;
  };
  invalidHelperTextAttr?: string;
}
export declare const ValidatorSettings: ValidatorSettingsType;
export declare const ValidatorDefaults: {
  [key: string]: InputValidationConfigs | string;
};
declare type ValidatorFunction = (
  value: any,
  options: object | undefined
) => boolean;
interface InputValidationConfigs {
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
interface FormValidationConfigs {
  [key: string]: InputValidationConfigs;
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
  validation: FormValidationConfigs;
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
    validationConfigs: FormValidationConfigs
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
    [key: string]: string | InputValidationConfigs;
  }
) => (string | undefined)[] | null;
export {};
