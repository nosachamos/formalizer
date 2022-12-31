# Custom Validators

Writing custom validators, or customizing built-in ones is quick and easy.

## Usage

You can define a custom validator like so:

```jsx
// define somewhere in your app
const mustContainZ = {
  errorMessage: 'Must contain the letter z',
  validator: value => !!value && value.toLowerCase().indexOf('z') > -1
};
```

Then use reuse it throughout your app like so:

```jsx
<input type="password" {...useInput('password', mustContainZ)} />
```

If reusing the validator is not a goal, you may also define the validator inline:

```jsx
<input
  type="password"
  {...useInput('password', {
    errorMessage: 'Must contain the letter z',
    validator: value => !!value && value.toLowerCase().indexOf('z') > -1
  })}
/>
```

## Configuring a custom validator

A validator configuration accepts the following properties:

### validator

Can be assigned a function to perform the validation, or the string mame of a global or built-in validator.

The validator function must have the following signature:

```typescript
type validationFunction = (value: string, options: object) => boolean;
```

Must be provided.

### errorMessage

The error message to display when this validator rejects a value.

This can be either a plain string, or a function that returns a string.

##### Dynamic error messages

Providing a function allows you to dynamically generate the error message based on the value of the input being validated, or other data associated with your form.

Here is an example of a validator using a dynamically generated error message:

```jsx
const validateEmail = {
  validator: 'isEmail',
  errorMessage: (value, formData) => {
    return `The value "${value}" is not a valid email address`;
  }
};
```

As you can see above, the message will change as the user types new values.

If none is provided, a generic error message is used instead. You can access this generic message by importing the `DEFAULT_VALIDATION_ERROR_MESSAGE` constant.

Alternatively, you can omit the errorMessage property entirely and just return an error message directly from the validator function:

```jsx
const validateEmail = {
  validator: () => {
    if (value?.toLowerCase().indexOf('z') === -1) {
      return 'Must contain the letter z';
    }
    return undefined;
  }
};
```

### negate

A boolean flag that indicates whether the validator should be negated.

For example, if a `isEmpty` validator would normally reject values that are not empty, you can reverse this by providing setting the `negate` flag to true. In this case, only non-empty values will be accepted.

### options

An object containing options that are passed in to the validator function and may be used to customize the validator's behavior.
