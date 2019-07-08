# Global Validators

You can add validators as properties to a global object named `GlobalValidators`. Once added to this object, they become
available anywhere in your app. This is very handy to ensure your app doesn't end up with multiple versions of commonly
used validators, and helps you and your team find and maintain existing validators.

## Creating Global Validators

Here we create a global validator that ensures the input value contains the letter Z.

```jsx
// define somewhere in your app
GlobalValidators.mustContainLetterZ: {
    errorMessage: 'Must contain the letter z',
    validator: (value) => !!value && value.toLowerCase().indexOf('z') > -1
};
```

Once this is done, you can then refer to it by name anywhere in your app:

```jsx
<input type="password" {...useInput('password', 'mustContainLetterZ')} />
```

You can also create a custom validator reuses the validation function defined in the global validator, but overrides
specific options such as the `errorMessage`:

```jsx
<input
  type="password"
  {...useInput('password', {
      validator: 'mustContainLetterZ',
      errorMessage: 'Must contain the letter z'
    }
  })}
/>
```

Notice that the key of the custom validator matches the one from the global validator.

## Customizing validators globally

Global validators are also useful to customize how built-in and third party validators operate, or the error messages associated with them.

```jsx
// define somewhere in your app
GlobalValidators.isEmail: {
    errorMessage: 'Must contain the letter z'
};
```

Remember that the `isEmail` comes from the `validator` library so it must be installed for this validator to be available.

Because overriding a validator's error message is such a common use case, you can take a shortcut and assign the error message directly to the validator:

```jsx
// define somewhere in your app
GlobalValidators.isEmail: 'Must contain the letter z';
```

From this point on, all `isEmail` validation errors in your will use the newly assigned error message
