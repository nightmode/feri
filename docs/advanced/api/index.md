# Feri - API

Feri is designed to be extremely customizable. That means you get full access to the same API she uses herself. Call on existing functions, create your own, or even replace core functionality.

## Modules

* [Shared](shared.md#feri---shared)
* [Config](config.md#feri---config)
* [Functions](functions.md#feri---functions)
* [Clean](clean.md#feri---clean)
* [Build](build.md#feri---build)
* [Watch](watch.md#feri---watch)

## Require

Assuming Feri is installed locally in your project's `node_modules` folder, you can require her with the following:

    const feri = require('feri')

## Overview

When you require Feri, you are actually requiring her [code/1 - main.js](../../../code/1%20-%20main.js) file. Inside this file you'll notice that Feri is sharing every module she uses herself, plus a convenience object called action.

```js
const feri = {
    'action': {
        'clean': clean.processClean,
        'build': build.processBuild,
        'watch': watch.processWatch,
    },
    'shared'   : shared,
    'config'   : config,
    'functions': functions,
    'clean'    : clean,
    'build'    : build,
    'watch'    : watch
}

module.exports = feri
```

The action object exists solely to enable cool statements like `feri.action.clean()` instead of `feri.clean.processClean()`. Both will accomplish the same thing so use whichever style you prefer.

Now that we know about all the modules being exported, let's go over each in a bit more detail.

## Modules

### Shared

Shared is all the neat things we may want to share across modules. Things that don't really belong in the config module like caches, non-user configurable variables, computed values, and more.

For more information, see the [Shared](shared.md#feri---shared) documentation.

### Config

Config holds all the variables that may be set by the command line, set by a [custom config file](../custom-config-file.md#feri---custom-config-file) for the command line, or set programatically.

For more information, see the [Config](config.md#feri---config) documentation.

### Functions

Functions is a module that many other modules depend on. A treasure trove of helpers.

For more information, see the [Functions](functions.md#feri---functions) documentation.

### Clean

Clean is a module dedicated to cleaning destination files.

For more information, see the [Clean](clean.md#feri---clean) documentation.

### Build

Build is a module dedicated to building destination files.

For more information, see the [Build](build.md#feri---build) documentation.

### Watch

Watch is all about watching source and destination folders for changes. Initiating the appropriate clean or build tasks in response to file system events.

For more information, see the [Watch](watch.md#feri---watch) documentation.

## License

MIT © [Kai Nightmode](https://twitter.com/kai_nightmode)