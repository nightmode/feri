'use strict'

//----------
// Includes
//----------
var os           = require('os')            // ~ 1 ms
var path         = require('path')          // ~ 1 ms
var uniqueNumber = require("unique-number") // ~ 2 ms

//-----------
// Functions
//-----------
var propertyAccessor = function propertyAccessor(object, keys) {
    /*
    Retrieve an object property with a dot notation string.
    @param   {Object}  object   Object to access.
    @param   {String}  keys     Property to access using 0 or more dots for notation.
    @return  {*}
    */
    var array = keys.split('.')
    while (array.length && (object = object[array.shift()]));
    return object
}

//-----------
// Variables
//-----------
var shared = {
    // null values will be populated later
    cache: {
        'errorsSeen'       : [], // keep track of which error messages have been displayed
        'includeFilesSeen' : {}, // will contain temporary sub arrays to keep track of which files have been seen when recursively checking source includes to find out if any of them are newer than the destination output file
        'includesNewer'    : {}, // keep track of include files and their modified times
        'missingMapBuild'  : []  // note file types that are missing an entry in config.map.sourceToDestTasks
    },
    cli: false, // will be set to true if we are running from the command line
    help: false, // will be set to true if we are displaying help text on the command line
    language: { // language.base and language.loaded are a duplicate of each other to speed up our default english language usage
        base: { // if a value in language.loaded is not available, fall back to a value from here
            "error": {
                "configPaths"           : "Source and destination should be unique and not nested within each other.",
                "destPointsToSource"    : "Destination points to a source directory.",
                "missingDest"           : "Missing destination file.",
                "missingSource"         : "Missing source file.",
                "missingSourceDirectory": "Missing source directory.",
                "removeDest"            : "Source file delete ignored since source files should never be harmed.",
                "watchingDest"          : "Error watching destination folder.",
                "watchingSource"        : "Error watching source folder."
            },
            "message": {
                "fileChangedTooRecently"  : "{file} was changed too recently, ignoring.",
                "includesNewer"           : "{extension} include(s) newer than destination file.",
                "missingSourceToDestTasks": "Missing config.map.sourceToDestTasks for the following file types:",
                "listeningOnPort"         : "{software} listening on port {port}.",
                "usingConfigFile"         : "Using config file {file}.",
                "watchRefreshed"          : "{software} refreshed.",
                "watchingDirectory"       : "Watching {directory} for changes."
            },
            "paddedGroups": {
                "build": {
                    "output": "output ",
                    "copy"  : "copy   "
                },
                "stats": {
                    "load" : "Load  ",
                    "clean": "Clean ",
                    "build": "Build ",
                    "watch": "Watch ",
                    "total": "Total "
                }
            },
            "words": {
                "add"      : "add",
                "build"    : "Build",
                "clean"    : "Clean",
                "change"   : "change",
                "directory": "dir",
                "done"     : "Done",
                "removed"  : "removed",
                "seconds"  : "seconds",
                "stats"    : "Stats",
                "watch"    : "Watch",
                "watching" : "Watching"
            }
        },
        display: function shared_language_display(keys) {
            var alreadyLoaded = propertyAccessor(shared.language.loaded, keys)

            if (typeof alreadyLoaded === 'string') {
                return alreadyLoaded
            } else {
                return propertyAccessor(shared.language.base, keys)
            }
        },
        loaded: { // can be replaced by a call like functions.setLanguage('en-us')
            "error": {
                "configPaths"           : "Source and destination should be unique and not nested within each other.",
                "destPointsToSource"    : "Destination points to a source directory.",
                "missingDest"           : "Missing destination file.",
                "missingSource"         : "Missing source file.",
                "missingSourceDirectory": "Missing source directory.",
                "removeDest"            : "Source file delete ignored since source files should never be harmed.",
                "watchingDest"          : "Error watching destination folder.",
                "watchingSource"        : "Error watching source folder."
            },
            "message": {
                "fileChangedTooRecently"  : "{file} was changed too recently, ignoring.",
                "includesNewer"           : "{extension} include(s) newer than destination file.",
                "missingSourceToDestTasks": "Missing config.map.sourceToDestTasks for the following file types:",
                "listeningOnPort"         : "{software} listening on port {port}.",
                "usingConfigFile"         : "Using config file {file}.",
                "watchRefreshed"          : "{software} refreshed.",
                "watchingDirectory"       : "Watching {directory} for changes."
            },
            "paddedGroups": {
                "build": {
                    "output": "output ",
                    "copy"  : "copy   "
                },
                "stats": {
                    "load" : "Load  ",
                    "clean": "Clean ",
                    "build": "Build ",
                    "watch": "Watch ",
                    "total": "Total "
                }
            },
            "words": {
                "add"      : "add",
                "build"    : "Build",
                "clean"    : "Clean",
                "change"   : "change",
                "directory": "dir",
                "done"     : "Done",
                "removed"  : "removed",
                "seconds"  : "seconds",
                "stats"    : "Stats",
                "watch"    : "Watch",
                "watching" : "Watching"
            }
        }
    },
    livereload: {
        'calmTimer'   : null, // timer used to call livereload 300ms after the last destination file change
        'changedFiles': [],
    },
    platform: os.platform(),
    path: {
        'pwd': process.env.PWD,
        'self': path.dirname(__dirname) // full path to ourself like /Users/daniel/Dropbox/Projects/node/feri
    },
    slash: '/', // directory separator
    stats: {
        'timeTo': {
            'load' : 0, // seconds it took to require files
            'clean': 0, // seconds it took to clean
            'build': 0, // seconds it took to build
            'watch': 0  // seconds it took to enable watch mode
        }
    },
    uniqueNumber: new uniqueNumber() // unique number system (https://www.npmjs.com/package/unique-number) for ensuring unique property names like shared.cache.includePaths[name]
}

//------------------
// Windows Specific
//------------------
if (shared.platform === 'win32' || shared.platform === 'win64') {
    shared.slash = '\\'
}

//---------
// Exports
//---------
module.exports = shared
