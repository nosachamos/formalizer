# Examples

## Built-in validator examples

This library provides only two validators out-of-the-box:

### isRequired

To pass validation, the field value must not be empty (or composed solely by spaces):

```jsx
<input type="password" {...useInput('name', 'isRequired')} />
```

### mustMatch

Because requiring a field to match the value of another field is such a common use case, we provide the `mustMatch` function
you can use to quickly setup this validation. This function takes the name of the field it must match and return a validator
that enforces this behavior.

For example, to ensure the user's email and email conformations match, you could do the following:

```jsx
import {mustMatch} from 'formalizer';

...

<input {...useInput('email', ['isRequired', 'isEmail'] )} />

<input {...useInput('emailConfirmation', mustMatch('email'))} />
```

Yep, it's that simple.
