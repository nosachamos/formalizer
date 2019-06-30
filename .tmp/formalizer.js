var __assign =
  (this && this.__assign) ||
  function() {
    __assign =
      Object.assign ||
      function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
import { useCallback, useEffect, useRef, useState } from 'react';
import validator from 'validator';
export var ValidatorSettings = {
  invalidAttr: { error: true },
  invalidHelperTextAttr: undefined
};
export var ValidatorDefaults = {
  isRequired: 'This field is required.'
};
export var DEFAULT_VALIDATION_ERROR_MESSAGE = 'This field is not valid.';
export var useFormInput = function(_a) {
  var name = _a.name,
    formHandler = _a.formHandler,
    _b = _a.validation,
    validation = _b === void 0 ? [] : _b,
    updateError = _a.updateError,
    _c = _a.invalidAttr,
    invalidAttr = _c === void 0 ? {} : _c,
    helperTextAttr = _a.helperTextAttr;
  var formData = formHandler[0],
    setFormData = formHandler[1];
  var formValue = formData[name] || '';
  var _d = useState(formValue),
    value = _d[0],
    setValue = _d[1];
  var _e = useState(true),
    isValid = _e[0],
    setIsValid = _e[1];
  var _f = useState(false),
    isTouched = _f[0],
    setIsTouched = _f[1];
  var _g = useState(void 0),
    helperText = _g[0],
    setHelperText = _g[1];
  var handleValidation = useCallback(
    function(inputValue) {
      var _a;
      for (
        var _i = 0, validation_1 = validation;
        _i < validation_1.length;
        _i++
      ) {
        var v = validation_1[_i];
        var validationConfig = void 0;
        // if this is a string the user has just requested a validation by name, such as `isRequired`. Otherwise, user
        // has provided a validation config, so use that.
        validationConfig =
          typeof v === 'string' ? ((_a = {}), (_a[v] = {}), _a) : v;
        var result = validate(inputValue, validationConfig);
        setIsValid(!result);
        if (result) {
          var unmetRuleKey = result[0],
            errorMessage = result[1];
          setHelperText(errorMessage);
          updateError(name, unmetRuleKey, errorMessage);
          break; // stop on the first error - we only show one at a time.
        } else {
          updateError(name);
        }
      }
    },
    [name, validation, updateError]
  );
  // watch for external parent data changes in self
  useEffect(
    function() {
      if (value !== formValue) {
        setValue(formValue);
        setIsTouched(false);
      }
    },
    [formValue, value]
  );
  // validate on value change
  useEffect(
    function() {
      if (isTouched) {
        handleValidation(value);
      } else {
        // if not touched, make sure the input is valid. This is needed when this effect is triggered due to a
        // programmatic update to the form data, otherwise inputs that should now be valid won't get updated.
        updateError(name);
      }
    },
    [value, isTouched, handleValidation]
  );
  // rewrite self and parent's value
  var handleChange = function(e) {
    var _a;
    var _b = e.currentTarget,
      type = _b.type,
      checked = _b.checked;
    var inputValue = e.currentTarget.value;
    var newValue = type === 'checkbox' ? checked : inputValue;
    setValue(inputValue);
    setFormData(__assign({}, formData, ((_a = {}), (_a[name] = newValue), _a)));
  };
  var handleBlur = function() {
    if (!isTouched) {
      setIsTouched(true);
    }
    handleValidation(value);
  };
  var showError = !isValid && isTouched;
  var helperTextObj = void 0;
  if (helperTextAttr && helperText !== undefined) {
    helperTextObj = {};
    helperTextObj[helperTextAttr] = helperText;
  }
  var inputAttr = __assign(
    {},
    showError && helperTextObj,
    showError && invalidAttr,
    { name: name, onBlur: handleBlur, onChange: handleChange, value: value }
  );
  return inputAttr;
};
export var useForm = function(
  formRef,
  defaultValues,
  handleSubmit,
  invalidAttr,
  helperTextAttr
) {
  if (invalidAttr === void 0) {
    invalidAttr = ValidatorSettings.invalidAttr;
  }
  if (helperTextAttr === void 0) {
    helperTextAttr = ValidatorSettings.invalidHelperTextAttr;
  }
  var formHandler = useState(defaultValues);
  var errorHandler = useState({});
  var _a = useState(false),
    mounted = _a[0],
    setMounted = _a[1];
  var values = formHandler[0],
    setValues = formHandler[1];
  var errors = errorHandler[0],
    setErrors = errorHandler[1];
  // initial mounted flag
  useEffect(function() {
    return setMounted(true);
  }, []);
  var updateError = function(name, unmetRule, errorMessage) {
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
  var formInputsAttrs = useRef({});
  var validateForm = function() {
    if (formRef.current) {
      var formInputsByName_1 =
        formInputsAttrs.current[formRef.current.formValidationIdAttr];
      // trigger validation on each of the form's inputs
      if (formInputsByName_1) {
        Object.keys(formInputsByName_1).forEach(function(inputName) {
          return formInputsByName_1[inputName].onBlur();
        });
      }
    }
    return mounted && !Object.values(errors).length; // no errors found
  };
  var useInput = function(name, validationConfigs) {
    var inputAttr = useFormInput({
      formHandler: formHandler,
      helperTextAttr: helperTextAttr,
      invalidAttr: invalidAttr,
      name: name,
      updateError: updateError,
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
  var formSubmitHandler = function(e) {
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
  // we proxy this set state call so that we can trigger a form validation once a new set of values has been set on the form.
  var externalSetValues = function(formValues) {
    setValues(formValues);
    validateForm();
  };
  return {
    errors: errors,
    formValues: values,
    isValid: mounted && !Object.values(errors).length,
    setValues: externalSetValues,
    useInput: useInput,
    validateForm: validateForm
  };
};
/**
 * Returns either unmet rule, or null
 * @param value
 * @param validation
 * @returns {*}
 */
export var validate = function(value, validation) {
  var fieldsToValidate = [];
  Object.keys(validation).forEach(function(property) {
    var options = {};
    var errorMsg = DEFAULT_VALIDATION_ERROR_MESSAGE;
    var negate = false;
    var validatorFunction = void 0;
    if (ValidatorDefaults[property]) {
      if (typeof ValidatorDefaults[property] === 'string') {
        // @ts-ignore
        validatorFunction = validator[ValidatorDefaults[property]];
        errorMsg = ValidatorDefaults[property];
        negate = false;
      } else {
        var propValidator = ValidatorDefaults[property];
        if (typeof propValidator.validator === 'string') {
          validatorFunction = validator[propValidator.validator];
        } else if (typeof propValidator.validator === 'function') {
          validatorFunction = propValidator.validator;
        } else {
          throw new Error(
            'The given validator must be either a string or a function.'
          );
        }
        if (propValidator.errorMessage) {
          errorMsg = propValidator.errorMessage;
        }
        negate = propValidator.negate === void 0 ? false : propValidator.negate;
        options = propValidator.options === void 0 ? {} : propValidator.options;
      }
    } else {
      var valConfig = validation[property];
      // if this is an empty object, user passed in just the string for a built in validator, which got converted to an
      // empty object before validate was invoked.
      if (Object.keys(valConfig).length === 0) {
        validatorFunction = validator[property];
      } else if (
        typeof valConfig === 'object' &&
        typeof valConfig.validator === 'string'
      ) {
        validatorFunction = validator[valConfig.validator];
      }
    }
    fieldsToValidate.push({
      key: property,
      validation: {
        errorMessage: errorMsg,
        negate: negate,
        options: options,
        validator: validatorFunction
      }
    });
    if (typeof validation[property] === 'string') {
      fieldsToValidate[fieldsToValidate.length - 1].validation.errorMessage =
        validation[property];
    } else if (typeof validation[property] === 'object') {
      if (typeof validation[property].validator === 'string') {
        // this was resolved to a validator function, we can discard the string now.
        delete validation[property].validator;
      }
      fieldsToValidate[fieldsToValidate.length - 1].validation = __assign(
        {},
        fieldsToValidate[fieldsToValidate.length - 1].validation,
        validation[property]
      );
    }
  });
  var unmetValidationKey = void 0;
  var errorMessage = void 0;
  var isValid = true;
  for (
    var _i = 0, fieldsToValidate_1 = fieldsToValidate;
    _i < fieldsToValidate_1.length;
    _i++
  ) {
    var validationConfig = fieldsToValidate_1[_i];
    var property = validationConfig.key;
    var configs = validationConfig.validation;
    switch (property) {
      case 'isRequired':
        if (!value || value.trim().length === 0) {
          isValid = false;
          unmetValidationKey = property;
          errorMessage = validationConfig.validation.errorMessage;
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
      errorMessage = validationConfig.validation.errorMessage;
      break;
    }
  }
  return isValid ? null : [unmetValidationKey, errorMessage];
};
