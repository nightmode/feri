# Feri - Config

Config holds all the variables that may be set by the command line, a custom config file for the command line, or programatically.

The clean module lives in the file [code/3 - config.js](../../code/3 - config.js)

## Config Object

* [concurLimit](#config.concurLimit)
* [fileType](#config.fileType)
  * [coffeeScript](#config.fileType.coffeeScript)
  * [css](#config.fileType.css)
  * [ejs](#config.fileType.ejs)
  * [js](#config.fileType.js)
  * [less](#config.fileType.less)
  * [sass](#config.fileType.sass)
  * [stylus](#config.fileType.stylus)
* [includeFileTypes](#config.includeFileTypes)
* [includePrefix](#config.includePrefix)
* [glob](#config.glob)
  * [clean](#config.glob.clean)
  * [build](#config.glob.build)
* [language](#config.language)
* [livereloadFileTypes](#config.livereloadFileTypes)
* [map](#config.map)
  * [destToSourceExt](#config.destToSourceExt)
  * [sourceToDestTasks](#config.sourceToDestTasks)
* [option](#config.option)
  * [build](#config.option.build)
  * [clean](#config.option.clean)
  * [debug](#config.option.debug)
  * [forcebuild](#config.option.forcebuild)
  * [livereload](#config.option.livereload)
  * [republish](#config.option.republish)
  * [stats](#config.option.stats)
  * [watch](#config.option.watch)
* [path](#config.path)
  * [source](#config.path.source)
  * [dest](#config.path.dest)
* [sourceMaps](#config.sourceMaps)
* [sourceRoot](#config.sourceRoot)
* [thirdParty](#config.thirdParty)
  * [chokidar](#config.thirdParty.chokidar)
  * [cleanCss](#config.thirdParty.cleanCss)
  * [htmlMinifier](#config.thirdParty.htmlMinifier)
  * [livereload](#config.thirdParty.livereload)
  * [markdownIt](#config.thirdParty.markdownIt)

## config.concurLimit

Type: `number`

Controls how many build and clean processes can run simultaneously. Values 1-3 recommended since node [libuv](https://github.com/libuv/libuv) seems to have 4 slots by default. Feel free to experiment with this setting to see how fast you can get Feri to run.

```js
config.concurLimit = 1
```

## config.fileType

Type: `object`

Parent container for options specific to a single file type.

> ### config.fileType.coffeeScript

> Type: `object`

> Options used by [build.coffeeScript](build.md#build.coffeeScript).

> ```js
config.fileType.coffeeScript = {
    'sourceMaps': false
}
```

> ### config.fileType.css

> Type: `object`

> Options used by [build.css](build.md#build.css).

> ```js
config.fileType.css = {
    'sourceMaps': false
}
```

> ### config.fileType.ejs

> Type: `object`

> Options used by [build.ejs](build.md#build.ejs).

> ```js
config.fileType.ejs = {
    'root': ""
}
```

> The root variable will be passed to the EJS rendering engine to figure out include file paths like...

> ```js
<% include root + '/partials/_header.ejs' %>
```

> ### config.fileType.js

> Type: `object`

> Options used by [build.js](build.md#build.js).

> ```js
config.fileType.js = {
    'sourceMaps': false
}
```

> ### config.fileType.less

> Type: `object`

> Options used by [build.less](build.md#build.less).

> ```js
config.fileType.less = {
    'sourceMaps': false
}
```

> ### config.fileType.sass

> Type: `object`

> Options used by [build.sass](build.md#build.sass).

> ```js
config.fileType.sass = {
    'sourceMaps': false
}
```

> ### config.fileType.stylus

> Type: `object`

> Options used by [build.stylus](build.md#build.stylus).

> ```js
config.fileType.stylus = {
    'sourceMaps': false
}
```

## config.includeFileTypes

Type: `array`

Used by [watch.buildOne](watch.md#buildOne) to know which file types may use includes.

```js
config.includeFileTypes = ['ejs', 'jade', 'less', 'sass', 'scss', 'styl']
```

## config.includePrefix

Type: `string`

Files prefixed with this string will not be published directly to the destination directory. Prefixed files can be included inside other files that do get published to destination though.

```js
config.includePrefix = '_'
```

## config.glob

Type: `object`

Parent container for [glob](https://www.npmjs.com/package/glob) search strings.

> ### config.glob.clean

> Type: `string`

> If specified, use when running [clean.processClean](clean.md#clean.processClean) without the files parameter.

> ```js
config.glob.clean = '' // default
```

> Example

> ```js
// only clean image files
config.glob.clean = '**/*.{gif|jpg|png}'
```

> ### config.glob.build

> Type: `string`

> If specified, use when running [build.processBuild](build.md#build.processBuild) without the files parameter.

> ```js
config.glob.build = '' // default
```

> Example

> ```js
// only build less files
config.glob.build = '**/*.less'
```

## config.language

Type: `string`

Specify a language Feri that should use. The language should map to a json file like [language/en-us.json](../../langauge/en-us.json) in the language directory.

```js
config.language = 'en-us'
```

Note: API users should use [functions.setLanguage](functions.md#functions.setLangauge) to change both this variable and [share.language.loaded](share.md#shared.language.loaded) at the same time. Command line users only need to set this variable.

## config.livereloadFileTypes

Type: `array`

Only refresh the livereload client if one of these file types has been changed.

```js
config.livereloadFileTypes = ['css', 'html', 'js']
```

## config.map

Type: `object`

Parent container for the all important mapping objects. These are the objects that tell Feri how to clean and build various file types.

> ### config.map.destToSourceExt

> Type: `object`

> Destination extensions to source extensions map.

> In the object below, a CSS file could be generated by a LESS, SASS, SCSS, or STYL file. This is incredibly valuable information that Feri uses to clean and build.

> ```js
config.map.destToSourceExt = {
    'css' : ['less', 'sass', 'scss', 'styl'],
    'gz'  : ['*'],
    'html': ['ejs', 'jade', 'md'],
    'js'  : ['coffee'],
    'map' : ['*']
}
```

> Notice how an entry like `gz` has an asterisk for one of its array values? An asterisk means the extension in question could be added on to any file. Perhaps a file like `index.html.gz`, `style.css.gz`, or `hello.txt.gz`. Could be anything really so the asterisk instructs Feri to use special logic for these kinds of files.

> Note: API users can use [functions.addDestToSourceExt](functions.md#functions.addDestToSourceExt) to modify this object safely.

> ### config.map.sourceToDestTasks

> Type: `object`

> Source extensions to build tasks map.

> Array elements for any particular file type can be a `string` or a `function`. A string signifies that an existing build function should be used. For example, `['gif']` means use [build.gif](build.md#build.gif) to optimize gif files. A function means you have constructed your own [custom build task](../custom-build-task.md).

> ```js
jsconfig.map.sourceToDestTasks = {
    'coffee': ['coffeeScript', 'js'],
    'css'   : ['css'],
    'ejs'   : ['ejs', 'html'],
    'gif'   : ['gif'],
    'html'  : ['html'],
    'jade'  : ['jade', 'html'],
    'jpg'   : ['jpg'],
    'js'    : ['js'],
    'less'  : ['less'],
    'md'    : ['markdown', 'html'],
    'png'   : ['png'],
    'sass'  : ['sass'],
    'scss'  : ['sass'],
    'styl'  : ['stylus'],
    // copy only tasks
    'ai'    : ['copy'],
    'eot'   : ['copy'],
    'gz'    : ['copy'],
    'ico'   : ['copy'],
    'iso'   : ['copy'],
    'json'  : ['copy'],
    'm4a'   : ['copy'],
    'map'   : ['copy'],
    'mp3'   : ['copy'],
    'mp4'   : ['copy'],
    'ogg'   : ['copy'],
    'otf'   : ['copy'],
    'psd'   : ['copy'],
    'svg'   : ['copy'],
    'ttf'   : ['copy'],
    'txt'   : ['copy'],
    'vtt'   : ['copy'],
    'wav'   : ['copy'],
    'weba'  : ['copy'],
    'webm'  : ['copy'],
    'woff'  : ['copy'],
    'xml'   : ['copy'],
    'zip'   : ['copy']
}

> Example

> ```js
// imaginary custom build task for html files

function elSanto(obj) {
    // El Santo can minify files using his powerful hands!
    return crushingGrip(obj)
}

config.map.sourceToDestTasks.html = [elSanto]
```

## config.option

Type: `object`

Parent container for options that can be set programmatically or via the command line.

> ### config.option.build

> Type: `boolean`

> Defaults to `true`.

> ```js
config.option.build = true
```

> ### config.option.clean

> Type: `boolean`

> Defaults to `true`.

> ```js
config.option.clean = true
```

> ### config.option.debug

> Type: `boolean`

> Display extra console log messages to command line users. Defaults to `false`.

> ```js
config.option.debug = false
```

> ### config.option.forcebuild

> Type: `boolean`

> Overwrite destination files without checking their modified times to see if they need to be built. Just build them. Defaults to `false`.

> ```js
config.option.forcebuild = false
```

> ### config.option.livereload

> Type: `boolean`

> Monitor the destination directory when watching in order to update Feri's built-in LiveReload server. Defaults to `false`.

> ```js
config.option.livereload = false
```

> ### config.option.republish

> Type: `boolean`

> Remove all destination files and then build. Defaults to `false`.

> ```js
config.option.republish = false
```

> ### config.option.stats

> Type: `boolean`

> Display statistics for command line users. Defaults to `true`.

> ```js
config.option.stats = true
```

> ### config.option.watch

> Type: `boolean`

> Watch the source directory and optionally the destination directory if `config.option.livereload` is `true`. Clean and build as needed. Defaults to `false` for command line users.

> ```js
config.option.watch = false
```

> Note: The above value is set to `true` for API users so they can call [watch.processWatch](watch.md#watch.processWatch) without having to first enable watching.

## config.path

Type: `object`

Parent container for paths that can set via the command line or programmatically.

> ### config.path.source

> Type: `string`

> The source folder that should be used to build files from.

> ```js
config.path.source = './source'
```

> ### config.path.dest

> Type: `string`

> The destination folder that receives files built from source. The folder that is also cleaned based on the existence of equivalent files in the source directory. Please be careful when choosing your destination folder.

> ```js
config.path.dest = './dest'
```

## config.sourceMaps

Type: `boolean`

Enable source maps for file types that generate CSS or JS files. Defaults to `false`.

> ```js
config.sourceMaps = false
```

## config.sourceRoot

Type: `string`

The virtual folder all source maps will show up under when using developer tools in a web browser.

Defaults to `/source-maps'.

> ```js
config.sourceRoot = '/source-maps'
```

## config.thirdParty

Type: `object`

Parent container for options used by various third party packages.

> ### config.thirdParty.chokidar

> Type: `object`

> Options for [chokidar](https://github.com/paulmillr/chokidar). Used by various [watch](watch.md) functions.

> ```js
config.thirdParty.chokidar = {
    'ignored'       : [/\/\.(?!htaccess)/, '**/untitled folder', '**/Untitled Folder', '**/New folder'], // ignore dot objects (except for .htaccess files) and newly created folders for Mac OS, Ubuntu, and Windows
    'ignoreInitial' : true,
    'followSymlinks': false
}
```

> ### config.thirdParty.cleanCss

> Type: `object`

> Options for [clean-css](https://www.npmjs.com/package/clean-css). Used by [build.css](build.md#build.css).

> ```js
config.thirdParty.cleanCss = {
    'advanced'           : false,
    'aggressiveMerging'  : false,
    'keepSpecialComments': 0,
    'mediaMerging'       : false,
    'processImport'      : false,
    'rebase'             : false,
    'roundingPrecision'  : -1,
    'shorthandCompacting': false
}
```

> ### config.thirdParty.htmlMinifier

> Type: `object`

> Options for [html-minifier](https://www.npmjs.com/package/html-minifier). Used by [build.html](build.md#build.html).

> ```js
config.thirdParty.htmlMinifier = {
    'removeComments'           : true,
    'collapseWhitespace'       : true,
    'collapseBooleanAttributes': true,
    'removeAttributeQuotes'    : true,
    'removeRedundantAttributes': true,
    'removeEmptyAttributes'    : true,
    'minifyJS': {
        'mangle': false
    },
    'minifyCSS': {
        'advanced'           : false,
        'aggressiveMerging'  : false,
        'keepSpecialComments': 0,
        'mediaMerging'       : false,
        'processImport'      : false,
        'restructuring'      : false,
        'shorthandCompacting': false
    },
    'minifyURLs': {
        'output'            : 'rootRelative',
        'removeEmptyQueries': true
    }
}
```

> ### config.thirdParty.livereload

> Type: `object`

> Options for [tiny-lr-fork](https://www.npmjs.com/package/tiny-lr-fork). Used by various [watch](watch.md) functions.

> ```js
config.thirdParty.livereload = {
    'port': 35729
}
```

> ### config.thirdParty.markdownIt

> Type: `object`

> Options for [markdown-it](https://www.npmjs.com/package/markdown-it). Used by [build.markdown](build.md#build.markdown).

> ```js
config.thirdParty.markdownIt = {
    'linkify': true
}
```

## License

MIT © [Daniel Gagan](https://forestmist.org)