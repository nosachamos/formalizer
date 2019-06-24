import React, { createRef, useRef } from 'react';
import { TestForm } from './test-form';
import { mount, shallow } from 'enzyme';
import { useForm } from './formalizer';

describe('Form Validation', () => {
  const FIELD_REQUIRED_MESSAGE = 'This field is required.';

  const isRequiredValidation = {
    isRequired: {
      errorMessage: FIELD_REQUIRED_MESSAGE
    }
  };

  // let formElement;
  // beforeAll(async () => {
  //   formElement = shallow(testForm);
  // });

  it(`Errors when invalid email value is given`, () => {
    const submitHandler = jest.fn();

    let formInfo = null;
    const FormWrapper = () => {
      const formRef = useRef(null);

      formInfo = useForm(
        formRef,
        {
          field1: '',
          field2: ''
        },
        submitHandler,
        null
      );

      return (
        <form ref={formRef}>
          <input
            id="field1"
            {...formInfo.useInput('field1', isRequiredValidation)}
          />
          <span id="field1Error">{formInfo.errors['field1']}</span>

          <input
            id="field2"
            {...formInfo.useInput('field2', isRequiredValidation)}
          />
          <span id="field2Error">{formInfo.errors['field2']}</span>

          <button
            data-test="form-submit-button"
            disabled={!formInfo.isValid}
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

    const wrapper = mount(<FormWrapper />);
    wrapper.render();
    wrapper.update();

    expect(formInfo.isValid).toBe(true);

    wrapper.find('[data-test="force-validation-button"]').simulate('click');
    wrapper.update();

    expect(formInfo.isValid).toBe(false);

    expect(submitHandler).not.toHaveBeenCalled(); // errors, so submit is aborted

    expect(formInfo.errors.field1).toEqual(FIELD_REQUIRED_MESSAGE);
    expect(formInfo.errors.field2).toEqual(FIELD_REQUIRED_MESSAGE);

    expect(wrapper.find('#field1Error').text()).toEqual(FIELD_REQUIRED_MESSAGE);
    expect(wrapper.find('#field2Error').text()).toEqual(FIELD_REQUIRED_MESSAGE);
  });
});
