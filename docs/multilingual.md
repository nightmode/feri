# Feri - Multilingual

 * [Languages](#languages)
 * [Usage](#usage)
 * [Translation Guide](#translation-guide)
 * [Contributing Translations](#contributing-translations)

## Languages

Feri is currently available in the following languages.

 * English (US)
 * French (France)
 * German (Germany and Switzerland)
 * Italian (Italy and Switzerland)
 * Portuguese (Brazil)
 * Swedish (Sweden)

Don't see your favorite language? Check out the [translation guide](#translation-guide) to see how you can help.

## Usage

Specifying a language is accomplished with a [custom config file](../README.md#custom-config-file).

For example, if we wanted to work in Swedish we would create a `feri.js` file in our project directory with the following code in it:

```js
// feri.js
module.exports = function(feri) {
    feri.config.language = 'sv-se'
}
```

By setting `feri.config.langauge` to `sv-se`, we are telling Feri to look in the [language](https://github.com/nightmode/feri/tree/master/language) directory for a file called `sv-se.json`. Assuming the file exists and is valid, the next time you run Feri you'll be doing so in a certain Muppet Chef's language of choice. Bork bork bork!

## Translation Guide

In addition to US English, Feri stores all her translations inside the [language](https://github.com/nightmode/feri/tree/master/language) directory. Files are named by language then country and saved in a JSON format.

To make a new translation, start by copying `en-us.json` to a new file. If you are not sure which language or country abbreviation to use, feel free to name your file `new.json` or similar.

Now that you have your own file to work in, let's go over the hierarchy of a typical language file in more detail.

### Error

This section contains various error messages in sentence format.

```js
"error": {
    "configPaths"           : "Source and destination should be unique and not nested within each other.",
    "destPointsToSource"    : "Destination points to a source directory.",
    "destProtected"         : "Destination should not be a protected location like {path}.",
    "halted"                : "Halted {software} version {version} due to errors.",
    "missingDest"           : "Missing destination file.",
    "missingSource"         : "Missing source file.",
    "missingSourceDirectory": "Missing source directory.",
    "removeDest"            : "Source file delete ignored since source files should never be harmed.",
    "watchingDest"          : "Error watching destination folder.",
    "watchingSource"        : "Error watching source folder."
}
```

One thing you may notice is that certain messages have special placeholders like `{software}`. These placeholders get replaced at run time, so a string like:

```
Halted {software} version {version} due to errors.
```

Will display like:

```
Halted Feri version 1.0 due to errors.
```

Having placeholders means you can change their order to better suit your language of choice.

### Message

This section contains various informative messages in sentence format.

```js
"message": {
    "fileChangedTooRecently"  : "{file} was changed too recently, ignoring.",
    "includesNewer"           : "{extension} include(s) newer than destination file.",
    "missingSourceToDestTasks": "Missing config.map.sourceToDestTasks for the following file types:",
    "listeningOnPort"         : "{software} listening on port {port}.",
    "usingConfigFile"         : "Using {file} file.",
    "watchRefreshed"          : "{software} refreshed.",
    "watchingDirectory"       : "Watching {directory} for changes."
}
```

Much like the Error section before it, placeholders are used so a string like:

```
{software} refreshed.
```

Will display like:

```
LiveReload refreshed.
```

### Padded Groups

Padded Groups are words, optionally padded with spaces so they line up nicely when displayed.

```js
"paddedGroups": {
    "build": {
        "output": "output",
        "copy"  : "copy  "
    },
    "stats": {
        "load" : "Load ",
        "clean": "Clean",
        "build": "Build",
        "watch": "Watch",
        "total": "Total"
    }
}
```

Each word in a group should be padded with enough spaces to equal the longest string from that same group.

For example, `paddedGroups.build` has two keys, `output` and `copy`. The longest string is `output` at 6 characters. Extra spaces were added `copy` to reach a matching length of 6 characters. Now they both display nicely together.

<img src="https://raw.githubusercontent.com/nightmode/feri/master/images/translation-guide-build.png" width="918" height="150" alt="">

Same idea for `paddedGroups.stats` except that the longest strings here are 5 characters long. Adding one space to `load` ensures that they all line up nicely when displayed.

<img src="https://raw.githubusercontent.com/nightmode/feri/master/images/translation-guide-stats.png" width="918" height="227" alt="">

### Words

Words get used in all sorts of places. Let's go over examples for each to understand them better.

```js
"words": {
    "add"             : "add",
    "addDirectory"    : "add dir",
    "build"           : "Build",
    "clean"           : "Clean",
    "change"          : "change",
    "done"            : "Done",
    "removed"         : "removed",
    "removedDirectory": "removed dir",
    "seconds"         : "seconds",
    "stats"           : "Stats",
    "watch"           : "Watch",
    "watching"        : "Watching"
}
```

**Add** is used when a file is added while watching. For example...

```
/source/index.html add
```

**Add Directory** is used when a folder is added while watching. For example...

```
/source/new_folder add dir
```

**Build** is the title that displays once before any building tasks.

**Clean** is the title that displays once before any cleaning tasks.

**Change** is used when a file changes while watching. For example...

```
/source/index.html change
/dest/index.html change
```

**Done** signifies that no tasks needed to be run after a clean or build phase.

**Removed** is used throughout Feri to indicate that a file was removed. For example...

```
/dest/old.txt removed
```

**Removed Directory** is used when a folder is removed while watching. For example...

```
/dest/old_folder removed dir
```

**Seconds** is only displayed when displaying statistics. For example...

```
Total 0.392 seconds
```

**Stats** is the title that displays once before listing statistics.

**Watch** is the title that displays once before listing which folders are being watched.

**Watching** is the title that displays once before Feri goes into watch mode.

## Contributing Translations

Firstly, you are awesome! Thank you. ^_^

If you have not already, try testing your translation with different command line switches like `--republish`, `--watch`, and/or `--livereload` to see how everything looks. Once everything is set you can send a [pull request](https://github.com/nightmode/feri/pulls) or contact [Kai Nightmode](https://twitter.com/kai_nightmode) for more options.

## License

MIT © [Kai Nightmode](https://forestmist.org)