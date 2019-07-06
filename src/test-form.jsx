import React, { useRef } from 'react';
import { useFormalizer } from './index';

export const TestForm = ({ validation, onSubmitHandler, testFunc }) => {
  const formRef = useRef(null);

  const { useInput, isValid, validateForm, errors } = useFormalizer(
    formRef,
    {
      field1: '',
      field2: ''
    },
    onSubmitHandler,
    null
  );

  return (
    <>
      <form ref={formRef}>
        <input
          id="field1"
          placeholder="Field 1"
          {...useInput('field1', validation.field1)}
        />
        <span id="field1Error">
          {errors['field1'] && console.log(errors['field1'])}
        </span>

        <input
          id="field2"
          placeholder="Field 2"
          {...useInput('field2', validation.field2)}
        />
        <span id="field2Error">{errors['field2']}</span>

        <button
          data-test="form-submit-button"
          disabled={!isValid}
          type="submit"
        >
          Submit
        </button>
      </form>

      <hr />

      <button data-test="force-validation-button" onClick={validateForm}>
        Force form validation
      </button>
    </>
  );
};
