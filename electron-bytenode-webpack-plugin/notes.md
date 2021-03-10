# Electron Bytenode Webpack Plugin

Goals:

- After webpack has built each entry point, convert the .js files to .jsc via bytenode (with the electron option). So index.js becomes index.jsc.
- Generate a new loader file to replace index.js file. See code for this file below.
- Build this new "loader" file with Webpack, bundling its dependencies

Problems:

- How do we bundle the loader file? 
  - Does it become a separate entry point so that we can bundle Bytenode?
  - If it's a separate entry point, how do we resolve the `require('./index.jsc)` when there's no `.jsc` file yet? A custom loader as part of the plugin?

## The Loader

The loader is the file which loads the associated Bytenode `.jsc` file. It's a tiny little file which looks like this:

```javascript
require('bytenode')
require('./index.jsc')
```