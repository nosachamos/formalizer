import React from 'react';

export const typeIntoInput = (input, value) => {
  input.instance().value = value;
  input.simulate('change', { target: { value: value } });
};

export const performAssertions = (
  wrapper,
  formInfo,
  submitHandler,
  field1ErrorMessage,
  field2ErrorMessage,
  formValidAfterSubmit,
  submitHandlerCalled = true
) => {
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
};

export const buildDisconnectedForm = (
  formInfo,
  field1Validation,
  field2Validation
) => (
  <>
    <input name="field1" {...formInfo.useInput('field1', field1Validation)} />
    <span id="field1Error">{formInfo.errors['field1']}</span>
    <input name="field2" {...formInfo.useInput('field2', field2Validation)} />
    <span id="field2Error">{formInfo.errors['field2']}</span>
    <input type="checkbox" {...formInfo.useInput('checkboxField')} />
    <input type="radio" value="a" {...formInfo.useInput('radioField')} />
    <input type="radio" value="b" {...formInfo.useInput('radioField')} />
    <input type="radio" value="c" {...formInfo.useInput('radioField')} />
  </>
);

export const buildTestForm = (formInfo, field1Validation, field2Validation) => (
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
      onClick={formInfo.performValidations}
    >
      Force form validation
    </button>
  </form>
);
