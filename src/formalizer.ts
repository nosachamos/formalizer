import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
  RefObject
} from 'react';
import validator from 'validator';

/*
The validation object has a validation rule per key whose value has the following format:
{
    customValidator: {
        errorMessage: string,
        validator: function (provided only if a custom validation function is needed/desired)
    }
}

For built in validators, the value can simply be the desired error message:
{
    isRequired: "This field is required"
}

Alternatively, you may provide error messages to be used with all validators of a given type. To do that, set each
validator as a key on the ValidatorDefaults object:

ValidatorDefaults.isRequired = "This field is required.";
ValidatorDefaults.startsWithLetterZ = {
    errorMessage: "Must start with the letter Z",
    validator: (value) => value && value.length > 0 && value.charAt(0).toLowerCase() === 'z';
};

ValidatorSettings = {
    invalidAttr: { error: true },
    invalidHelperTextAttr: undefined
}

*/

interface ValidatorSettingsType {
  invalidAttr?: { error: boolean };
  invalidHelperTextAttr?: string;
}

export const ValidatorSettings: ValidatorSettingsType = {
  invalidAttr: { error: true },
  invalidHelperTextAttr: undefined
};

export const ValidatorDefaults: {
  [key: string]: InputValidationConfigs | string;
} = {};

const DEFAULT_ERROR_MESSAGE = 'This field is not valid.';

type ValidatorFunction = (value: any, options: object | undefined) => boolean;

interface InputValidationConfigs {
  errorMessage?: string;
  negate?: boolean;
  options?: object;
  validator?: ValidatorFunction;
}

interface FormData {
  [key: string]: any;
}

type FormSubmitHandler = (
  e: Event,
  formValues: { [ley: string]: any }
) => boolean;

interface FormValidationConfigs {
  [key: string]: InputValidationConfigs;
}

type ValidationErrorUpdater = (
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
  helperTextObj?: { [key: string]: string };
  invalidAttr?: object;
}

export const useFormInput = ({
  name,
  formHandler,
  validation = {},
  updateError,
  invalidAttr = {},
  helperTextAttr
}: FormInputParams): InputAttributes => {
  const [formData, setFormData] = formHandler;
  const formValue = formData[name] || '';

  const [value, setValue] = useState(formValue);
  const [isValid, setIsValid] = useState(true);
  const [isTouched, setIsTouched] = useState(false);
  const [helperText, setHelperText] = useState<string | undefined>(void 0);

  const handleValidation = useCallback(
    (inputValue: any) => {
      const result = validate(inputValue, validation);
      setIsValid(!result);
      if (result) {
        const [unmetRuleKey, errorMessage] = result;
        setHelperText(errorMessage);
        updateError(name, unmetRuleKey, errorMessage);
      } else {
        updateError(name);
      }
    },
    [name, validation, updateError]
  );

  // watch for external parent data changes in self
  useEffect(() => {
    if (value !== formValue) {
      setValue(formValue);
      setIsTouched(false);
    }
  }, [formValue, value]);

  // validate on value change
  useEffect(() => {
    if (isTouched) {
      handleValidation(value);
    }
  }, [value, isTouched, handleValidation]);

  // rewrite self and parent's value
  const handleChange = (e: FormEvent<HTMLInputElement>) => {
    const { type, checked } = e.currentTarget;
    const inputValue = e.currentTarget.value;

    const newValue = type === 'checkbox' ? checked : inputValue;

    setValue(inputValue);
    setFormData({
      ...formData,
      [name]: newValue
    });
  };

  const handleBlur = () => {
    if (!isTouched) {
      setIsTouched(true);
    }
    handleValidation(value);
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
    onBlur: handleBlur,
    onChange: handleChange,
    value
  };

  return inputAttr;
};

export const useForm = (
  formRef: RefObject<HTMLFormElement>,
  defaultValues: FormData,
  handleSubmit: FormSubmitHandler,
  invalidAttr = ValidatorSettings.invalidAttr,
  helperTextAttr = ValidatorSettings.invalidHelperTextAttr
) => {
  const formHandler = useState(defaultValues);
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

  if (formRef.current) {
    if (!formRef.current.formValidationIdAttr) {
      formRef.current.formValidationIdAttr = Math.random()
        .toString(36)
        .substr(2, 9);
    }
  }

  const formInputsAttrs = useRef<{
    [key: string]: { [key: string]: InputAttributes };
  }>({});

  const useInput = (name: string, validationConfigs: FormValidationConfigs) => {
    const inputAttr = useFormInput({
      formHandler,
      helperTextAttr,
      invalidAttr,
      name,
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

  const validateForm = () => {
    if (formRef.current) {
      const formInputsByName =
        formInputsAttrs.current[formRef.current.formValidationIdAttr];

      // trigger validation on each of the form's inputs
      Object.keys(formInputsByName).forEach(inputName =>
        formInputsByName[inputName].onBlur()
      );
    }

    return mounted && !Object.values(errors).length; // no errors found
  };

  const formSubmitHandler = (e: Event) => {
    // first validate the form
    if (validateForm()) {
      try {
        // since the form is valid, delegate to the user-provided submit handler, if one was given to us
        if (handleSubmit) {
          handleSubmit(e, values);
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

  return {
    errors,
    formValues: values,
    isValid: mounted && !Object.values(errors).length,
    setValues,
    useInput,
    validateForm
  };
};

/**
 * Returns either unmet rule, or null
 * @param value
 * @param validation
 * @returns {*}
 */
export const validate = (
  value: any,
  validation: { [key: string]: InputValidationConfigs | string }
) => {
  const fieldsToValidate: { [key: string]: InputValidationConfigs } = {};

  Object.keys(validation).forEach(property => {
    let options = {};
    let errorMessage: string | undefined = void 0;
    let negate: boolean | undefined = void 0;
    let validatorFunction: ValidatorFunction | undefined = void 0;

    if (ValidatorDefaults[property]) {
      if (typeof ValidatorDefaults[property] === 'string') {
        // @ts-ignore
        validatorFunction = validator[
          ValidatorDefaults[property] as string
        ] as ValidatorFunction;
        errorMessage = ValidatorDefaults[property] as string;
        negate = false;
      } else {
        const propValidator = ValidatorDefaults[
          property
        ] as InputValidationConfigs;

        if (typeof propValidator.validator === 'string') {
          validatorFunction = validator[propValidator.validator];
        } else if (typeof propValidator.validator === 'function') {
          validatorFunction = propValidator.validator;
        } else {
          throw new Error(
            'The given validator must be either a string or a function.'
          );
        }

        errorMessage = propValidator.errorMessage
          ? propValidator.errorMessage
          : DEFAULT_ERROR_MESSAGE;
        negate = propValidator.negate === void 0 ? false : propValidator.negate;
        options = propValidator.options === void 0 ? {} : propValidator.options;
      }
    } else {
      // @ts-ignore
      validatorFunction = validator[property] as ValidatorFunction;
    }

    fieldsToValidate[property] = {
      errorMessage,
      negate,
      options,
      validator: validatorFunction
    };

    if (typeof validation[property] === 'string') {
      fieldsToValidate[property].errorMessage = validation[property] as string;
    } else if (typeof validation[property] === 'boolean') {
      fieldsToValidate[property].negate = validation[property] as boolean;
    } else if (typeof validation[property] === 'function') {
      fieldsToValidate[property].validator = validation[
        property
      ] as ValidatorFunction;
    } else if (typeof validation[property] === 'object') {
      fieldsToValidate[property] = {
        ...fieldsToValidate[property],
        ...(validation[property] as object)
      };
    }
  });

  // check whether we do need to validate at all - no validation rules, no validation needed
  if (fieldsToValidate.isEmpty) {
    return null;
  }

  let unmetValidationKey: string | undefined = void 0;
  let isValid = true;

  Object.keys(fieldsToValidate).forEach(property => {
    if (unmetValidationKey) {
      return;
    }

    const configs: InputValidationConfigs = fieldsToValidate[property];

    switch (property) {
      case 'isRequired':
        if (!value) {
          unmetValidationKey = property;
        }
        break;

      default:
        if (configs.validator !== undefined) {
          isValid = configs.validator(value, configs.options);
        }
    }

    if (configs.negate) {
      isValid = !isValid;
    }

    if (!isValid) {
      unmetValidationKey = property;
      return;
    }
  });

  return unmetValidationKey
    ? [unmetValidationKey, fieldsToValidate[unmetValidationKey].errorMessage]
    : null;
};
