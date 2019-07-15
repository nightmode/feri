# Feri

<img src="https://raw.githubusercontent.com/nightmode/feri/master/images/feri-the-ferret.png" width="420" height="453" align="right" alt="">

An easy to use build tool for web files.

Incrementally clean, build, and watch with little to no configuration required.

## Navigation

* [Features](#features)
* [Core Concepts](#core-concepts)
  * [One Source, One Destination](#one-source-one-destination)
  * [File Extension Based](#file-extension-based)
  * [Include Files](#include-files)
  * [Customizable](#customizable)
* [Install](#install)
* [Upgrade](#upgrade)
* [Command Line](#command-line)
* [Quickstart Guide](#quickstart-guide)
* Advanced
  * ...
  * [Custom Config File](#custom-config-file)
  * [Extension Specific Information](#extension-specific-information)
  * [Edge Cases](#edge-cases)
  * [API](#api)
* [Support](#contribute)

## Features

* Clean, Build, and Watch
* Command Line and API
* Concatenate
* GIF, JPG, and PNG
* HTML, CSS, and JavaScript
* Linux, macOS, and Windows
* Markdown
* [Multilingual](docs/multilingual.md)

## Core Concepts

### One Source, One Destination

A single source directory which builds/compiles/minifies into a single destination directory.

**Clean**: Destination files that do not have a source equivalent are removed during cleaning.

**Build**: If a source file is missing a destination equivalent, build the file. If a source file is newer than a destination equivalent, build the file.

**Watch**: Run a clean or build task in reaction to file system changes.

### File Extension Based

A single plan of action for each file type. CSS files are minified. JPG files are losslessly optimized. Markdown files are compiled, then minified, and so on. Each extension can have its own unique build process but all files of that type are treated equally.

### Include Files
Any file prefixed with an underscore ( _ ) is considered an include file. Include files do not get directly published from source to destination. Instead, include files contents are only published when a file that can leverage includes is published.

### Customizable

Although capable as is, Feri is designed to be extremely customizable. Using the API or a custom config file allows you to not only change options but even replace core functions.

## Install

Make sure you have [Node](https://nodejs.org/en/) version 11.0.0 or greater. Depending on your operating system, you may also need to install python or other tools used by dependencies that need to be compiled.

Install Feri globally as a command line tool, accessible from anywhere.

```
npm install -g feri
```

Install Feri locally in your project's [node_modules](https://nodejs.org/api/modules.html#modules_loading_from_node_modules_folders) folder for API use and/or command line use from within your project only.

```
npm install feri
```

## Upgrade

You can always upgrade to the latest version of Feri by re-running the global or local install commands.

If you are unsure if an upgrade is available, run the following for a global install.

```
feri --version
```

Or the following for a local install.

```
npx feri --version
```

The above commands will provide additional upgrade information if a newer version is available. Otherwise, just the currently installed version will be listed.

### Upgrade from Version 3

Two potentially critical things to be aware of.

* The dependency `livereload` has been replaced by a new extension server.
* Many dependencies have been removed.
    * If you still want to work with CoffeeScript, EJS, Jade, JSX, Less, Pug, Sass, and/or Stylus, you'll need to create your own custom build task.

Custom config files using the boolean `feri.config.option.livereload` should be changed to `feri.config.option.extensions`.

API use for anything `livereload` related should be changed to an `extension` or `extensions` equivalent depending on where you are in the plumbing.

Command line options like `--livereload` and `--nolivereload` have new equivalents like `--extensions` and `--noextensions`.

## Command Line

If installed globally, you can see what command line options are available with:

```
feri --help
```

Or locally with:

```
npx feri --help
```

More information is available in the [command line](docs/command-line.md) documentation.

## Quickstart Guide

Assuming Feri is installed globally, the quickest way to start a new project is to use the init command.

```
feri --init
```

This will create a `source` and `dest` folder along with a custom config file. To make sure everything works, place some files in your source folder. Now run `feri` from the directory where you can see the source and dest folders. After a short time, your published files should appear in the dest folder.

You'll need to run `feri` everytime you want to clean and/or build new files. Once you are comfortable with that pattern, try running the following command instead.

```
feri --watch
```

Now Feri will stay active, watching your source folder for changes and automatically run the appropriate clean or build tasks depending on your activity in the source folder. Neat!

## Advanced

...

## Custom Config File

If you are using the command line, Feri will look for a file called `feri.js` or `feri-config.js` in the directory you call her from. This file can specify not only which command line options you want enabled, but also control any [config API](docs/api/config.md) settings.

For example, Feri will clean and build by default but what if you want her to watch too? You could type `feri --watch` every time you want to work on your project, but where is the fun in that? Activate your inner awesomeness and setup a custom config file like:

```js
module.exports = function(feri) {
    // clean and build are enabled by default
    feri.config.option.watch = true
}
```

Now you can type `feri` and the custom config file will take of the rest! Even better, command line switches still take precedence. That means typing `feri --nowatch` will temporarily override the config file setting.

Protip: All [API documentation](docs/api/index.md) features are available to custom config files.

## Custom Build Tasks

Feri thinks you should be able to grab nearly any npm module and make a [custom build task](docs/custom-build-task.md) out of it without too much effort. Are `.snazzy` files the new CSS hotness? No need to wait for a plugin, you can play with new tech right away.

## Extension Specific Information

Additional [extension specific information](docs/extension-specific-info.md) is available for `concat`, `br`, and `gz` files.

## Edge Cases

An index murder mystery!? Find out more in this melodramatic issue of [Edge Cases](docs/edge-cases.md).

## API

Learn how to leverage Feri's favorite functions in the full [API](docs/api/index.md).

## Support

Help [support this project](https://www.patreon.com/nightmode) for as little as $1 a month on Patreon. Help me wake up every morning with a smile on my face because you went the extra mile for someone who likes to do the same.

In addition to Patreon, here are some other ways you can help support this project.

 * [Translate Feri](docs/multilingual.md#translation-guide) into other languages. tlhIngan maH!
 * [Report issues on GitHub](https://github.com/nightmode/feri/issues)
 * Social media, meetups, fan art, papercraft, or nearly anything else you can share.
 * Pull reqrests to improv spellng in documantations!

## License

MIT © [Kai Nightmode](https://twitter.com/kai_nightmode)