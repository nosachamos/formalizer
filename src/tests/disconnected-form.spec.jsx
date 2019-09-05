import { DEFAULT_VALIDATION_ERROR_MESSAGE, useFormalizer } from '../formalizer';
import { mount } from 'enzyme';
import { act } from '@testing-library/react';
import {
  buildDisconnectedForm,
  performAssertions,
  typeIntoInput
} from './support-files/test-utilities';
import React from 'react';

describe('Disconnected form validation', () => {
  let wrapper;
  let submitHandler;
  let formInfo;

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

  it(`Radio buttons comes out checked according to its initial value.`, () => {
    const FormWrapper = () => {
      formInfo = useFormalizer(null, {
        field1: '',
        field2: '',
        checkboxField: true,
        radioField: 'b'
      });

      return buildDisconnectedForm(formInfo);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    // radio comes checked correctly according to the given initial value
    expect(wrapper.find('[type="radio"][value="a"]').props().checked).toBe(
      false
    );
    expect(wrapper.find('[type="radio"][value="b"]').props().checked).toBe(
      true
    );
    expect(wrapper.find('[type="radio"][value="c"]').props().checked).toBe(
      false
    );

    act(() => {
      formInfo.performValidations();
    });

    expect(formInfo.isValid).toBe(true);

    // radio comes checked correctly according to the given initial value
    expect(wrapper.find('[type="radio"][value="a"]').props().checked).toBe(
      false
    );
    expect(wrapper.find('[type="radio"][value="b"]').props().checked).toBe(
      true
    );
    expect(wrapper.find('[type="radio"][value="c"]').props().checked).toBe(
      false
    );
  });

  it(`Radio buttons can be used in disconnected forms, and picked value is correctly applied.`, () => {
    // we mock this submit handler to perform the assertions we need in the data that is passed to it
    submitHandler.mockImplementationOnce(formData => {
      expect(formData).not.toBeNull();
      expect(formData).not.toBeNull();
      expect(formData.field1).not.toBeNull();
      expect(formData.field2).not.toBeNull();
      expect(formData.checkboxField).not.toBeNull();
      expect(formData.radioField).not.toBeNull();
      expect(formData.field1).toBe('test1');
      expect(formData.field2).toBe('test2');
      expect(formData.checkboxField).toBe(true);
      expect(formData.radioField).toBe('a');
    });

    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, {
        field1: 'test1',
        field2: 'test2',
        checkboxField: true,
        radioField: 'b'
      });

      return buildDisconnectedForm(formInfo);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    // select a different radio button
    act(() => {
      wrapper.find('[type="radio"][value="a"]').prop('onChange')({
        currentTarget: { value: 'a' }
      });
    });

    expect(formInfo.isValid).toBe(true);

    performBasicAssertions();

    // trigger a form validation so that the submitHandler is invoked now
    act(() => {
      formInfo.performValidations();
    });

    // resetting the calls and mock implementation
    submitHandler.mockClear();
  });

  it(`Checkbox comes out checked if its initial value was set to true.`, () => {
    const FormWrapper = () => {
      formInfo = useFormalizer(null, {
        field1: '',
        field2: '',
        checkboxField: true
      });

      return buildDisconnectedForm(formInfo);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    // checkbox starts checked
    expect(wrapper.find('[type="checkbox"]').props().checked).toBe(true);

    act(() => {
      formInfo.performValidations();
    });

    expect(formInfo.isValid).toBe(true);

    // checkbox is still checked
    expect(wrapper.find('[type="checkbox"]').props().checked).toBe(true);
  });

  it(`Toggle button comes out checked if its initial value was set to true.`, () => {
    const FormWrapper = () => {
      formInfo = useFormalizer(null, {
        field1: '',
        field2: '',
        toggleField: true
      });

      return buildDisconnectedForm(formInfo);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    // toggle starts checked
    expect(wrapper.find('[type="button"]').props().checked).toBe(true);

    act(() => {
      formInfo.performValidations();
    });

    expect(formInfo.isValid).toBe(true);

    // toggle is still checked
    expect(wrapper.find('[type="button"]').props().checked).toBe(true);
  });

  it(`Inputs come without a type attribute if we set the omitTypeAttribute setting to true.`, () => {
    const FormWrapper = () => {
      formInfo = useFormalizer(null, {
        field1: '',
        field2: '',
        toggleField: true
      });

      return buildDisconnectedForm(formInfo, undefined, undefined, {
        omitTypeAttribute: true
      });
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    // fields were properly mounted and can be found
    expect(wrapper.find('[data-test="field1-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="field2-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="checkbox-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="toggle-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="radio-input-a"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="radio-input-b"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="radio-input-c"]').exists()).toBe(true);

    // but none of them had the type attribute set
    expect(wrapper.find('[type="button"]').exists()).toBe(false);
    expect(wrapper.find('[type="radio"]').exists()).toBe(false);
    expect(wrapper.find('[type="text"]').exists()).toBe(false);
    expect(wrapper.find('[type="checkbox"]').exists()).toBe(false);
  });

  it(`If no form is connected, errors are still raised even if no submitHandler is given.`, () => {
    const FormWrapper = () => {
      formInfo = useFormalizer(null, {
        field1: 'john-smith@email.com',
        field2: '',
        checkboxField: false
      });

      return buildDisconnectedForm(formInfo, 'isEmail', undefined);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    act(() => {
      formInfo.performValidations();
    });

    expect(formInfo.isValid).toBe(true);

    act(() => {
      // lets start by typing an incomplete email
      typeIntoInput(wrapper.find('[name="field1"]'), 'invalid@email');
    });

    act(() => {
      // lets start by typing an incomplete email
      typeIntoInput(wrapper.find('[name="field1"]'), 'also.an.invalid@email');
    });

    act(() => {
      formInfo.performValidations();
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

    act(() => {
      // lets start by typing an incomplete email
      typeIntoInput(wrapper.find('[name="field1"]'), 'valid@email.com');
    });

    act(() => {
      // then press Enter
      wrapper.find('[name="field1"]').simulate('keypress', { key: 'Enter' });
    });

    // Form is no longer valid
    expect(formInfo.isValid).toBe(true);

    // no errors in the form either
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

  it(`If no form is connected, validations happen and the submitHandler is invoked on when the performValidations function is invoked`, () => {
    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, {
        field1: 'john-smith@email.com',
        field2: '',
        checkboxField: false
      });

      return buildDisconnectedForm(formInfo, 'isEmail', undefined);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    act(() => {
      formInfo.performValidations();
    });

    performBasicAssertions();

    // the second argument is the form data, and it is correct
    expect(submitHandler.mock.calls[0][0]).toEqual({
      field1: 'john-smith@email.com',
      field2: '',
      checkboxField: false
    });

    // resetting the submit handler
    submitHandler.mockClear();

    act(() => {
      // lets start by typing an incomplete email
      typeIntoInput(wrapper.find('[name="field1"]'), 'invalid@email');
    });
    wrapper.update();

    act(() => {
      // lets start by typing an incomplete email
      typeIntoInput(wrapper.find('[name="field1"]'), 'also.an.invalid@email');
    });
    wrapper.update();

    act(() => {
      formInfo.performValidations();
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

  it(`If no form is connected, then the submitHandler is not invoked on when checkboxes, toggle buttons and radio buttons lose focus`, () => {
    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, {
        checkboxField: false,
        toggleField: false,
        radioField: 'b'
      });

      return buildDisconnectedForm(formInfo, 'isEmail', undefined);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    // select a different radio button
    act(() => {
      wrapper.find('[type="radio"][value="a"]').prop('onChange')({
        currentTarget: { value: 'a' }
      });
    });
    wrapper.update();

    // this blur event will not result in one more call to the submit handler mock function
    act(() => {
      wrapper.find('[type="radio"][value="a"]').prop('onBlur')({
        currentTarget: { value: 'a' }
      });
    });
    wrapper.update();

    performBasicAssertions();

    // the second argument is the form data, and it is correct
    expect(submitHandler.mock.calls[0][0]).toEqual({
      checkboxField: false,
      toggleField: false,
      radioField: 'a'
    });
    // reset the mock calls
    submitHandler.mockClear();

    // toggling the checkbox also results in a call to the submit handler
    act(() => {
      wrapper.find('[type="checkbox"]').prop('onChange')({
        currentTarget: { type: 'checkbox', checked: true }
      });
    });
    wrapper.update();

    // this blur event will not result in one more call to the submit handler mock function
    act(() => {
      wrapper.find('[type="checkbox"]').prop('onBlur')({
        currentTarget: { type: 'checkbox', checked: true }
      });
    });
    wrapper.update();

    performBasicAssertions();

    // the second argument is the form data, and it is correct
    expect(submitHandler.mock.calls[0][0]).toEqual({
      checkboxField: true,
      toggleField: false,
      radioField: 'a'
    });
    // reset the mock calls
    submitHandler.mockClear();

    // toggling the toggle button also results in a call to the submit handler
    act(() => {
      wrapper.find('[type="button"]').prop('onChange')({
        currentTarget: { type: 'button', checked: true }
      });
    });
    wrapper.update();

    // this blur event will not result in one more call to the submit handler mock function
    act(() => {
      wrapper.find('[type="button"]').prop('onBlur')({
        currentTarget: { type: 'button', checked: true }
      });
    });
    wrapper.update();

    performBasicAssertions();

    // the second argument is the form data, and it is correct
    expect(submitHandler.mock.calls[0][0]).toEqual({
      checkboxField: true,
      toggleField: true,
      radioField: 'a'
    });
    // reset the mock calls
    submitHandler.mockClear();
  });

  it(`If no form is connected, then the submitHandler is invoked on when data is accepted`, () => {
    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, {
        field1: '',
        field2: '',
        checkboxField: false,
        toggleField: false
      });

      return buildDisconnectedForm(formInfo, 'isEmail', undefined);
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    act(() => {
      // lets start by typing an incomplete email
      typeIntoInput(wrapper.find('[name="field1"]'), 'john-smithl@email.com');
    });
    wrapper.update();

    act(() => {
      // then press Enter
      wrapper.find('[name="field1"]').simulate('keypress', { key: 'Enter' });
    });
    wrapper.update();

    performBasicAssertions();

    // the second argument is the form data, and it is correct
    expect(submitHandler.mock.calls[0][0]).toEqual({
      field1: 'john-smithl@email.com',
      field2: '',
      checkboxField: false,
      toggleField: false
    });
    // reset the mock calls
    submitHandler.mockClear();

    act(() => {
      // type on the field with no validations, and press Enter
      typeIntoInput(wrapper.find('[name="field2"]'), 'test value');
    });
    wrapper.update();

    act(() => {
      // then press Enter
      wrapper.find('[name="field2"]').simulate('keypress', { key: 'Enter' });
    });
    wrapper.update();

    performBasicAssertions();

    // the second argument is the form data, and it is correct
    expect(submitHandler.mock.calls[0][0]).toEqual({
      field1: 'john-smithl@email.com',
      field2: 'test value',
      checkboxField: false,
      toggleField: false
    });
    // reset the mock calls
    submitHandler.mockClear();

    // toggling the checkbox also results in a call to the submit handler
    act(() => {
      wrapper.find('[type="checkbox"]').prop('onChange')({
        currentTarget: { type: 'checkbox', checked: true }
      });
    });
    wrapper.update();

    performBasicAssertions();

    // the second argument is the form data, and it is correct
    expect(submitHandler.mock.calls[0][0]).toEqual({
      field1: 'john-smithl@email.com',
      field2: 'test value',
      checkboxField: true,
      toggleField: false
    });
    // reset the mock calls
    submitHandler.mockClear();

    // toggling the toggle button also results in a call to the submit handler
    act(() => {
      wrapper.find('[type="button"]').prop('onChange')({
        currentTarget: { type: 'button', checked: true }
      });
    });
    wrapper.update();

    performBasicAssertions();

    // the second argument is the form data, and it is correct
    expect(submitHandler.mock.calls[0][0]).toEqual({
      field1: 'john-smithl@email.com',
      field2: 'test value',
      checkboxField: true,
      toggleField: true
    });
    // reset the mock calls
    submitHandler.mockClear();

    // now type some invalid data and make sure the handle is not called
    act(() => {
      typeIntoInput(wrapper.find('[name="field1"]'), 'john@invalid');
    });
    wrapper.update();

    act(() => {
      // then press Enter
      wrapper.find('[name="field1"]').simulate('keypress', { key: 'Enter' });
    });
    wrapper.update();

    // handler was not invoked - data isn't valid
    expect(submitHandler).not.toHaveBeenCalled();

    // now type some invalid data and remove the focus from the field
    act(() => {
      typeIntoInput(wrapper.find('[name="field1"]'), 'john-smith@invalid');
    });
    wrapper.update();

    act(() => {
      // remove focus from the field
      wrapper.find('[name="field1"]').simulate('blur');
    });
    wrapper.update();

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

  it(`If no form is connected, the submitHandler not invoked until all data is valid.`, () => {
    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, {
        field1: 'start@valid.com',
        field2: 'valid',
        checkboxField: false,
        toggleField: false
      });

      return buildDisconnectedForm(formInfo, 'isEmail', 'isRequired');
    };

    wrapper = mount(<FormWrapper />);

    expect(formInfo.isValid).toBe(true);

    // now type some invalid data and remove the focus from the field email field, so that it is errored out
    act(() => {
      typeIntoInput(wrapper.find('[name="field1"]'), 'john-smith@invalid');
    });
    wrapper.update();

    act(() => {
      // then press Enter
      wrapper.find('[name="field1"]').simulate('keypress', { key: 'Enter' });
    });
    wrapper.update();

    // handler was not invoked - data isn't valid
    expect(submitHandler).not.toHaveBeenCalled();

    // now, the interesting part of this test: we update another field and make sure that one is valid. Even then,
    // the submit handler should not be invoked until we have corrected the first field as well.
    act(() => {
      typeIntoInput(wrapper.find('[name="field2"]'), 'another valid value');
    });
    wrapper.update();

    act(() => {
      // then press Enter
      wrapper.find('[name="field2"]').simulate('keypress', { key: 'Enter' });
    });
    wrapper.update();

    // handler was not invoked - data on the field1 is still invalid
    expect(submitHandler).not.toHaveBeenCalled();

    // finally, correct field1 and see that now the handler is invoked
    act(() => {
      typeIntoInput(wrapper.find('[name="field1"]'), 'john-smith@valid.com');
    });
    wrapper.update();

    act(() => {
      // then press Enter
      wrapper.find('[name="field1"]').simulate('keypress', { key: 'Enter' });
    });
    wrapper.update();

    // handler was not invoked - data isn't valid
    expect(submitHandler).toHaveBeenCalled();
  });
});
