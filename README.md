# Feri

<img src="https://raw.githubusercontent.com/nightmode/feri/master/images/feri-the-ferret.png" width="420" height="453" align="right" alt="">

An easy to use build tool for web files.

Incrementally clean, build, and watch with little to no configuration required.

## Future of Feri

The following changes are likely for the next major release.

* Upgrade to Async/Await.
* Upgrade to Streams.
* Reduce dependencies drastically.
* Drop support for source maps which have been a maintenance nightmare.
* Reposition Feri as a focused, opinionated tool that can be extended. Not an everything included tool.

## Quick Links

* [Features](#features)
* [How It Works](#how-it-works)
  * [One Source, One Destination](#one-source-one-destination)
  * [Extension Based](#extension-based)
  * [Include Files](#include-files)
  * [Preconfigured](#preconfigured)
* [Requirements](#requirements)
* [Install](#install)
* [Upgrading](#upgrading)
* [Command Line](#command-line)
* [Quickstart](#quickstart)
* [Custom Config File](#custom-config-file)
* [Extension Specific Information](#extension-specific-information)
* [Edge Cases](#edge-cases)
* [API Documentation](#api-documentation)
* [Contribute](#contribute)

## Features

* Clean, Build, and Watch
* Command Line / API
* Compile and Minify
  * Markdown
  * Sass
  * Stylus
* Concatenate
* LiveReload
* Minify
  * HTML
  * CSS
  * JavaScript
* Optimize
  * GIF
  * JPG
  * PNG
* [Multilingual](docs/multilingual.md)
* Multi-platform
* Promise Based
* Source Maps

## How It Works

### One Source, One Destination

Feri is based on the simple premise of having one source and one destination directory.

Since source and destination folders are linked, cleaning is a breeze. If a destination file does not have a source equivalent, remove the destination file.

Likewise, knowing which source files need to be built is simple. If a source file is missing a destination equivalent, build the source file. If a source file is newer than a destination equivalent, build the source file. If a destination file is newer, no build is needed.

Watching is accomplished by running the appropriate clean or build function in reaction to file system changes. With some added smarts to know that a modified include file should trigger a check all files that may depend on the include for possible rebuilding.

### Extension Based

Feri has a plan of action for each file type. CSS files get minified. JPG files are losslessly optimized, and so on. Each extension can have its own unique build process but all files of that type are treated equally. This greatly reduces the complexity when compared to systems which have you define every action to every file, over and over again.

### Include Files
Any file prefixed with an underscore ( _ ) is considered an include file. Include files do not get directly published from source to destination but can be included in other files that do.

### Preconfigured

Feri comes preconfigured with sensible defaults that get you up and running fast. For some, you'll never have to touch a thing. For others, you'll thrill at how easy it is to make a Feri config file with all your favorite settings. Others still will cackle with mad abandonment once they harness the unrestricted power of Feri's API to make their own wild creations!

## Requirements

[Node](https://nodejs.org/en/) version 11.0.0 or greater.

## Install

Install Feri globally for command line use.

```
npm install -g feri
```

Install Feri locally in your project's [node_modules](https://nodejs.org/api/modules.html#modules_loading_from_node_modules_folders) folder for API use.

```
npm install feri
```

## Upgrading

### Upgrading from Feri 3.x

...

## Command Line

Assuming Feri is installed globally, you can see what command line options are available with:

```
feri --help
```

Expanded information is available in the [command line](docs/command-line.md) documentation.

## Quickstart

Assuming Feri is installed globally, the quickest way to start a new project is to use the init command.

```
feri --init
```

This will create your `source` and `dest` folders along with a default `feri-config.js` file. To make sure everything works, place some files in your source folder. Now run `feri` from the directory where you can see the source and dest folders. Check the dest folder and you should see your built / optimized files. Wash, rinse, repeat.

## Custom Config File

If you are using the command line, Feri will look for a file called `feri-config.js` in the directory you call her from. This file can specify not only which command line options you want enabled, but also control any [config API](docs/api/config.md) settings.

For example, Feri will clean and build by default but what if you want her to watch too? You could type `feri --watch` every time you want to work on your project, but where is the fun in that? Activate your inner awesomeness and setup a `feri-config.js` file like:

```js
// feri-config.js
module.exports = function(feri) {
    // clean and build are enabled by default
    feri.config.option.watch = true
}
```

Now you can type `feri` and the custom config file will take of the rest! Even better, command line switches still take precedence. That means typing `feri --nowatch` will temporarily override the config file setting.

Protip: All [API documentation](docs/api/index.md) features are available to `feri-config.js` files.

## Custom Build Tasks

Feri thinks you should be able to grab nearly any npm module and make a [custom build task](docs/custom-build-task.md) out of it without too much effort. Are `.snazzy` files the new CSS hotness? No need to wait for a plugin, you can play with new tech right away.

## Extension Specific Information

Additional [extension specific information](docs/extension-specific-info.md) is available for `concat` files and `gz` files.

## Edge Cases

An index murder mystery!? Find out more in this melodramatic issue of [Edge Cases](docs/edge-cases.md).

## API Documentation

Learn how to leverage Feri's favorite functions in the full [API documentation](docs/api/index.md).

## Contribute

Looking to contribute? Here are some ideas.

 * Tell your friends about the build tool with the cute logo, Feri.
 * [Translate Feri](docs/multilingual.md#translation-guide) into other languages. tlhIngan maH!
 * [Report issues on GitHub](https://github.com/nightmode/feri/issues)
 * Pull reqrests to improv spellng in documantations!

## License

MIT © [Kai Nightmode](https://forestmist.org)