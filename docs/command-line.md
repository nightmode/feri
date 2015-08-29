# Feri - Command Line

Once Feri is installed globally you can call her from any location as `feri`.

Feri will clean, build, and display statistics by default. She will also assume your source folder is "./source" and your destination folder is "./dest" unless you tell her otherwise.

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

Let's talk about options as three separate groups for easier [grokking](https://en.wikipedia.org/wiki/Grok).

### Common Options

The first group can be considered the most common options.

```
-c, --clean          clean the destination directory
-b, --build          build source files to destination
-w, --watch          watch source to clean and build as needed
-l, --livereload     monitor destination directory for livereload
-s, --stats          display statistics
```

Feri will clean, build, and display statistics by default. If you like those behaviors you can simply type `feri` instead of `feri --clean --build --stats`.

### Negating Options

The second group can be considered the negating version of group one.

```
-nc, --noclean       no clean
-nb, --nobuild       no build
-nw, --nowatch       no watch
-nl, --nolivereload  no livereload
-ns, --nostats       no statistics
```

Negating options are stronger than the options they override. For example, `feri --clean --noclean` would result in the destination folder not being cleaned.

### Special Options

The third group are special options that can override any previous group, do multiple things at once, or otherwise be uniquely awesome.

```
-a, --all            clean, build, watch, livereload, stats
-f, --forcebuild     overwrite destination files without consideration
-r, --republish      remove all destination files and then build
-d, --debug          enable verbose console logging
-v, --version        version
-h, --help           help
```

Options like `--all`, `--forcebuild`, and `--republish` will override settings from any previous group.

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

MIT © [Daniel Gagan](https://forestmist.org)