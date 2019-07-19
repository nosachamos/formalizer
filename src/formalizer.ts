import {
  Dispatch,
  FormEvent,
  MutableRefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState
} from 'react';

// apparently can't import a type from an optional dependency, so use "any" until this is resolved.
// https://stackoverflow.com/questions/52795354/how-to-use-a-type-from-an-optional-dependency-in-a-declaration-file
// https://stackoverflow.com/questions/55041919/import-of-optional-module-with-type-information
let validator: any = void 0;

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

type ValidatorFunction = (value: any, options: Options) => boolean;

interface InputValidationConfig {
  key?: string;
  errorMessage?: string | ErrorMessageFunction;
  negate?: boolean;
  options?: Options;
  validator?: ValidatorFunction | string;
}

const isInputValidationConfig = (value: any): value is InputValidationConfig =>
  value !== undefined &&
  value !== null &&
  (typeof value.validator === 'string' ||
    typeof value.validator === 'function');

interface FormData {
  [key: string]: any;
}

type FormSubmitHandler = (
  formValues: { [ley: string]: any },
  e?: Event
) => boolean;

type ErrorMessageFunction = (value: string, formData: FormData) => string;

interface InputValidationByKey {
  [key: string]: InputValidationConfig | string;
}

type InputValidation = InputValidationConfig | string;

type ValidationErrorUpdater = (
  name: string,
  unmetRuleKey?: string,
  errorMessage?: string
) => void;

interface FormInputParams {
  name: string;
  formHandler: [FormData, Dispatch<SetStateAction<FormData>>];
  formRef: MutableRefObject<HTMLFormElement | null>;
  updateError: ValidationErrorUpdater;
  invalidAttr?: object;
  submitHandler?: FormSubmitHandler;
  validation: InputValidation[];
  helperTextAttr?: string;
}

interface InputAttributes {
  value: any;
  name: string;
  onKeyPress: (e: KeyboardEvent) => void;
  onChange: (e: FormEvent<HTMLInputElement>) => any;
  onBlur: () => any;
  helperTextObj?: { [key: string]: string };
  invalidAttr?: object;
}

interface Options {
  [key: string]: any;
  formData: { [key: string]: string };
}

export const mustMatch = (fieldName: string): InputValidationConfig => ({
  errorMessage: `Must match the ${fieldName} field.`,
  validator: (value: string, options: Options) =>
    value === options.formData[fieldName]
});

export const useFormInput = ({
  name,
  formHandler,
  formRef,
  validation = [],
  updateError,
  invalidAttr = {},
  submitHandler,
  helperTextAttr
}: FormInputParams): InputAttributes => {
  const [formData, setFormData] = formHandler;
  const formValue = formData[name];
  const [isCheckboxInput, setIsCheckboxInput] = useState(false);
  const [value, setValue] = useState<string | boolean>(formValue);
  const [isValid, setIsValid] = useState(true);
  const [isTouched, setIsTouched] = useState(false);
  const [helperText, setHelperText] = useState<string | undefined>(void 0);

  const handleValidationRef = useRef(
    (
      inputValue: any,
      currentFormData: FormData,
      invokeSubmitHandler: boolean,
      inputIsTouched: boolean
    ) => {
      let result: Array<string | undefined> | undefined;

      if (inputIsTouched) {
        let validationToProcess: Array<string | InputValidationConfig>;

        if (Array.isArray(validation)) {
          validation.forEach(v => {
            if (typeof v !== 'string' && !isInputValidationConfig(v)) {
              throw new Error(
                'Formalizer: the validator value passed into useInput must be a single string, a custom validator object or an array of these.'
              );
            }
          });
          validationToProcess = validation;
        } else {
          if (
            typeof validation !== 'string' &&
            !isInputValidationConfig(validation)
          ) {
            throw new Error(
              'Formalizer: the validator value passed into useInput must be a single string, a custom validator object or an array of these.'
            );
          } else {
            validationToProcess = [validation];
          }
        }

        for (const v of validationToProcess) {
          let validationConfig: InputValidationByKey | undefined = void 0;

          // if this is a string the user has just requested a validation by name, such as `isRequired`. Otherwise, user
          // has provided a validation config, so use that.

          if (typeof v === 'string') {
            validationConfig = { [v]: {} };
          } else {
            let key: string | undefined = void 0;
            if (!v.key) {
              key =
                typeof v.validator === 'string'
                  ? v.validator // if the validator is a string, use that as a string
                  : (key = '' + Math.random()); // no key given, so generate one
            } else {
              key = v.key;
            }
            validationConfig = { [key]: v };
          }

          result = validate(inputValue, validationConfig, currentFormData);

          setIsValid(!result);
          if (result) {
            // stop on the first error - we only show one at a time.
            break;
          }
        }
      }

      if (!!result) {
        const [unmetRuleKey, errorMessage] = result;
        setHelperText(errorMessage);

        // show error for this input
        updateError(name, unmetRuleKey, errorMessage);
      } else {
        // if form is not connected, and we have a submit handler, we call it every time validation passes. Otherwise
        // we do nothing here - it will be invoked when the form is submitted.
        if (!formRef.current && inputIsTouched && invokeSubmitHandler) {
          if (submitHandler) {
            submitHandler(currentFormData);
          }
        }

        // clearing the error
        updateError(name);
      }
    }
  );

  // watch for external parent data changes in self
  useEffect(() => {
    if (value !== formValue) {
      setValue(formValue);
      setIsTouched(false);

      handleValidationRef.current(formValue, formData, isCheckboxInput, false);
    }
  }, [formValue, value]);

  // rewrite self and parent's value
  const handleChange = (e: FormEvent<HTMLInputElement>) => {
    const { type, checked } = e.currentTarget;
    const inputValue = e.currentTarget.value;

    const isCheckbox = type === 'checkbox';
    const newValue = isCheckbox ? checked : inputValue;

    const newFormData = {
      ...formData,
      [name]: newValue
    };

    setFormData(newFormData);

    // must set the value before we set the sourced flag, or else checkboxes invoke their submit handlers twice.
    // Not sure why - React should combine these into one useEffect invocation, but its not doing that. It's
    // triggering once for the value change, and once for the isTouched change.
    setValue(newValue);

    let newIsTouched = isTouched;
    if (isCheckbox) {
      setIsCheckboxInput(true);
      newIsTouched = true;
      setIsTouched(newIsTouched);
    }

    handleValidationRef.current(
      newValue,
      newFormData,
      isCheckbox,
      newIsTouched
    );
  };

  const handleValueAccepted = () => {
    if (!isTouched) {
      setIsTouched(true);
    }

    handleValidationRef.current(value, formData, true, true);
  };

  // we handle key presses and trigger validations if Enter was pressed
  const handleKeyPress = (e: KeyboardEvent) => {
    // We attempt to use keyCode first so that we work properly on IE 11 and lower. If that's
    // not available, use the which property. Finally, if that's not available, use the newer key instead.
    if (
      (e as any['keyCode']) === 13 ||
      (e as any['which']) === 13 ||
      e.key === 'Enter'
    ) {
      handleValueAccepted();
    }
  };

  const showError = !isValid && isTouched;

  let helperTextObj: { [key: string]: string } | undefined = void 0;
  if (helperTextAttr && helperText !== undefined) {
    helperTextObj = {};
    helperTextObj[helperTextAttr] = helperText;
  }

  const inputAttr = {
    ...(showError && helperTextObj),
    ...(showError && invalidAttr),
    name,
    onBlur: handleValueAccepted,
    onChange: handleChange,
    onKeyPress: handleKeyPress,
    value
  };

  return inputAttr;
};

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

const loadValidatorDependency = () => {
  validator = require('validator');

  if (validator !== undefined) {
    return true;
  }

  const validatorVersion: string | undefined = require('validator/package.json')
    .version;

  // check if we support the validator version - throw error if unsupported
  if (validatorVersion) {
    const versionParts = validatorVersion.split('.');
    if (parseInt(versionParts[0], 10) < 4) {
      // major version is 11 or higher
      validator = undefined;
      throw new Error(
        `Formalizer: unsupported version of the validator library found (${validatorVersion}). Please upgrade to 4.0.0 or higher.`
      );
    }
  }

  return validator !== undefined;
};

const getErrorMessage = (
  errorMsg: string | ErrorMessageFunction | undefined,
  value: string,
  formData: FormData
) => {
  if (typeof errorMsg === 'string') {
    return errorMsg;
  } else if (typeof errorMsg === 'function') {
    return errorMsg(value, formData);
  } else {
    throw new Error(
      `Formalizer: a validator's errorMessage field must be either a string or a function that returns a string.`
    );
  }
};

/**
 * Returns either unmet rule, or null
 * @param value
 * @param validation
 * @returns {*}
 */
export const validate = (
  value: any,
  validation: InputValidationByKey,
  formData: FormData
) => {
  const fieldsToValidate: InputValidationConfig[] = [];

  Object.keys(validation).forEach(property => {
    let options = { formData };
    let errorMsg: string = DEFAULT_VALIDATION_ERROR_MESSAGE;
    let negate: boolean | undefined = false;
    let validatorFunction: ValidatorFunction | undefined = void 0;

    if (GlobalValidators[property]) {
      // making sure the given validator is of supported type
      if (
        GlobalValidators[property] === null ||
        (typeof GlobalValidators[property] !== 'string' &&
          typeof GlobalValidators[property] !== 'object') ||
        Array.isArray(GlobalValidators[property])
      ) {
        throw new Error(
          'Formalizer: validators must be of string or object type.'
        );
      }

      if (typeof GlobalValidators[property] === 'string') {
        if (loadValidatorDependency()) {
          // @ts-ignore
          validatorFunction = validator[
            GlobalValidators[property] as string
          ] as ValidatorFunction;
        }
        errorMsg = GlobalValidators[property] as string;
        negate = false;
      } else {
        // can only be an object at this point
        const propValidator = GlobalValidators[
          property
        ] as InputValidationConfig;

        if (typeof propValidator.validator === 'string') {
          if (loadValidatorDependency()) {
            validatorFunction = validator[propValidator.validator];
          }
        } else if (typeof propValidator.validator === 'function') {
          validatorFunction = propValidator.validator;
        } else {
          throw new Error(
            'Formalizer: the given validator must be either a string or a function.'
          );
        }

        if (propValidator.errorMessage) {
          errorMsg = getErrorMessage(
            propValidator.errorMessage,
            value,
            formData
          );
        }

        negate = propValidator.negate === void 0 ? false : propValidator.negate;
        options =
          propValidator.options === void 0
            ? { formData }
            : propValidator.options;
      }
    } else {
      const valConfig = validation[property] as InputValidationConfig;

      // if this is an empty object, user passed in just the string for a built in validator, which got converted to an
      // empty object before validate was invoked.
      if (Object.keys(valConfig as object).length === 0) {
        if (loadValidatorDependency()) {
          validatorFunction = (validator as any)[property];
        }
      } else if (typeof valConfig.validator === 'function') {
        validatorFunction = valConfig.validator;
      } else if (
        typeof valConfig === 'object' &&
        typeof valConfig.validator === 'string'
      ) {
        if (loadValidatorDependency()) {
          validatorFunction = validator[valConfig.validator];
        }
      }
    }

    fieldsToValidate.push({
      errorMessage: errorMsg,
      key: property,
      negate,
      options,
      validator: validatorFunction
    });

    fieldsToValidate[fieldsToValidate.length - 1] = {
      ...fieldsToValidate[fieldsToValidate.length - 1],
      ...(validation[property] as object)
    };

    // making sure the resolved function is used
    fieldsToValidate[fieldsToValidate.length - 1].validator = validatorFunction;
  });

  let unmetValidationKey: string | undefined = void 0;
  let errorMessage: string | ErrorMessageFunction | undefined = void 0;
  let isValid = true;

  for (const validationConfig of fieldsToValidate) {
    const property = validationConfig.key;
    const configs: InputValidationConfig = validationConfig;

    if (!configs.options) {
      configs.options = { formData };
    } else if (!configs.options.formData) {
      configs.options = { ...configs.options, formData };
    }

    switch (property) {
      case 'isRequired':
        if (!value || value.trim().length === 0) {
          isValid = false;
        }
        break;

      default:
        if (typeof configs.validator === 'function') {
          isValid = configs.validator(value, configs.options);
        } else {
          throw new Error(
            `Formalizer: cannot find a validator named "${property}". If you are attempting to perform a validation defined ` +
              `by the Validator library, please make sure to have it installed prior.`
          );
        }
    }

    if (configs.negate) {
      isValid = !isValid;
    }

    if (!isValid) {
      unmetValidationKey = property;
      errorMessage = getErrorMessage(
        validationConfig.errorMessage,
        value,
        formData
      );
      break;
    }
  }

  return isValid ? undefined : [unmetValidationKey, errorMessage];
};
