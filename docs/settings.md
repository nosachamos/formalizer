# Settings

Formalizer provides a few settings that allows you to customizer its behavior, both globally as well as on each form:

| Setting               | Type    | Description                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| invalidAttr           | object  | The attributes set on `invalidAttr` are added to the inputs which contain errors. Setting it to `{ error: true }` results in `error=true` being added to errored inputs. You can add as many attributes as you wish.                                                                                                                                         |
| helperTextAttr        | string  | The name of an optional attribute that, when set, is added to each of the error out inputs. It's value is set to the current error displayed for that input. For example, you set this setting to `errorText`, a required field that is left empty will have a `errorText="This field is required."` attribute set on it until the error has been corrected. |
| keepUnknownAttributes | boolean | Whether attributes passed in as initial values but not present as form inputs should be kept in the final object handed to the result handler function. The default value is to remove any initial value attributes that are not present as form inputs.                                                                                                     |

## Global Settings

If your app needs some of all of these settings to be used in every form validated by Formalizer, then you can simply set them in the global `FormalizerSettings` object. For example:

```jsx
FormalizerSettings.invalidAttr = { error: true };
FormalizerSettings.helperTextAttr = 'helperText';
FormalizerSettings.keepUnknownAttributes = true;
```

Now all forms will use this settings, unless they are overridden by a specific use of the `useFormalizer` hook.

## Settings on a per-form Basis

You may also set these for a single form instead of globally by providing the desired settings as an argument to the `useFormalizer` hook:

```jsx
const settings = {
  invalidAttr: { nogood: true },
  helperTextAttr: 'errorMsg',
  keepUnknownAttributes: true
};

const { formRef, useInput, errors } = useFormalizer(
  submitHandler,
  initialValues,
  settings // <-- your custom settings for this form only
);
```

This settings will override any global settings that may have been set previously.
