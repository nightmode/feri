# Feri - Shared

Shared is all the neat things we may want to share across modules. Things that don't really belong in the [config](config.md#feri---config) module like caches, non-user configurable variables, computed values, and more.

The shared module can be found inside the file [code/2 - shared.js](../../../code/2%20-%20shared.js)

## Shared Object

* [cache](#sharedcache)
  * [errorsSeen](#sharedcacheerrorsseen)
  * [includesFilesSeen](#sharedcacheincludefilesseen)
  * [includesNewer](#sharedcacheincludesnewer)
  * [missingMapBuild](#sharedcachemissingmapbuild)
* [cli](#sharedcli)
* [extension](#sharedextension)
  * [calmTimer](#sharedextensioncalmtimer)
  * [changedFiles](#sharedextensionchangedfiles)
* [folder](#sharedfolder)
  * [dest](#sharedfolderdest)
    * [case](#sharedfolderdestcase)
    * [lastPath](#sharedfolderdestlastpath)
  * [source](#sharedfoldersource)
    * [case](#sharedfoldersourcecase)
    * [lastPath](#sharedfoldersourcelastpath)
* [global](#sharedglobal)
* [help](#sharedhelp)
* [indent](#sharedindent)
* [language](#sharedlanguage)
  * [base](#sharedlanguagebase)
  * [display](#sharedlanguagedisplay)
  * [loaded](#sharedlanguageloaded)
* [log](#sharedlog)
* [platform](#sharedplatform)
* [path](#sharedpath)
  * [pwd](#sharedpathpwd)
  * [self](#sharedpathself)
* [slash](#sharedslash)
* [stats](#sharedstats)
  * [timeTo](#sharedstatstimeto)
    * [load](#sharedstatstimetoload)
    * [clean](#sharedstatstimetoclean)
    * [build](#sharedstatstimetobuild)
    * [watch](#sharedstatstimetowatch)
* [suppressWatchEvents](#sharedsuppresswatchevents)
* [uniqueNumber](#shareduniquenumber)
* [watch](#sharedwatch)
  * [working](#sharedwatchworking)
  * [workQueue](#sharedwatchworkqueue)

## shared.cache

Type: `object`

Parent for various `array` and `object` properties that keep track of temporary information used during cleaning and building. Can be reset by [functions.cacheReset](functions.md#functionscachereset).

## shared.cache.errorsSeen

Type: `array`

Keep track of which error messages have been displayed to a command line user. Used by [functions.logError](functions.md#functionslogerror) to show individual errors only once.

## shared.cache.includeFilesSeen

Type: `object`

Keep track of which include files have been seen.

Child properties are of the type `array`.

## shared.cache.includesNewer

Type: `object`

Keep track of include files and their modified times.

Child properties are of the type `object`.

## shared.cache.missingMapBuild

Type: `array`

Keep track of any file types that are missing a [config.map.sourceToDestTasks](config.md#configmapsourcetodesttasks) entry during a build pass.

## shared.cli

Type: `boolean`

Feri is running on the command line if true. As a require if false.

## shared.extension

Type: `object`

Parent container for extension server related items.

## shared.extension.calmTimer

Type: `null` or `object`

Variable used by [watch.updateExtensionServer](watch.md#watchupdateextensionserver) to update 300 ms after the last destination file change.

## shared.extension.changedFiles

Type: `array`

Keeps track of which destination files were changed in order to relay those to the extension server.

## shared.folder

Type: `object`

Parent container for source and destination folder related items.

## shared.folder.dest

Type: `object`

Parent container for destination folder related items.

## shared.folder.dest.case

Type: `string`

The mode or style of file naming such as `lower`, `upper`, `nocase`, or `case`. Set by [functions.detectCaseDest](functions.md#functionsdetectcasedest).

## shared.folder.dest.lastPath

Type: `string`

The last seen destination folder like `/project/dest`. Set by [functions.detectCaseDest](functions.md#functionsdetectcasedest).

## shared.folder.source

Type: `object`

Parent container for source folder related items.

## shared.folder.source.case

Type: `string`

The mode or style of file naming such as `lower`, `upper`, `nocase`, or `case`. Set by [functions.detectCaseSource](functions.md#functionsdetectcasesource).

## shared.folder.source.lastPath

Type: `string`

The last seen source folder like `/project/source`. Set by [functions.detectCaseSource](functions.md#functionsdetectcasesource).

## shared.global

Type: `boolean`

Feri is installed globally if true. Locally if false.

## shared.help

Type: `boolean`

Displaying help text on the command line if true.

## shared.indent

Type: `string`

Defaults to four spaces.

Used to indent console messages.

## shared.language

Type: `object`

Parent container for language related items.

## shared.language.base

Type: `object`

The default language fallback object in case a value in shared.language.loaded is not available.

## shared.language.display

Type: `function`

Return a string from `shared.language.loaded` if available otherwise return the same string from `shared.language.base`.

```js
@param   {String}  keys  String like 'error.missingSource'
@return  {String}        String like 'Missing source file.'
```

For example.

```js
let message = shared.language.display('error.missingSource')
// message is 'Missing source file.'
```

## shared.language.loaded

Type: `object`

The active language translation. Defaults to english but can be replaced by [functions.setLanguage](functions.md#functionssetlanguage).

## shared.log

Type: `boolean`

Allow console logging if set to true for command line use. Defaults to false for API and testing use.

## shared.platform

Type: `string`

Result of `os.platform()`. Can be values like `darwin`, `win32`, `win64`, and so on.

## shared.path

Type: `object`

Parent container for path related items.

## shared.path.pwd

Type: `string`

Present working directory.

## shared.path.self

Type: `string`

Full path to ourself like `/Users/nightmode/project/node_modules/feri`.

## shared.slash

Type: `string`

Directory separator that is `/` by default. Will be set to `\` for Windows.

## shared.stats

Type: `object`

Parent container for statistic related items.

## shared.stats.timeTo

Type: `object`

Parent container for time to related items.

## shared.stats.timeTo.load

Type: `number`

Seconds it took to require files.

## shared.stats.timeTo.clean

Type: `number`

Seconds it took to clean.

## shared.stats.timeTo.build

Type: `number`

Seconds it took to build.

## shared.stats.timeTo.watch

Type: `number`

Seconds it took to enable watch mode.

## shared.suppressWatchEvents

Type: `boolean`

Used to temporarily suppress watch events for command line users until the title "Watching" is displayed. Can also be used to temporarily suppress watch events without having to stop the watch process.

```js
shared.suppressWatchEvents = false // default
```

## shared.uniqueNumber

Type: `number`

Iterate with `(++shared.uniqueNumber)` or reset back to 0.

## shared.watch

Type: `object`

Parent container for watch related items.

## shared.watch.working

Type: `boolean`

Defaults to `false`.

Will be set to `true` by [watch.workQueueProcess](watch.md#watchworkqueueprocess) so multiple calls to `watch.workQueueProcess` return early if one instance of that function is already working on the `shared.watch.workQueue` array.

## shared.watch.workQueue

Type: `array`

Defaults to an empty array.

Array of objects that will be managed by [watch.workQueueAdd](watch.md#watchworkqueueadd) and [watch.workQueueProcess](watch.md#watchworkqueueprocess).

```js
// example array with two objects
shared.watch.workQueue = [
    {
        location: 'source',
        task: 'add',
        path: '/source/file.txt'
    },
    {
        location: 'source',
        task: 'change',
        path:'/source/file.txt'
    }
]
```

## License

MIT © [Kai Nightmode](https://twitter.com/kai_nightmode)