[![Build Status](https://travis-ci.com/nosachamos/formalizer.svg?branch=master)](https://travis-ci.com/nosachamos/formalizer)
[![codecov](https://codecov.io/gh/nosachamos/formalizer/branch/master/graph/badge.svg)](https://codecov.io/gh/nosachamos/formalizer)

[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
![npm](https://img.shields.io/npm/v/formalizer.svg)
![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/nosachamos/formalizer.svg)
![GitHub](https://img.shields.io/github/license/nosachamos/formalizer.svg)

Formalizer is a React Hooks based form validation library made for humans. The cleanest code or your money back.

![Formalizer](logo.png)

Simple, tiny, extensible, intuitive, documented, fully tested, magical.

# Installation

```sh
yarn add formalizer
```

or

```sh
npm install formalizer --save
```

# Usage

```jsx
import { useForm, mustMatch } from 'formalizer';

const UserProfileComponent = () => {
  const formRef = useRef(null);
  const { useInput, errors, isValid } = useForm(formRef);

  return (
    <form ref={formRef}>
      <input {...useInput('name', ['isRequired'])} />
      <span>{errors['name']}</span>

      <input {...useInput('email', ['isRequired', 'isEmail'])} />
      <span>{errors['email']}</span>

      <button disabled={!isValid} type="submit">
        Submit
      </button>
    </form>
  );
};
```

# Tutorial

Let's add validations to following signup form:

```html
<form>
  <input name="email" />
  <input type="password" name="password" />
  <input type="password" name="passwordConfirmation" />

  <button type="submit">Submit</button>
</form>
```

For this tutorial, we have a few requirements we want to implement:

- The email field should be required, and its value must be a valid email address;
- We also want password to be required, to contain the uppercase letter Z;
- Finally, the password confirmation field must match match the password.

## Setting up the form

First, since we will be adding Formalizer to this form, we won't need the `name` attribute anymore. Let's clean it up:

```html
<form>
  <input />
  <input type="password" />
  <input type="password" />

  <button type="submit">Submit</button>
</form>
```

We use the `useForm` hook to get a reference to everything we need. It takes a reference to the form you will be validating:

```jsx
const formRef = useRef(null);
const { useInput } = useForm(formRef);

<form ref={formRef}>...</form>;
```

## Adding the email field validations

We then can use the `useInput` field to add validations to the inputs. Let's make both the email and password fields required:

```jsx
<form ref={formRef}>
  <input {...useInput('email', 'isRequired')} />
  <input type="password" />
  <input type="password" />

  <button type="submit">Submit</button>
</form>
```

We also want the email field to be a valid email. To validate this, we will take advantage of our integration with the `validator` library:

```sh
npm install validator --save
```

Now we can use the `isEmail` or any other of their excellent validators.

We want to use more than one validator, so use an array:

```jsx
<input {...useInput('email', ['isRequired', 'isEmail'])} />
```

## Adding password field validations

Now we know how to get the password field required. But we also want this field to contain the letter Z. For this special requirement, we will write a custom validator:

```jsx
<input
  type="password"
  {...useInput('password', [
    'isRequired',
    {
      mustContainZ: {
        errorMessage: 'Must contain letter Z.',
        validator: value => value && value.indexOf('Z') > -1
      }
    }
  ])}
/>
```

You can, of course, factor that validator out for readability or reuse:

```jsx
const containsZLetter = {
  mustContainZ: {
    errorMessage: 'Must contain letter Z.',
    validator: value => value && value.indexOf('Z') > -1
  }
};

<input
  type="password"
  {...useInput('password', ['isRequired', containsZLetter])}
/>;
```

## Adding password confirmation validation

Our last validation requirement is to have the password confirmation field match the password field. We will start implementing another custom validator to illustrate how this could be done from scratch. The validator function receives two parameters: a `value`, which we have seen above, and an `options` object. This options object has a property called `formData`, which has the value for every field in the form. We can use that to create this custom validator:

```jsx
const mustMatchPasswordValidator = {
  mustMatchPassword: {
    errorMessage: 'Must match the password.',
    validator: (value, options) => value === options.formData.password
  }
};

<input
  type="password"
  {...useInput('passConfirmation', mustMatchPasswordValidator)}
/>;
```

But because this is such a common use-case, we provide a validator out of the box:

```jsx
import { mustMatch } from 'formalizer';

...

<input type="password" {...useInput('passConfirmation', mustMatch('password')) } />
```

The last thing left to do, is display the validation errors when they occur.

## Displaying validation errors

To display the validation errors, we add a `span` elements to our form:

```jsx
<form ref="{formRef}">
  <input {...useInput('email', 'isRequired')} />
  <span></span>

  <input
    type="password"
    {...useInput('password', ['isRequired', containsZLetter])}
  />
  <span></span>

  <input
    type="password"
    {...useInput('passConfirmation', mustMatch('password'))}
  />
  <span></span>

  <button type="submit">Submit</button>
</form>
```

The `useForm` hook also returns an `errors` object which contains the errors currently in the form:

```jsx
const { useInput, errors } = useForm(formRef);
```

We then use it to display the errors:

```jsx
<form ref={formRef}>
  <input {...useInput('email', 'isRequired')} />
  <span>{errors['email']}</span>

  <input
    type="password"
    {...useInput('password', ['isRequired', containsZLetter])}
  />
  <span>{errors['password']}</span>

  <input
    type="password"
    {...useInput('passConfirmation', mustMatch('password'))}
  />
  <span>{errors['passConfirmation']}</span>

  <button type="submit">Submit</button>
</form>
```

That's it!

## Final Result

This is how our fully validated form looks like:

```jsx
const containsZLetter = {
  mustContainZ: {
    errorMessage: 'Must contain letter Z.',
    validator: value => value && value.indexOf('Z') > -1
  }
};

<form ref={formRef}>
  <input {...useInput('email', 'isRequired')} />
  <span>{errors['email']}</span>

  <input
    type="password"
    {...useInput('password', ['isRequired', containsZLetter])}
  />
  <span>{errors['password']}</span>

  <input
    type="password"
    {...useInput('passConfirmation', mustMatch('password'))}
  />
  <span>{errors['passConfirmation']}</span>

  <button type="submit">Submit</button>
</form>;
```
