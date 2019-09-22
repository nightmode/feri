'use strict'

//----------
// Includes
//----------
const os   = require('os')   // ~ 1 ms
const path = require('path') // ~ 1 ms

//-------------------
// Private Functions
//-------------------
const propertyAccessor = function propertyAccessor(object, keys) {
    /*
    Retrieve an object property with a dot notation string.
    @param   {Object}  object   Object to access.
    @param   {String}  keys     Property to access using 0 or more dots for notation.
    @return  {*}
    */
    let array = keys.split('.')
    while (array.length && (object = object[array.shift()]));
    return object
}

//-----------
// Variables
//-----------
const shared = {
    // null values will be populated later
    cache: {
        'errorsSeen'       : [], // Keep track of which error messages have been displayed to a command line user. Used by functions.logError to show individual errors only once.
        'includeFilesSeen' : {}, // Keep track of which include files have been seen. Child properties are of the type array.
        'includesNewer'    : {}, // Keep track of include files and their modified times. Child properties are of the type object.
        'missingMapBuild'  : []  // Keep track of any file types that are missing a config.map.sourceToDestTasks entry during a build pass.
    },
    cli: false, // Running as a command line tool if true. Called as a require if false.
    extension: {
        'calmTimer': null, // Variable used by watch.updateExtensionServer to update 300 ms after the last destination file change.
        'changedFiles': [] // Keeps track of which destination files were changed in order to relay those to the extension server.
    },
    folder: {
        dest: { // destination folder related
            case: '', // the mode or style of file naming such as 'lower', 'upper', 'nocase', or 'case', set by functions.detectCaseDest
            lastPath: '' // the last seen destination folder like '/project/dest', set by functions.detectCaseDest
        },
        source: { // source folder related
            case: '', // the mode or style of file naming such as 'lower', 'upper', 'nocase', or 'case', set by functions.detectCaseSource
            lastPath: '' // the last seen source folder like '/project/source', set by functions.detectCaseSource
        }
    },
    global: true, // Installed globally if true. Locally if false.
    help: false, // will be set to true if we are displaying help text on the command line
    indent: '    ', // default to four spaces when indenting console messages
    language: { // language.base and language.loaded are a duplicate of each other to speed up our default english language usage
        base: { // The default language object that is a fallback in case a value in shared.language.loaded is not available.
            "error": {
                "concatInclude"         : "Warning: Concat files can use includes but should never be an include themselves.",
                "configPaths"           : "Source and destination should be unique and not nested within each other.",
                "destPointsToSource"    : "Destination points to a source directory.",
                "destProtected"         : "Destination should not be a protected location like {path}.",
                "halted"                : "Halted {software} version {version} due to errors.",
                "locationInCode"        : "{error} on line {number} character {position}.",
                "missingDest"           : "Missing destination file.",
                "missingSource"         : "Missing source file.",
                "missingSourceDirectory": "Missing source directory.",
                "removeDest"            : "Source file delete ignored since source files should never be harmed.",
                "watchingDest"          : "Error watching destination folder.",
                "watchingSource"        : "Error watching source folder."
            },
            "message": {
                "fileChangedTooRecently"  : "{file} was changed too recently, ignoring.",
                "fileWasNotBuilt"         : "File was not built.",
                "includesNewer"           : "{extension} include(s) newer than destination file.",
                "listeningOnPort"         : "{software} listening on port {port}.",
                "missingSourceHelp"       : "Check your folders for existing projects or run \"feri --init\" to start a new project.",
                "missingSourceToDestTasks": "Missing config.map.sourceToDestTasks for the following file types:",
                "usingConfigFile"         : "Using {file} file.",
                "watchUpdated"            : "{software} updated.",
                "watchingDirectory"       : "Watching {directory} for changes."
            },
            "paddedGroups": {
                "build": {
                    "output": "output",
                    "copy"  : "copy  "
                },
                "stats": {
                    "load" : "Load ",
                    "clean": "Clean",
                    "build": "Build",
                    "watch": "Watch",
                    "total": "Total"
                }
            },
            "words": {
                "add"             : "add",
                "addDirectory"    : "add dir",
                "build"           : "Build",
                "clean"           : "Clean",
                "change"          : "change",
                "done"            : "Done",
                "in"              : "in",
                "removed"         : "removed",
                "removedDirectory": "removed dir",
                "seconds"         : "seconds",
                "stats"           : "Stats",
                "watch"           : "Watch",
                "watching"        : "Watching"
            }
        },
        display: function shared_language_display(keys) {
            /*
            Return a string from shared.language.loaded if available otherwise return the same string from shared.language.base.
            @param   {String}  keys  String like 'error.missingSource'
            @return  {String}        String like 'Missing source file.'
            */
            let alreadyLoaded = propertyAccessor(shared.language.loaded, keys)

            if (typeof alreadyLoaded === 'string') {
                return alreadyLoaded
            } else {
                return propertyAccessor(shared.language.base, keys)
            }
        },
        loaded: { // The active language translation. Defaults to english but can be replaced by functions.setLanguage.
            "error": {
                "concatInclude"         : "Warning: Concat files can use includes but should never be an include themselves.",
                "configPaths"           : "Source and destination should be unique and not nested within each other.",
                "destPointsToSource"    : "Destination points to a source directory.",
                "destProtected"         : "Destination should not be a protected location like {path}.",
                "halted"                : "Halted {software} version {version} due to errors.",
                "locationInCode"        : "{error} on line {number} character {position}.",
                "missingDest"           : "Missing destination file.",
                "missingSource"         : "Missing source file.",
                "missingSourceDirectory": "Missing source directory.",
                "removeDest"            : "Source file delete ignored since source files should never be harmed.",
                "watchingDest"          : "Error watching destination folder.",
                "watchingSource"        : "Error watching source folder."
            },
            "message": {
                "fileChangedTooRecently"  : "{file} was changed too recently, ignoring.",
                "fileWasNotBuilt"         : "File was not built.",
                "includesNewer"           : "{extension} include(s) newer than destination file.",
                "listeningOnPort"         : "{software} listening on port {port}.",
                "missingSourceHelp"       : "Check your folders for existing projects or run \"feri --init\" to start a new project.",
                "missingSourceToDestTasks": "Missing config.map.sourceToDestTasks for the following file types:",
                "usingConfigFile"         : "Using {file} file.",
                "watchUpdated"            : "{software} updated.",
                "watchingDirectory"       : "Watching {directory} for changes."
            },
            "paddedGroups": {
                "build": {
                    "output": "output",
                    "copy"  : "copy  "
                },
                "stats": {
                    "load" : "Load ",
                    "clean": "Clean",
                    "build": "Build",
                    "watch": "Watch",
                    "total": "Total"
                }
            },
            "words": {
                "add"             : "add",
                "addDirectory"    : "add dir",
                "build"           : "Build",
                "clean"           : "Clean",
                "change"          : "change",
                "done"            : "Done",
                "in"              : "in",
                "removed"         : "removed",
                "removedDirectory": "removed dir",
                "seconds"         : "seconds",
                "stats"           : "Stats",
                "watch"           : "Watch",
                "watching"        : "Watching"
            }
        }
    },
    log: false, // will be set to true if we are running as a command line in order to allow console logging
    platform: os.platform(),
    path: {
        'pwd': process.cwd(),
        'self': path.dirname(__dirname) // full path to ourself like /Users/nightmode/projects/feri
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
    suppressWatchEvents: false, // Used to temporarily suppress watch events for command line users until the title "Watching" is displayed. Can also be used to temporarily suppress watch events without having to stop the watch process.
    uniqueNumber: 0, // iterate with (++uniqueNumber) or reset to 0
    watch: {
        working: false, // when set to true, one instance of watch.workQueueProcess is already taking care of the workQueue
        workQueue: [] // array of objects that will be managed by watch.workQueueAdd and watch.workQueueProcess.
        // workQueue will contain objects like... [{location:'source', task:'add', path:'/source/file.txt'}, {location:'source', task:'change', path:'/source/file.txt'}]
        // the workQueue order will match the order of events while watching
    }
}

//------------------
// Windows Specific
//------------------
if (shared.platform === 'win32') {
    shared.slash = '\\'
}

//---------
// Exports
//---------
module.exports = shared