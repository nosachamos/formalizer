import React, {
  Dispatch,
  FormEvent,
  MutableRefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState
} from 'react';
import { FORMALIZER_ID_DATA_ATTRIBUTE, useFormInput } from './use-form-input';

interface FormalizerSettingsType {
  invalidAttr?: { [key: string]: any };
  helperTextAttr?: string;
  keepUnknownAttributes?: boolean;
}

export const FormalizerSettings: FormalizerSettingsType = {
  helperTextAttr: undefined,
  invalidAttr: { error: true },
  keepUnknownAttributes: false
};

export interface SingleErrorPerInput {
  [key: string]: string;
}
export interface ErrorByValidatorKey {
  [key: string]: string;
}
export interface MultipleErrorsPerInput {
  [key: string]: ErrorByValidatorKey;
}

export const GlobalValidators: {
  [key: string]: InputValidationConfig<any> | string;
} = {
  isRequired: 'This field is required.'
};

export const DEFAULT_VALIDATION_ERROR_MESSAGE = 'This field is not valid.';

export type ValidatorFunction<T> = (
  value: any,
  options: ValidatorFunctionOptions<T>
) => boolean;

export interface InputValidationConfig<T> {
  key?: string;
  errorMessage?: string | ErrorMessageFunction<T>;
  negate?: boolean;
  options?: InputValidationOptions;
  validator?: ValidatorFunction<T> | string;
}

export const isInputValidationConfig = <T>(
  value: any
): value is InputValidationConfig<T> =>
  value !== undefined &&
  value !== null &&
  (typeof value.validator === 'string' ||
    typeof value.validator === 'function');

type FormSubmitHandler<T> = (formValues: T, e?: Event) => void;

export type ErrorMessageFunction<T> = (value: string, formData: T) => string;

export interface InputValidationByKey<T> {
  [key: string]: InputValidationConfig<T> | string;
}

export interface ValidationSettings {
  reportMultipleErrors?: boolean;
  omitTypeAttribute?: boolean;
}

export interface ValidationSettingsWithTypeOmitted {
  omitTypeAttribute: true;
}

type InputValidation<T> = InputValidationConfig<T> | string;

export type ValidationErrorCleaner = (
  name: string,
  reportMultipleErrors: boolean,
  ruleKey?: string
) => void;

export type ValidationErrorReporter = (
  name: string,
  reportMultipleErrors: boolean,
  ruleKey: string,
  errorMessage: string
) => void;

export type SupportedInputTypes = 'text' | 'checkbox' | 'radio' | 'button';

export interface FormInputParams<T, I> {
  name: string;
  errors: SingleErrorPerInput | MultipleErrorsPerInput;
  formHandler: [T, Dispatch<SetStateAction<T>>];
  formRef: MutableRefObject<HTMLFormElement | null>;
  clearError: ValidationErrorCleaner;
  reportError: ValidationErrorReporter;
  invalidAttr?: object;
  inputType: I;
  inputValueAttributeVal?: string;
  submitHandler?: FormSubmitHandler<T>;
  validation: Array<InputValidation<T>> | string;
  helperTextAttr?: string;
  validationSettings?: ValidationSettings;
}

export interface FormInputData<I> {
  inputAttr: InputAttributes<I>;
  runValidations: () => boolean;
}

export interface InputAttributes<I> {
  value?: any;
  checked?: boolean;
  name: string;
  onKeyPress: (e: React.KeyboardEvent<any> | KeyboardEvent) => void;
  onChange: (e: React.ChangeEvent<any> | FormEvent<any>) => void;
  onBlur: () => any;
  helperTextObj?: { [key: string]: string };
  invalidAttr?: object;
  type?: I | undefined;
  [FORMALIZER_ID_DATA_ATTRIBUTE]: string;
}

export interface InputValidationOptions {
  [key: string]: any;
}

export interface ValidatorFunctionOptions<T> extends InputValidationOptions {
  formData: T;
}

export function setupForMaterialUI(): void {
  FormalizerSettings.invalidAttr = { error: true };
  FormalizerSettings.helperTextAttr = 'helperText';
}

export interface Formalizer<T> {
  errors: SingleErrorPerInput | MultipleErrorsPerInput;
  formRef: React.MutableRefObject<HTMLFormElement | null>;
  formValues: T;
  isValid: boolean;
  performValidations: () => boolean;
  setValues: (formValues: T) => void;
  useCheckboxInput: <V extends ValidationSettings>(
    name: string,
    options?: V | undefined
  ) => InputAttributes<undefined>;
  useInput: <V extends ValidationSettings>(
    name: string,
    validationConfigs?: string | Array<InputValidation<T>> | undefined,
    options?: V | undefined
  ) => InputAttributes<undefined>;
  useRadioInput: <V extends ValidationSettings>(
    name: string,
    value: string,
    options?: V | undefined
  ) => InputAttributes<undefined>;
  useToggleInput: <V extends ValidationSettings>(
    name: string,
    options?: V | undefined
  ) => InputAttributes<undefined>;
}

export const useFormalizer = <
  T extends { [key: string]: any },
  N extends Partial<T>
>(
  submitHandler?: FormSubmitHandler<T>,
  initialValues?: N,
  settings?: FormalizerSettingsType
): Formalizer<T> => {
  // some basic validations
  if (!!submitHandler && typeof submitHandler !== 'function') {
    throw new Error(
      'Formalizer: the given form submit handler argument is of an invalid type. Must be a function.'
    );
  }
  if (
    !!initialValues &&
    (typeof initialValues !== 'object' || Array.isArray(initialValues))
  ) {
    throw new Error(
      'Formalizer: the given initial values argument is of an invalid type. Must be an object.'
    );
  }

  const formRef = useRef(null) as MutableRefObject<HTMLFormElement | null>;
  const { invalidAttr, helperTextAttr } = settings
    ? { ...FormalizerSettings, ...settings }
    : FormalizerSettings;

  const formHandler = useState<T>(initialValues ? initialValues : ({} as any));
  const errorHandler = useState<SingleErrorPerInput | MultipleErrorsPerInput>(
    {}
  );
  const [mounted, setMounted] = useState(false);

  /**
   * Map of form inputs by input name. When we have a connected form, there is an entry per form.
   * There is one special entry for disconnected forms.
   */
  const formInputsMap = useRef<{
    [key: string]: { [key: string]: FormInputData<any> };
  }>({});

  const DISCONNECTED_FORM_INPUTS = '$$$DISCONNECTED_FORM_INPUTS$$$';

  const [values, setValues] = formHandler;
  const [errors, setErrors] = errorHandler;

  const clearError = (
    name: string,
    reportMultipleErrors: boolean,
    key?: string
  ) => {
    if (reportMultipleErrors && key) {
      const errorForInput = errors[name] as ErrorByValidatorKey | undefined;
      if (errorForInput) {
        delete errorForInput[key];

        if (Object.keys(errorForInput).length === 0) {
          delete errors[name];
        }
      }
    } else {
      delete errors[name];
    }
    setErrors(errors);
  };

  const reportError = (
    name: string,
    reportMultipleErrors: boolean,
    unmetRuleKey: string,
    errorMessage: string
  ) => {
    if (reportMultipleErrors) {
      let errorsForInput = errors[name] as ErrorByValidatorKey;

      if (!errorsForInput) {
        errorsForInput = {};
        errors[name] = errorsForInput;
      }

      errorsForInput[unmetRuleKey] = errorMessage;
    } else {
      errors[name] = errorMessage;
    }

    setErrors(errors);
  };

  // initial mounted flag
  useEffect(() => setMounted(true), []);

  if (formRef && formRef.current) {
    if (!formRef.current.formValidationIdAttr) {
      formRef.current.formValidationIdAttr = Math.random()
        .toString(36)
        .substr(2, 9);
    }
  }

  const performValidations = () => {
    if (formRef.current) {
      const formInputsByUniqueId =
        formInputsMap.current[formRef.current.formValidationIdAttr];

      // trigger validation on each of the form's inputs
      if (formInputsByUniqueId) {
        Object.keys(formInputsByUniqueId).forEach(inputUniqueId =>
          formInputsByUniqueId[inputUniqueId].inputAttr.onBlur()
        );
      }
    } else {
      const formInputsByUniqueId =
        formInputsMap.current[DISCONNECTED_FORM_INPUTS];

      // trigger validation on each of the form's inputs
      const allInputsValid = Object.keys(
        formInputsByUniqueId
      ).every(inputUniqueId =>
        formInputsByUniqueId[inputUniqueId].runValidations()
      );

      // now we need to trigger the submit handler if there are no errors
      if (allInputsValid && submitHandler) {
        // first, remove the values that are not part of any known inputs as they may have been set by the initial
        // values given to Formalizer. The form values we submit to the submit handler should only contain data
        // for the form inputs.
        const knownAttrValues = () => {
          const filteredValues: { [key: string]: any } = {};

          Object.values(formInputsByUniqueId).forEach(inputData => {
            filteredValues[inputData.inputAttr.name] =
              values[inputData.inputAttr.name];
          });

          return filteredValues;
        };

        const submitHandlerValues = settings?.keepUnknownAttributes
          ? values
          : knownAttrValues();
        submitHandler(submitHandlerValues as T);
      }
    }

    return mounted && !Object.values(errors).length; // no errors found
  };

  const useInputHandler = <I extends SupportedInputTypes>(
    name: string,
    inputValueAttributeVal: string | undefined,
    validationConfigs: Array<InputValidation<T>> | string = [],
    inputType: I,
    validationSettings?: ValidationSettings
  ) => {
    const formInputData = useFormInput<T, I>({
      clearError,
      errors,
      formHandler,
      formRef,
      helperTextAttr,
      inputType,
      inputValueAttributeVal,
      invalidAttr,
      name,
      reportError,
      submitHandler,
      validation: validationConfigs,
      validationSettings
    });

    if (formRef.current) {
      // connected form - group inputs by form
      if (!formInputsMap.current[formRef.current.formValidationIdAttr]) {
        formInputsMap.current[formRef.current.formValidationIdAttr] = {};
      }
      formInputsMap.current[formRef.current.formValidationIdAttr][
        formInputData.inputAttr[FORMALIZER_ID_DATA_ATTRIBUTE]
      ] = formInputData;
    } else {
      // disconnected form - all inputs on the same group
      if (!formInputsMap.current[DISCONNECTED_FORM_INPUTS]) {
        formInputsMap.current[DISCONNECTED_FORM_INPUTS] = {};
      }
      formInputsMap.current[DISCONNECTED_FORM_INPUTS][
        formInputData.inputAttr[FORMALIZER_ID_DATA_ATTRIBUTE]
      ] = formInputData;
    }

    return formInputData.inputAttr;
  };

  const useInput = <V extends ValidationSettings>(
    name: string,
    validationConfigs?: Array<InputValidation<T>> | string,
    options?: V
  ) => useInputHandler(name, undefined, validationConfigs, 'text', options);

  const useCheckboxInput = <V extends ValidationSettings>(
    name: string,
    options?: V
  ) => useInputHandler(name, undefined, undefined, 'checkbox', options);

  const useToggleInput = <V extends ValidationSettings>(
    name: string,
    options?: V
  ) => useInputHandler(name, undefined, undefined, 'button', options);

  const useRadioInput = <V extends ValidationSettings>(
    name: string,
    value: string,
    options?: V
  ) => useInputHandler(name, value, undefined, 'radio', options);

  const formSubmitHandler = (e: Event) => {
    // first validate the form
    if (performValidations()) {
      try {
        // since the form is valid, delegate to the user-provided submit handler, if one was given to us
        if (submitHandler) {
          // first, remove the values that are not part of any known inputs as they may have been set by the initial
          // values given to Formalizer. The form values we submit to the submit handler should only contain data
          // for the form inputs.
          const knownAttrValues = () => {
            const filteredValues: { [key: string]: any } = {};
            Object.values(formInputsMap).forEach(
              (inputGroup: { [key: string]: FormInputData<any> }) => {
                Object.values(inputGroup).forEach(inputGroupIndex => {
                  Object.values(inputGroupIndex).forEach(inputData => {
                    filteredValues[inputData.inputAttr.name] =
                      values[inputData.inputAttr.name];
                  });
                });
              }
            );

            return filteredValues;
          };

          const submitHandlerValues = settings?.keepUnknownAttributes
            ? values
            : knownAttrValues();
          submitHandler(submitHandlerValues as T, e);
        } else {
          // by default, we don't submit the form. If the user wants the native submission behavior, they must
          // provide a submit handler.
          e.preventDefault();
          return false;
        }
      } catch (e) {
        throw new Error(
          'An error has happened executing the user-provided form submit handler.'
        );
      }
    } else {
      // there were errors, so prevent form submission in all cases
      e.preventDefault();
      return false;
    }

    return true;
  };

  // now find the form with the given ref, and attach our own onSubmit handler which will trigger the entire
  // form validation. If the entire form is found to be valid, it will also trigger the user-provided submit handler.
  if (formRef.current) {
    // we replace the handler so that the new function created during this render, which includes the updated form
    // values available to it through closure, can then be used if the user submits the form.
    if (formRef.current.currentSubmitHandler) {
      formRef.current.removeEventListener(
        'submit',
        formRef.current.currentSubmitHandler
      );
    }

    formRef.current.addEventListener('submit', formSubmitHandler);
    formRef.current.currentSubmitHandler = formSubmitHandler;
  }

  // we proxy this set state call so that we can trigger a form validation once a new set of values has been set on the form.
  const externalSetValues = (formValues: T) => {
    setValues(formValues);
    performValidations();
  };

  return {
    errors,
    formRef,
    formValues: values,
    isValid: mounted && !Object.values(errors).length,
    performValidations,
    setValues: externalSetValues,
    useCheckboxInput,
    useInput,
    useRadioInput,
    useToggleInput
  };
};
