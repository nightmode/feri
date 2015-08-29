# Feri - Functions

Functions is the module that many other modules depend on. A treasure trove of helpers.

The functions module lives in the file [code/4 - functions.js](../../code/4 - functions.js)

## Functions Object

The functions object is grouped into three categories.

### Functions

* [addDestToSourceExt](#functionsadddesttosourceext)
* [cacheReset](#functionscachereset)
* [changeExt](#functionschangeext)
* [cleanArray](#functionscleanarray)
* [cloneObj](#functionscloneobj)
* [configPathsAreGood](#functionsconfigpathsaregood)
* [destToSource](#functionsdesttosource)
* [fileExists](#functionsfileexists)
* [filesExist](#functionsfilesexist)
* [fileExistsAndTime](#functionsfileexistsandtime)
* [filesExistAndTime](#functionsfilesexistandtime)
* [fileExtension](#functionsfileextension)
* [fileSize](#functionsfilesize)
* [findFiles](#functionsfindfiles)
* [globOptions](#functionsgloboptions)
* [inSource](#functionsinsource)
* [log](#functionslog)
* [logError](#functionslogerror)
* [logOutput](#functionslogoutput)
* [logWorker](#functionslogworker)
* [makeDirPath](#functionsmakedirpath)
* [mathRoundPlaces](#functionsmathroundplaces)
* [occurrences](#functionsoccurrences)
* [readFile](#functionsreadfile)
* [readFiles](#functionsreadfiles)
* [removeDest](#functionsremovedest)
* [removeExt](#functionsremoveext)
* [removeFile](#functionsremovefile)
* [removeFiles](#functionsremovefiles)
* [restoreObj](#functionsrestoreobj)
* [sharedStatsTimeTo](#functionssharedstatstimeto)
* [setLanguage](#functionssetlanguage)
* [sourceToDest](#functionssourcetodest)
* [stats](#functionsstats)
* [trimSource](#functionstrimsource)
* [trimDest](#functionstrimdest)
* [uniqueArray](#functionsuniquearray)
* [writeFile](#functionswritefile)

### Functions: Includes

* [includesNewer](#functionsincludesnewer)
* [includePathsEjs](#functionsincludepathsejs)
* [includePathsJade](#functionsincludepathsjade)
* [includePathsLess](#functionsincludepathsless)
* [includePathsSass](#functionsincludepathssass)
* [includePathsStylus](#functionsincludepathsstylus)

### Functions: Reusable Object Building

* [objBuildWithIncludes](#functionsobjbuildwithincludes)
* [objBuildInMemory](#functionsobjbuildinmemory)
* [objBuildOnDisk](#functionsobjbuildondisk)

## Functions

### functions.addDestToSourceExt

Type: `function`

Add or append a mapping to config.map.destToSourceExt without harming existing entries.

```
@param  {String}         ext       Extension like 'html'
@param  {String,Object}  mappings  String like 'ejs' or array of strings like ['ejs', 'jade', 'md']
```

### functions.cacheReset

Type: `function`

Reset [shared.cache](shared.md#sharedcache) for a new pass through a set of files.

### functions.changeExt

Type: `function`

Change one extension to another.

```
@param   {String}  filePath      File path like '/files/index.jade'
@param   {String}  newExtension  Extension like 'html'
@return  {String}                File path like '/files/index.html'
```

### functions.cleanArray

Type: `function`

Remove empty items from an array.

```
@param   {Object}  array  Array like [1,,3]
@return  {Object}         Cleaned array like [1,3]
```

### functions.cloneObj

Type: `function`

Clone an object recursively so the return is not a reference to the original object.

```
@param  {Object}  obj  Object like { number: 1, bool: true, array: [], subObject: {} }
@return {Object}
```

### functions.configPathsAreGood

Type: `function`

Ensure source and destination are not the same and not in each others path.

```
@return  {Boolean}  True if both paths are good.
```

### functions.destToSource

Type: `function`

Convert destination path to its source equivalent.

```
@param   {String}  dest  File path like '/dest/index.html'
@return  {String}        File path like '/source/index.html'
```

### functions.fileExists

Type: `function`

Find out if a file or folder exists.

```
@param   {String}   filePath  Path to a file or folder.
@return  {Promise}            Promise that returns a boolean. True if yes.
```

### functions.filesExist

Type: `function`

Find out if one or more files or folders exist.

```
@param   {Object}   filePaths  Array of file paths like ['/source/index.html', '/source/about.html']
@return  {Promise}             Promise that returns an array of booleans. True if a particular file exists.
```

### functions.fileExistsAndTime

Type: `function`

Find out if a file exists along with its modified time.

```
@param   {String}   filePath  Path to a file or folder.
@return  {Promise}            Promise that returns an object like { exists: true, mtime: 123456789 }
```

### functions.filesExistAndTime

Type: `function`

Find out if one or both files exist along with their modified time.

```
@param   {String}  source  Source file path like '/source/favicon.ico'
@param   {String}  dest    Destination file path like '/dest/favicon.ico'
@return  {Promise}         Promise that returns an object like { source: { exists: true, mtime: 123456789 }, dest: { exists: false, mtime: 0 } }
```

### functions.fileExtension

Type: `function`

Return file extension in string.

```
@param   {String}  filePath  File path like '/conan/riddle-of-steel.txt'
@return  {String}            String like 'txt'
```

### functions.fileSize

Type: `function`

Find out the size of a file or folder.

```
@param  {String}   filePath  Path to a file or folder.
@return {Promise}            Promise that will return a boolean. True if yes.
```

### functions.findFiles

Type: `function`

Find the files using [glob](https://www.npmjs.com/package/glob).

```
@param   {String}  match      String like '*.jpg'
@param   {Object}  [options]  Optional. Options for glob.
@return  {Promise}            Promise that returns an array of files or empty array if successful. Error if not.
```

### functions.globOptions

Type: `function`

Return glob options updated to ignore include prefixed files.

```
@return  {Object}
```

### functions.inSource

Type: `function`

Find out if a path is in the source directory.

```
@param   {String}   filePath  Full file path like '/var/projects/a/source/index.ejs'
@return  {Boolean}            True if the file path is in the source directory.
```

### functions.log

Type: `function`

Display a console message if logging is enabled.

```
@param  {String}   message   String to display.
@param  {Boolean}  [indent]  Optional and defaults to true. If true, the string will be indented four spaces.
```

### functions.logError

Type: `function`

Log a stack trace or simple text string depending on the type of object passed in.

```
@param  {Object,String}  err  Error object or simple string describing the error.
```

### functions.logOutput

Type: `function`

Log a pretty output message with a relative looking path.

```
@param  {String}  destFilePath  Full path to a destination file.
@param  {String}  [message]     Optional and defaults to 'output'.
```

### functions.logWorker

Type: `function`

Overly chatty logging utility used by build functions.

```
@param  {String}  workerName  Name of worker.
@param  {Object}  obj         Reusable object originally created by build.processOneBuild
```

### functions.makeDirPath

Type: `function`

Create an entire directory structure leading up to a file, if needed.

```
@param   {String}  filePath  Path like '/dest/images/koi/magikarp.png'
@return  {Promise}           Promise that returns true if successful. Error object if not.
```

### functions.mathRoundPlaces

Type: `function`

Round a number to a certain amount of decimal places.

```
@param   {Number}  number    Number to round.
@param   {Number}  decimals  Number of decimal places.
@return  {Number}            Returns 0.04 if mathRoundPlaces(0.037, 2) was called.
```

### functions.occurrences

Type: `function`

Find out how many characters or strings are in a string.

```
@param   {String}   string              String to search.
@param   {String}   subString           Character or string to search for.
@param   {Boolean}  [allowOverlapping]  Optional and defaults to false.
@return  {Number}                       Number of occurrences of 'subString' in 'string'.
```

### functions.readFile

Type: `function`

Promise version of fs.readFile.

```
@param   {String}  filePath    File path like '/dest/index.html'
@param   {String}  [encoding]  Optional and defaults to 'utf8'
@return  {String}              Data from file.
```

### functions.readFiles

Type: `function`

Sequentially read in multiple files and return an array of their contents.

```
@param   {Object}   filePaths   Array of file paths like ['/source/file1.txt', '/source/file2.txt']
@param   {String}   [encoding]  Optional and defaults to 'utf8'
@return  {Promise}              Promise that returns an array of data like ['data from file1', 'data from file2']
```

### functions.removeDest

Type: `function`

Remove file or folder if unrelated to the source directory.

```
@param   {String}   filePath  Path to a file or folder.
@param   {Boolean}  log       Set to false to disable console log removal messages.
@return  {Promise}            Promise that returns true if the file or folder was removed successfully otherwise an error if not.
```

### functions.removeExt

Type: `function`

Remove one extension from a file path.

```
@param   {String}  filePath  File path like '/files/index.html.gz'
@return  {String}            File path like '/files/index.html'
```

### functions.removeFile

Type: `function`

Remove a file or folder.

```
@param   {String}   files  String like '/dest/index.html'
@return  {Promise}         Promise that returns true if the file or folder was removed or if there was nothing to do. An error otherwise.
```

### functions.removeFiles

Type: `function`

Remove files and folders.

```
@param   {String,Object}  files  String like '/dest/index.html' or Object like ['/dest/index.html', '/dest/css']
@return  {Promise}               Promise that returns true if the files and folders were removed or if there was nothing to do. An error otherwise.
```

### functions.restoreObj

Type: `function`

Restore an object without affecting any references to said object.

```
@return {Object}    obj     Object to be restored.
@param  {Object}    fromObj Object to restore from.
@return {Object}            Object that is a restore of the original. Not a reference.
```

### functions.sharedStatsTimeTo

Type: `function`

Get the current time or return the time elapsed in seconds from a previous time.

```
@param   {Number}  [time]  Optional and defaults to 0. Commonly a number produced by a previous call to this function.
@return  {Number}
```

### functions.setLanguage

Type: `function`

Replace the shared.language.loaded object with the contents of a JSON language file.

```
@param   {String}   [lang]  Optional. Defaults to using the value specified by config.language
@return  {Promise}          Promise that returns true if everything is ok otherwise an error.
```

### functions.sourceToDest

Type: `function`

Convert source path to its destination equivalent.

```
@param   {String}  source  File path like '/source/index.html'
@return  {String}          File path like '/dest/index.html'
```

### functions.stats

Type: `function`

Returns a copy of the shared.stats object for programatic consumers.

```
@return  {Object}
```

### functions.trimSource

Type: `function`

Trim most of the source path off a string.

```
@param   {String}  filePath  File path like '/web/projects/source/index.html'
@return  {String}            String like '/source/index.html'
```

### functions.trimDest

Type: `function`

Trim most of the dest path off a string.

```
@param   {String}  filePath  File path like '/web/projects/dest/index.html'
@return  {String}            String like '/dest/index.html'
```

### functions.uniqueArray

Type: `function`

Keep only unique values in an array.

```
@param   {Object}  array  Array like [0,0,7]
@return  {Object}         Array like [0,7]
```

### functions.writeFile

Type: `function`

Promise version of fs.writeFile.

```
@param   {String}   filePath    File path like '/web/dest/index.html'
@param   {String}   data        Data to be written.
@param   {String}   [encoding]  Optional and defaults to 'utf8'
@return  {Promise}              Promise that returns true if the file was written otherwise an error.
```

## Functions: Includes

### functions.includesNewer

Type: `function`

Figure out if any include files are newer than the modified time of the destination file.

```
@param   {Object}   includePaths  Array of file paths like ['/source/_header.ejs', '/source/_footer.ejs']
@param   {String}   fileType      File type like 'ejs', 'sass', 'stylus', etc...
@param   {Number}   destTime      Modified time of the destination file.
@return  {Promise}                Promise that returns true if any includes files are newer.
```

### functions.includePathsEjs

Type: `function`

Find EJS includes and return an array of matches.

```
@param   {String}   data                     String to search for include paths.
@param   {String}   filePath                 Source file where data came from.
@param   {String}   [includePathsCacheName]  Optional. Unique property name used with shared.cache.includeFilesSeen to keep track of which include files have been found when recursing.
@return  {Promise}                           Promise that returns an array of includes like ['/partials/_footer.ejs'] if successful. An error object if not.
```

### functions.includePathsJade

Type: `function`

Find Jade includes and return an array of matches.

```
@param   {String}   data                     String to search for include paths.
@param   {String}   filePath                 Source file where data came from.
@param   {String}   [includePathsCacheName]  Optional. Unique property name used with shared.cache.includeFilesSeen to keep track of which include files have been found when recursing.
@return  {Promise}                           Promise that returns an array of includes like ['/partials/_footer.jade'] if successful. An error object if not.
```

### functions.includePathsLess

Type: `function`

Find Less includes and return an array of matches.

```
@param   {String}   data                     String to search for import paths.
@param   {String}   filePath                 Source file where data came from.
@param   {String}   [includePathsCacheName]  Optional. Unique property name used with shared.cache.includeFilesSeen to keep track of which include files have been found when recursing.
@return  {Promise}                           Promise that returns an array of includes like ['/partials/_fonts.less'] if successful. An error object if not.
```

### functions.includePathsSass

Type: `function`

Find Sass includes and return an array of matches.

```
@param   {String}   data                     String to search for import paths.
@param   {String}   filePath                 File path to where data came from.
@param   {String}   [includePathsCacheName]  Optional. Unique property name used with shared.cache.includeFilesSeen to keep track of which include files have been found when recursing.
@return  {Promise}                           Promise that returns an array of includes like ['/partials/_fonts.scss'] if successful. An error object if not.
```

### functions.includePathsStylus

Type: `function`

Find Stylus includes and return an array of matches.

```
@param   {String}   data                     String to search for includes paths.
@param   {String}   filePath                 Full file path to where data came from.
@param   {String}   [includePathsCacheName]  Optional. Unique property name used with shared.cache.includeFilesSeen to keep track of which include files have been found when recursing.
@return  {Promise}                           Promise that returns an array of includes like ['/partials/_fonts.styl'] if successful. An error object if not.
```

## Functions: Reusable Object Building

### functions.objBuildWithIncludes

Type: `function`

Figure out if a reusable object, which may may have include files, needs to be built in memory.

```
@param   {Object}    obj              Reusable object originally created by build.processOneBuild
@param   {Function}  includeFunction  Function that will parse this particular type of file (ejs, sass, stylus, etc...) and return any paths to include files.
@return  {Promise}                    Promise that returns a reusable object.
```

### functions.objBuildInMemory

Type: `function`

Figure out if a reusable object needs to be built in memory.

```
@param   {Object}   obj  Reusable object originally created by build.processOneBuild
@return  {Promise}  obj  Promise that returns a reusable object.
```

### functions.objBuildOnDisk

Type: `function`

Figure out if a reusable object needs to be written to disk and if so, prepare for a command line program to use it next.

```
@param   {Object}   obj  Reusable object originally created by build.processOneBuild
@return  {Promise}  obj  Promise that returns a reusable object.
```

## License

MIT © [Daniel Gagan](https://forestmist.org)