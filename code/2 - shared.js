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
        'errorsSeen'       : [], // Keep track of which error messages have been displayed to a command line user. Used by functions.logError to show individual errors only once.
        'includeFilesSeen' : {}, // Keep track of which include files have been seen. Child properties are of the type array.
        'includesNewer'    : {}, // Keep track of include files and their modified times. Child properties are of the type object.
        'missingMapBuild'  : []  // Keep track of any file types that are missing a config.map.sourceToDestTasks entry during a build pass.
    },
    cli: false, // Running as a command line tool if true. Called as a require if false.
    help: false, // will be set to true if we are displaying help text on the command line
    language: { // language.base and language.loaded are a duplicate of each other to speed up our default english language usage
        base: { // The default language object that is a fallback in case a value in shared.language.loaded is not available.
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
            /*
            Return a string from shared.language.loaded if available otherwise return the same string from shared.language.base.
            @param   {String}  keys  String like 'error.missingSource'
            @return  {String}        String like 'Missing source file.'
            */
            var alreadyLoaded = propertyAccessor(shared.language.loaded, keys)

            if (typeof alreadyLoaded === 'string') {
                return alreadyLoaded
            } else {
                return propertyAccessor(shared.language.base, keys)
            }
        },
        loaded: { // The active language translation. Defaults to english but can be replaced by functions.setLanguage.
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
        'calmTimer'   : null, // Variable used by watch.updateLiveReloadServer to update the LiveReload server 300 ms after the last destination file change.
        'changedFiles': [], // Keeps track of which destination files were changed in order to relay those to the LiveReload server.
    },
    log: false, // will be set to true if we are running as a command line in order to allow console logging
    platform: os.platform(),
    path: {
        'pwd': process.env.PWD,
        'self': path.dirname(__dirname) // full path to ourself like /Users/daniel/project/node_modules/feri
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
    uniqueNumber: new uniqueNumber() // An instance of unique-number that is used to ensure unique property names in functions like functions.includePathsEjs.
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
