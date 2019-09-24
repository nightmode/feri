# Feri - Functions

Functions is the module that many other modules depend on. A treasure trove of helpers.

The functions module can be found inside the file [code/4 - functions.js](../../../code/4%20-%20functions.js)

## Functions Object

The functions object is grouped into three categories.

### Functions

* [addDestToSourceExt](#functionsadddesttosourceext)
* [buildEmptyOk](#functionsbuildemptyok)
* [cacheReset](#functionscachereset)
* [changeExt](#functionschangeext)
* [cleanArray](#functionscleanarray)
* [cloneObj](#functionscloneobj)
* [concatMetaClean](#functionsconcatmetaclean)
* [concatMetaRead](#functionsconcatmetaread)
* [concatMetaWrite](#functionsconcatmetawrite)
* [configPathsAreGood](#functionsconfigpathsaregood)
* [destToSource](#functionsdesttosource)
* [detectCaseDest](#functionsdetectcasedest)
* [detectCaseSource](#functionsdetectcasesource)
* [figureOutPath](#functionsfigureoutpath)
* [fileExists](#functionsfileexists)
* [fileExistsAndTime](#functionsfileexistsandtime)
* [fileExtension](#functionsfileextension)
* [filesExist](#functionsfilesexist)
* [filesExistAndTime](#functionsfilesexistandtime)
* [fileSize](#functionsfilesize)
* [fileStat](#functionsfilestat)
* [findFiles](#functionsfindfiles)
* [globOptions](#functionsgloboptions)
* [inDest](#functionsindest)
* [initFeri](#functionsinitferi)
* [inSource](#functionsinsource)
* [isGlob](#functionsisglob)
* [log](#functionslog)
* [logError](#functionslogerror)
* [logOutput](#functionslogoutput)
* [logWorker](#functionslogworker)
* [makeDirPath](#functionsmakedirpath)
* [mathRoundPlaces](#functionsmathroundplaces)
* [normalizeSourceMap](#functionsnormalizesourcemap)
* [objFromSourceMap](#functionsobjfromsourcemap)
* [occurrences](#functionsoccurrences)
* [playSound](#functionsplaysound)
* [possibleSourceFiles](#functionspossiblesourcefiles)
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
* [upgradeAvailable](#functionsupgradeavailable)
* [useExistingSourceMap](#functionsuseexistingsourcemap)
* [wait](#functionswait)
* [writeFile](#functionswritefile)

### Functions: Includes

* [includesNewer](#functionsincludesnewer)
* [includePathsConcat](#functionsincludepathsconcat)

### Functions: Reusable Object Building

* [objBuildWithIncludes](#functionsobjbuildwithincludes)
* [objBuildInMemory](#functionsobjbuildinmemory)
* [objBuildOnDisk](#functionsobjbuildondisk)

## Functions

### functions.addDestToSourceExt

Type: `function`

Add or append a mapping to [config.map.destToSourceExt](config.md#configmapdesttosourceext) without harming existing entries.

```
@param  {String}         ext       Extension like 'html'
@param  {String,Object}  mappings  String like 'md' or array of strings like ['md']
```

### functions.buildEmptyOk

Type: `function`

Allow empty files to be built in memory once they get to [build.finalize](build.md#buildfinalize).

```
@param   {Object}   obj  Reusable object originally created by build.processOneBuild
@return  {Promise}  obj  Promise that returns a reusable object.
```

### functions.cacheReset

Type: `function`

Reset [shared.cache](shared.md#sharedcache) and [shared.uniqueNumber](shared.md#shareduniquenumber) for a new pass through a set of files.

### functions.changeExt

Type: `function`

Change one extension to another.

```
@param   {String}  filePath      File path like '/files/index.md'
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

### functions.concatMetaClean

Type: `function`

Silently clean up any orphaned `.filename.ext.concat` meta files in the source directory.

### functions.concatMetaRead

Type: `function`

Read a meta information file which lists the includes used to build a concat file.

```
@param  {String}  file  Full file path to a source concat file.
```

### functions.concatMetaWrite

Type: `function`

Write a meta information file with a list of includes used to build a concat file.

```
@param  {String}  file          Full file path to a source concat file.
@param  {Object}  includeArray  Array of include file strings.
```

### functions.configPathsAreGood

Type: `function`

Ensure source and destination are not blank, not the same, and not in each other's path. Also ensure that the destination is not a protected folder.

```
@return  {*}  Boolean true if both paths are good. String with an error message if not.
```

### functions.destToSource

Type: `function`

Convert a destination path to its source equivalent.

```
@param   {String}  dest  File path like '/dest/index.html'
@return  {String}        File path like '/source/index.html'
```

### functions.detectCaseDest

Type: `function`

Find out how a destination folder deals with case. Writes a test file once and then caches that result for subsequent calls.

```
@return  {Promise}  Promise that returns a string like 'lower', 'upper', 'nocase', or 'case'.
```

### functions.detectCaseSource

Type: `function`

Find out how a source folder deals with case. Writes a test file once and then caches that result for subsequent calls.

```
@return  {Promise}  Promise that returns a string like 'lower', 'upper', 'nocase', or 'case'.
```

### functions.figureOutPath

Type: `function`

Figure out if a path is relative and if so, return an absolute version of the path.

```
@param   {String}  filePath  File path like '/full/path/to/folder' or '/relative/path'
@return  {String}            File path like '/fully/resolved/relative/path'
```

### functions.fileExists

Type: `function`

Find out if a file or folder exists.

```
@param   {String}   filePath  Path to a file or folder.
@return  {Promise}            Promise that returns a boolean. True if yes.
```

### functions.fileExistsAndTime

Type: `function`

Find out if a file exists along with its modified time.

```
@param   {String}   filePath  Path to a file or folder.
@return  {Promise}            Promise that returns an object like { exists: true, mtime: 123456789 }
```

### functions.fileExtension

Type: `function`

Return a file extension from a string.

```
@param   {String}  filePath  File path like '/conan/riddle-of-steel.txt'
@return  {String}            String like 'txt'
```

### functions.filesExist

Type: `function`

Find out if one or more files or folders exist.

```
@param   {Object}   filePaths  Array of file paths like ['/source/index.html', '/source/about.html']
@return  {Promise}             Promise that returns an array of booleans. True if a particular file exists.
```

### functions.filesExistAndTime

Type: `function`

Find out if one or both files exist along with their modified time.

```
@param   {String}  source  Source file path like '/source/favicon.ico'
@param   {String}  dest    Destination file path like '/dest/favicon.ico'
@return  {Promise}         Promise that returns an object like { source: { exists: true, mtime: 123456789 }, dest: { exists: false, mtime: 0 } }
```

### functions.fileSize

Type: `function`

Find out the size of a file or folder.

```
@param  {String}   filePath  Path to a file or folder.
@return {Promise}            Promise that will return the number of bytes or 0.
```

### functions.fileStat

Type: `function`

Return an fs stats object if a file or folder exists otherwise an error. A case sensitive version of fsStatPromise for source and dest locations.

```
@param   {String}   filePath  Path to a file or folder.
@return  {Promise}            Promise that returns an fs stats object if a file or folder exists. An error if not.
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

### functions.inDest

Type: `function`

Find out if a path is in the destination directory.

```
@param   {String}   filePath  Full file path like '/projects/dest/index.html'
@return  {Boolean}            True if the file path is in the destination directory.
```

### functions.initFeri

Type: `function`

If needed, create the source and destination folders along with a [custom config file](../custom-config-file.md#feri---custom-config-file) in the present working directory.

```
@return  {Promise}
```

### functions.inSource

Type: `function`

Find out if a path is in the source directory.

```
@param   {String}   filePath  Full file path like '/projects/source/index.md'
@return  {Boolean}            True if the file path is in the source directory.
```

### functions.isGlob

Type: `function`

Find out if a string is a glob.

```
@param   {String}   string  String to test.
@return  {Boolean}          True if string is a glob.
```

### functions.log

Type: `function`

Display a console message if logging is enabled.

```
@param  {String}   message   String to display.
@param  {Boolean}  [indent]  Optional and defaults to true. If true, the string will be indented using the shared.indent value.
```

### functions.logError

Type: `function`

Log a stack trace or text string depending on the type of object passed in.

```
@param  {Object,String}  err  Error object or string describing the error.
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

Create an entire directory structure leading up to a file or folder, if needed.

```
@param   {String}   filePath  Path like '/images/koi.png' or '/images'.
@param   {Boolean}  isDir     True if filePath is a directory that should be used as is.
@return  {Promise}            Promise that returns true if successful. An error if not.
```

### functions.mathRoundPlaces

Type: `function`

Round a number to a certain amount of decimal places.

```
@param   {Number}  number    Number to round.
@param   {Number}  decimals  Number of decimal places.
@return  {Number}            Returns 0.04 if mathRoundPlaces(0.037, 2) was called.
```

### functions.normalizeSourceMap

Type: `function`

Normalize source maps.

```
@param   {Object}  obj        Reusable object most likely created by functions.objFromSourceMap
@param   {Object}  sourceMap  Source map to normalize.
@return  {Object}             Normalized source map.
```

### functions.objFromSourceMap

Type: `function`

Create a reusable object based on a source map.

```
@param   {Object}  obj        Reusable object originally created by build.processOneBuild
@param   {Object}  sourceMap  Source map to use in the data field of the returned object.
@return  {Object}             A reusable object crafted especially for build.map
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

### functions.playSound

Type: `function`

Play a sound file using [node-wav-player](https://www.npmjs.com/package/node-wav-player).

```
@param  {String}  file  File path or file name string. A file name without a directory component like 'sound.wav' will be prepended with feri's sound folder location.
```

### functions.possibleSourceFiles

Type: `function`

Figure out all the possible source files for any given destination file path.

```
@param   {String}  filepath  File path like '/dest/code.js'
@return  {Object}            Array of possible source files.
```

### functions.readFile

Type: `function`

Promisified version of fs.readFile.

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
@param   {Boolean}  [log]     Optional and defaults to true. Set to false to disable console log removal messages.
@param   {Boolean}  [isDir]   Optional and defaults to false. If true, log with 'words.removedDir' instead of 'words.remove'.
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
@param   {String}   filePath  String like '/dest/index.html'
@return  {Promise}            Promise that returns true if the file or folder was removed or if there was nothing to do. An error otherwise.
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
@return  {Object}  obj      Object to be restored.
@param   {Object}  fromObj  Object to restore from.
@return  {Object}           Object that is a restore of the original. Not a reference.
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

Convert a source path to its destination equivalent.

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

### functions.upgradeAvailable

Type: `function`

Find out if a Feri upgrade is available.

```
@param   {String}   specifyRemoteVersion  Specify a remote version string like 1.2.3 instead of looking up the exact version on GitHub. Useful for testing.
@return  {Promise}                        Promise that returns a string with the latest version of Feri if an upgrade is available. Returns a boolean false otherwise.
```

### functions.useExistingSourceMap

Type: `function`

Use an existing source map if it was modified recently otherwise remove it.

```
@param   {String}   filePath  Path to a file that may also have a separate '.map' file associated with it.
@return  {Promise}            Promise that will return a source map object that was generated recently or a boolean false.
```

### functions.wait

Type: `function`

Promise that is useful for injecting delays and testing scenarios.

```
@param   {Number}   ms  Number of milliseconds to wait before returning.
@return  {Promise}
```

### functions.writeFile

Type: `function`

Promisified version of fs.writeFile.

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
@param   {Object}   includePaths  Array of file paths like ['/source/_header.file', '/source/_footer.file']
@param   {String}   fileType      File type like 'concat'.
@param   {Number}   destTime      Modified time of the destination file.
@return  {Promise}                Promise that returns true if any includes files are newer.
```

### functions.includePathsConcat

Type: `function`

Find CONCAT includes and return an array of matches.

```
@param   {String}   data                     String to search for include paths.
@param   {String}   filePath                 Source file where data came from.
@param   {String}   [includePathsCacheName]  Optional. Unique property name used with shared.cache.includeFilesSeen to keep track of which include files have been found when recursing.
@return  {Promise}                           Promise that returns an array of files to concatenate like ['/js/_library.js'] if successful. An error object if not.
```

## Functions: Reusable Object Building

### functions.objBuildWithIncludes

Type: `function`

Figure out if a reusable object, which may have include files, needs to be built in memory.

```
@param   {Object}    obj              Reusable object originally created by build.processOneBuild
@param   {Function}  includeFunction  Function that will parse this particular type of file (concat for example) and return any paths to include files.
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

MIT © [Kai Nightmode](https://twitter.com/kai_nightmode)