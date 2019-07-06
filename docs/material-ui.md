# Material UI integration

To use Formalizer with [Material UI](https://material-ui.com/) you can simply import the `setupForMaterialUI` function and call it:

```jsx
import { setupForMaterialUI } from 'formalizer';

...

// then, somewhere in your app's bootstraping code just call it
setupForMaterialUI();
```

Now you can use Formalizer with Material UI's inputs such as `TextField`, and they will error out and display error messages automatically.

#### How it works under the hood

All this function does is set the `invalidAttr` and `invalidHelperTextAttr` settings to the following values:

```jsx
FormalizerSettings = {
  invalidAttr: { error: true },
  helperTextAttr: 'helperText'
};
```

You can learn more about this settings [here](settings.md).
