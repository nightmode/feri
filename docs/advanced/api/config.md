# Feri - Config

Config holds all the variables that may be set by the command line, set by a [custom config file](../custom-config-file.md#feri---custom-config-file) for the command line, or set programatically.

The config module can be found inside the file [code/3 - config.js](../../../code/3%20-%20config.js)

## Config Object

* [case](#configcase)
  * [source](#configcasesource)
  * [dest](#configcasedest)
* [concurLimit](#configconcurlimit)
* [extension](#configextension)
  * [defaultDocument](#configextensiondefaultdocument)
  * [fileTypes](#configextensionfiletypes)
  * [port](#configextensionport)
* [fileType](#configfiletype)
  * [concat](#configfiletypeconcat)
  * [css](#configfiletypecss)
  * [js](#configfiletypejs)
* [includeFileTypes](#configincludefiletypes)
* [includePrefix](#configincludeprefix)
* [glob](#configglob)
  * [clean](#configglobclean)
  * [build](#configglobbuild)
  * [watch](#configglobwatch)
    * [source](#configglobwatchsource)
    * [dest](#configglobwatchdest)
* [language](#configlanguage)
* [map](#configmap)
  * [destToSourceExt](#configmapdesttosourceext)
  * [sourceToDestTasks](#configmapsourcetodesttasks)
* [option](#configoption)
  * [build](#configoptionbuild)
  * [clean](#configoptionclean)
  * [debug](#configoptiondebug)
  * [forcebuild](#configoptionforcebuild)
  * [init](#configoptioninit)
  * [extensions](#configoptionextensions)
  * [republish](#configoptionrepublish)
  * [stats](#configoptionstats)
  * [watch](#configoptionwatch)
* [path](#configpath)
  * [source](#configpathsource)
  * [dest](#configpathdest)
* [playSound](#configplaysound)
* [sourceMaps](#configsourcemaps)
* [sourceRoot](#configsourceroot)
* [thirdParty](#configthirdparty)
  * [chokidar](#configthirdpartychokidar)
  * [cleanCss](#configthirdpartycleancss)
  * [htmlMinifier](#configthirdpartyhtmlminifier)
  * [markdownIt](#configthirdpartymarkdownit)
  * [svgo](#configthirdpartysvgo)

## config.case

Type: `object`

Parent container for manually specifying how file name cases are handled on the source and dest volumes.

## config.case.source

Type: `string`

Defaults to an empty string.

Valid values are `case`, `nocase`, `lower`, and `upper`.

For case sensitive volumes (Linux by default), setting `case` gets you the most speed as the OS can be trusted to match file names exactly.

For case insensitive volumes (macOS and Windows by default), setting `nocase` will get you some speed since Feri will not have to write a test file to determine casing for that location.

## config.case.dest

Type : `string`

Defaults to an empty string.

Valid values are `case`, `nocase`, `lower`, and `upper`.

For case sensitive volumes (Linux by default), setting `case` gets you the most speed as the OS can be trusted to match file names exactly.

For case insensitive volumes (macOS and Windows by default), setting `nocase` will get you some speed since Feri will not have to write a test file to determine casing for that location.

## config.concurLimit

Type: `number`

Controls the number of clean or build processes that can be run simultaneously. Values 1-3 recommended since node [libuv](https://github.com/libuv/libuv) seems to have 4 slots by default. Feel free to experiment with this setting to see how fast you can get Feri to run.

Note: This setting only affects clean and build processes, not watching. Watching limits clean and build tasks to one at a time to match the order of events.

```js
config.concurLimit = 1
```

## config.extension

Type: `object`

Parent container for extension client support.

## config.extension.defaultDocument

Type: `string`

Defaults to `index.html`.

Will be passed once to each extension client upon connection.

## config.extension.fileTypes

Type: `array`

Defaults to `['css', 'html', 'js']`.

Only inform extension clients about changes to these file types. File types should be lowercase only.

## config.extension.port

Type: `number`

Defaults to `4000`.

WebSocket server port for extension clients.

## config.fileType

Type: `object`

Parent container for options specific to a single file type.

## config.fileType.concat

Type: `object`

Options used by [build.concat](build.md#buildconcat).

```js
config.fileType.concat = {
    'enabled': true,
    'sourceMaps': false
}
```

Note: Feri will only generate a source map when the file it is based on needs to be built. Running `feri --republish` or `feri --forcebuild` once after enabling sourceMaps will ensure their creation.

## config.fileType.css

Type: `object`

Options used by [build.css](build.md#buildcss).

```js
config.fileType.css = {
    'sourceMaps': false
}
```

Note: Feri will only generate a source map when the file it is based on needs to be built. Running `feri --republish` or `feri --forcebuild` once after enabling sourceMaps will ensure their creation.

## config.fileType.js

Type: `object`

Options used by [build.js](build.md#buildjs).

```js
config.fileType.js = {
    'sourceMaps': false
}
```

Note: Feri will only generate a source map when the file it is based on needs to be built. Running `feri --republish` or `feri --forcebuild` once after enabling sourceMaps will ensure their creation.

## config.includeFileTypes

Type: `array`

Used by [watch.buildOne](watch.md#buildone) to know which file types may use includes. Any array items should be a file extension string without a dot like `txt` or `js`.

```js
config.includeFileTypes = []
```

## config.includePrefix

Type: `string`

Files prefixed with this string will not be published directly to the destination directory. Prefixed files can be included inside other files that do ultimately get published.

```js
config.includePrefix = '_'
```

## config.glob

Type: `object`

Parent container for [glob](https://www.npmjs.com/package/glob) search strings.

## config.glob.clean

Type: `string`

If specified, use when running [clean.processClean](clean.md#cleanprocessclean) without the `files` parameter.

```js
config.glob.clean = '' // default
```

Example

```js
// only clean image files
config.glob.clean = '**/*.{gif,jpg,png}'
```

## config.glob.build

Type: `string`

If specified, use when running [build.processBuild](build.md#buildprocessbuild) without the `files` parameter.

```js
config.glob.build = '' // default
```

Example

```js
// only build css files
config.glob.build = '**/*.css'
```

## config.glob.watch

Type: `object`

Parent container for watch related, glob search strings.

## config.glob.watch.source

Type: `string`

If specified, use when running [watch.processWatch](watch.md#watchprocesswatch) without the `sourceFiles` parameter.

```js
config.glob.watch.source = '' // default
```

Example

```js
// watch html and css source files
config.glob.watch.source = '**/*.{html,css}'
```

## config.glob.watch.dest

Type: `string`

If specified, use when running [watch.processWatch](watch.md#watchprocesswatch) without the `destFiles` parameter.

```js
config.glob.watch.dest = '' // default
```

Example

```js
// watch css destination files
config.glob.watch.dest = '**/*.css'
```

## config.language

Type: `string`

Specify which language to use. The language should map to a json file like [language/en-us.json](../../../language/en-us.json) in the language directory.

```js
config.language = 'en-us'
```

Note: API users should use [functions.setLanguage](functions.md#functionssetlanguage) to change both this variable and [share.language.loaded](shared.md#sharedlanguageloaded) at the same time. Command line users only need to set `config.langauge` in a [custom config file](../custom-config-file.md#feri---custom-config-file).

## config.map

Type: `object`

Parent container for the all important mapping objects. These are the objects that tell Feri how to clean and build various file types.

## config.map.destToSourceExt

Type: `object`

Destination extensions to source extensions map.

In the object below, a HTML file could be generated by a MD file. This is incredibly valuable information that Feri uses to clean and build.

```js
config.map.destToSourceExt = {
    'br'  : ['*'],
    'gz'  : ['*'],
    'html': ['md'],
    'map' : ['*']
}
```

Notice how an entry like `gz` has an asterisk for one of its array values? An asterisk means the extension in question could be added on to any file. Resulting in a file like `index.html.gz`, `style.css.gz`, or `hello.txt.gz`. Could be anything really so the asterisk instructs Feri to use special logic for these file extensions.

Protip: Use [functions.addDestToSourceExt](functions.md#functionsadddesttosourceext) to modify this object safely.

## config.map.sourceToDestTasks

Type: `object`

Source extensions to build tasks map.

Array elements for any particular file type can be a `string` or a `function`. A string signifies that an existing build task should be used. For example, `['gif']` means use [build.gif](build.md#buildgif) to optimize gif files. A function means you have constructed your own [custom build task](../custom-build-task.md#feri---custom-build-task).

```js
config.map.sourceToDestTasks = {
    'concat': ['concat'],
    'css'   : ['css'],
    'gif'   : ['gif'],
    'htm'   : ['html'],
    'html'  : ['html'],
    'jpg'   : ['jpg'],
    'jpeg'  : ['jpg'],
    'js'    : ['js'],
    'md'    : ['markdown', 'html'],
    'png'   : ['png'],
    'svg'   : ['svg'],
    // copy only tasks
    '7z'    : ['copy'],
    'ai'    : ['copy'],
    'asp'   : ['copy'],
    'aspx'  : ['copy'],
    'br'    : ['copy'],
    'c'     : ['copy'],
    'cfm'   : ['copy'],
    'cfc'   : ['copy'],
    'csv'   : ['copy'],
    'doc'   : ['copy'],
    'docx'  : ['copy'],
    'eot'   : ['copy'],
    'eps'   : ['copy'],
    'exe'   : ['copy'],
    'flv'   : ['copy'],
    'gz'    : ['copy'],
    'h'     : ['copy'],
    'ico'   : ['copy'],
    'ini'   : ['copy'],
    'iso'   : ['copy'],
    'json'  : ['copy'],
    'm3u8'  : ['copy'],
    'm4a'   : ['copy'],
    'map'   : ['copy'],
    'mid'   : ['copy'],
    'midi'  : ['copy'],
    'mov'   : ['copy'],
    'mp3'   : ['copy'],
    'mp4'   : ['copy'],
    'mpd'   : ['copy'],
    'ogg'   : ['copy'],
    'otf'   : ['copy'],
    'pdf'   : ['copy'],
    'php'   : ['copy'],
    'pl'    : ['copy'],
    'ppt'   : ['copy'],
    'pptx'  : ['copy'],
    'psd'   : ['copy'],
    'py'    : ['copy'],
    'rb'    : ['copy'],
    'rss'   : ['copy'],
    'swf'   : ['copy'],
    'tar'   : ['copy'],
    'ttf'   : ['copy'],
    'txt'   : ['copy'],
    'vtt'   : ['copy'],
    'wav'   : ['copy'],
    'weba'  : ['copy'],
    'webm'  : ['copy'],
    'woff'  : ['copy'],
    'woff2' : ['copy'],
    'xls'   : ['copy'],
    'xlsx'  : ['copy'],
    'xml'   : ['copy'],
    'zip'   : ['copy']
}
```

Example

```js
// imaginary custom build task for html files

function elSanto(obj) {
    // El Santo can minify files using his powerful hands!
    return crushingGrip(obj)
}

config.map.sourceToDestTasks.html = [elSanto]
```

## config.option

Type: `object`

Parent container for options that can be set via the command line or programmatically.

## config.option.build

Type: `boolean`

Defaults to `true`.

```js
config.option.build = true
```

## config.option.clean

Type: `boolean`

Defaults to `true`.

```js
config.option.clean = true
```

## config.option.debug

Type: `boolean`

Defaults to `false`.

Display extra console log messages to command line users.

```js
config.option.debug = false
```

## config.option.forcebuild

Type: `boolean`

Defaults to `false`.

Overwrite destination files without checking their modified times to see if they need to be built. Just build them.

```js
config.option.forcebuild = false
```

## config.option.init

Type: `boolean`

Defaults to `false`.

Create a `./source` and `./dest` folder. Also create a [custom config file](../custom-config-file.md#feri---custom-config-file) if it does not exist yet.

## config.option.extensions

Type: `boolean`

Defaults to `false`.

Run a WebSocket server for extension clients.

## config.option.republish

Type: `boolean`

Defaults to `false`.

Remove all destination files and then build.

```js
config.option.republish = false
```

## config.option.stats

Type: `boolean`

Defaults to `true`.

Display statistics for command line users.

```js
config.option.stats = true
```

## config.option.watch

Type: `boolean`

Watch the source directory and optionally the destination directory if `config.option.extensions` is `true`. Clean and build as needed. Defaults to `false` for command line users.

```js
config.option.watch = false
```

Note: The above value is set to `true` for API users so they can call [watch.processWatch](watch.md#watchprocesswatch) without having to first enable watching.

## config.path

Type: `object`

Parent container for paths that can be set via the command line or programmatically.

## config.path.source

Type: `string`

The source folder that should be used to build files from.

```js
config.path.source = 'source'
```

## config.path.dest

Type: `string`

The destination folder that receives files built from source. The destination folder that is also cleaned based on the existence of equivalent files in the source directory. Please be very careful when choosing your destination folder as a wrong folder could easily be cleaned of valuable files if those files do not have source folder equivalents.

```js
config.path.dest = 'dest'
```

## config.playSound

Type: `boolean`

Defaults to `true`.

Allow [functions.playSound](functions.md#functionsplaysound) to play sound.

## config.sourceMaps

Type: `boolean`

Defaults to `false`.

Enable source maps for file types that generate CSS or JS files.

```js
config.sourceMaps = false
```

Note: Feri will only generate a source map when the file it is based on needs to be built. Running `feri --republish` or `feri --forcebuild` once after enabling sourceMaps will ensure their creation.

## config.sourceRoot

Type: `string`

The virtual folder all source maps will show up under when using developer tools in a web browser.

Defaults to `/source-maps'.

```js
config.sourceRoot = '/source-maps'
```

## config.thirdParty

Type: `object`

Parent container for options used by various third party packages.

## config.thirdParty.chokidar

Type: `object`

Options for [chokidar](https://github.com/paulmillr/chokidar). Used by various [watch](watch.md#feri---watch) functions.

```js
config.thirdParty.chokidar = {
    'ignored'       : [/\/\.(?!htaccess)/, '**/untitled folder', '**/Untitled Folder', '**/New folder'], // ignore dot objects (except for .htaccess files) and newly created folders for Mac OS, Ubuntu, and Windows
    'ignoreInitial' : true,
    'followSymlinks': false
}
```

## config.thirdParty.cleanCss

Type: `object`

Options for [clean-css](https://www.npmjs.com/package/clean-css). Used by [build.css](build.md#buildcss).

```js
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

## config.thirdParty.htmlMinifier

Type: `object`

Options for [html-minifier](https://www.npmjs.com/package/html-minifier). Used by [build.html](build.md#buildhtml).

```js
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

## config.thirdParty.markdownIt

Type: `object`

Options for [markdown-it](https://www.npmjs.com/package/markdown-it). Used by [build.markdown](build.md#buildmarkdown).

```js
config.thirdParty.markdownIt = {
    'breaks': false,
    'highlight': null,
    'html': false,
    'langPrefix': 'language-',
    'linkify': true,
    'maxNesting': 100,
    'quotes': '“”‘’',
    'typographer': false,
    'xhtmlOut': false
}
```

#config.thirdParty.svgo

Type: `object`

Options for [svgo](https://www.npmjs.com/package/svgo). Used by [build.svg](build.md#buildsvg).

```js
'full': true, // true means use the defined plugins only
'js2svg': {
    pretty: false,
    indent: '    '
},
'multipass': true,
'plugins': [
    // the array order is important so do not alpha sort
    // disable a plugin by passing false as the only value
    // enable a plugin by passing true as the only value
    // enable a plugin by passing an object to the plugin -> { removeDesc: { removeAny: true } }
    { 'removeDoctype': true },
    { 'removeXMLProcInst': true },
    { 'removeComments': true },
    { 'removeMetadata': true },
    { 'removeXMLNS': false },
    { 'removeEditorsNSData': true },
    { 'cleanupAttrs': true },
    { 'inlineStyles': true },
    { 'minifyStyles': true },
    { 'convertStyleToAttrs': true },
    { 'cleanupIDs': true },
    { 'prefixIds': false },
    { 'removeRasterImages': false },
    { 'removeUselessDefs': true },
    { 'cleanupNumericValues': true },
    { 'cleanupListOfValues': false },
    { 'convertColors': true },
    { 'removeUnknownsAndDefaults': true },
    { 'removeNonInheritableGroupAttrs': true },
    { 'removeUselessStrokeAndFill': true },
    { 'removeViewBox': true },
    { 'cleanupEnableBackground': true },
    { 'removeHiddenElems': true },
    { 'removeEmptyText': true },
    { 'convertShapeToPath': true },
    { 'convertEllipseToCircle': true },
    { 'moveElemsAttrsToGroup': true },
    { 'moveGroupAttrsToElems': true },
    { 'collapseGroups': true },
    { 'convertPathData': true },
    { 'convertTransform': true },
    { 'removeEmptyAttrs': true },
    { 'removeEmptyContainers': true },
    { 'mergePaths': true },
    { 'removeUnusedNS': true },
    { 'sortAttrs': false },
    { 'sortDefsChildren': true },
    { 'removeTitle': true },
    { 'removeDesc': true },
    { 'removeDimensions': false },
    { 'removeAttrs': false },
    { 'removeAttributesBySelector': false },
    { 'removeElementsByAttr': false },
    { 'removeStyleElement': false },
    { 'removeScriptElement': false },
    { 'removeOffCanvasPaths': false }
    /*
    The following plugins do not support passing false and must be passed options they like in order to use them.
    { 'addAttributesToSVGElement': ... }
    { 'addClassesToSVGElement': ... }
    { 'reusePaths': ... }
    */
```

## License

MIT © [Kai Nightmode](https://twitter.com/kai_nightmode)