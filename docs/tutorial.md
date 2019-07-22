# Tutorial

Let's add validations to following signup form:

```jsx
const UserProfileComponent = () =>

    return (
        <form>
            <input name="email" />
            <input type="password" name="password" />
            <input type="password" name="passwordConfirmation" />

            <input type="checkbox" name="signupForNewsletter" />

            <input type="radio" name="newsletterFrequency" value="dailyNewsletter" />
            <input type="radio" name="newsletterFrequency" value="weeklyNewsletter" />

            <button type="submit">Submit</button>
        </form>
    );
}
```

For this tutorial, we have a few requirements we want to implement:

- The email field should be required, and its value must be a valid email address;
- We also want password to be required, to contain the uppercase letter Z;
- Finally, the password confirmation field must match match the password.

## Setting up the form

First, since we will be adding Formalizer to this form, we won't need the `name` attribute anymore. Let's clean it up:

```jsx
<form>
  <input />
  <input type="password" />
  <input type="password" />
  <input type="checkbox" />
  <input type="radio" value="dailyNewsletter" />
  <input type="radio" value="weeklyNewsletter" />

  <button type="submit">Submit</button>
</form>
```

We use the `useFormalizer` hook to get a reference to everything we need. It returns a ref that must be connected to the form you will be validating:

```jsx
const { formRef, useInput } = useFormalizer();

<form ref={formRef}>...</form>;
```

## Adding the email field validations

We then can use the `useInput` field to add validations to the inputs. Let's make both the email and password fields required:

```jsx
<form ref={formRef}>
  <input {...useInput('email', 'isRequired')} />
  ...
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
      errorMessage: 'Must contain letter Z.',
      validator: value => value && value.indexOf('Z') > -1
    }
  ])}
/>
```

You can, of course, factor that validator out for readability or reuse:

```jsx
const mustContainZ = {
  errorMessage: 'Must contain letter Z.',
  validator: value => value && value.indexOf('Z') > -1
};

<input
  type="password"
  {...useInput('password', ['isRequired', containsZLetter])}
/>;
```

## Adding password confirmation validation

Our last validation requirement is to have the password confirmation field match the password field. We will start implementing another custom validator to illustrate how this could be done from scratch. The validator function receives two parameters: a `value`, which we have seen above, and an `options` object. This options object has a property called `formData`, which has the value for every field in the form. We can use that to create this custom validator:

```jsx
const mustMatchPassword = {
  errorMessage: 'Must match the password.',
  validator: (value, options) => value === options.formData.password
};

<input type="password" {...useInput('passConfirmation', mustMatchPassword)} />;
```

But because this is such a common use-case, we provide a validator out of the box:

```jsx
import { mustMatch } from 'formalizer';

...

<input type="password" {...useInput('passConfirmation', mustMatch('password')) } />
```

The last thing left to do, is display the validation errors when they occur.

## Checkbox and radio button selections

Next, we want to make sure the value selected by the user on the checkbox and set of radio buttons is included in the form data we send to the server.

To accomplish, all we need is to add the two other input hooks supported by Formalizer: `useCheckboxInput` and `useRadioInput`. Note that the input type is not longer needed since they are implied when using these hooks. Also, for radio buttons, we will supply the value for each radio input as the second argument of the `useRadioInput` hook, so we don't need those attributes anymore either.

```jsx
const { formRef, useInput, useCheckboxInput, useRadioInput } = useFormalizer();

...

<input {...useCheckboxInput('signupForNewsletter')} />

<input {...useRadioInput('newsletterFrequency', 'dailyNewsletter')} />
<input {...useRadioInput('newsletterFrequency', 'weeklyNewsletter')} />
```

That's it. Now when this form is submitted, the form data will include a `signupForNewsletter` with a boolean value indicating whether the checkbox was checked, and a `newsletterFrequency` string property whose value corresponds to the selected radio button.

## Displaying validation errors

To display the validation errors, we add a `span` elements to our form.

The `useFormalizer` hook also returns an `errors` object which contains the errors currently in the form:

```jsx
const { formRef, useInput, errors } = useFormalizer();
```

We then use it to display the errors within the newly added span elements:

```jsx
<form ref={formRef}>
  <input {...useInput('email', 'isRequired')} />
  <span>{errors['email']}</span>

  <input
    type="password"
    {...useInput('password', ['isRequired', mustContainZ])}
  />
  <span>{errors['password']}</span>

  <input
    type="password"
    {...useInput('passConfirmation', mustMatch('password'))}
  />
  <span>{errors['passConfirmation']}</span>

  <input {...useCheckboxInput('signupForNewsletter')} />

  <input {...useRadioInput('newsletterFrequency', 'dailyNewsletter')} />
  <input {...useRadioInput('newsletterFrequency', 'weeklyNewsletter')} />

  <button type="submit">Submit</button>
</form>
```

## Disabling submission when form is invalid

We can quickly check whether the whole form is valid by using the `isValid` flag:

```jsx
const { formRef, useInput, errors, isValid } = useFormalizer();
```

Then use it to disable the Submit button when the `isValid` true is not true:

```jsx
<button disabled={!isValid} type="submit">
  Submit
</button>
```

## Handling form submission

Finally, we want to be able to do something with the form data when the form is valid and the user clicks Submit. With Formalizer, you don't need to add onSubmit handlers yourself. Instead, pass in the submit handler function to the `useFormalizer` hook, and it will be invoked when the user submits a valid form:

```jsx
const submitHandler = (event, formData) => {
  // do something with formData, such as send it to the server
};

const { formRef, useInput, errors, isValid } = useFormalizer(submitHandler);
```

## Setting form initial values

Suppose that in our component, we could be given a `userProfile` prop. If set, that should be used to set the form initial values (just the email, as we won't save the password anywhere):

```jsx
const UserProfileComponent = ({userProfile}) => {
    console.dir(userProfile); // { email: 'john.smith@gmail.com' }

    ...
```

To accomplish that, we simply pass it as the `useFormalizer` hook's first argument:

```jsx
const { formRef, useInput, errors, isValid } = useFormalizer(
  submitHandler,
  userProfile
);
```

That's it!

## Final Result

This is how our fully-featured form looks like:

```jsx
const mustContainZ = {
    errorMessage: 'Must contain letter Z.',
    validator: value => value && value.indexOf('Z') > -1
};

const UserProfileComponent = ({userProfile}) =>

    const handleSubmit = (formData, event) => {
        // do something with formData, such as send it to the server
    }

    const { formRef, useInput, useCheckboxInput, useRadioInput, errors, isValid } = useFormalizer(handleSubmit, userProfile);

    return (
        <form ref={formRef}>
            <input {...useInput('email', 'isRequired')} />
            <span>{errors['email']}</span>

            <input type="password"
                {...useInput('password', ['isRequired', containsZLetter])} />
            <span>{errors['password']}</span>

            <input type="password"
                {...useInput('passConfirmation', mustMatch('password'))} />
            <span>{errors['passConfirmation']}</span>

            <input {...useCheckboxInput('signupForNewsletter')} />

            <input {...useRadioInput('newsletterFrequency', 'dailyNewsletter')} />
            <input {...useRadioInput('newsletterFrequency', 'weeklyNewsletter')} />

            <button disabled={!isValid} type="submit">Submit</button>
        </form>
    );
}
```
