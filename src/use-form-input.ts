import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  FormData,
  FormInputData,
  FormInputParams,
  InputAttributes,
  InputValidationByKey,
  InputValidationConfig,
  isInputValidationConfig
} from './formalizer';
import { validate } from './validate';

export const FORMALIZER_ID_DATA_ATTRIBUTE = 'data-formalizer-id';

export const useFormInput = ({
  name,
  formHandler,
  formRef,
  validation = [],
  updateError,
  invalidAttr = {},
  inputType = 'text',
  submitHandler,
  helperTextAttr,
  inputValueAttributeVal
}: FormInputParams): FormInputData => {
  const [formData, setFormData] = formHandler;
  const [previousFormData, setPreviousFormData] = useState<FormData | null>(
    null
  );
  const [previousValidationResult, setPreviousValidationResult] = useState(
    true
  );
  const formValue = formData[name];
  const [value, setValue] = useState<string | boolean>(formValue);
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
      currentFormData: FormData,
      invokeSubmitHandler: boolean,
      inputIsTouched: boolean
    ): boolean => {
      if (
        JSON.stringify(previousFormData) === JSON.stringify(currentFormData)
      ) {
        // data didn't change since previous time we invoked the submitHandler, so we don't need to invoke it again or do validations.
        return previousValidationResult;
      }

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
        // we do nothing here.
        if (!formRef.current && inputIsTouched && invokeSubmitHandler) {
          if (submitHandler) {
            setPreviousFormData(currentFormData);
            submitHandler(currentFormData);
          }
        }

        // clearing the error
        updateError(name);
      }

      setPreviousValidationResult(!result);
      return !result;
    }
  );

  const isInputToggleable = (type: string) =>
    type === 'checkbox' || type === 'radio';

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
  const handleChange = (e: FormEvent<HTMLInputElement>) => {
    const { checked } = e.currentTarget;
    const inputValue = e.currentTarget.value;

    const newValue = inputType === 'checkbox' ? checked : inputValue;

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
  const handleKeyPress = (e: KeyboardEvent) => {
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

  const inputAttr: InputAttributes = {
    ...(showError && helperTextObj),
    ...(showError && invalidAttr),
    name,
    onBlur: handleValueAccepted(true),
    onChange: handleChange,
    onKeyPress: handleKeyPress,
    type: inputType,
    [FORMALIZER_ID_DATA_ATTRIBUTE]: inputUniqueIdRef.current
  };

  if (inputType === 'checkbox') {
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
