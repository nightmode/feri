# Feri - API Documentation

Welcome to Feri Land! A magical place where you get access to all the wonderful tools that Feri uses behind the scenes. If you can think it, you can create it!

## Modules

* [Shared](shared.md)
* [Config](config.md)
* [Functions](functions.md)
* [Clean](clean.md)
* [Build](build.md)
* [Watch](watch.md)

## Require

Assuming Feri is installed locally in your project's node_modules folder, you can require her with the following:

    var feri = require('feri')

## Lay of the Land

When you require Feri, you are actually requiring her [code/1 - main.js](../../code/1 - main.js) file. Inside this file you'll notice that Feri is sharing every module she uses herself, plus a convenience object called action.

```js
var feri = {
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

The action object exists solely to enable cool statements like `feri.action.clean()` instead of `feri.clean.processClean()`. Both will accomplish the same thing so feel free to use whichever style you prefer.

Now that we know about all the modules being exported, let's go over each in a bit more detail.

## Modules

### Shared

Shared is all the neat things we may want to share across modules. Things that don't really belong in the config module like caches, non-user configurable variables, computed values, and more.

For more information, see the [Shared](shared.md) documentation.

### Config

Config holds all the variables that may be set by the command line, a custom config file for the command line, or programatically.

For more information, see the [Config](config.md) documentation.

### Functions

Functions is the module that many other modules depend on. A treasure trove of helpers.

For more information, see the [Functions](functions.md) documentation.

### Clean

Clean is the module dedicated to cleaning destination files.

For more information, see the [Clean](clean.md) documentation.

### Build

Build is the module dedicated to building destination files.

For more information, see the [Build](build.md) documentation.

### Watch

Watch is all about watching the source and destination folders for changes, and initiating the proper clean or build tasks in response to file system events.

For more information, see the [Watch](watch.md) documentation.

## License

MIT © [Kai Nightmode](https://forestmist.org)