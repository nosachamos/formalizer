import {
  Dispatch,
  FormEvent,
  MutableRefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState
} from 'react';
import { useFormInput } from './use-form-input';

interface FormalizerSettingsType {
  invalidAttr?: { [key: string]: any };
  helperTextAttr?: string;
}

export const FormalizerSettings: FormalizerSettingsType = {
  helperTextAttr: undefined,
  invalidAttr: { error: true }
};

export const GlobalValidators: {
  [key: string]: InputValidationConfig | string;
} = {
  isRequired: 'This field is required.'
};

export const DEFAULT_VALIDATION_ERROR_MESSAGE = 'This field is not valid.';

export type ValidatorFunction = (value: any, options: Options) => boolean;

export interface InputValidationConfig {
  key?: string;
  errorMessage?: string | ErrorMessageFunction;
  negate?: boolean;
  options?: Options;
  validator?: ValidatorFunction | string;
}

export const isInputValidationConfig = (
  value: any
): value is InputValidationConfig =>
  value !== undefined &&
  value !== null &&
  (typeof value.validator === 'string' ||
    typeof value.validator === 'function');

export interface FormData {
  [key: string]: any;
}

type FormSubmitHandler = (
  formValues: { [ley: string]: any },
  e?: Event
) => boolean;

export type ErrorMessageFunction = (
  value: string,
  formData: FormData
) => string;

export interface InputValidationByKey {
  [key: string]: InputValidationConfig | string;
}

type InputValidation = InputValidationConfig | string;

type ValidationErrorUpdater = (
  name: string,
  unmetRuleKey?: string,
  errorMessage?: string
) => void;

export interface FormInputParams {
  name: string;
  formHandler: [FormData, Dispatch<SetStateAction<FormData>>];
  formRef: MutableRefObject<HTMLFormElement | null>;
  updateError: ValidationErrorUpdater;
  invalidAttr?: object;
  submitHandler?: FormSubmitHandler;
  validation: InputValidation[];
  helperTextAttr?: string;
}

export interface InputAttributes {
  value: any;
  name: string;
  onKeyPress: (e: KeyboardEvent) => void;
  onChange: (e: FormEvent<HTMLInputElement>) => any;
  onBlur: () => any;
  helperTextObj?: { [key: string]: string };
  invalidAttr?: object;
}

export interface Options {
  [key: string]: any;
  formData: { [key: string]: string };
}

export function setupForMaterialUI(): void {
  FormalizerSettings.invalidAttr = { error: true };
  FormalizerSettings.helperTextAttr = 'helperText';
}

export const useFormalizer = (
  submitHandler?: FormSubmitHandler,
  initialValues?: FormData,
  settings?: FormalizerSettingsType
) => {
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
    ? settings
    : FormalizerSettings;

  const formHandler = useState(initialValues ? initialValues : {});
  const errorHandler = useState<{ [key: string]: string }>({});
  const [mounted, setMounted] = useState(false);

  const [values, setValues] = formHandler;
  const [errors, setErrors] = errorHandler;

  // initial mounted flag
  useEffect(() => setMounted(true), []);

  const updateError = (
    name: string,
    unmetRule?: string,
    errorMessage?: string
  ) => {
    if (!unmetRule) {
      delete errors[name];
    } else {
      if (errorMessage !== undefined) {
        errors[name] = errorMessage;
      }
    }
    setErrors(errors);
  };

  if (formRef && formRef.current) {
    if (!formRef.current.formValidationIdAttr) {
      formRef.current.formValidationIdAttr = Math.random()
        .toString(36)
        .substr(2, 9);
    }
  }

  const formInputsAttrs = useRef<{
    [key: string]: { [key: string]: InputAttributes };
  }>({});

  const validateForm = () => {
    if (formRef.current) {
      const formInputsByName =
        formInputsAttrs.current[formRef.current.formValidationIdAttr];

      if (formInputsByName) {
        // trigger validation on each of the form's inputs
        Object.keys(formInputsByName).forEach(inputName =>
          formInputsByName[inputName].onBlur()
        );
      }
    }

    return mounted && !Object.values(errors).length; // no errors found
  };

  const useInput = (name: string, validationConfigs: InputValidation[]) => {
    const inputAttr = useFormInput({
      formHandler,
      formRef,
      helperTextAttr,
      invalidAttr,
      name,
      submitHandler,
      updateError,
      validation: validationConfigs
    });

    if (formRef.current) {
      if (!formInputsAttrs.current[formRef.current.formValidationIdAttr]) {
        formInputsAttrs.current[formRef.current.formValidationIdAttr] = {};
      }
      formInputsAttrs.current[formRef.current.formValidationIdAttr][
        inputAttr.name
      ] = inputAttr;
    }

    return inputAttr;
  };

  const formSubmitHandler = (e: Event) => {
    // first validate the form
    if (validateForm()) {
      try {
        // since the form is valid, delegate to the user-provided submit handler, if one was given to us
        if (submitHandler) {
          submitHandler(values, e);
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
  const externalSetValues = (formValues: FormData) => {
    setValues(formValues);
    validateForm();
  };

  return {
    errors,
    formRef,
    formValues: values,
    isValid: mounted && !Object.values(errors).length,
    setValues: externalSetValues,
    useInput,
    validateForm
  };
};
