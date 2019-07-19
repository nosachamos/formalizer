import React from 'react';
import { mount } from 'enzyme';
import {
  DEFAULT_VALIDATION_ERROR_MESSAGE,
  FormalizerSettings,
  GlobalValidators,
  mustMatch,
  setupForMaterialUI,
  useFormalizer
} from './formalizer';
import { act } from '@testing-library/react';

class ErrorBoundary extends React.Component {
  componentDidCatch(error, info) {
    // we silence these errors as they are expected by several tests and handled/asserted when needed
  }

  render() {
    return this.props.children;
  }
}

describe('Form Validation', () => {
  const FIELD_REQUIRED_MESSAGE = 'This field is required.';
  const FIELD_REQUIRED_CUSTOM_MESSAGE = 'Very required field.';

  const isRequiredValidation = [
    {
      validator: 'isRequired',
      errorMessage: FIELD_REQUIRED_MESSAGE
    }
  ];

  const isRequiredNegatedValidation = [
    {
      validator: 'isRequired',
      errorMessage: FIELD_REQUIRED_MESSAGE,
      negate: true
    }
  ];

  const isRequiredWithCustomErrorMsg = [
    {
      validator: 'isRequired',
      errorMessage: FIELD_REQUIRED_CUSTOM_MESSAGE
    }
  ];

  const isRequiredWithoutErrorMessage = [
    {
      validator: value => {
        return !!value && value.trim().length > 0;
      }
    }
  ];

  const isRequiredWithCustomKey = [
    {
      key: 'isRequiredValidation',
      validator: value => {
        return !!value && value.trim().length > 0;
      }
    }
  ];

  const mustContainLetterZWithOption = [
    {
      validator: (value, options) => {
        if (options.ignoreCase) {
          return !!value && value.toLowerCase().indexOf('z') > -1;
        } else {
          return !!value && value.indexOf('z') > -1;
        }
      }
    }
  ];

  let wrapper;
  let submitHandler;
  let formInfo;
  beforeEach(() => {
    // avoid annoying virtual console errors we don't care about
    jest.spyOn(window._virtualConsole, 'emit').mockImplementation(() => void 0);

    submitHandler = jest.fn();
    formInfo = null;
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
      wrapper = undefined;
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

        // submit handler was called (exactly once) because we did not connect a form
        expect(submitHandler.mock.calls.length).toBe(1);
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

  const buildTestForm = (formInfo, field1Validation, field2Validation) => (
    <form ref={formInfo.formRef}>
      <input name="field1" {...formInfo.useInput('field1', field1Validation)} />
      <span id="field1Error">{formInfo.errors['field1']}</span>
      <input name="field2" {...formInfo.useInput('field2', field2Validation)} />
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
      title: `Error raised when required fields have empty value - using plain string validator instead of array`,
      field1Value: '',
      field2Value: '',
      field1Validation: 'isRequired',
      field2Validation: 'isRequired',
      field1ErrorMessage: FIELD_REQUIRED_MESSAGE,
      field2ErrorMessage: FIELD_REQUIRED_MESSAGE,
      buttonToClickSelector: '[data-test="force-validation-button"]'
    },
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
      title: `Error raised when required fields have empty value - using custom is required object with user-provided key`,
      field1Value: '',
      field2Value: '',
      field1Validation: isRequiredWithCustomKey,
      field2Validation: isRequiredWithCustomKey,
      field1ErrorMessage: DEFAULT_VALIDATION_ERROR_MESSAGE,
      field2ErrorMessage: DEFAULT_VALIDATION_ERROR_MESSAGE,
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
        formInfo = useFormalizer(
          submitHandler,
          { field1: data.field1Value, field2: data.field2Value },
          null
        );

        return buildTestForm(
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

  it(`Error raised when input has invalid value and Enter is pressed`, () => {
    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler);

      return buildTestForm(formInfo, 'isEmail', undefined);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    act(() => {
      // lets start by typing an incomplete email
      typeIntoInput(
        wrapper.find('[name="field1"]'),
        'this.is.my.email@notcomplete'
      );
    });

    // form is still valid since we did not remove focus or pressed Enter
    expect(formInfo.isValid).toBe(true);

    act(() => {
      // then press Enter
      wrapper.find('[name="field1"]').simulate('keypress', { key: 'Enter' });
    });

    // Form is no longer valid
    expect(formInfo.isValid).toBe(false);

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      DEFAULT_VALIDATION_ERROR_MESSAGE,
      undefined,
      false
    );
  });

  it(`If no form is connected, then the submitHandler is invoked on when data is accepted`, () => {
    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, {
        field1: '',
        field2: '',
        checkboxField: false
      });

      return (
        <>
          <input name="field1" {...formInfo.useInput('field1', 'isEmail')} />
          <span id="field1Error">{formInfo.errors['field1']}</span>
          <input name="field2" {...formInfo.useInput('field2')} />
          <span id="field2Error">{formInfo.errors['field2']}</span>
          <input type="checkbox" {...formInfo.useInput('checkboxField')} />
        </>
      );
    };

    wrapper = mount(<FormWrapper />);

    const performBasicAssertions = () => {
      // submit handler was called (exactly once) because we did not connect a form
      expect(submitHandler.mock.calls.length).toBe(1);
      // we got something as the first argument
      expect(submitHandler.mock.calls[0][0]).not.toBeNull();
      // second argument is empty
      expect(submitHandler.mock.calls[0][1]).toBeUndefined();
      // Form is valid
      expect(formInfo.isValid).toBe(true);
    };

    expect(formInfo.isValid).toBe(true);

    act(() => {
      // lets start by typing an incomplete email
      typeIntoInput(wrapper.find('[name="field1"]'), 'john-smithl@email.com');
    });

    act(() => {
      // then press Enter
      wrapper.find('[name="field1"]').simulate('keypress', { key: 'Enter' });
    });

    performBasicAssertions();

    // the second argument is the form data, and it is correct
    expect(submitHandler.mock.calls[0][0]).toEqual({
      field1: 'john-smithl@email.com',
      field2: '',
      checkboxField: false
    });
    // reset the mock calls
    submitHandler.mockClear();

    act(() => {
      // type on the field with no validations, and press Enter
      typeIntoInput(wrapper.find('[name="field2"]'), 'test value');
    });

    act(() => {
      // then press Enter
      wrapper.find('[name="field2"]').simulate('keypress', { key: 'Enter' });
    });

    performBasicAssertions();

    // the second argument is the form data, and it is correct
    expect(submitHandler.mock.calls[0][0]).toEqual({
      field1: 'john-smithl@email.com',
      field2: 'test value',
      checkboxField: false
    });
    // reset the mock calls
    submitHandler.mockClear();

    // toggling the checkbox also results in a call to the submit handler
    act(() => {
      wrapper.find('[type="checkbox"]').prop('onChange')({
        currentTarget: { type: 'checkbox', checked: true }
      });
    });

    performBasicAssertions();

    // the second argument is the form data, and it is correct
    expect(submitHandler.mock.calls[0][0]).toEqual({
      field1: 'john-smithl@email.com',
      field2: 'test value',
      checkboxField: true
    });
    // reset the mock calls
    submitHandler.mockClear();

    // now type some invalid data and make sure the handle is not called
    act(() => {
      typeIntoInput(wrapper.find('[name="field1"]'), 'john@invalid');
    });

    act(() => {
      // then press Enter
      wrapper.find('[name="field1"]').simulate('keypress', { key: 'Enter' });
    });

    // handler was not invoked - data isn't valid
    expect(submitHandler).not.toHaveBeenCalled();

    // now type some invalid data and remove the focus from the field
    act(() => {
      typeIntoInput(wrapper.find('[name="field1"]'), 'john-smith@invalid');
    });

    act(() => {
      // remove focus from the field
      wrapper.find('[name="field1"]').simulate('blur');
    });

    // handler was not invoked - data isn't valid
    expect(submitHandler).not.toHaveBeenCalled();

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      DEFAULT_VALIDATION_ERROR_MESSAGE,
      undefined,
      false
    );
  });

  it('Validators can be negated', () => {
    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, { field1: '', field2: '' }, null);

      return buildTestForm(
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
    typeIntoInput(wrapper.find('[name="field1"]'), 'test z');

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
    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, { field1: '', field2: '' }, null);

      return buildTestForm(formInfo, [], []);
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
    typeIntoInput(wrapper.find('[name="field1"]'), 'test z');

    // submit form
    formInfo.formRef.current.dispatchEvent(new Event('submit'));

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

  [
    {
      name: 'undefined',
      value: undefined
    },
    {
      name: 'null',
      value: null
    }
  ].forEach(t =>
    it(`Can ${t.name} initial form value.`, () => {
      const FormWrapper = () => {
        formInfo = useFormalizer(submitHandler, t.value, null);

        return buildTestForm(formInfo, [], []);
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
    })
  );

  [
    {
      name: 'numeric',
      value: 123
    },
    {
      name: 'boolean',
      value: true
    },
    {
      name: 'array',
      value: []
    },
    {
      name: 'function',
      value: () => {}
    },
    {
      name: 'string',
      value: 'invalid'
    }
  ].forEach(t =>
    it(`Error raised when invalid initial form values of ${t.name} type is used.`, () => {
      const callMount = () => useFormalizer(submitHandler, t.value, null);

      expect(callMount).toThrowError(
        new Error(
          'Formalizer: the given initial values argument is of an invalid type. Must be an object.'
        )
      );
    })
  );

  [
    {
      name: 'undefined',
      value: undefined
    },
    {
      name: 'null',
      value: null
    }
  ].forEach(t =>
    it(`Can ${t.name} form submission handler.`, () => {
      const FormWrapper = () => {
        formInfo = useFormalizer(t.value, {}, null);

        return buildTestForm(formInfo, [], []);
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
    })
  );

  [
    {
      name: 'numeric',
      value: 123
    },
    {
      name: 'boolean',
      value: true
    },
    {
      name: 'object',
      value: {}
    },
    {
      name: 'array',
      value: []
    },
    {
      name: 'string',
      value: 'invalid'
    }
  ].forEach(t =>
    it(`Error raised when invalid form submit handler of ${t.name} type is used.`, () => {
      const callMount = () => useFormalizer(t.value, {});

      expect(callMount).toThrowError(
        new Error(
          'Formalizer: the given form submit handler argument is of an invalid type. Must be a function.'
        )
      );
    })
  );

  it('Can handle no fields to validate given: form is always valid', () => {
    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, {}, null);

      return (
        <form ref={formInfo.formRef}>
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
    formInfo.formRef.current.dispatchEvent(new Event('submit'));

    // no errors, form is submitted
    expect(formInfo.isValid).toBe(true);
    expect(submitHandler).toHaveBeenCalled(); // form was submitted this time
    submitHandler.mockClear(); // reset the calls count
  });

  it('Custom error message can be added to built in isRequired validator', () => {
    const CUSTOM_ERROR_MESSAGE = "Field can't be left empty";
    GlobalValidators.isRequired = CUSTOM_ERROR_MESSAGE;

    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, { field1: '', field2: '' }, null);

      return buildTestForm(formInfo, ['isRequired'], ['isRequired']);
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
    GlobalValidators.isRequired = 'This field is required.';
  });

  it('Default error attribute is added to input', () => {
    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, {
        field1: 'testValue',
        field2: ''
      });
      return buildTestForm(formInfo, ['isRequired'], ['isRequired']);
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

    expect(wrapper.find('[name="field1"]').prop('error')).not.toBeDefined();
    expect(wrapper.find('[name="field2"]').prop('error')).toBe(true);
  });

  it('Form-specific custom error attribute is added to input', () => {
    const settings = { invalidAttr: { 'input-has-error': 'yes' } };

    const FormWrapper = () => {
      formInfo = useFormalizer(
        submitHandler,
        { field1: '', field2: 'testValue' },
        settings
      );
      return buildTestForm(formInfo, ['isRequired'], ['isRequired']);
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

    expect(wrapper.find('[name="field1"]').prop('input-has-error')).toBe('yes');
    expect(
      wrapper.find('[name="field2"]').prop('input-has-error')
    ).not.toBeDefined();
  });

  it('Global custom error attribute is added to input', () => {
    const originalInvalidAttr = FormalizerSettings.invalidAttr;
    FormalizerSettings.invalidAttr = { 'input-has-error': 'yes' };

    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, {
        field1: '',
        field2: 'testValue'
      });
      return buildTestForm(formInfo, ['isRequired'], ['isRequired']);
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

    expect(wrapper.find('[name="field1"]').prop('input-has-error')).toBe('yes');
    expect(
      wrapper.find('[name="field2"]').prop('input-has-error')
    ).not.toBeDefined();

    FormalizerSettings.invalidAttr = originalInvalidAttr;
  });

  it('Form submission is prevented when there were errors in the form', () => {
    const FormWrapper = () => {
      formInfo = useFormalizer(null, { field1: '', field2: '' });
      return buildTestForm(formInfo, ['isRequired'], []);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    // actually submit the form
    act(() => {
      formInfo.formRef.current.dispatchEvent(new Event('submit'));
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
      formInfo = useFormalizer(submitHandler, { field1: 'test', field2: '' });
      return buildTestForm(
        formInfo,
        [
          {
            errorMessage: 'Field does not contain letter z',
            validator: value => {
              return value.length > 1 && value.indexOf('z') > -1;
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
    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, { field1: '', field2: '' });
      return buildTestForm(
        formInfo,
        [
          'isRequired',
          {
            errorMessage: 'Field does not contain letter z',
            validator: value => {
              return value.length > 1 && value.indexOf('z') > -1;
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
    typeIntoInput(wrapper.find('[name="field1"]'), 'test');

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
    typeIntoInput(wrapper.find('[name="field1"]'), 'test z');

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
    formInfo.formRef.current.dispatchEvent(new Event('submit'));
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
    typeIntoInput(wrapper.find('[name="field1"]'), 'test');
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      'Field does not contain letter z',
      undefined,
      false
    );

    // remove everything and the required error is back
    typeIntoInput(wrapper.find('[name="field1"]'), '');
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      FIELD_REQUIRED_MESSAGE,
      undefined,
      false
    );
  });

  it('Custom built-in validator function that uses custom options can be provided', () => {
    // adding a custom global validator which changes behavior based on given option
    GlobalValidators.mustNotBeEmpty = {
      errorMessage: 'Must not be empty',
      validator: 'isEmpty',
      options: { ignore_whitespace: true },
      negate: true
    };

    // first we test without giving options
    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, { field1: '', field2: '' });
      return buildTestForm(formInfo, ['mustNotBeEmpty'], []);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    // starts with error
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      'Must not be empty',
      undefined,
      false
    );

    typeIntoInput(wrapper.find('[name="field1"]'), '   ');
    // still has error since we are using option to ignore whitespaces
    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      'Must not be empty',
      undefined,
      false
    );

    typeIntoInput(wrapper.find('[name="field1"]'), 'abc');
    // no errors now
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

  it('Custom global validator function that uses custom options can be provided', () => {
    // adding a custom global validator which changes behavior based on given option
    GlobalValidators.mustContainLetterZ = {
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
        formInfo = useFormalizer(submitHandler, { field1: 'test', field2: '' });
        return buildTestForm(formInfo, ['mustContainLetterZ'], []);
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

      typeIntoInput(wrapper.find('[name="field1"]'), 'test z'); // no error now
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
      typeIntoInput(wrapper.find('[name="field1"]'), 'test Z'); // upper case Z will not be accepted
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
        formInfo = useFormalizer(submitHandler, { field1: 'test', field2: '' });
        return buildTestForm(
          formInfo,
          [
            {
              validator: 'mustContainLetterZ',
              options: { ignoreCase: true }
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

      typeIntoInput(wrapper.find('[name="field1"]'), 'test z'); // no error now
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
      typeIntoInput(wrapper.find('[name="field1"]'), 'test Z'); // no error now, we are validating with the ignore case option
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
      const originalError = console.error;
      console.error = jest.fn(); // prevents React 16 error boundary warning

      GlobalValidators.isEmail = invalidValidatorDef;

      const FormWrapper = () => {
        formInfo = useFormalizer(submitHandler, { field1: 'test', field2: '' });
        return buildTestForm(formInfo, ['isEmail'], []);
      };

      wrapper = mount(
        <ErrorBoundary>
          <FormWrapper />
        </ErrorBoundary>
      );

      const callMount = () =>
        wrapper.find('[data-test="force-validation-button"]').simulate('click');

      expect(callMount).toThrowError(
        new Error(
          'Formalizer: the given validator must be either a string or a function.'
        )
      );

      console.error = originalError;

      delete GlobalValidators.isEmail;
    })
  );

  it('Custom global validation using a dynamic error message can be provided', () => {
    GlobalValidators.dynamicErrorMsgValidator = {
      validator: () => false,
      errorMessage: (value, formData) => {
        const formDataStr = JSON.stringify(formData);
        return `Dynamic error msg for value "${value}" and form data "${formDataStr}"`;
      }
    };

    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, {
        field1: 'test',
        field2: 'abc'
      });
      return buildTestForm(
        formInfo,
        ['dynamicErrorMsgValidator'],
        ['dynamicErrorMsgValidator']
      );
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      `Dynamic error msg for value "test" and form data "{"field1":"test","field2":"abc"}"`,
      `Dynamic error msg for value "abc" and form data "{"field1":"test","field2":"abc"}"`,
      false,
      false
    );
  });

  it('Custom validation using a dynamic error message can be provided', () => {
    const dynamicErrorMsgValidator = {
      validator: () => false,
      errorMessage: (value, formData) => {
        const formDataStr = JSON.stringify(formData);
        return `Dynamic error msg for value "${value}" and form data "${formDataStr}"`;
      }
    };

    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, {
        field1: 'test',
        field2: 'abc'
      });
      return buildTestForm(
        formInfo,
        [dynamicErrorMsgValidator],
        [dynamicErrorMsgValidator]
      );
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      `Dynamic error msg for value "test" and form data "{"field1":"test","field2":"abc"}"`,
      `Dynamic error msg for value "abc" and form data "{"field1":"test","field2":"abc"}"`,
      false,
      false
    );
  });

  it('Custom validation using a third party validator function and a dynamic error message can be provided', () => {
    const dynamicErrorMsgValidator = {
      validator: 'isEmail',
      errorMessage: (value, formData) => {
        const formDataStr = JSON.stringify(formData);
        return `Dynamic error msg for value "${value}" and form data "${formDataStr}"`;
      }
    };

    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, {
        field1: 'test',
        field2: 'abc'
      });
      return buildTestForm(
        formInfo,
        [dynamicErrorMsgValidator],
        [dynamicErrorMsgValidator]
      );
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      `Dynamic error msg for value "test" and form data "{"field1":"test","field2":"abc"}"`,
      `Dynamic error msg for value "abc" and form data "{"field1":"test","field2":"abc"}"`,
      false,
      false
    );

    typeIntoInput(wrapper.find('[name="field1"]'), 'valid.email@email.com');
    typeIntoInput(wrapper.find('[name="field2"]'), 'valid.email@email.com');
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

  [
    {
      name: 'numeric',
      value: 123
    },
    {
      name: 'boolean',
      value: true
    },
    {
      name: 'array',
      value: []
    },
    {
      name: 'array',
      value: {}
    }
  ].forEach(v =>
    it(`Handle an invalid error message of ${v.name} type correctly`, () => {
      const originalError = console.error;
      console.error = jest.fn(); // prevents React 16 error boundary warning

      const customValidator = {
        validator: () => false,
        errorMessage: v.value
      };

      const FormWrapper = () => {
        formInfo = useFormalizer(submitHandler, { field1: 'test', field2: '' });
        return buildTestForm(formInfo, [customValidator], []);
      };

      wrapper = mount(
        <ErrorBoundary>
          <FormWrapper />
        </ErrorBoundary>
      );

      const callMount = () =>
        wrapper.find('[data-test="force-validation-button"]').simulate('click');

      expect(callMount).toThrowError(
        new Error(
          `Formalizer: a validator's errorMessage field must be either a string or a function that returns a string.`
        )
      );

      console.error = originalError;
    })
  );

  it("Custom global validation using a string validator (referring to one of validator's functions) can be provided", () => {
    GlobalValidators.mustBeEmail = {
      errorMessage: 'This needs to be an email.',
      validator: 'isEmail'
    };

    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, { field1: 'test', field2: '' });
      return buildTestForm(formInfo, ['mustBeEmail'], []);
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

    typeIntoInput(wrapper.find('[name="field1"]'), 'valid.email@email.com');
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

  it('Custom validation using a string validator (referring to one a third-party validator) can be provided', () => {
    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, { field1: 'test', field2: '' });
      return buildTestForm(
        formInfo,
        [
          {
            errorMessage: 'This needs to be an email.',
            validator: 'isEmail'
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

    typeIntoInput(wrapper.find('[name="field1"]'), 'valid.email@email.com');
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
    GlobalValidators.mustBeEmail = {
      errorMessage: 'This needs to be an email.',
      validator: 'isEmail'
    };

    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, { field1: 'test', field2: '' });
      return buildTestForm(
        formInfo,
        [
          {
            validator: 'mustBeEmail',
            errorMessage: 'Not even close to a valid email, bro.'
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

    typeIntoInput(wrapper.find('[name="field1"]'), 'valid.email@email.com');
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
    GlobalValidators.mustBeEmail = {
      errorMessage: 'This needs to be an email.',
      validator: 'isEmail'
    };

    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, { field1: 'test', field2: '' });
      return buildTestForm(formInfo, [{ validator: 'mustBeEmail' }], []);
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

    typeIntoInput(wrapper.find('[name="field1"]'), 'valid.email@email.com');
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
    GlobalValidators.mustBeEmail = {
      validator: 'isEmail'
    };

    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, { field1: 'test', field2: '' });
      return buildTestForm(formInfo, [{ validator: 'mustBeEmail' }], []);
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

    typeIntoInput(wrapper.find('[name="field1"]'), 'valid.email@email.com');
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
    delete GlobalValidators.mustBeEmail;

    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, { field1: 'test', field2: '' });
      return buildTestForm(formInfo, [{ validator: 'isEmail' }], []);
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

    typeIntoInput(wrapper.find('[name="field1"]'), 'valid.email@email.com');
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
    delete GlobalValidators.isEmail;

    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, { field1: 'test', field2: '' });
      return buildTestForm(formInfo, ['isEmail'], []);
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

    typeIntoInput(wrapper.find('[name="field1"]'), 'valid.email@email.com');
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

  it('Custom validators are given the complete form data as one of its options object properties', () => {
    const customValidator = {
      validator: (value, options) => {
        expect(options).not.toBeNull();
        expect(options.formData).not.toBeNull();
        expect(options.formData.field1).not.toBeNull();
        expect(options.formData.field2).not.toBeNull();
        expect(options.formData.field1).toBe('test1');
        expect(options.formData.field2).toBe('test2');
        return true;
      }
    };

    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, {
        field1: 'test1',
        field2: 'test2'
      });
      return buildTestForm(formInfo, customValidator, []);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    // assertions on the formData will be executed when the validator is executed
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
  });

  [
    { name: 'null', options: null },
    { name: 'undefined', options: undefined },
    { name: 'empty', options: {} }
  ].forEach(o =>
    it(`Custom validators are given the complete form data with the options object even if an ${o.name} options has been specified`, () => {
      const customValidator = {
        options: o.options,
        validator: (value, options) => {
          expect(options).not.toBeNull();
          expect(options.formData).not.toBeNull();
          expect(options.formData.field1).not.toBeNull();
          expect(options.formData.field2).not.toBeNull();
          expect(options.formData.field1).toBe('test1');
          expect(options.formData.field2).toBe('test2');
          return true;
        }
      };

      const FormWrapper = () => {
        formInfo = useFormalizer(submitHandler, {
          field1: 'test1',
          field2: 'test2'
        });
        return buildTestForm(formInfo, customValidator, []);
      };

      wrapper = mount(<FormWrapper />);

      expect(formInfo.isValid).toBe(true);

      // assertions on the formData will be executed when the validator is executed
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
    })
  );

  it('Global validators are given the complete form data as one of its options object properties', () => {
    GlobalValidators.isFormDataPresent = {
      validator: (value, options) => {
        expect(options).not.toBeNull();
        expect(options.formData).not.toBeNull();
        expect(options.formData.field1).not.toBeNull();
        expect(options.formData.field2).not.toBeNull();
        expect(options.formData.field1).toBe('test1');
        expect(options.formData.field2).toBe('test2');
        return true;
      }
    };

    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, {
        field1: 'test1',
        field2: 'test2'
      });
      return buildTestForm(formInfo, 'isFormDataPresent', []);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    // assertions on the formData will be executed when the validator is executed
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
  });

  it('Can use built in mustMatch validator and it works correctly', () => {
    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, { field1: 'test', field2: '' });
      return buildTestForm(formInfo, [], mustMatch('field1'));
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');

    performAssertions(
      wrapper,
      formInfo,
      submitHandler,
      undefined,
      'Must match the field1 field.',
      false,
      false
    );

    // type the same content into field2, and the error should go away
    typeIntoInput(wrapper.find('[name="field2"]'), 'test');
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
    window.onerror = jest.fn();
    const errorSpy = jest.spyOn(window, 'onerror').mockImplementation(() => {});

    const submitHandlerThatThrows = () => {
      throw new Error('Ops, I am not as cool as I thought I was. :(');
    };

    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandlerThatThrows, {
        field1: 'test',
        field2: ''
      });
      return buildTestForm(formInfo, ['isRequired'], []);
    };

    wrapper = mount(<FormWrapper />);

    act(() => {
      // submit the form
      formInfo.formRef.current.dispatchEvent(new Event('submit'));
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
    delete GlobalValidators.mustBeEmail;

    const FormWrapper = () => {
      formInfo = useFormalizer(null, {
        field1: 'valid.email@email.com',
        field2: ''
      });
      return buildTestForm(formInfo, [{ validator: 'isEmail' }], []);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    act(() => {
      // submit the form
      formInfo.formRef.current.dispatchEvent(new Event('submit'));
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
    const originalError = console.error;
    console.error = jest.fn(); // prevents React 16 error warning
    spyOn(console, 'error');

    const FormWrapper = () => {
      formInfo = useFormalizer(
        submitHandler,
        { field1: '', field2: 'testValue' },
        {
          invalidAttr: { 'input-has-error': 'yes' },
          helperTextAttr: 'myHelperText'
        }
      );
      return buildTestForm(formInfo, ['isRequired'], ['isRequired']);
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

    expect(wrapper.find('[name="field1"]').prop('input-has-error')).toBe('yes');
    expect(
      wrapper.find('[name="field2"]').prop('input-has-error')
    ).not.toBeDefined();

    expect(wrapper.find('[name="field1"]').prop('myHelperText')).toBe(
      FIELD_REQUIRED_MESSAGE
    );
    expect(
      wrapper.find('[name="field2"]').prop('myHelperText')
    ).not.toBeDefined();

    console.error = originalError;
  });

  it('Fields are updated when form value is set programmatically', () => {
    const FormWrapper = () => {
      formInfo = useFormalizer(
        submitHandler,
        { field1: '', field2: 'testValue' },
        {}
      );
      return buildTestForm(formInfo, ['isRequired'], ['isRequired']);
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

  it('Handle unknown validator properly', () => {
    const FormWrapper = () => {
      formInfo = useFormalizer(
        submitHandler,
        { field1: '', field2: 'testValue' },
        {}
      );
      return buildTestForm(formInfo, ['unknownValidator'], []);
    };

    wrapper = mount(
      <ErrorBoundary>
        <FormWrapper />
      </ErrorBoundary>
    );

    // still valid because we didn't fin the validation
    expect(formInfo.isValid).toBe(true);

    const callMount = () =>
      wrapper.find('[data-test="force-validation-button"]').simulate('click');

    expect(callMount).toThrowError(
      new Error(
        `Formalizer: cannot find a validator named "unknownValidator". If you are attempting to perform a validation defined by the Validator library, please make sure to have it installed prior.`
      )
    );
  });

  [
    {
      validator: [{ invalidValidatorFunc: { validator: false } }],
      type: 'boolean'
    },
    {
      validator: [{ invalidValidatorFunc: { validator: 123 } }],
      type: 'number'
    }
  ].forEach(v =>
    it(`Handle validator of invalid type "${v.type}"`, () => {
      const FormWrapper = () => {
        formInfo = useFormalizer(
          submitHandler,
          { field1: '', field2: 'testValue' },
          {}
        );
        return buildTestForm(formInfo, v.validator, []);
      };

      wrapper = mount(
        <ErrorBoundary>
          <FormWrapper />
        </ErrorBoundary>
      );

      // still valid because we didn't fin the validation
      expect(formInfo.isValid).toBe(true);

      const callMount = () =>
        wrapper.find('[data-test="force-validation-button"]').simulate('click');

      expect(callMount).toThrowError(
        new Error(
          `Formalizer: the validator value passed into useInput must be a single string, a custom validator object or an array of these.`
        )
      );
    })
  );

  [
    {
      validator: [{ validator: [] }],
      type: 'validator of array type',
      error: 'Formalizer: validators must be of string or object type.'
    },
    {
      validator: [{ validator: 123 }],
      type: 'validator of 123 type',
      error: 'Formalizer: validators must be of string or object type.'
    },
    {
      validator: [{ validator: false }],
      type: 'validator of boolean type',
      error: 'Formalizer: validators must be of string or object type.'
    },
    {
      validator: [{ validator: null }],
      type: 'validator of null type',
      error: 'Formalizer: validators must be of string or object type.'
    }
  ].forEach(v =>
    it(`Handle global validator of invalid ${v.type}`, () => {
      GlobalValidators.invalidValidator = v.validator;

      const FormWrapper = () => {
        formInfo = useFormalizer(
          submitHandler,
          { field1: '', field2: 'testValue' },
          {}
        );
        return buildTestForm(formInfo, ['invalidValidator'], []);
      };

      wrapper = mount(
        <ErrorBoundary>
          <FormWrapper />
        </ErrorBoundary>
      );

      // still valid because we didn't fin the validation
      expect(formInfo.isValid).toBe(true);

      const callMount = () =>
        wrapper.find('[data-test="force-validation-button"]').simulate('click');

      expect(callMount).toThrowError(new Error(v.error));
    })
  );

  [
    {
      validator: false,
      type: 'bare boolean type',
      error:
        'Formalizer: the validator value passed into useInput must be a single string, a custom validator object or an array of these.'
    },
    {
      validator: 123,
      type: 'bare numeric type',
      error:
        'Formalizer: the validator value passed into useInput must be a single string, a custom validator object or an array of these.'
    },
    {
      validator: null,
      type: 'bare null type',
      error:
        'Formalizer: the validator value passed into useInput must be a single string, a custom validator object or an array of these.'
    },
    {
      validator: [false],
      type: 'boolean type',
      error:
        'Formalizer: the validator value passed into useInput must be a single string, a custom validator object or an array of these.'
    },
    {
      validator: [123],
      type: 'numeric type',
      error:
        'Formalizer: the validator value passed into useInput must be a single string, a custom validator object or an array of these.'
    },
    {
      validator: [undefined],
      type: 'undefined type',
      error:
        'Formalizer: the validator value passed into useInput must be a single string, a custom validator object or an array of these.'
    },
    {
      validator: [null],
      type: 'null type',
      error:
        'Formalizer: the validator value passed into useInput must be a single string, a custom validator object or an array of these.'
    },
    {
      validator: [[]],
      type: 'array validator value',
      error:
        'Formalizer: the validator value passed into useInput must be a single string, a custom validator object or an array of these.'
    }
  ].forEach(v =>
    it(`Handle custom validator of invalid ${v.type}`, () => {
      const FormWrapper = () => {
        formInfo = useFormalizer(
          submitHandler,
          { field1: '', field2: 'testValue' },
          {}
        );
        return buildTestForm(formInfo, v.validator, []);
      };

      wrapper = mount(
        <ErrorBoundary>
          <FormWrapper />
        </ErrorBoundary>
      );

      // still valid because we didn't fin the validation
      expect(formInfo.isValid).toBe(true);

      const callMount = () =>
        wrapper.find('[data-test="force-validation-button"]').simulate('click');

      expect(callMount).toThrowError(new Error(v.error));
    })
  );

  it(`The setupForMaterialUI() function configures settings correctly`, () => {
    const originalInvalidAttr = FormalizerSettings.invalidAttr;
    const originalHelperTextAttr = FormalizerSettings.helperTextAttr;
    setupForMaterialUI();

    // still valid because we didn't fin the validation
    expect(FormalizerSettings.invalidAttr).not.toBeNull();
    expect(FormalizerSettings.invalidAttr.error).toBe(true);

    expect(FormalizerSettings.helperTextAttr).not.toBeNull();
    expect(FormalizerSettings.helperTextAttr).toBe('helperText');

    FormalizerSettings.invalidAttr = originalInvalidAttr;
    FormalizerSettings.helperTextAttr = originalHelperTextAttr;
  });

  // THESE TESTS MUST RUN LAST
  [
    {
      name: 'unknown string validator',
      validator: ['isEmail']
    },
    {
      name: 'unknown validator function',
      validator: [{ validator: 'isEmail' }]
    }
  ].forEach(v =>
    it(`Handle missing optional validator library dependency correctly when using ${v.name}`, () => {
      jest.mock('validator', () => void 0);

      // making sure we don't have a global validator named isEmail
      delete GlobalValidators.isEmail;

      // attempt to use the missing dependency
      const FormWrapper = () => {
        formInfo = useFormalizer(
          submitHandler,
          { field1: 'invalid', field2: '' },
          {}
        );
        return buildTestForm(formInfo, v.validator, []);
      };

      wrapper = mount(
        <ErrorBoundary>
          <FormWrapper />
        </ErrorBoundary>
      );

      expect(formInfo.isValid).toBe(true);

      // still valid because we didn't fin the validation
      expect(formInfo.isValid).toBe(true);

      const callMount = () =>
        wrapper.find('[data-test="force-validation-button"]').simulate('click');

      try {
        expect(callMount).toThrowError(
          new Error(
            `Formalizer: cannot find a validator named "isEmail". If you are attempting to perform a validation defined by the Validator library, please make sure to have it installed prior.`
          )
        );
      } finally {
        jest.resetModules();
      }
    })
  );

  it('Handle unsupported validator library dependency correctly', () => {
    const originalPackageJson = require('validator/package.json');
    jest.mock('validator/package.json', () => ({ version: '1.0.0' }));

    // making sure we don't have a global validator named isEmail
    delete GlobalValidators.isEmail;

    // attempt to use the missing dependency
    const FormWrapper = () => {
      formInfo = useFormalizer(
        submitHandler,
        { field1: 'invalid', field2: '' },
        {}
      );
      return buildTestForm(formInfo, ['isEmail'], []);
    };

    wrapper = mount(
      <ErrorBoundary>
        <FormWrapper />
      </ErrorBoundary>
    );

    expect(formInfo.isValid).toBe(true);

    // still valid because we didn't fin the validation
    expect(formInfo.isValid).toBe(true);

    const callMount = () =>
      wrapper.find('[data-test="force-validation-button"]').simulate('click');

    try {
      expect(callMount).toThrowError(
        new Error(
          `Formalizer: unsupported version of the validator library found (1.0.0). Please upgrade to 4.0.0 or higher.`
        )
      );
    } finally {
      jest.resetModules();
    }
  });
});
