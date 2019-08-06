import {
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
}

export const FormalizerSettings: FormalizerSettingsType = {
  helperTextAttr: undefined,
  invalidAttr: { error: true }
};

export const GlobalValidators: {
  [key: string]: InputValidationConfig<any> | string;
} = {
  isRequired: 'This field is required.'
};

export const DEFAULT_VALIDATION_ERROR_MESSAGE = 'This field is not valid.';

export type ValidatorFunction<T> = (value: any, options: Options<T>) => boolean;

export interface InputValidationConfig<T> {
  key?: string;
  errorMessage?: string | ErrorMessageFunction<T>;
  negate?: boolean;
  options?: Options<T>;
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

type InputValidation<T> = InputValidationConfig<T> | string;

type ValidationErrorUpdater = (
  name: string,
  unmetRuleKey?: string,
  errorMessage?: string
) => void;

export type SupportedInputTypes = 'text' | 'checkbox' | 'radio' | 'button';

export interface FormInputParams<T> {
  name: string;
  formHandler: [T, Dispatch<SetStateAction<T>>];
  formRef: MutableRefObject<HTMLFormElement | null>;
  updateError: ValidationErrorUpdater;
  invalidAttr?: object;
  inputType: SupportedInputTypes;
  inputValueAttributeVal?: string;
  submitHandler?: FormSubmitHandler<T>;
  validation: Array<InputValidation<T>>;
  helperTextAttr?: string;
}

export interface FormInputData {
  inputAttr: InputAttributes;
  runValidations: () => boolean;
}

export interface InputAttributes {
  value?: any;
  checked?: boolean;
  name: string;
  onKeyPress: (e: KeyboardEvent) => void;
  onChange: (e: FormEvent<HTMLInputElement>) => any;
  onBlur: () => any;
  helperTextObj?: { [key: string]: string };
  invalidAttr?: object;
  type: string;
  [FORMALIZER_ID_DATA_ATTRIBUTE]: string;
}

export interface Options<T> {
  [key: string]: any;
  formData: T;
}

export function setupForMaterialUI(): void {
  FormalizerSettings.invalidAttr = { error: true };
  FormalizerSettings.helperTextAttr = 'helperText';
}

export const useFormalizer = <T extends { [key: string]: any } = {}>(
  submitHandler?: FormSubmitHandler<T>,
  initialValues?: T,
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

  const formHandler = useState<T>(initialValues ? initialValues : ({} as any));
  const errorHandler = useState<{ [key: string]: string }>({});
  const [mounted, setMounted] = useState(false);

  /**
   * Map of form inputs by input name. When we have a connected forms, there is an entry per form.
   * There is one special entry for disconnected forms.
   */
  const formInputsMap = useRef<{
    [key: string]: { [key: string]: FormInputData };
  }>({});

  const DISCONNECTED_FORM_INPUTS = '$$$DISCONNECTED_FORM_INPUTS$$$';

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
      errors[name] = errorMessage as string;
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
      const allInputsValid = Object.keys(formInputsByUniqueId).every(
        inputUniqueId => formInputsByUniqueId[inputUniqueId].runValidations()
      );

      // now we need to trigger the submit handler if there are no errors
      if (allInputsValid && submitHandler) {
        submitHandler(values);
      }
    }

    return mounted && !Object.values(errors).length; // no errors found
  };

  const useInputHandler = (
    name: string,
    inputValueAttributeVal: string | undefined,
    validationConfigs: Array<InputValidation<T>> = [],
    inputType: SupportedInputTypes
  ) => {
    const formInputData = useFormInput<T>({
      formHandler,
      formRef,
      helperTextAttr,
      inputType,
      inputValueAttributeVal,
      invalidAttr,
      name,
      submitHandler,
      updateError,
      validation: validationConfigs
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

  const useInput = (
    name: string,
    validationConfigs?: Array<InputValidation<T>>
  ) => useInputHandler(name, undefined, validationConfigs, 'text');

  const useCheckboxInput = (
    name: string,
    validationConfigs?: Array<InputValidation<T>>
  ) => useInputHandler(name, undefined, validationConfigs, 'checkbox');

  const useToggleInput = (
    name: string,
    validationConfigs?: Array<InputValidation<T>>
  ) => useInputHandler(name, undefined, validationConfigs, 'button');

  const useRadioInput = (
    name: string,
    value: string,
    validationConfigs?: Array<InputValidation<T>>
  ) => useInputHandler(name, value, validationConfigs, 'radio');

  const formSubmitHandler = (e: Event) => {
    // first validate the form
    if (performValidations()) {
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
