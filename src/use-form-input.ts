import React, { FormEvent, useEffect, useRef, useState } from 'react';
import {
  FormInputData,
  FormInputParams,
  InputAttributes,
  InputValidationByKey,
  InputValidationConfig,
  isInputValidationConfig,
  SupportedInputTypes
} from './formalizer';
import { validate } from './validate';

export const FORMALIZER_ID_DATA_ATTRIBUTE = 'data-formalizer-id';

export interface ValidationResult {
  errors: Array<{ key: string; errorMessage?: string }>;
}

export const useFormInput = <
  T extends { [key: string]: string | boolean },
  I extends SupportedInputTypes
>({
  name,
  formHandler,
  formRef,
  validation = [],
  clearError,
  reportError,
  invalidAttr = {},
  inputType,
  submitHandler,
  helperTextAttr,
  inputValueAttributeVal,
  validationSettings
}: FormInputParams<T, I>): FormInputData<I> => {
  const [formData, setFormData] = formHandler;
  const formValue = formData[name] as any;
  const [value, setValue] = useState<any>(formValue);
  const [isValid, setIsValid] = useState(true);
  const [isTouched, setIsTouched] = useState(false);
  const [helperText, setHelperText] = useState<string | undefined>(void 0);

  /**
   * We attach this unique id to the input's data-formalizer-id attribute so we can properly
   * handle inputs with repeated names, such as use cases involving radio buttons.
   */
  const inputUniqueIdRef = useRef(
    Math.random()
      .toString(36)
      .substr(2, 9)
  );

  const handleValidationRef = useRef(
    (
      inputValue: any,
      currentFormData: T,
      invokeSubmitHandler: boolean,
      inputIsTouched: boolean
    ): boolean => {
      let result: ValidationResult;
      let hasErrors = false;

      if (inputIsTouched) {
        let validationToProcess: Array<string | InputValidationConfig<T>>;

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

        const reportMultipleErrors = !!(
          validationSettings && validationSettings.reportMultipleErrors === true
        );

        const validationConfig: InputValidationByKey<T> = {};
        for (const v of validationToProcess) {
          // if this is a string the user has just requested a validation by name, such as `isRequired`. Otherwise, user
          // has provided a validation config, so use that.

          if (typeof v === 'string') {
            validationConfig[v] = {};
          } else {
            let key: string;
            if (!v.key) {
              key =
                typeof v.validator === 'string'
                  ? v.validator // if the validator is a string, use that as a string
                  : (key = Math.random()
                      .toString(36)
                      .substr(2, 9)); // no key given, so generate one
            } else {
              key = v.key;
            }
            validationConfig[key] = v;
          }
        }

        result = validate(inputValue, validationConfig, currentFormData);

        if (result.errors && result.errors.length > 0) {
          for (const error of result.errors) {
            if (error.errorMessage) {
              hasErrors = true;
              setHelperText(error.errorMessage);

              // show error for this input
              reportError(
                name,
                reportMultipleErrors,
                error.key,
                error.errorMessage
              );

              if (!reportMultipleErrors) {
                // stop on the first error - we only show one at a time.
                break;
              }
            } else {
              // clearing the error
              clearError(name, reportMultipleErrors, error.key);
            }
          }
        } else {
          // no errors, clear everything for this input
          clearError(name, false);
        }
      } else {
        // if component isn't touched, clear errors
        clearError(name, false);
      }

      // if form is not connected, and we have a submit handler, we call it every time validation passes. Otherwise
      // we do nothing here.
      if (
        !formRef.current &&
        !hasErrors &&
        inputIsTouched &&
        invokeSubmitHandler
      ) {
        if (submitHandler) {
          submitHandler(currentFormData);
        }
      }

      setIsValid(!hasErrors);

      return !hasErrors;
    }
  );

  const isInputToggleable = (type: SupportedInputTypes) =>
    type === 'checkbox' ||
    type === undefined || // toggle buttons
    type === 'radio';

  // watch for external parent data changes in self
  useEffect(() => {
    if (value !== formValue) {
      setValue(formValue);
      setIsTouched(false);

      handleValidationRef.current(
        formValue,
        formData,
        isInputToggleable(inputType),
        false
      );
    }
  }, [formValue, value]);

  // rewrite self and parent's value
  const handleChange = (
    e:
      | React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      | FormEvent<any>
  ): void => {
    const { checked } = e.currentTarget;
    const inputValue = e.currentTarget.value;

    const newValue =
      inputType === 'checkbox' || inputType === undefined
        ? checked
        : inputValue;

    const newFormData = {
      ...(formData as any),
      [name]: newValue
    };

    setFormData(newFormData);

    // must set the value before we set the sourced flag, or else checkboxes invoke their submit handlers twice.
    // Not sure why - React should combine these into one useEffect invocation, but its not doing that. It's
    // triggering once for the value change, and once for the isTouched change.
    setValue(newValue);

    let newIsTouched = isTouched;
    if (isInputToggleable(inputType)) {
      newIsTouched = true;
      setIsTouched(newIsTouched);
    }

    handleValidationRef.current(
      newValue,
      newFormData,
      isInputToggleable(inputType),
      newIsTouched
    );
  };

  const handleValueAccepted = (
    mayInvokeSubmitHandler: boolean
  ) => (): boolean => {
    if (!isTouched) {
      setIsTouched(true);
    }

    return handleValidationRef.current(
      value,
      formData,
      mayInvokeSubmitHandler,
      true
    );
  };

  // we handle key presses and trigger validations if Enter was pressed
  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLDivElement> | KeyboardEvent
  ) => {
    // We attempt to use keyCode first so that we work properly on IE 11 and lower. If that's
    // not available, use the which property. Finally, if that's not available, use the newer key instead.
    if (
      (e as any['keyCode']) === 13 ||
      (e as any['which']) === 13 ||
      e.key === 'Enter'
    ) {
      handleValueAccepted(true)();
    }
  };

  const showError = !isValid && isTouched;

  let helperTextObj: { [key: string]: string } | undefined = void 0;
  if (helperTextAttr && helperText !== undefined) {
    helperTextObj = {};
    helperTextObj[helperTextAttr] = helperText;
  }

  const inputAttr: InputAttributes<I> = {
    ...(showError && helperTextObj),
    ...(showError && invalidAttr),
    name,
    // we don't invoke the submit handler on blur if we are disconnected from a form and the input is a checkbox or radio button.
    onBlur: handleValueAccepted(
      !!formRef.current || !isInputToggleable(inputType)
    ),
    onChange: handleChange,
    onKeyPress: handleKeyPress,
    [FORMALIZER_ID_DATA_ATTRIBUTE]: inputUniqueIdRef.current
  };

  if (inputType) {
    inputAttr.type = inputType;
  }

  if (
    inputType === 'checkbox' ||
    inputType === undefined /* toggle inputs have undefined type attribute */
  ) {
    inputAttr.checked = typeof value === 'boolean' ? value : false;
  } else if (inputType === 'radio') {
    inputAttr.value = inputValueAttributeVal;
    inputAttr.checked = value === inputValueAttributeVal;
  } else {
    // assume the type is text, or text equivalent such as password, search, email and others.
    inputAttr.value = value;
  }

  const formInputData = {
    inputAttr,
    runValidations: handleValueAccepted(false)
  };

  return formInputData;
};
