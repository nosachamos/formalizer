import React from 'react';
import { act } from '@testing-library/react';

export const typeIntoInput = (input, value) => {
  act(() => {
    input.instance().value = value;
    input.simulate('change', { target: { value: value } });
  });
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
  field2Validation,
  validationSettings
) => (
  <>
    {formInfo.formValues['field1'] !== undefined && (
      <>
        <input
          data-test={'field1-input'}
          name="field1"
          {...formInfo.useInput('field1', field1Validation, validationSettings)}
        />
        <span id="field1Error">{formInfo.errors['field1']}</span>
      </>
    )}

    {formInfo.formValues['field2'] !== undefined && (
      <>
        <input
          data-test={'field2-input'}
          name="field2"
          {...formInfo.useInput('field2', field2Validation, validationSettings)}
        />
        <span id="field2Error">{formInfo.errors['field2']}</span>
      </>
    )}

    {formInfo.formValues['checkboxField'] !== undefined && (
      <input
        data-test={'checkbox-input'}
        {...formInfo.useCheckboxInput('checkboxField', validationSettings)}
      />
    )}

    {formInfo.formValues['toggleField'] !== undefined && (
      <input
        data-test={'toggle-input'}
        {...formInfo.useToggleInput('toggleField', validationSettings)}
      />
    )}

    {formInfo.formValues['radioField'] !== undefined && (
      <input
        data-test={'radio-input-a'}
        {...formInfo.useRadioInput('radioField', 'a', validationSettings)}
      />
    )}

    {formInfo.formValues['radioField'] !== undefined && (
      <input
        data-test={'radio-input-b'}
        {...formInfo.useRadioInput('radioField', 'b', validationSettings)}
      />
    )}

    {formInfo.formValues['radioField'] !== undefined && (
      <input
        data-test={'radio-input-c'}
        {...formInfo.useRadioInput('radioField', 'c', validationSettings)}
      />
    )}
  </>
);

export const buildTestForm = (
  formInfo,
  field1Validation,
  field2Validation,
  field1ValidationSettings = {},
  field2ValidationSettings = {}
) => (
  <form ref={formInfo.formRef}>
    <input
      name="field1"
      {...formInfo.useInput(
        'field1',
        field1Validation,
        field1ValidationSettings
      )}
    />
    <span id="field1Error">
      {field1ValidationSettings.reportMultipleErrors
        ? undefined
        : formInfo.errors['field1']}
    </span>
    <input
      name="field2"
      {...formInfo.useInput(
        'field2',
        field2Validation,
        field2ValidationSettings
      )}
    />
    <span id="field2Error">
      {field2ValidationSettings.reportMultipleErrors
        ? undefined
        : formInfo.errors['field2']}
    </span>

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
