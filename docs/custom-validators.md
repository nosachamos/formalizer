# Custom Validators

Writing custom validators, or customizing built-in ones is quick and easy.

## Usage

You can define a custom validator like so:

```jsx
// define somewhere in your app
const mustContainZValidator = {
  mustContainLetterZ: {
    errorMessage: 'Must contain the letter z',
    validator: value => !!value && value.toLowerCase().indexOf('z') > -1
  }
};
```

Then use reuse it throughout your app like so:

```jsx
<input type="password" {...useInput('password', mustContainZValidator)} />
```

If reusing the validator is not a goal, you may also define the validator inline:

```jsx
<input
    type="password"
    {...useInput('password', {
        mustContainLetterZ = {
            errorMessage: 'Must contain the letter z',
            validator: (value) => !!value && value.toLowerCase().indexOf('z') > -1
        }
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

If none is provided, a generic error message is used instead. You can access this generic message by importing the `DEFAULT_VALIDATION_ERROR_MESSAGE` constant.

### negate

A boolean flag that indicates whether the validator should be negated.

For example, if a `isEmpty` validator would normally reject values that are not empty, you can reverse this by providing setting the `negate` flag to true. In this case, only non-empty values will be accepted.

### options

An object containing options that are passed in to the validator function and may be used to customize the validator's behavior.
