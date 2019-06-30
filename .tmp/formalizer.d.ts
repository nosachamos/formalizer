import { Dispatch, FormEvent, SetStateAction, RefObject } from 'react';
interface ValidatorSettingsType {
  invalidAttr?: {
    [key: string]: any;
  };
  invalidHelperTextAttr?: string;
}
export declare const ValidatorSettings: ValidatorSettingsType;
export declare const ValidatorDefaults: {
  [key: string]: InputValidationConfig | string;
};
export declare const DEFAULT_VALIDATION_ERROR_MESSAGE =
  'This field is not valid.';
declare type ValidatorFunction = (
  value: any,
  options: object | undefined
) => boolean;
interface InputValidationConfig {
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
interface InputValidationByKey {
  [key: string]: InputValidationConfig | string;
}
declare type InputValidation = InputValidationByKey | string;
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
  validation: InputValidation[];
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
  handleSubmit?: FormSubmitHandler | undefined,
  invalidAttr?:
    | {
        [key: string]: any;
      }
    | undefined,
  helperTextAttr?: string | undefined
) => {
  errors: {
    [key: string]: string;
  };
  formValues: FormData;
  isValid: boolean;
  setValues: (formValues: FormData) => void;
  useInput: (
    name: string,
    validationConfigs: InputValidation[]
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
  validation: InputValidationByKey
) => (string | undefined)[] | null;
export {};
