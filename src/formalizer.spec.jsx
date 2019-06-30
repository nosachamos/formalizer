import React, { createRef, useRef } from 'react';
import { mount } from 'enzyme';
import {
  DEFAULT_VALIDATION_ERROR_MESSAGE,
  useForm,
  ValidatorDefaults,
  ValidatorSettings
} from './formalizer';
import { act } from '@testing-library/react';

class ErrorBoundary extends React.Component {
  componentDidCatch(error, info) {
    // we silence these errors as they are expected by several tests and handled/asserted when needed
  }

  render = () => this.props.children;
}

describe('Form Validation', () => {
  const FIELD_REQUIRED_MESSAGE = 'This field is required.';
  const FIELD_REQUIRED_CUSTOM_MESSAGE = 'Very required field.';

  const isRequiredValidation = [
    {
      isRequired: {
        errorMessage: FIELD_REQUIRED_MESSAGE
      }
    }
  ];

  const isRequiredNegatedValidation = [
    {
      isRequired: {
        errorMessage: FIELD_REQUIRED_MESSAGE,
        negate: true
      }
    }
  ];

  const isRequiredWithCustomErrorMsg = [
    {
      isRequired: {
        errorMessage: FIELD_REQUIRED_CUSTOM_MESSAGE
      }
    }
  ];

  const isRequiredWithoutErrorMessage = [
    {
      isCustomRequired: {
        validator: value => {
          return !!value && value.trim().length > 0;
        }
      }
    }
  ];

  const mustContainLetterZWithOption = [
    {
      isCustomRequired: {
        validator: (value, options) => {
          if (options.ignoreCase) {
            return !!value && value.toLowerCase().indexOf('z') > -1;
          } else {
            return !!value && value.indexOf('z') > -1;
          }
        }
      }
    }
  ];

  let wrapper;
  let submitHandler;
  let formInfo;
  beforeEach(() => {
    jest.spyOn(window._virtualConsole, 'emit').mockImplementation(() => null);

    submitHandler = jest.fn();
    formInfo = null;
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  function performAssertions(
    wrapper,
    formInfo,
    submitHandler,
    field1ErrorMessage,
    field2ErrorMessage,
    formValidAfterSubmit,
    submitHandlerCalled = true
  ) {
    expect(formInfo.isValid).toBe(formValidAfterSubmit);

    if (formValidAfterSubmit) {
      if (submitHandlerCalled) {
        expect(submitHandler).toHaveBeenCalled(); // expect submit handler to be called if form is valid
      }
    } else {
      expect(submitHandler).not.toHaveBeenCalled(); // errors, so submit is aborted
    }

    expect(formInfo.errors.field1).toEqual(field1ErrorMessage);
    expect(formInfo.errors.field2).toEqual(field2ErrorMessage);

    expect(wrapper.find('#field1Error').text()).toEqual(
      field1ErrorMessage ? field1ErrorMessage : ''
    );
    expect(wrapper.find('#field2Error').text()).toEqual(
      field2ErrorMessage ? field2ErrorMessage : ''
    );

    submitHandler.mockClear(); // reset the calls count
  }

  const buildTestForm = (
    formRef,
    formInfo,
    field1Validation,
    field2Validation
  ) => (
    <form ref={formRef}>
      <input id="field1" {...formInfo.useInput('field1', field1Validation)} />
      <span id="field1Error">{formInfo.errors['field1']}</span>
      <input id="field2" {...formInfo.useInput('field2', field2Validation)} />
      <span id="field2Error">{formInfo.errors['field2']}</span>

      <button
        data-test="form-submit-button"
        {...(formInfo.isValid ? {} : { disabled: true })}
        type="submit"
      >
        Submit
      </button>
      <button
        data-test="force-validation-button"
        onClick={formInfo.validateForm}
      >
        Force form validation
      </button>
    </form>
  );

  const typeIntoInput = (input, value) => {
    input.instance().value = value;
    input.simulate('change', { target: { value: value } });
  };

  // TESTS START HERE

  [
    {
      title: `Error raised when required fields have empty value - using custom is required object`,
      field1Value: '',
      field2Value: '',
      field1Validation: isRequiredValidation,
      field2Validation: isRequiredValidation,
      field1ErrorMessage: FIELD_REQUIRED_MESSAGE,
      field2ErrorMessage: FIELD_REQUIRED_MESSAGE,
      buttonToClickSelector: '[data-test="force-validation-button"]'
    },
    {
      title: `Error raised when required fields have empty value - using built in isRequired key`,
      field1Value: '',
      field2Value: '',
      field1Validation: ['isRequired'],
      field2Validation: ['isRequired'],
      field1ErrorMessage: FIELD_REQUIRED_MESSAGE,
      field2ErrorMessage: FIELD_REQUIRED_MESSAGE,
      buttonToClickSelector: '[data-test="force-validation-button"]'
    },
    {
      title: `Error raised when required fields have empty value - using custom validator an error message`,
      field1Value: '',
      field2Value: '',
      field1Validation: isRequiredWithCustomErrorMsg,
      field2Validation: isRequiredWithCustomErrorMsg,
      field1ErrorMessage: FIELD_REQUIRED_CUSTOM_MESSAGE,
      field2ErrorMessage: FIELD_REQUIRED_CUSTOM_MESSAGE,
      buttonToClickSelector: '[data-test="force-validation-button"]'
    },
    {
      title: `Error raised when required fields have empty value - using custom validator without an error message`,
      field1Value: '',
      field2Value: '',
      field1Validation: isRequiredWithoutErrorMessage,
      field2Validation: isRequiredWithoutErrorMessage,
      field1ErrorMessage: DEFAULT_VALIDATION_ERROR_MESSAGE,
      field2ErrorMessage: DEFAULT_VALIDATION_ERROR_MESSAGE,
      buttonToClickSelector: '[data-test="force-validation-button"]'
    }
  ].forEach(data =>
    it(data.title, () => {
      const FormWrapper = () => {
        const formRef = useRef(null);
        formInfo = useForm(
          formRef,
          { field1: data.field1Value, field2: data.field2Value },
          submitHandler,
          null
        );

        return buildTestForm(
          formRef,
          formInfo,
          data.field1Validation,
          data.field2Validation
        );
      };

      wrapper = mount(<FormWrapper />);

      expect(formInfo.isValid).toBe(true);

      wrapper.find('[data-test="force-validation-button"]').simulate('click');

      performAssertions(
        wrapper,
        formInfo,
        submitHandler,
        data.field1ErrorMessage,
        data.field2ErrorMessage,
        false
      );
    })
  );

  it('Validators can be negated', () => {
    const FormWrapper = () => {
      const formRef = useRef(null);
      formInfo = useForm(
        formRef,
        { field1: '', field2: '' },
        submitHandler,
        null
      );

      return buildTestForm(
        formRef,
        formInfo,
        isRequiredNegatedValidation,
        isRequiredNegatedValidation
      );
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    // form still valid because validation has been negated
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      undefined,
      undefined,
      true,
      false
    );

    // set some text to the first input, and see that it errors out now
    // // finally, make it invalid by removing the letter z
    typeIntoInput(wrapper.find('#field1'), 'test z');

    // no errors on second field, but first field is now errored because validation was negated
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      FIELD_REQUIRED_MESSAGE,
      undefined,
      false,
      false
    );
  });

  it('Can handle no validations given: form is always valid', () => {
    const formRef = createRef();
    const FormWrapper = () => {
      formInfo = useForm(
        formRef,
        { field1: '', field2: '' },
        submitHandler,
        null
      );

      return buildTestForm(formRef, formInfo, [], []);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    // form still valid, no validations given
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      undefined,
      undefined,
      true,
      false
    );

    // set some text to the first input: it continues to be valid
    typeIntoInput(wrapper.find('#field1'), 'test z');

    // submit form
    formRef.current.dispatchEvent(new Event('submit'));

    // no errors, form is submitted
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      undefined,
      undefined,
      true,
      true
    );
  });

  it('Can handle no fields to validate given: form is always valid', () => {
    const formRef = createRef();
    const FormWrapper = () => {
      formInfo = useForm(formRef, {}, submitHandler, null);

      return (
        <form ref={formRef}>
          <button
            data-test="form-submit-button"
            {...(formInfo.isValid ? {} : { disabled: true })}
            type="submit"
          >
            Submit
          </button>
          <button
            data-test="force-validation-button"
            onClick={formInfo.validateForm}
          >
            Force form validation
          </button>
        </form>
      );
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    // form still valid, no validations given
    expect(formInfo.isValid).toBe(true);
    expect(submitHandler).not.toHaveBeenCalled(); // just validated, so no submit
    submitHandler.mockClear(); // reset the calls count

    // submit form
    formRef.current.dispatchEvent(new Event('submit'));

    // no errors, form is submitted
    expect(formInfo.isValid).toBe(true);
    expect(submitHandler).toHaveBeenCalled(); // form was submitted this time
    submitHandler.mockClear(); // reset the calls count
  });

  it('Custom error message can be added to built in isRequired validator', () => {
    const CUSTOM_ERROR_MESSAGE = "Field can't be left empty";
    ValidatorDefaults.isRequired = CUSTOM_ERROR_MESSAGE;

    const FormWrapper = () => {
      const formRef = useRef(null);
      formInfo = useForm(
        formRef,
        { field1: '', field2: '' },
        submitHandler,
        null
      );

      return buildTestForm(formRef, formInfo, ['isRequired'], ['isRequired']);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      CUSTOM_ERROR_MESSAGE,
      CUSTOM_ERROR_MESSAGE,
      false
    );

    // restoring the default message
    ValidatorDefaults.isRequired = 'This field is required.';
  });

  it('Default error attribute is added to input', () => {
    const FormWrapper = () => {
      const formRef = useRef(null);
      formInfo = useForm(
        formRef,
        { field1: 'testValue', field2: '' },
        submitHandler
      );
      return buildTestForm(formRef, formInfo, ['isRequired'], ['isRequired']);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      undefined,
      FIELD_REQUIRED_MESSAGE,
      false
    );

    expect(wrapper.find('#field1').prop('error')).not.toBeDefined();
    expect(wrapper.find('#field2').prop('error')).toBe(true);
  });

  it('Custom error attribute is added to input', () => {
    const FormWrapper = () => {
      const formRef = useRef(null);
      formInfo = useForm(
        formRef,
        { field1: '', field2: 'testValue' },
        submitHandler,
        { 'input-has-error': 'yes' }
      );
      return buildTestForm(formRef, formInfo, ['isRequired'], ['isRequired']);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      FIELD_REQUIRED_MESSAGE,
      undefined,
      false
    );

    expect(wrapper.find('#field1').prop('input-has-error')).toBe('yes');
    expect(wrapper.find('#field2').prop('input-has-error')).not.toBeDefined();
  });

  it('Global custom error attribute is added to input', () => {
    const originalInvalidAttr = ValidatorSettings.invalidAttr;
    ValidatorSettings.invalidAttr = { 'input-has-error': 'yes' };

    const FormWrapper = () => {
      const formRef = useRef(null);
      formInfo = useForm(
        formRef,
        { field1: '', field2: 'testValue' },
        submitHandler
      );
      return buildTestForm(formRef, formInfo, ['isRequired'], ['isRequired']);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      FIELD_REQUIRED_MESSAGE,
      undefined,
      false
    );

    expect(wrapper.find('#field1').prop('input-has-error')).toBe('yes');
    expect(wrapper.find('#field2').prop('input-has-error')).not.toBeDefined();

    ValidatorSettings.invalidAttr = originalInvalidAttr;
  });

  it('Form submission is prevented when there were errors in the form', () => {
    const formRef = createRef();
    const FormWrapper = () => {
      formInfo = useForm(formRef, { field1: '', field2: '' });
      return buildTestForm(formRef, formInfo, ['isRequired'], []);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    // actually submit the form
    act(() => {
      formRef.current.dispatchEvent(new Event('submit'));
    });
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      FIELD_REQUIRED_MESSAGE,
      undefined,
      false,
      false
    );
  });

  it('Custom validator function can be provided', () => {
    const FormWrapper = () => {
      const formRef = useRef(null);
      formInfo = useForm(
        formRef,
        { field1: 'test', field2: '' },
        submitHandler
      );
      return buildTestForm(
        formRef,
        formInfo,
        [
          {
            mustHaveZ: {
              errorMessage: 'Field does not contain letter z',
              validator: value => {
                return value.length > 1 && value.indexOf('z') > -1;
              }
            }
          }
        ],
        []
      );
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      'Field does not contain letter z',
      undefined,
      false
    );
  });

  it('Custom validator function mixed with built in validator by key can be provided together', () => {
    const formRef = createRef();
    const FormWrapper = () => {
      formInfo = useForm(formRef, { field1: '', field2: '' }, submitHandler);
      return buildTestForm(
        formRef,
        formInfo,
        [
          'isRequired',
          {
            mustHaveZ: {
              errorMessage: 'Field does not contain letter z',
              validator: value => {
                return value.length > 1 && value.indexOf('z') > -1;
              }
            }
          }
        ],
        []
      );
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    // isRequired comes first, so that's the first error we get
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      FIELD_REQUIRED_MESSAGE,
      undefined,
      false
    );

    // let's type something without letter Z now
    typeIntoInput(wrapper.find('#field1'), 'test');

    // now is not empty anymore but doesn't have letter z
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      'Field does not contain letter z',
      undefined,
      false
    );

    // // finally, make it invalid by removing the letter z
    typeIntoInput(wrapper.find('#field1'), 'test z');

    // no errors
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      undefined,
      undefined,
      true,
      false
    );

    // submit a valid form and make sure the form handler is not invoked: this only validates the form
    wrapper.find('[data-test="force-validation-button"]').simulate('click');
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      undefined,
      undefined,
      true,
      false
    );

    // submit the form by pressing the submit button. This time the form submit handler should be invoked
    // first, making sure the submit button is not disabled
    expect(
      wrapper.find('[data-test="form-submit-button"]').prop('disabled')
    ).not.toBeDefined();

    // now click on the submit button.
    // can't use simulate on the form submit button, or the form is not submitted.
    // See https://github.com/airbnb/enzyme/issues/308#issuecomment-255630011
    formRef.current.dispatchEvent(new Event('submit'));
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      undefined,
      undefined,
      true,
      true
    );

    // remove letter z, error is back
    typeIntoInput(wrapper.find('#field1'), 'test');
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      'Field does not contain letter z',
      undefined,
      false
    );

    // remove everything and the required error is back
    typeIntoInput(wrapper.find('#field1'), '');
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      FIELD_REQUIRED_MESSAGE,
      undefined,
      false
    );
  });

  it('Custom global validator function that uses custom options can be provided', () => {
    // adding a custom global validator which changes behavior based on given option
    ValidatorDefaults.mustContainLetterZ = {
      errorMessage: 'Must contain the letter z',
      validator: (value, options) => {
        if (options['ignoreCase']) {
          return !!value && value.toLowerCase().indexOf('z') > -1;
        } else {
          return !!value && value.indexOf('z') > -1;
        }
      }
    };

    {
      // first we test without giving options
      const FormWrapper = () => {
        const formRef = useRef(null);
        formInfo = useForm(
          formRef,
          { field1: 'test', field2: '' },
          submitHandler
        );
        return buildTestForm(formRef, formInfo, ['mustContainLetterZ'], []);
      };

      wrapper = mount(<FormWrapper />);

      expect(formInfo.isValid).toBe(true);

      wrapper.find('[data-test="force-validation-button"]').simulate('click');

      // starts with error
      performAssertions(
        wrapper,
        formInfo,
        submitHandler,
        'Must contain the letter z',
        undefined,
        false
      );

      typeIntoInput(wrapper.find('#field1'), 'test z'); // no error now
      performAssertions(
        wrapper,
        formInfo,
        submitHandler,
        undefined,
        undefined,
        true,
        false
      );

      // upper case is not recognized by default
      typeIntoInput(wrapper.find('#field1'), 'test Z'); // upper case Z will not be accepted
      performAssertions(
        wrapper,
        formInfo,
        submitHandler,
        'Must contain the letter z',
        undefined,
        false,
        false
      );
    }

    {
      // now test with the ignoreCase option and validate upper case Z is accepted
      const FormWrapper = () => {
        const formRef = useRef(null);
        formInfo = useForm(
          formRef,
          { field1: 'test', field2: '' },
          submitHandler
        );
        return buildTestForm(
          formRef,
          formInfo,
          [
            {
              mustContainLetterZ: {
                options: { ignoreCase: true }
              }
            }
          ],
          []
        );
      };

      wrapper = mount(<FormWrapper />);

      expect(formInfo.isValid).toBe(true);

      wrapper.find('[data-test="force-validation-button"]').simulate('click');

      // starts with error
      performAssertions(
        wrapper,
        formInfo,
        submitHandler,
        'Must contain the letter z',
        undefined,
        false,
        false
      );

      typeIntoInput(wrapper.find('#field1'), 'test z'); // no error now
      performAssertions(
        wrapper,
        formInfo,
        submitHandler,
        undefined,
        undefined,
        true,
        false
      );

      // upper case now recognized
      typeIntoInput(wrapper.find('#field1'), 'test Z'); // no error now, we are validating with the ignore case option
      performAssertions(
        wrapper,
        formInfo,
        submitHandler,
        undefined,
        undefined,
        true,
        false
      );
    }
  });

  [
    {
      name: 'object',
      validator: {} // invalid type
    },
    {
      name: 'boolean',
      validator: false // invalid type
    },
    {
      name: 'undefined',
      validator: undefined // invalid type
    }
  ].forEach(invalidValidatorDef =>
    it(`Correct error is thrown when the given global validator of invalid type (${invalidValidatorDef.name})`, () => {
      spyOn(console, 'error'); // prevents React 16 error boundary warning

      ValidatorDefaults.invalidValidator = invalidValidatorDef;

      const formRef = createRef();
      const FormWrapper = () => {
        formInfo = useForm(
          formRef,
          { field1: 'test', field2: '' },
          submitHandler
        );
        return buildTestForm(formRef, formInfo, ['invalidValidator'], []);
      };

      wrapper = mount(
        <ErrorBoundary>
          <FormWrapper />
        </ErrorBoundary>
      );

      const callMount = () =>
        wrapper.find('[data-test="force-validation-button"]').simulate('click');

      expect(callMount).toThrowError(
        new Error('The given validator must be either a string or a function.')
      );
    })
  );

  it("Custom global validation using a string validator (referring to one of validator's functions) can be provided", () => {
    ValidatorDefaults.mustBeEmail = {
      errorMessage: 'This needs to be an email.',
      validator: 'isEmail'
    };

    const FormWrapper = () => {
      const formRef = useRef(null);
      formInfo = useForm(
        formRef,
        { field1: 'test', field2: '' },
        submitHandler
      );
      return buildTestForm(formRef, formInfo, ['mustBeEmail'], []);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      'This needs to be an email.',
      undefined,
      false,
      false
    );

    typeIntoInput(wrapper.find('#field1'), 'valid.email@email.com');
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      undefined,
      undefined,
      true,
      false
    );
  });

  it("Custom validation using a string validator (referring to one of validator's functions) can be provided", () => {
    const FormWrapper = () => {
      const formRef = useRef(null);
      formInfo = useForm(
        formRef,
        { field1: 'test', field2: '' },
        submitHandler
      );
      return buildTestForm(
        formRef,
        formInfo,
        [
          {
            mustBeEmail: {
              errorMessage: 'This needs to be an email.',
              validator: 'isEmail'
            }
          }
        ],
        []
      );
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      'This needs to be an email.',
      undefined,
      false,
      false
    );

    typeIntoInput(wrapper.find('#field1'), 'valid.email@email.com');
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      undefined,
      undefined,
      true,
      false
    );
  });

  it('Custom global validation using a string validator can have its message overridden', () => {
    ValidatorDefaults.mustBeEmail = {
      errorMessage: 'This needs to be an email.',
      validator: 'isEmail'
    };

    const FormWrapper = () => {
      const formRef = useRef(null);
      formInfo = useForm(
        formRef,
        { field1: 'test', field2: '' },
        submitHandler
      );
      return buildTestForm(
        formRef,
        formInfo,
        [
          {
            mustBeEmail: {
              errorMessage: 'Not even close to a valid email, bro.'
            }
          }
        ],
        []
      );
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      'Not even close to a valid email, bro.',
      undefined,
      false,
      false
    );

    typeIntoInput(wrapper.find('#field1'), 'valid.email@email.com');
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      undefined,
      undefined,
      true,
      false
    );
  });

  it('Custom global validation using a string validator can have its message overridden by direct string assignment', () => {
    ValidatorDefaults.mustBeEmail = {
      errorMessage: 'This needs to be an email.',
      validator: 'isEmail'
    };

    const FormWrapper = () => {
      const formRef = useRef(null);
      formInfo = useForm(
        formRef,
        { field1: 'test', field2: '' },
        submitHandler
      );
      return buildTestForm(
        formRef,
        formInfo,
        [{ mustBeEmail: 'Not even close to a valid email, bro.' }],
        []
      );
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      'Not even close to a valid email, bro.',
      undefined,
      false,
      false
    );

    typeIntoInput(wrapper.find('#field1'), 'valid.email@email.com');
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      undefined,
      undefined,
      true,
      false
    );
  });

  it('Can specify global validator by assigning the validator config to its string name', () => {
    ValidatorDefaults.mustBeEmail = {
      errorMessage: 'This needs to be an email.',
      validator: 'isEmail'
    };

    const FormWrapper = () => {
      const formRef = useRef(null);
      formInfo = useForm(
        formRef,
        { field1: 'test', field2: '' },
        submitHandler
      );
      return buildTestForm(
        formRef,
        formInfo,
        [{ mustBeEmail: { validator: 'mustBeEmail' } }],
        []
      );
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      'This needs to be an email.',
      undefined,
      false,
      false
    );

    typeIntoInput(wrapper.find('#field1'), 'valid.email@email.com');
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      undefined,
      undefined,
      true,
      false
    );
  });

  it('Can specify global validator without custom message by assigning the validator config to its string name', () => {
    ValidatorDefaults.mustBeEmail = {
      validator: 'isEmail'
    };

    const FormWrapper = () => {
      const formRef = useRef(null);
      formInfo = useForm(
        formRef,
        { field1: 'test', field2: '' },
        submitHandler
      );
      return buildTestForm(
        formRef,
        formInfo,
        [{ mustBeEmail: { validator: 'mustBeEmail' } }],
        []
      );
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      'This field is not valid.',
      undefined,
      false,
      false
    );

    typeIntoInput(wrapper.find('#field1'), 'valid.email@email.com');
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      undefined,
      undefined,
      true,
      false
    );
  });

  it('Can specify built-in validator by assigning the validator config to its string name', () => {
    // making sure there is not global validator for this
    delete ValidatorDefaults.mustBeEmail;

    const FormWrapper = () => {
      const formRef = useRef(null);
      formInfo = useForm(
        formRef,
        { field1: 'test', field2: '' },
        submitHandler
      );
      return buildTestForm(
        formRef,
        formInfo,
        [{ mustBeEmail: { validator: 'isEmail' } }],
        []
      );
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      'This field is not valid.',
      undefined,
      false,
      false
    );

    typeIntoInput(wrapper.find('#field1'), 'valid.email@email.com');
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      undefined,
      undefined,
      true,
      false
    );
  });

  it('Can specify built-in validator directly by its string name', () => {
    // making sure there is not global validator for this
    delete ValidatorDefaults.isEmail;

    const FormWrapper = () => {
      const formRef = useRef(null);
      formInfo = useForm(
        formRef,
        { field1: 'test', field2: '' },
        submitHandler
      );
      return buildTestForm(formRef, formInfo, ['isEmail'], []);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      'This field is not valid.',
      undefined,
      false,
      false
    );

    typeIntoInput(wrapper.find('#field1'), 'valid.email@email.com');
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      undefined,
      undefined,
      true,
      false
    );
  });

  it(`Correct error is thrown when user-provided submit handler throws an exception`, () => {
    //spyOn(console, 'error'); // prevents React 16 error boundary warning
    // let spy = {};
    // spy.console = jest.spyOn(console, 'error').mockImplementation(() => {});

    window.onerror = jest.fn();
    const errorSpy = jest.spyOn(window, 'onerror').mockImplementation(() => {});

    const submitHandlerThatThrows = () => {
      throw new Error('Ops, I am not as cool as I thought I was. :(');
    };

    const formRef = createRef();
    const FormWrapper = () => {
      formInfo = useForm(
        formRef,
        { field1: 'test', field2: '' },
        submitHandlerThatThrows
      );
      return buildTestForm(formRef, formInfo, ['isRequired'], []);
    };

    wrapper = mount(<FormWrapper />);

    act(() => {
      // submit the form
      formRef.current.dispatchEvent(new Event('submit'));
    });

    // need to check things like this because JSDOM likes to eat exceptions thrown from event handlers.
    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy.mock.calls[0][0]).toContain(
      'An error has happened executing the user-provided form submit handler.'
    );

    // restore to undefined
    delete window.onerror;
  });

  it('Can specify built-in validator without a form submit handler', () => {
    // making sure there is not global validator for this
    delete ValidatorDefaults.mustBeEmail;

    const formRef = createRef();
    const FormWrapper = () => {
      formInfo = useForm(formRef, {
        field1: 'valid.email@email.com',
        field2: ''
      });
      return buildTestForm(
        formRef,
        formInfo,
        [{ mustBeEmail: { validator: 'isEmail' } }],
        []
      );
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    act(() => {
      // submit the form
      formRef.current.dispatchEvent(new Event('submit'));
    });

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      undefined,
      undefined,
      true,
      false
    );
  });

  it('Custom error helper text is added to input', () => {
    const FormWrapper = () => {
      const formRef = useRef(null);
      formInfo = useForm(
        formRef,
        { field1: '', field2: 'testValue' },
        submitHandler,
        { 'input-has-error': 'yes' },
        'myHelperText'
      );
      return buildTestForm(formRef, formInfo, ['isRequired'], ['isRequired']);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      FIELD_REQUIRED_MESSAGE,
      undefined,
      false
    );

    expect(wrapper.find('#field1').prop('input-has-error')).toBe('yes');
    expect(wrapper.find('#field2').prop('input-has-error')).not.toBeDefined();

    expect(wrapper.find('#field1').prop('myHelperText')).toBe(
      FIELD_REQUIRED_MESSAGE
    );
    expect(wrapper.find('#field2').prop('myHelperText')).not.toBeDefined();
  });

  it('Fields are updated when form value is set programmatically', () => {
    const FormWrapper = () => {
      const formRef = useRef(null);
      formInfo = useForm(
        formRef,
        { field1: '', field2: 'testValue' },
        submitHandler,
        {}
      );
      return buildTestForm(formRef, formInfo, ['isRequired'], ['isRequired']);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      FIELD_REQUIRED_MESSAGE,
      undefined,
      false
    );

    // manually setting the form value
    act(() => {
      formInfo.setValues({ field1: 'updated', field2: 'testValue updated' });
    });

    expect(formInfo.isValid).toBe(true);
    expect(submitHandler).not.toHaveBeenCalled();
    expect(formInfo.errors.field1).toEqual(undefined);
    expect(formInfo.errors.field2).toEqual(undefined);
  });
});
