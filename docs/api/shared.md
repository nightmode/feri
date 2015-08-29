# Feri - Shared

Shared is all the neat things we may want to share across modules. Things that don't really belong in the [config](config.md) module like caches, non-user configurable variables, computed values, and more.

The shared module lives in the file [code/2 - shared.js](../../code/2 - shared.js)

## Shared Object

* [cache](#sharedcache)
  * [errorsSeen](#sharedcacheerrorsseen)
  * [includesFilesSeen](#sharedcacheincludesfilesseen)
  * [includesNewer](#sharedcacheincludesnewer)
  * [missingMapBuild](#sharedcachemissingmapbuild)
* [cli](#sharedcli)
* [help](#sharedhelp)
* [language](#sharedlanguage)
  * [base](#sharedlanguagebase)
  * [display](#sharedlanguagedisplay)
  * [loaded](#sharedlanguageloaded)
* [livereload](#sharedlivereload)
  * [calmTimer](#sharedlivereloadcalmtimer)
  * [changedFiles](#sharedlivereloadchangedfiles)
* [log](#sharedlog)
* [platform](#sharedplatform)
* [path](#sharedpath)
  * [pwd](#sharedpathpwd)
  * [self](#sharedpathself)
* [slash](#sharedslash)
* [stats](#sharedstats)
  * [timeTo](#sharedtimeto)
    * [load](#sharedtimetoload)
    * [clean](#sharedtimetoclean)
    * [build](#sharedtimetobuild)
    * [watch](#sharedtimetowatch)
* [uniqueNumber](#shareduniquenumber)

## shared.cache

Type: `object`

Parent for various `array` and `object` properties that keep track of temporary information used during cleaning and building. Can be reset by [functions.cacheReset](#functions.md#functionscachereset).

> ## shared.cache.errorsSeen

> Type: `array`

> Keep track of which error messages have been displayed to a command line user. Used by [functions.logError](functions.md#functionslogerror) to show individual errors only once.

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

> Keep track of any file types that are missing a [config.map.sourceToDestTasks](config.md#configmapsourcetodesttasks) entry during a build pass.

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

> The active language translation. Defaults to english but can be replaced by [functions.setLanguage](functions.md#functionssetlanguage).

## shared.livereload

Type: `object`

Parent container for LiveReload related items.

> ## shared.livereload.calmTimer

> Type: `null` or `object`

> Variable used by [watch.updateLiveReloadServer](watch.md#watchupdatelivereloadserver) to update the LiveReload server 300 ms after the last destination file change.

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

An instance of [unique-number](https://www.npmjs.com/package/unique-number) that is used to ensure unique property names in functions like [functions.includePathsEjs](functions.md#functionsincludepathsejs).

## License

MIT © [Daniel Gagan](https://forestmist.org)