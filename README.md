# Feri

Feri is a refreshingly easy to use build tool for web files.

Incrementally clean, build, and watch with little to no configuration required.

Spend an afternoon on your project, not your build tool. ^_^

* [Features](#features)
* [How It Works](#how-it-works)
  * [One Source, One Destination](#one-source-one-destination)
  * [Extension Based](#extension-based)
  * [Include Files](#include-files)
  * [Preconfigured](#preconfigured)
* [Install](#install)
* [Command Line](#command-line)
* [Custom Config File](#custom-config-file)
* [Extension Specific Information](#extension-specific-information)
* [Edge Cases](#edge-cases)
* [API Documentation](#api-documentation)
* [Contribute](#help-feri)

## Features

* Clean, Build, and Watch
* Command Line / API
* Compile and Minify
  * CoffeeScript
  * Embedded JavaScript (EJS)
  * Jade
  * Less
  * Markdown
  * Sass
  * Stylus
* LiveReload
* Minify
  * HTML
  * CSS
  * JavaScript
* Optimize
  * GIF
  * JPG
  * PNG
* Multilingual
* Multi-platform
* Promise Based
* Source Maps

## How It Works

### One Source, One Destination

Feri is based on the simple premise of having one source and one destination directory.

Since source and destination folders are linked, cleaning is a breeze. If a destination file does not have a source equivalent, remove the destination file.

Likewise, knowing which source files need to be built is simple logic. If a source file is missing a destination equivalent, build the source file. If a source file is newer than a destination equivalent, build the source file. If a destination file is newer, no build is needed.

Watching is accomplished by running the appropriate clean or build function in reaction to file system changes. With some added smarts to know that a modified include file should trigger a check all files that may depend on the include for possible rebuilding.

### Extension Based

Feri has a plan of action for each file type. CSS files get minified. JPG files are losslessly optimized and so on. Each extension can have its own unique build process but all files of that type are treated equally. This greatly reduces the complexity when compared to systems which have you define every action, to every file, over and over again.

### Include Files
Any file prefixed with an underscore ( _ ) is considered an include file. Include files do not get directly published from source to destination but can be included in other files that do.

### Preconfigured

Feri comes preconfigured with sensible defaults that get you up and running fast. For some, you'll never have to touch a thing. For others, you'll thrill at how easy it is to make a Feri config file with all your favorite settings. Others still will cackle with mad abandonment once they harness the unrestricted power of Feri's API to make their own wild creations!

## Install

Install Feri globally for command line use.

```
npm install -g feri
```

Install Feri locally in your project's [node_modules](https://nodejs.org/api/modules.html#modules_loading_from_node_modules_folders) folder for API use.

```
npm install feri
```

## Command Line

Assuming Feri is installed globally, you can see what command line options are available with:

```
feri --help
```

Expanded information is available in the [command line](docs/command-line.md) documentation.

## Custom Config File

If you are using the command line, Feri will look for a file called `feri.js` in the directory you call her from. This file can specify not only which command line options you want enabled but also control any [config API](docs/api/config.md) setting.

For example, Feri will clean and build by default but what if you want her to watch too? You could type `feri --watch` every time you want to work on your project but where is the fun in that? Activate your inner awesomeness and setup a `feri.js` file like:

```js
// feri.js
module.exports = function(config) {
    // clean and build are enabled by default
    config.option.watch = true
}
```

Now you can type `feri` and the custom config file will take of the rest! Even better, command line switches still take precedence. That means typing `feri --nowatch` will temporarily override the config file setting.

Visit the [config API](docs/api/config.md) documentation to find out about all the neat things you can specify in your config file.

## Custom Build Tasks

Feri thinks you should be able to grab nearly any npm module and make a [custom build task](docs/custom-build-task.md) out of it without too much effort. Are `.snazzy` files the new CSS hotness? No need to wait for a plugin, you can play with new tech right away.

## Extension Specific Information

Additional [extension specific information](docs/extension-specific-info.md) is available for CSS source maps, EJS includes, and GZ files.

## Edge Cases

An index murder mystery!? Plus, what the heck are remora files? Find out in this melodramatic issue of [Edge Cases](edge-cases.md).

## API Documentation

Learn how to leverage Feri's favorite functions in the full [API documentation](docs/api/index.md).

## Contribute

Feri and her silly creator [Daniel](https://forestmist.org/about/) would like nothing more than to make the world a better place. ^_^

If you would like to help Feri and her hue-mon (they come in so many colors), then here are a few ideas to get you started.

 * Tell your friends and co-workers how Feri lowered your blood pressure!
 * Coordinate a massive social media storm from the comfort of your own toilet!
 * Translate [langauge/en-us.json](../language/en-us.json) into other languages. Bonus points for Klingon!
 * Report issues here on GitHub or forget that and post Feri fan art to [DeviantArt](https://deviantart.com) instead!
 * Invite Daniel to talk on your JavaScript podcast about Feri and get a free back farts demonstration! *Wood or tile floor recommended.*
 * Turbo-charge Feri's human with [hamburgers and root beer](https://cash.me/$ForestMist)!
 * Run mocha tests or... test how copious amounts of mocha affects your run! *huff puff*
 * Pull reqrests to improv spellng in documantations!
 * Beastmaster x Feri fan fiction!

Other wacky ideas, job offers, and/or lifetime supplies of [Burgerville](http://www.burgerville.com/) welcome. ^_^

## License

MIT © [Daniel Gagan](https://forestmist.org)