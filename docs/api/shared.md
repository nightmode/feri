# Feri - Shared

Shared is all the neat things we may want to share across modules. Things that don't really belong in the [config](config.md) module like caches, non-user configurable variables, computed values, and more.

The shared module lives in the file [code/2 - shared.js](../../code/2 - shared.js)

## Shared Object

* [cache](#shared.cache)
  * [errorsSeen](#shared.cache.errorsSeen)
  * [includesFilesSeen](#shared.cache.includesFilesSeen)
  * [includesNewer](#shared.cache.includesNewer)
  * [missingMapBuild](#shared.cache.missingMapBuild)
* [cli](#shared.cli)
* [help](#shared.help)
* [language](#shared.language)
  * [base](#shared.language.base)
  * [display](#shared.language.display)
  * [loaded](#shared.language.loaded)
* [livereload](#shared.livereload)
  * [calmTimer](#shared.livereload.calmTimer)
  * [changedFiles](#shared.livereload.changedFiles)
* [log](#shared.log)
* [platform](#shared.platform)
* [path](#shared.path)
  * [pwd](#shared.path.pwd)
  * [self](#shared.path.self)
* [slash](#shared.slash)
* [stats](#shared.stats)
  * [timeTo](#shared.timeTo)
    * [load](#shared.timeTo.load)
    * [clean](#shared.timeTo.clean)
    * [build](#shared.timeTo.build)
    * [watch](#shared.timeTo.watch)
* [uniqueNumber](#shared.uniqueNumber)

## shared.cache

Type: `object`

Parent for various `array` and `object` properties that keep track of temporary information used during cleaning and building. Can be reset by [functions.cacheReset](#functions.md#functions.cacheReset).

> ## shared.cache.errorsSeen

> Type: `array`

> Keep track of which error messages have been displayed to a command line user. Used by [functions.logError](functions.md#functions.logError) to show individual errors only once.

> ## shared.cache.includeFilesSeen

> Type: `object`

> Keep track of which include files have been seen.

> Child properties are of the type `array`.

> ## shared.cache.includesNewer

> Type: `object`

> Keep track of include files and their modified times.

> Child properties are of the type `object`.

> ## shared.cache.missingMapBuild

> Type: `array`

> Keep track of any file types that are missing a [config.map.sourceToDestTasks](config.md#config.map.sourceToDestTasks) entry during a build pass.

## shared.cli

Type: `boolean`

Running as a command line tool if `true`.

Called as a require if `false`.

## shared.help

Type: `boolean`

Displaying help text on the command line if `true`.

## shared.language

Type: `object`

Parent container for language related items.

> ## shared.language.base

> Type: `object`

> The default language object that is a fallback in case a value in shared.language.loaded is not available.

> ## shared.language.display

> Type: `function`

> Return a string from `shared.language.loaded` if available otherwise return the same string from `shared.language.base`.

> ```js
@param   {String}  keys  String like 'error.missingSource'
@return  {String}        String like 'Missing source file.'
```

> Example

> ```js
var message = shared.language.display('error.missingSource')
// message is 'Missing source file.'
```

> ## shared.language.loaded

> Type: `object`

> The active language translation. Defaults to english but can be replaced by [functions.setLanguage](functions.md#functions.setLanguage).

## shared.livereload

Type: `object`

Parent container for LiveReload related items.

> ## shared.livereload.calmTimer

> Type: `null` or `object`

> Variable used by [watch.updateLiveReloadServer](watch.md#watch.updateLiveReloadServer) to update the LiveReload server 300 ms after the last destination file change.

> ## shared.livereload.changedFiles

> Type: `array`

> Keeps track of which destination files were changed in order to relay those to the LiveReload server.

## shared.log

Type: `boolean`

Allow console logging if set to `true` for command line use. Defaults to `false` for API and testing.

## shared.platform

Type: `string`

Result of `os.platform()`. Can be values like `darwin`, `win32`, `win64` and such.

## shared.path

Type: `object`

Parent container for path related items.

> ## shared.path.pwd

> Type: `string`

> Present working directory.

> ## shared.path.self

> Type: `string`

> Full path to ourself like `/Users/daniel/project/node_modules/feri`.

## shared.slash

Type: `string`

Directory separator that is `/` by default. Will be set to `\` for Windows.

## shared.stats

Type: `object`

Parent container for statistic related items.

> ## shared.stats.timeTo

> Type: `object`

> Parent container for time to related items.

> > ## shared.stats.timeTo.load

> >  Type: `number`

> > Seconds it took to require files.

> > ## shared.stats.timeTo.clean

> > Type: `number`

> > Seconds it took to clean.

> > ## shared.stats.timeTo.build

> > Type: `number`

> > Seconds it took to build.

> > ## shared.stats.timeTo.watch

> > Type: `number`

> > Seconds it took to enable watch mode.

## shared.uniqueNumber

Type: `object`

An instance of [unique-number](https://www.npmjs.com/package/unique-number) that is used to ensure unique property names in functions like [functions.includePathsEjs](functions.md#functions.includePathsEjs).

## License

MIT © [Daniel Gagan](https://forestmist.org)