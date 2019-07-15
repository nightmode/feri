# Feri - Command Line

Once Feri is installed globally you can call her from any location as `feri`.

Feri will clean, build, and display statistics by default. She will also assume your source folder is "./source" and your destination folder is "./dest" unless you tell her otherwise.

## Navigation

* [Usage](#usage)
* [Options](#options)
* [Source](#source)
* [Destination](#destination)
* [Examples](#examples)

## Usage

```
feri [options] [source] [destination]
```

Optional elements include options, source, and destination.

## Options

Options come in three flavours: Common, Negating, and Special.

### Common Options

```
-c, --clean          clean the destination directory
-b, --build          build source files to destination
-w, --watch          watch source to clean and build as needed
-e, --extensions     monitor destination directory for extensions
-s, --stats          display statistics
```

Feri will clean, build, and display statistics by default. If you like those behaviors you can simply type `feri` instead of `feri --clean --build --stats`.

### Negating Options

```
-nc, --noclean       no clean
-nb, --nobuild       no build
-nw, --nowatch       no watch
-ne, --noextensions  no extensions
-ns, --nostats       no statistics
```

Negating options override their counterparts. For example, `feri --clean --noclean` would result in the destination folder not being cleaned.

### Special Options

Special options can override other options, do multiple things at once, or are otherwise uniquely awesome.

```
-a, --all            clean, build, watch, extensions, stats
-f, --forcebuild     overwrite destination files without consideration
-r, --republish      remove all destination files and then build
-i, --init           create source, destination, and custom config file
-d, --debug          enable verbose console logging
-v, --version        version
-h, --help           help
```

Options like `--all`, `--forcebuild`, and `--republish` will override any other settings.

## Source

Optional source directory to build files from.

If not provided, Feri will look for a `source` folder in the directory you called her from.

## Destination

Optional destination directory to build files to.

If not provided, Feri will look for a `dest` folder in the directory you called her from.

## Examples

Clean, build, and stats are enabled by default.

```
feri
```

Clean, do not build, and then watch.

```
feri --nobuild --watch
```

Republish from a specific source folder to a specific destination folder.

```
feri --republish /path/to/source /path/to/destination
```

## License

MIT © [Kai Nightmode](https://twitter.com/kai_nightmode)