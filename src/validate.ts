import {
  DEFAULT_VALIDATION_ERROR_MESSAGE,
  ErrorMessageFunction,
  GlobalValidators,
  InputValidationByKey,
  InputValidationConfig,
  ValidatorFunction
} from './formalizer';
import { ValidationResult } from './use-form-input';

// apparently can't import a type from an optional dependency, so use "any" until this is resolved.
// https://stackoverflow.com/questions/52795354/how-to-use-a-type-from-an-optional-dependency-in-a-declaration-file
// https://stackoverflow.com/questions/55041919/import-of-optional-module-with-type-information
let validator: any = void 0;

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

const getErrorMessage = <T>(
  errorMsg: string | ErrorMessageFunction<T> | undefined,
  value: string,
  formData: T
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
export const validate = <T>(
  value: any,
  validation: InputValidationByKey<T>,
  formData: T
): ValidationResult => {
  const result = {
    errors: []
  } as ValidationResult;

  const fieldsToValidate: Array<InputValidationConfig<T>> = [];

  Object.keys(validation).forEach(property => {
    let options = { formData };
    let errorMsg: string = DEFAULT_VALIDATION_ERROR_MESSAGE;
    let negate: boolean | undefined = false;
    let validatorFunction: ValidatorFunction<T> | undefined = void 0;

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
          ] as ValidatorFunction<T>;
        }
        errorMsg = GlobalValidators[property] as string;
        negate = false;
      } else {
        // can only be an object at this point
        const propValidator = GlobalValidators[
          property
        ] as InputValidationConfig<T>;

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
      const valConfig = validation[property] as InputValidationConfig<T>;

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
  let errorMessage: string | ErrorMessageFunction<T> | undefined = void 0;

  for (const validationConfig of fieldsToValidate) {
    let isValid = true;
    const property = validationConfig.key;

    const configs: InputValidationConfig<T> = validationConfig;

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

    if (!isValid && property) {
      unmetValidationKey = property;
      errorMessage = getErrorMessage(
        validationConfig.errorMessage,
        value,
        formData
      );

      result.errors.push({ key: unmetValidationKey, errorMessage });
    }
  }

  return result;
};
