# Examples

## Built-in validator examples

This library provides only two validators out-of-the-box: `isRequired`, which ensures the field isn't empty, and `mustMatch`, which
ensures the field matches the value of another field (useful for value confirmations, such as email or passwords).

In this example we combine them both so that the `password` field is required, and the `passConfirmation` field is both
required and as well as required to match the password field:

```jsx
  <input
    type="password"
    {...useInput('password', 'isRequired')}
  />

  <input
    type="password"
    {...useInput('passConfirmation', ['isRequired', mustMatch('password')] )}
  />
```

## Custom validator examples

The following examples illustrate several ways to use this custom validator:

#### Use this custom validator alone (no array needed)

```jsx
// then use it while also providing an option to customize behavior
<input type="password" {...useInput('password', mustContainZValidator)} />
```

#### Use this custom validator together with the built-in isRequired validator

```jsx
// then use it while also providing an option to customize behavior
<input
  type="password"
  {...useInput('password', ['isRequired', mustContainZValidator])}
/>
```

Note that the order the validators are provided is significant: validators will be executed in the order they were provided. The validation will stop on the first validator to reject the input, and its error message will be returned.

In this case, providing the `isRequired` validator first allows for its error message to be displayed when no value is present, and `mustContainZValidator` validator's error message to be displayed if it is not empty but it doesn't contain the letter z.

#### Custom validator that uses an option

```jsx
// then use it while also providing an option to customize behavior
<input
  type="password"
  {...useInput('password', [
    'isRequired',
    { mustContainZValidator: { options: { ignoreCase: true } } }
  ])}
/>
```

#### Override a validator's error message for a particular input

```jsx
// then use it while also providing an option to customize behavior
<input
  type="password"
  {...useInput('password', [
    'isRequired',
    {
      mustContainZValidator: {
        errorMessage: 'Not valid: please make sure it contains the letter z.'
      }
    }
  ])}
/>
```

## Global validator examples

#### Overriding a global validator's error message

Because overriding the error message is such a common use case, you can take a shortcut to do this and assign the new error message directly to the validator:

```jsx
<input
  type="password"
  {...useInput('password', {
    mustContainZValidator: 'Must contain the letter z'
  })}
/>
```

#### Overriding a third-party validator's error message

You can also override the error message of a third party validator. To do that, simply specify which validator you are customizing using the `validator` property:

```jsx
<input
  type="password"
  {...useInput('password', {
    isEmail: 'Please enter a valid email address'
  })}
/>
```
