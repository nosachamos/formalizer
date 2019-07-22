# The `useFormalizer` hook

The `useFormalizer` allows you to both setup your form for validation, as well as access information about its validity, current errors, and more.

Ir returns a ref that should must connect to the form to be validated:

```jsx
const { formRef } = useFormalizer();

...

<form ref={formRef}>
    ...
</form>
```

But on it's own, it's not too useful. To take advantage of what Formalizer can offer you will need the other items this hook returns.

## What it returns

The `useFormalizer` hook returns a number of things you will need to setup your inputs for validation, get form errors, etc.

```jsx
import { useFormalizer } from 'formalizer';
...

    const {
            formRef,
            useInput,
            errors,
            isValid,
            performValidations,
            formValues,
            setValues
          } = useFormalizer();
```

Let's examine each of these items returned:

| Property             | Type     | Description                                                                                                                                                                                                                   |
| -------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `formRef`            | ref      | A form ref that must be connected to the form being validated.                                                                                                                                                                |
| `useInput`           | hook     | This hook is used to setup validation in each of the form text inputs or text-based inputs (password, search, etc)                                                                                                            |
| `useCheckboxInput`   | hook     | Hook that allows you to handle checkboxes.                                                                                                                                                                                    |
| `useRadioInput`      | hook     | Used to add radio buttons to your form data.                                                                                                                                                                                  |
| `errors`             | object   | An object containing the errors currently in the form. The keys indicate the fields which have errors, and the values are the error messages to be displayed to the user. When the form is valid an empty object is returned. |
| `isValid`            | boolean  | A convenience flag indicating whether the form has errors or not. Useful for disabling submit/action buttons until errors have been resolved.                                                                                 |
| `performValidations` | function | Rarely needed, this function can be used to programmatically trigger a form validation and, if no errors are found, a form submission.                                                                                        |
| `formValues`         | object   | This object contains the set of values currently in the form. Not commonly used as this data is also passed as an argument into form submission handlers.                                                                     |
| `setValues`          | function | Although these aren't common these days, certain use cases such as programmatically resetting a form require programmatically altering the form values. You can use this function to accomplish that.                         |

## Handling form submissions

Once your validations have been set, you are also likely to need to handle form submissions.

With Formalizer, instead of directly attaching an `onSubmit` handler to your form, you will pass your event handler as the `useFormalizer` hook's first argument, like so:

```jsx
import { useFormalizer } from 'formalizer';

const EmailFormComponent = () => {
  const submitHandler = (event, formData) => {
    // so something with form data, such as dispatching a request to a server.
  };

  const { formRef, useInput, errors } = useFormalizer(submitHandler);

  return (
    <form ref={formRef}>
      <input {...useInput('email', 'isEmail')} />
      <span>{errors['email']}</span>
    </form>
  );
};
```

Formalizer will only invoke your submit handler when the form is submitted with valid values, so you don't need to perform any checks at that point. Besides the original submit event, the complete form data is passed into the event handler as a convenience.

#### If you save on every change

Some applications use a pattern where forms don't even have a Save/Submit button. Instead, they automatically save the changes whenever use toggles a checkbox, or completes the edits on an input field. When this is the case, you don't even need a form element.

Formalizer handles these scenarios automatically. Simply by not connecting a form to the given `formRef`, Formalizer understands you want to handle changes as they happen.

```jsx
import { useFormalizer } from 'formalizer';

const EmailFormComponent = () => {
  const submitHandler = (event, formData) => {
    // invoked every time new data is accepted (checkbox toggled, select value picked, text value accepted, etc).
  };

  const { useInput, errors } = useFormalizer(submitHandler);

  return (
      <input {...useInput('email', 'isEmail')} />
      <span>{errors['email']}</span>
  );
};
```

Since you have no connected form, the submit handler will be invoked every time a new input value is accepted either by toggling a checkbox, selecting a new value in a select component or pressing Enter or removing the focus off a text input.

## Setting form initial values

A common use case you are likely to see is to initiate the form with certain values. The most common example is of editing an existing entity.

The `useFormalizer` hook takes as its second argument an object containing the initial values for the form. You won't need to also set these values on the inputs: simply passing them to Formalizer is enough - all your inputs will be rendered with their initial values set.

For example, to initialize the following form with a given email address value:

```jsx
import { useFormalizer } from 'formalizer';

const EmailFormComponent = () => {
  const submitHandler = (event, formData) => {
    // so something with form data, such as dispatching a request to a server.
  };

  const { formRef, useInput, errors } = useFormalizer(submitHandler, {
    email: 'initial.email@gmail.com'
  });

  return (
    <form ref={formRef}>
      <input {...useInput('email', 'isEmail')} />
      <span>{errors['email']}</span>
    </form>
  );
};
```
