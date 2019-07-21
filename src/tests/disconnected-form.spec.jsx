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

  it(`Rio buttons comes out checked according to its initial value.`, () => {
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
  });

  it(`If no form is connected, then the submitHandler is invoked on when data is accepted`, () => {
    const FormWrapper = () => {
      formInfo = useFormalizer(submitHandler, {
        field1: '',
        field2: '',
        checkboxField: false
      });

      return buildDisconnectedForm(formInfo, 'isEmail', undefined);
    };

    wrapper = mount(<FormWrapper />);

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
});
