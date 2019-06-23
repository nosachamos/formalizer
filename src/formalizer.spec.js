import React from 'react';
import { TestForm } from './test-form';
import { mount } from 'enzyme';

const handleSubmit = formValues => {
  console.log(formValues);
};

describe('Form Validation', () => {
  const FIELD_REQUIRED_MESSAGE = 'This field is required.';

  const field1Validation = {
    isRequired: {
      errorMessage: FIELD_REQUIRED_MESSAGE
    }
  };

  const field2Validation = {
    isRequired: {
      errorMessage: FIELD_REQUIRED_MESSAGE
    }
  };

  // let formElement;
  beforeAll(async () => {
    // formElement = shallow(testForm);
  });

  it(`Errors when invalid email value is given`, () => {
    const onSubmitHandler = jest.fn();

    const formElement = mount(
      <TestForm
        onSubmit={onSubmitHandler}
        validation={{
          field1: field1Validation,
          field2: field2Validation
        }}
      />
    );

    formElement.find('button').simulate('click');
    formElement.update();

    expect(formElement.find('#field1Error').text()).toEqual(
      FIELD_REQUIRED_MESSAGE
    );
    expect(formElement.find('#field2Error').text()).toEqual(
      FIELD_REQUIRED_MESSAGE
    );
  });
});
