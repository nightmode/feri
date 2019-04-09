'use strict'

//----------------
// Includes: Self
//----------------
const color  = require('./color.js')
const shared = require('./2 - shared.js')
const config = require('./3 - config.js')

//----------
// Includes
//----------
const fs     = require('fs')     // ~  1 ms
const glob   = require('glob')   // ~ 13 ms
const mkdirp = require('mkdirp') // ~  1 ms
const path   = require('path')   // ~  1 ms
const util   = require('util')   // ~  1 ms

//---------------------
// Includes: Promisify
//---------------------
const fsReadFilePromise  = util.promisify(fs.readFile)       // ~  1 ms
const fsStatPromise      = util.promisify(fs.stat)           // ~  1 ms
const fsWriteFilePromise = util.promisify(fs.writeFile)      // ~  1 ms
const rimrafPromise      = util.promisify(require('rimraf')) // ~ 14 ms

//---------------------
// Includes: Lazy Load
//---------------------
let compareVersions // require('compare-versions') // ~  3 ms
let https           // require('https')            // ~ 33 ms

//-----------
// Variables
//-----------
let functions = {}

//-----------
// Functions
//-----------
functions.addDestToSourceExt = function functions_addDestToSourceExt(ext, mappings) {
    /*
    Add or append a mapping to config.map.destToSourceExt without harming existing entries.
    @param  {String}         ext       Extension like 'html'
    @param  {String,Object}  mappings  String like 'md' or array of strings like ['md']
    */
    if (typeof mappings === 'string') {
        mappings = [mappings]
    }

    if (!config.map.destToSourceExt.hasOwnProperty(ext)) {
        // create extension mapping property and empty array
        config.map.destToSourceExt[ext] = []
    }

    // append array
    Array.prototype.push.apply(config.map.destToSourceExt[ext], mappings)
} // addDestToSourceExt

functions.cacheReset = function functions_cacheReset() {
    /*
    Reset shared.cache and shared.uniqueNumber for a new pass through a set of files.
    */
    for (let i in shared.cache) {
        shared.cache[i] = shared.cache[i].constructor()
    }

    shared.uniqueNumber = 0
} // cacheReset

functions.changeExt = function functions_changeExt(filePath, newExtension) {
    /*
    Change one extension to another.
    @param   {String}  filePath      File path like '/files/index.md'
    @param   {String}  newExtension  Extension like 'html'
    @return  {String}                File path like '/files/index.html'
    */
    return filePath.substr(0, filePath.lastIndexOf('.')) + '.' + newExtension
} // changeExt

functions.cleanArray = function functions_cleanArray(array) {
    /*
    Remove empty items from an array.
    @param   {Object}  array  Array like [1,,3]
    @return  {Object}         Cleaned array like [1,3]
    */
    // This function comes from http://stackoverflow.com/questions/281264/remove-empty-elements-from-an-array-in-javascript
    let len = array.length

    for (let i = 0; i < len; i++) {
        array[i] && array.push(array[i]) // copy non-empty values to the end of the array
    }

    array.splice(0 , len) // cut the array and leave only the non-empty values

    return array
} // cleanArray

functions.cloneObj = function functions_cloneObj(object) {
    /*
    Clone an object recursively so the return is not a reference to the original object.
    @param  {Object}  obj  Object like { number: 1, bool: true, array: [], subObject: {} }
    @return {Object}
    */
    if (object === null || typeof object !== 'object') {
        // return early for boolean, function, null, number, string, symbol, undefined
        return object
    }

    if (object instanceof Date) {
        return new Date(object)
    }

    if (object instanceof RegExp) {
        return new RegExp(object)
    }

    let objectConstructor = object.constructor()

    for (let key in object) {
        // call self recursively
        objectConstructor[key] = functions.cloneObj(object[key])
    }

    return objectConstructor
} // cloneObj

functions.configPathsAreGood = function functions_configPathsAreGood() {
    /*
    Ensure source and destination are not blank, not the same, and not in each others path. Also ensure that the destination is not a protected folder.
    @return  {*}  Boolean true if both paths are good. String with an error message if not.
    */

    // resolve any relative paths to absolute
    config.path.source = path.resolve(config.path.source)
    config.path.dest = path.resolve(config.path.dest)

    let source = config.path.source.toLowerCase()
    let dest = config.path.dest.toLowerCase()

    let sourceSlash = source + shared.slash
    let destSlash = dest + shared.slash

    let protect = false
    let test = ''

    if (source === dest || sourceSlash.indexOf(destSlash) === 0 || destSlash.indexOf(sourceSlash) === 0) {
        // source and destination are the same or in each others path
        return shared.language.display('error.configPaths')
    }

    if (shared.slash === '\\') {
        // we are on windows

        if (typeof process.env.windir === 'string') {
            test = process.env.windir.toLowerCase() + shared.slash
            if (destSlash.indexOf(test) === 0) {
                // protect 'C:\Windows' and sub folders
                protect = true
            }
        }

        let env = [process.env.ProgramFiles,
                   process.env['ProgramFiles(x86)'],
                   path.dirname(process.env.USERPROFILE)]

        for (let i in env) {
            if (typeof env[i] === 'string') {
                test = env[i].toLowerCase()

                if (dest === test) {
                    // protect folders like 'C:\Program Files', 'C:\Program Files(x86)', or 'C:\Users'
                    protect = true
                    break
                } else if (path.dirname(dest) === test) {
                    // protect one level deeper into folder, but not farther
                    protect = true
                    break
                }
            }
        }

        if (dest === 'c:\\') {
            // zoinks
            protect = true
        }
    } else {
        // mac, unix, etc...

        if (typeof process.env.HOME === 'string') {
            test = path.dirname(process.env.HOME.toLowerCase())
            if (dest === test) {
                // protect Mac '/Users' and Unix '/home' folders
                protect = true
            } else if (path.dirname(dest) === test) {
                // protect one level deeper like '/Users/name'
                protect = true
            }
        }

        if (dest === '/') {
            // yikes
            protect = true
        }
    }

    if (protect) {
        return shared.language.display('error.destProtected').replace('{path}', "'" + config.path.dest + "'")
    }

    return true
} // configPathsAreGood

functions.destToSource = function functions_destToSource(dest) {
    /*
    Convert destination path to its source equivalent.
    @param   {String}  dest  File path like '/dest/index.html'
    @return  {String}        File path like '/source/index.html'
    */
    return dest.replace(config.path.dest, config.path.source)
} // destToSource

functions.figureOutPath = function functions_figureOutPath(filePath) {
    /*
    Figure out if a path is relative and if so, return an absolute version of the path.
    @param   {String}  filePath  File path like '/full/path/to/folder' or '/relative/path'
    @return  {String}            File path like '/fully/resolved/relative/path'
    */
    let pos = 0
    let str = '/'

    filePath = path.normalize(filePath)

    if (shared.slash === '\\') {
        // we are on windows
        pos = 1
        str = ':'
    }

    if (filePath.charAt(pos) === str) {
        // absolute path
        return filePath
    }

    // relative path
    return path.join(shared.path.pwd, filePath)
} // figureOutPath

functions.fileExists = function functions_fileExists(filePath) {
    /*
    Find out if a file or folder exists.
    @param   {String}   filePath  Path to a file or folder.
    @return  {Promise}            Promise that returns a boolean. True if yes.
    */
    return fsStatPromise(filePath).then(function() {
        return true
    }).catch(function(err) {
        return false
    })
} // fileExists

functions.filesExist = function functions_filesExist(filePaths) {
    /*
    Find out if one or more files or folders exist.
    @param   {Object}   filePaths  Array of file paths like ['/source/index.html', '/source/about.html']
    @return  {Promise}             Promise that returns an array of booleans. True if a particular file exists.
    */
    let files = filePaths.map(function(file) {
        return functions.fileExists(file)
    })

    return Promise.all(files)
} // filesExist

functions.fileExistsAndTime = function functions_fileExistsAndTime(filePath) {
    /*
    Find out if a file exists along with its modified time.
    @param   {String}   filePath  Path to a file or folder.
    @return  {Promise}            Promise that returns an object like { exists: true, mtime: 123456789 }
    */
    return fsStatPromise(filePath).then(function(stat) {
        return {
            'exists': true,
            'mtime': stat.mtime.getTime()
        }
    }).catch(function(err) {
        return {
            'exists': false,
            'mtime': 0
        }
    })
} // fileExistsAndTime

functions.filesExistAndTime = function functions_filesExistAndTime(source, dest) {
    /*
    Find out if one or both files exist along with their modified time.
    @param   {String}  source  Source file path like '/source/favicon.ico'
    @param   {String}  dest    Destination file path like '/dest/favicon.ico'
    @return  {Promise}         Promise that returns an object like { source: { exists: true, mtime: 123456789 }, dest: { exists: false, mtime: 0 } }
    */
    let files = [source, dest].map(function(file) {
        return fsStatPromise(file).then(function(stat) {
            return {
                'exists': true,
                'mtime': stat.mtime.getTime()
            }
        }).catch(function(err) {
            return {
                'exists': false,
                'mtime': 0
            }
        })
    })

    return Promise.all(files).then(function(array) {
        return {
            'source': array[0],
            'dest': array[1]
        }
    })
} // filesExistAndTime

functions.fileExtension = function functions_fileExtension(filePath) {
    /*
    Return file extension in string.
    @param   {String}  filePath  File path like '/conan/riddle-of-steel.txt'
    @return  {String}            String like 'txt'
    */
    return path.extname(filePath).replace('.', '').toLowerCase()
} // fileExtension

functions.fileSize = function functions_fileSize(filePath) {
    /*
    Find out the size of a file or folder.
    @param  {String}   filePath  Path to a file or folder.
    @return {Promise}            Promise that will return a boolean. True if yes.
    */
    return fsStatPromise(filePath).then(function(stats) {
        return stats.size
    }).catch(function(err) {
        return 0
    })
} // fileSize

functions.findFiles = function functions_findFiles(match, options) {
    /*
    Find the files using https://www.npmjs.com/package/glob.
    @param   {String}  match      String like '*.jpg'
    @param   {Object}  [options]  Optional. Options for glob.
    @return  {Promise}            Promise that returns an array of files or empty array if successful. Error if not.
    */
    return new Promise(function(resolve, reject) {
        if (typeof options === 'undefined') {
            options = functions.globOptions()
        }

		if (match.charAt(1) === ':') {
			// we have a windows path

			// glob doesn't like c: or similar so trim two characters
			match = match.substr(2)

			// glob only likes forward slashes
			match = match.replace(/\\/g, '/')
		}

        glob(match, options, function(err, files) {
            if (err) {
                reject(err)
            } else {
                resolve(files)
            }
        })
    })
} // findFiles

functions.globOptions = function functions_globOptions() {
    /*
    Return glob options updated to ignore include prefixed files.
    @return  {Object}
    */
    return {
        'ignore'  : '**/' + config.includePrefix + '*', // glob ignores dot files by default
        'nocase'  : true,
        'nodir'   : true,
        'realpath': true
    }
} // globOptions

functions.initFeri = function initFeri() {
    /*
    If needed, create the source and destination folders along with a feri-config.js file in the present working directory.
    @return  {Promise}
    */
    return Promise.resolve().then(function() {

        // make sure config.path.source is an absolute path in case it was set programmatically
        config.path.source = functions.figureOutPath(config.path.source)

        return functions.makeDirPath(config.path.source, true)

    }).then(function() {

        // make sure config.path.dest is an absolute path in case it was set programmatically
        config.path.dest = functions.figureOutPath(config.path.dest)

        return functions.makeDirPath(config.path.dest, true)

    }).then(function() {

        let configFile = path.join(shared.path.pwd, 'feri-config.js')

        return functions.fileExists(configFile).then(function(exists) {

            if (exists) {
                // do nothing
                return
            }

            return functions.readFile(path.join(shared.path.self, 'templates', 'feri-config.js')).then(function(data) {

                return functions.writeFile(configFile, data)

            })

        }) // return

    }).then(function() {

        functions.log('\n' + color.gray(shared.language.display('words.done') + '.\n'), false)

    })
} // initFeri

functions.inSource = function functions_inSource(filePath) {
    /*
    Find out if a path is in the source directory.
    @param   {String}   filePath  Full file path like '/projects/a/source/index.html'
    @return  {Boolean}            True if the file path is in the source directory.
    */
    return filePath.indexOf(config.path.source) === 0
} // inSource

functions.isGlob = function functions_isGlob(string) {
    /*
    Find out if a string is a glob.
    @param   {String}   string  String to test.
    @return  {Boolean}          True if string is a glob.
    */
    if (string.search(/\*|\?|!|\+|@|\[|\]|\(|\)/) >= 0) {
        return true
    } else {
        return false
    }
} // isGlob

functions.log = function functions_log(message, indent) {
    /*
    Display a console message if logging is enabled.
    @param  {String}   message   String to display.
    @param  {Boolean}  [indent]  Optional and defaults to true. If true, the string will be indented four spaces.
    */
    if (shared.log) {
        indent = (indent === false) ? '' : '    '
        console.info(indent + message)
    }
} // log

functions.logError = function functions_logError(error) {
    /*
    Log a stack trace or simple text string depending on the type of object passed in.
    @param  {Object,String}  err  Error object or simple string describing the error.
    */
    let message = error.message || error
    let displayError = false

    if (shared.log) {
        if (message === '') {
            if (typeof error.stack === 'string') {
                displayError = true
            }
        } else {
            // check if we have seen this error before
            if (shared.cache.errorsSeen.indexOf(error) < 0) {
                // error is unique so cache it for next time
                shared.cache.errorsSeen.push(error)
                displayError = true
            }
        }
    }

    if (displayError) {
        if (typeof error.stack === 'string') {
            // error is an object
            console.warn('\n' + color.red(error.stack) + '\n')
        } else {
            // error is a string
            console.warn('\n' + color.gray('Error: ') + color.red(error) + '\n')
        }
    }
} // logError

functions.logOutput = function functions_logOutput(destFilePath, message) {
    /*
    Log a pretty output message with a relative looking path.
    @param  {String}  destFilePath  Full path to a destination file.
    @param  {String}  [message]     Optional and defaults to 'output'.
    */
    let file = destFilePath.replace(path.dirname(config.path.dest), '')

    message = message || 'output'

    if (shared.slash === '\\') {
        // we are on windows
        file = file.replace(/\\/g, '/')
    }

    functions.log(color.gray(shared.language.display('paddedGroups.build.' + message)) + ' ' + color.cyan(file))
} // logOutput

functions.logWorker = function functions_logWorker(workerName, obj) {
    /*
    Overly chatty logging utility used by build functions.
    @param  {String}  workerName  Name of worker.
    @param  {Object}  obj         Reusable object originally created by build.processOneBuild
    */
    if (config.option.debug) {
        let data = (obj.data === '') ? '' : 'yes'

        functions.log(color.gray('\n' + workerName + ' -> called'))
        functions.log('source = ' + obj.source)
        functions.log('dest   = ' + obj.dest)
        functions.log('data   = ' + data)
        functions.log('build  = ' + obj.build)
    }
} // logWorker

functions.makeDirPath = function functions_makeDirPath(filePath, isDir) {
    /*
    Create an entire directory structure leading up to a file or folder, if needed.
    @param   {String}   filePath  Path like '/images/koi.png' or '/images'.
    @param   {Boolean}  isDir     True if filePath is a directory that should be used as is.
    @return  {Promise}            Promise that returns true if successful. Error object if not.
    */
    isDir = isDir || false

    if (!isDir) {
        filePath = path.dirname(filePath)
    }

    return new Promise(function(resolve, reject) {
        mkdirp(filePath, function(err) {
            if (err) {
                reject(err)
            } else {
                resolve(true)
            }
        })
    })
} // makeDirPath

functions.mathRoundPlaces = function functions_mathRoundPlaces(number, decimals) {
    /*
    Round a number to a certain amount of decimal places.
    @param   {Number}  number    Number to round.
    @param   {Number}  decimals  Number of decimal places.
    @return  {Number}            Returns 0.04 if mathRoundPlaces(0.037, 2) was called.
    */
    return +(Math.round(number + 'e+' + decimals) + 'e-' + decimals)
} // mathRoundPlaces

functions.normalizeSourceMap = function functions_normalizeSourceMap(obj, sourceMap) {
    /*
    Normalize source maps.
    @param   {Object}  obj        Reusable object most likely created by functions.objFromSourceMap
    @param   {Object}  sourceMap  Source map to normalize.
    @return  {Object}             Normalized source map.
    */
    function missingSource() {
        let preferredPath = path.basename(config.path.source)

        let source = obj.source
        source = source.replace(config.path.source, preferredPath)
        source = source.replace(config.path.dest, preferredPath)
        source = source.replace(path.basename(config.path.dest), preferredPath)

        if (source.toLowerCase().endsWith('.map')) {
            source = functions.removeExt(source)
        }

        if (shared.slash !== '/') {
            // we are on windows
            source = source.replace(/\\/g, '/')
        }

        return [source]
    }

    // an example of a nice source map
    /*
    {
        "version"       : 3,
        "sources"       : ["source/js/javascript.js"],
        "names"         : ["context_menu","e","window","event","eTarget","srcElement","target","nodeName","document","oncontextmenu"],
        "mappings"      : "AAEA,QAASA,cAAaC,GAClB,IAAKA,EAAG,GAAIA,GAAIC,OAAOC,KACvB,IAAIC,GAAWF,OAAY,MAAID,EAAEI,WAAaJ,EAAEK,MAEhD,OAAwB,OAApBF,EAAQG,UAED,EAFX,OANJC,SAASC,cAAgBT",
        "file"          : "javascript.js",
        "sourceRoot"    : "/source-maps",
        "sourcesContent": ["document.oncontextmenu = context_menu;\n \nfunction context_menu(e) {\n    if (!e) var e = window.event;\n    var eTarget = (window.event) ? e.srcElement : e.target;\n \n    if (eTarget.nodeName == \"IMG\") {\n        //context menu attempt on top of an image element\n        return false;\n    }\n}"]
    }
    */

    // sources
    if (Array.isArray(sourceMap.sources) === false) {
        sourceMap.sources = missingSource()
    }

    if (sourceMap.sources.length === 0) {
        sourceMap.sources = missingSource()
    }

    if (sourceMap.sources.length === 1 &&
       (sourceMap.sources[0] === 'unknown' || sourceMap.sources[0] === '?' || sourceMap.sources[0] === '')) {
        sourceMap.sources = missingSource()
    }

    for (let i in sourceMap.sources) {
        sourceMap.sources[i] = sourceMap.sources[i].replace(/\.\.\//g, '')
    }

    // names
    if (sourceMap.names === undefined) {
        sourceMap.names = []
    }

    // mappings
    if (sourceMap.mappings === undefined) {
        sourceMap.mappings = ''
    }

    // file
    sourceMap.file = path.basename(obj.dest)
    if (sourceMap.file.toLowerCase().endsWith('.map')) {
        sourceMap.file = functions.removeExt(sourceMap.file)
    }

    // source root
    sourceMap.sourceRoot = config.sourceRoot

    // sources content
    if (sourceMap.sourcesContent === undefined) {
        // fall back to obj.data since more specific sources are not available
        sourceMap.sourcesContent = [obj.data]
    }

    return sourceMap
} // normalizeSourceMap

functions.objFromSourceMap = function functions_objFromSourceMap(obj, sourceMap) {
    /*
    Create a reusable object based on a source map.
    @param   {Object}  obj        Reusable object originally created by build.processOneBuild
    @param   {Object}  sourceMap  Source map to use in the data field of the returned object.
    @return  {Object}             A reusable object crafted especially for build.map
    */
    return {
        'source': obj.dest + '.map',
        'dest': obj.dest + '.map',
        'data': JSON.stringify(sourceMap),
        'build': true
    }
} // objFromSourceMap

functions.occurrences = function functions_occurrences(string, subString, allowOverlapping) {
    /*
    Find out how many characters or strings are in a string.
    @param   {String}   string              String to search.
    @param   {String}   subString           Character or string to search for.
    @param   {Boolean}  [allowOverlapping]  Optional and defaults to false.
    @return  {Number}                       Number of occurrences of 'subString' in 'string'.
    */
    // This function comes from http://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string
    string += ''
    subString += ''

    if (subString.length <= 0) {
        return string.length + 1
    }

    let n = 0
    let pos = 0

    let step = (allowOverlapping) ? 1 : subString.length

    while (true) {
        pos = string.indexOf(subString, pos)

        if (pos >= 0) {
            n++
            pos += step
        } else {
            break
        }
    }

    return n
} // occurrences

functions.possibleSourceFiles = function functions_possibleSourceFiles(filePath) {
    /*
    Figure out all the possible source files for any given destination file path.
    @param   {String}  filepath  File path like '/dest/code.js'
    @return  {Object}            Array of possible source files.
    */
    filePath = functions.destToSource(filePath)

    let destExt = functions.fileExtension(filePath)
    let sources = [filePath]

    if (functions.fileExtension(filePath) !== 'concat' && config.fileType.concat.enabled) {
        sources.push(filePath + '.concat')
    }

    if (config.map.destToSourceExt.hasOwnProperty(destExt)) {
        let proceed = false

        if (destExt === 'map') {
            if (config.sourceMaps) {
                proceed = true
            } else {
                try {
                    let parentFileType = functions.fileExtension(functions.removeExt(filePath))

                    if (config.fileType[parentFileType].sourceMaps) {
                        proceed = true
                    }
                } catch(e) {
                    // do nothing
                }
            }
        } else if (destExt === 'gz') {
            try {
                let parentFileType = functions.fileExtension(functions.removeExt(filePath))

                if (config.map.sourceToDestTasks[parentFileType].indexOf('gz') >= 0) {
                    proceed = true
                }
            } catch(e) {
                // do nothing
            }
        } else {
            // file is not a GZ or MAP file type
            proceed = true
        }

        if (proceed) {
            let ext = ''
            let filePathMinusOneExt = ''

            let len = config.map.destToSourceExt[destExt].length

            for (let i = 0; i < len; i++) {
                ext = config.map.destToSourceExt[destExt][i]

                if (ext === '*') {
                    // extension is in addition to another extension
                    // for example, index.html.gz, library.js.map, etc...

                    // trim off one file extension
                    filePathMinusOneExt = functions.removeExt(filePath)

                    if (filePathMinusOneExt.indexOf('.') >= 0) {
                        // call self recursively
                        sources = sources.concat(functions.possibleSourceFiles(filePathMinusOneExt))
                    }
                } else {
                    let sourceFilePath = functions.changeExt(filePath, ext)
                    sources.push(sourceFilePath)
                    if (config.fileType.concat.enabled) {
                        sources.push(sourceFilePath + '.concat') // check for a file like code.js.concat
                    }
                }
            }
        }
    }

    return sources
} // possibleSourceFiles

functions.readFile = function functions_readFile(filePath, encoding) {
    /*
    Promise version of fs.readFile.
    @param   {String}  filePath    File path like '/dest/index.html'
    @param   {String}  [encoding]  Optional and defaults to 'utf8'
    @return  {String}              Data from file.
    */
    encoding = encoding || 'utf8'

    return fsReadFilePromise(filePath, { 'encoding': encoding })
} // readFile

functions.readFiles = function functions_readFiles(filePaths, encoding) {
    /*
    Sequentially read in multiple files and return an array of their contents.
    @param   {Object}   filePaths   Array of file paths like ['/source/file1.txt', '/source/file2.txt']
    @param   {String}   [encoding]  Optional and defaults to 'utf8'
    @return  {Promise}              Promise that returns an array of data like ['data from file1', 'data from file2']
    */
    encoding = encoding || 'utf8'

    let len = filePaths.length
    let p = Promise.resolve([])

    for (let i = 0; i < len; i++) {
        (function() {
            let file = filePaths[i]
            p = p.then(function(dataArray) {
                return functions.readFile(file, encoding).then(function(data) {
                    dataArray.push(data)
                    return dataArray
                }).catch(function(err) {
                    dataArray.push('')
                    return dataArray
                })
            })
        })()
    }

    return p
} // readFiles

functions.removeDest = function functions_removeDest(filePath, log, isDir) {
    /*
    Remove file or folder if unrelated to the source directory.
    @param   {String}   filePath  Path to a file or folder.
    @param   {Boolean}  [log]     Optional and defaults to true. Set to false to disable console log removal messages.
    @param   {Boolean}  [isDir]   Optional and defaults to false. If true, log with 'words.removedDir' instead of 'words.remove'.
    @return  {Promise}            Promise that returns true if the file or folder was removed successfully otherwise an error if not.
    */
    log = (log === false) ? false : true
    isDir = (isDir === true) ? true : false

    return Promise.resolve().then(function() {
        if (filePath.indexOf(config.path.source) >= 0) {
            throw 'functions.removeDest -> ' + shared.language.display('error.removeDest') + ' -> ' + filePath
        }

        return rimrafPromise(filePath).then(function() {
            if (log) {
                let message = 'words.removed'

                if (isDir) {
                    message = 'words.removedDirectory'
                }

                functions.log(color.gray(filePath.replace(config.path.dest, '/' + path.basename(config.path.dest)).replace(/\\/g, '/') + ' ' + shared.language.display(message)))
            }
            return true
        })
    })
} // removeDest

functions.removeExt = function functions_removeExt(filePath) {
    /*
    Remove one extension from a file path.
    @param   {String}  filePath  File path like '/files/index.html.gz'
    @return  {String}            File path like '/files/index.html'
    */
    return filePath.substr(0, filePath.lastIndexOf('.'))
} // removeExt

functions.removeFile = function functions_removeFile(filePath) {
    /*
    Remove a file or folder.
    @param   {String}   filePath  String like '/dest/index.html'
    @return  {Promise}            Promise that returns true if the file or folder was removed or if there was nothing to do. An error otherwise.
    */
    return rimrafPromise(filePath).then(function() {
        return true
    })
} // removeFile

functions.removeFiles = function functions_removeFile(files) {
    /*
    Remove files and folders.
    @param   {String,Object}  files  String like '/dest/index.html' or Object like ['/dest/index.html', '/dest/css']
    @return  {Promise}               Promise that returns true if the files and folders were removed or if there was nothing to do. An error otherwise.
    */
    if (typeof files === 'string') {
        files = [files]
    }

    let promiseArray = []

    for (let i in files) {
        promiseArray.push(functions.removeFile(files[i]))
    }

    return Promise.all(promiseArray).then(function() {
        return true
    })
} // removeFiles

functions.restoreObj = function functions_restoreObj(obj, fromObj) {
    /*
    Restore an object without affecting any references to said object.
    @return {Object}    obj     Object to be restored.
    @param  {Object}    fromObj Object to restore from.
    @return {Object}            Object that is a restore of the original. Not a reference.
    */
    for (let i in obj) {
        delete obj[i]
    }

    for (let key in fromObj) {
        obj[key] = functions.cloneObj(fromObj[key])
    }

    return obj
} // restoreObj

functions.sharedStatsTimeTo = function functions_sharedStatsTimeTo(time) {
    /*
    Get the current time or return the time elapsed in seconds from a previous time.
    @param   {Number}  [time]  Optional and defaults to 0. Commonly a number produced by a previous call to this function.
    @return  {Number}
    */
    time = time || 0

    if (time === 0) {
        // start timer
        time = new Date().getTime()
    } else {
        // calculate time past in seconds
        time = (new Date().getTime() - time) / 1000
    }

    return time
} // sharedStatsTimeTo

functions.setLanguage = function functions_setLanguage(lang) {
    /*
    Replace the shared.language.loaded object with the contents of a JSON language file.
    @param   {String}   [lang]  Optional. Defaults to using the value specified by config.language
    @return  {Promise}          Promise that returns true if everything is ok otherwise an error.
    */
    if (typeof lang === 'string') {
        config.language = lang
    }

    let file = path.join(shared.path.self, 'language', (config.language + '.json'))

    return functions.readFile(file).then(function(data) {
        shared.language.loaded = JSON.parse(data)

        return true
    })
} // setLanguage

functions.sourceToDest = function functions_sourceToDest(source) {
    /*
    Convert source path to its destination equivalent.
    @param   {String}  source  File path like '/source/index.html'
    @return  {String}          File path like '/dest/index.html'
    */
    let sourceExt = functions.fileExtension(source)

    let dest = source.replace(config.path.source, config.path.dest)

    if (sourceExt === 'concat') {
        sourceExt = functions.fileExtension(functions.removeExt(source))
        dest = functions.removeExt(dest)
    }

    for (let destExt in config.map.destToSourceExt) {
        if (config.map.destToSourceExt[destExt].indexOf(sourceExt) >= 0) {
            dest = functions.changeExt(dest, destExt)
            break
        }
    }

    return dest
} // sourceToDest

functions.stats = function functions_stats() {
    /*
    Returns a copy of the shared.stats object for programatic consumers.
    @return  {Object}
    */
    return functions.cloneObj(shared.stats)
}

functions.trimSource = function functions_trimSource(filePath) {
    /*
    Trim most of the source path off a string.
    @param   {String}  filePath  File path like '/web/projects/source/index.html'
    @return  {String}            String like '/source/index.html'
    */
    return filePath.replace(path.dirname(config.path.source), '')
} // tirmSource

functions.trimDest = function functions_trimDest(filePath) {
    /*
    Trim most of the dest path off a string.
    @param   {String}  filePath  File path like '/web/projects/dest/index.html'
    @return  {String}            String like '/dest/index.html'
    */
    return filePath.replace(path.dirname(config.path.dest), '')
} // trimDest

functions.uniqueArray = function functions_uniqueArray(array) {
    /*
    Keep only unique values in an array.
    @param   {Object}  array  Array like [0,0,7]
    @return  {Object}         Array like [0,7]
    */
    // Code from http://stackoverflow.com/questions/1960473/unique-values-in-an-array
    return array.filter(function (a, b, c) {
        // keeps first occurrence
        return c.indexOf(a) === b
    })
} // uniqueArray

functions.upgradeAvailable = function functions_upgradeAvailable(specifyRemoteVersion) {
    /*
    Find out if a Feri upgrade is available.
    @param   {String}   specifyRemoteVersion  Specify a remote version string like 1.2.3 instead of looking up the exact version on GitHub. Useful for testing.
    @return  {Promise}                        Promise that returns a string with the latest version of Feri if an upgrade is available. Returns a boolean false otherwise.
    */
    specifyRemoteVersion = specifyRemoteVersion || false

    return new Promise(function(resolve, reject) {

        if (specifyRemoteVersion) {
            resolve('{ "version": "' + specifyRemoteVersion + '" }')
        } else {
            if (typeof https !== 'object') {
                https = require('https')
            }

            https.get({
                host: 'raw.githubusercontent.com',
                path: '/nightmode/feri/master/package.json'
            }, function(response) {
                // explicitly treat incoming data as utf8 (avoids issues with multi-byte chars)
                response.setEncoding('utf8')

                let data = ''

                response.on('data', function(chunk) {
                    data += chunk
                })

                response.on('end', function() {
                    resolve(data)
                })

                response.on('error', function(e) {
                    reject(e)
                })
            }).on('error', function(e) {
                reject(e)
            })
        } // if

    }).then(function(data) {

        let remoteVersion = '0.0.0'

        try {
            remoteVersion = JSON.parse(data).version
        } catch(e) {
            // do nothing
        }

        let localVersion = require('../package.json').version

        if (typeof compareVersions !== 'object') {
            compareVersions = require('compare-versions')
        }

        if (compareVersions(remoteVersion, localVersion) > 0) {
            return remoteVersion
        } else {
            return false
        }

    }).catch(function(err) {

        return false

    })

} // upgradeAvailable

functions.useExistingSourceMap = function functions_useExistingSourceMap(filePath) {
    /*
    Use an existing source map if it was modified recently otherwise remove it.
    @param   {String}   filePath  Path to a file that may also have a separate '.map' file associated with it.
    @return  {Promise}            Promise that will return a source map object that was generated recently or a boolean false.
    */
    filePath += '.map'

    let removeFile = false

    return functions.fileExistsAndTime(filePath).then(function(mapFile) {

        if (mapFile.exists) {
            // map file already exists but has it been generated recently?
            if (mapFile.mtime < (new Date().getTime() - 5000)) {
                // map file is older than 5 seconds and most likely not just built
                // remove old map file so the build tool calling this function can genereate a new one
                removeFile = true
            } else {
                return functions.readFile(filePath).then(function(data) {
                    try {
                        let sourceMap = JSON.parse(data)
                        return sourceMap
                    } catch(e) {
                        removeFile = true
                        return false
                    }
                })
            }
        } else {
            return false
        }

    }).then(function(sourceMap) {

        if (removeFile) {
            return functions.removeDest(filePath, false).then(function() {
                return false
            })
        } else {
            return sourceMap
        }

    })
} // useExistingSourceMap

functions.writeFile = function functions_writeFile(filePath, data, encoding) {
    /*
    Promise version of fs.writeFile.
    @param   {String}   filePath    File path like '/web/dest/index.html'
    @param   {String}   data        Data to be written.
    @param   {String}   [encoding]  Optional and defaults to 'utf8'
    @return  {Promise}              Promise that returns true if the file was written otherwise an error.
    */
    let options = {
        'encoding': encoding || 'utf8'
    }

    return fsWriteFilePromise(filePath, data, options).then(function() {
        return true
    })
} // writeFile

//---------------------
// Functions: Includes
//---------------------
functions.includesNewer = function functions_includesNewer(includePaths, fileType, destTime) {
    /*
    Figure out if any include files are newer than the modified time of the destination file.
    @param   {Object}   includePaths  Array of file paths like ['/source/_header.file', '/source/_footer.file']
    @param   {String}   fileType      File type like 'stylus'.
    @param   {Number}   destTime      Modified time of the destination file.
    @return  {Promise}                Promise that returns true if any includes files are newer.
    */
    return Promise.resolve().then(function() {

        let newer = false

        let includesMap = includePaths.map(function(include) {
            if (newer) {
                // one of the promises must have set rebuild = true so return early
                return true
            }

            // make an object friendly property version of the file name by removing forward slashes and periods
            let fileName = include.replace(/[\/\.]/g, '')

            if (!shared.cache.includesNewer.hasOwnProperty(fileType)) {
                shared.cache.includesNewer[fileType] = {}
            }

            if (shared.cache.includesNewer[fileType].hasOwnProperty(fileName)) {
                // we already know the date
                if (shared.cache.includesNewer[fileType][fileName] > destTime) {
                    newer = true
                }
            } else {
                return fsStatPromise(include).then(function(stat) {
                    // add date to cache
                    shared.cache.includesNewer[fileType][fileName] = stat.mtime.getTime()
                    if (shared.cache.includesNewer[fileType][fileName] > destTime) {
                        newer = true
                    }
                }).catch(function(err) {
                    // the file probably does not exist so absorb the error and move on
                })
            }
        })

        return Promise.all(includesMap).then(function() {
            if (newer) {
                functions.log(color.gray(shared.language.display('message.includesNewer').replace('{extension}', fileType.toUpperCase())))
                return true
            }
            return false
        })

    })
} // includesNewer

functions.includePathsConcat = function functions_includePathsConcat(data, filePath, includePathsCacheName) {
    /*
    Find CONCAT includes and return an array of matches.
    @param   {String}   data                     String to search for include paths.
    @param   {String}   filePath                 Source file where data came from.
    @param   {String}   [includePathsCacheName]  Optional. Unique property name used with shared.cache.includeFilesSeen to keep track of which include files have been found when recursing.
    @return  {Promise}                           Promise that returns an array of files to concatenate like ['/js/_library.js'] if successful. An error object if not.
    */
    let cleanup = false

    if (typeof includePathsCacheName === 'undefined') {
        cleanup = true
        includePathsCacheName = 'concat' + (++shared.uniqueNumber)
        shared.cache.includeFilesSeen[includePathsCacheName] = [filePath]
    }

    return Promise.resolve().then(function() {

        let dataArray = data.split(/[\r\n]+/g)

        let includes = []

        // the order of our concat file matters so find them out using a sequential promise chain

        let p = Promise.resolve([])

        for (let a in dataArray) {
            (function() {
                let match = dataArray[a].trim()

                if (match.substring(0, 2) === '//' || match.length === 0) {
                    // skip over comments and empty lines
                } else {
                    p = p.then(function() {
                        let matchIsGlob = functions.isGlob(match)

                        if (match.indexOf(config.path.source) !== 0) {
                            // path must be relative
                            match = path.join(path.dirname(filePath), match)
                        }

                        if (matchIsGlob) {
                            let options = {
                                "nocase"  : true,
                                "nodir"   : false,
                                "realpath": true
                            }

                            return functions.findFiles(match, options).then(function(files) {

                                if (files.length > 0) {
                                    for (let j in files) {
                                        if (shared.cache.includeFilesSeen[includePathsCacheName].indexOf(files[j]) < 0) {
                                            // a unique path we haven't seen yet
                                            shared.cache.includeFilesSeen[includePathsCacheName].push(files[j])
                                            includes.push(files[j])
                                        }
                                    }
                                }

                            })
                        } else {
                            if (shared.cache.includeFilesSeen[includePathsCacheName].indexOf(match) < 0) {
                                // a unique path we haven't seen yet
                                shared.cache.includeFilesSeen[includePathsCacheName].push(match)
                                includes.push(match)
                            }
                        }
                    })
                }
            })() // function
        } // for

        p = p.then(function() {
            return includes
        })

        return p

    }).then(function(includes) {

        if (includes.length > 0) {
            // now we have an array of includes like ['/full/path/to/_file.js']

            let promiseArray = []

            for (let i in includes) {
                (function() {
                    let ii = i
                    promiseArray.push(
                        functions.fileExists(includes[ii]).then(function(exists) {
                            if (exists) {
                                if (functions.fileExtension(includes[ii]) === 'concat') {
                                    return functions.readFile(includes[ii]).then(function(data) {
                                        return functions.includePathsConcat(data, includes[ii], includePathsCacheName).then(function(subIncludes) {
                                            for (let j in subIncludes) {
                                                includes.push(subIncludes[j])
                                            }
                                        })
                                    })
                                }
                            } else {
                                delete includes[ii] // leaves an empty space in the array which we will clean up later
                            }
                        })
                    )
                })()
            } // for

            return Promise.all(promiseArray).then(function() {

                // clean out any empty includes which meant their files could not be found
                includes = functions.cleanArray(includes)

            }).then(function() {
                return includes
            })
        } else {
            return includes
        }

    }).then(function(includes) {

        if (cleanup) {
            delete shared.cache.includeFilesSeen[includePathsCacheName]

            for (let j in includes) {
                if (functions.fileExtension(includes[j]) === 'concat') {
                    delete includes[j]
                }
            }

            // clean any empty concat entries
            includes = functions.cleanArray(includes)
        }

        return includes

    })
} // includePathsConcat

functions.includePathsStylus = function functions_includePathsStylus(data, filePath, includePathsCacheName) {
    /*
    Find Stylus includes and return an array of matches.
    @param   {String}   data                     String to search for includes paths.
    @param   {String}   filePath                 Full file path to where data came from.
    @param   {String}   [includePathsCacheName]  Optional. Unique property name used with shared.cache.includeFilesSeen to keep track of which include files have been found when recursing.
    @return  {Promise}                           Promise that returns an array of includes like ['/partials/_fonts.styl'] if successful. An error object if not.
    */
    let cleanup = false

    if (typeof includePathsCacheName === 'undefined') {
        cleanup = true
        includePathsCacheName = 'styl' + (++shared.uniqueNumber)
        shared.cache.includeFilesSeen[includePathsCacheName] = [filePath]
    }

    return Promise.resolve().then(function() {

        /*
        Regular Expression should match...

            @require "file.styl"
            @require file.styl
            @import 'file'
            @import 'file.css'
            @import 'mixins/*'

        Notes from https://learnboost.github.io/stylus/docs/import.html

            When using @import without the .css extension, it’s assumed to be a Stylus sheet (e.g., @import "mixins/border-radius").

            @import also supports index styles. This means when you @import blueprint, it will resolve either blueprint.styl or blueprint/index.styl. This is really useful for libraries that want to expose all their features, while still allowing feature subsets to be imported.

            Stylus supports globbing. With it you could import many files using a file mask:
                @import 'product/*'
        */
        let re = /^(?:\s)*@(require|import)([^;\n]*).*$/gmi

        let match
        let includes = []
        let globs = []

        while (match = re.exec(data)) {
            match = match[2].trim()

            try {
                match = eval(match)
            } catch(e) {
                // do nothing
            }

            if (path.extname(match) === 'css') {
                // leave CSS @import as is
            } else {
                if (match.indexOf(config.path.source) !== 0) {
                    // path must be relative
                    match = path.join(path.dirname(filePath), match)
                }

                if (functions.isGlob(match)) {
                    // we are dealing with a glob
                    globs.push(match.replace(/\.styl/i, '') + '.styl')
                    continue
                }

                // extension-less imports
                if (!path.extname(match)) {
                    // import could be a stylus file
                    if (shared.cache.includeFilesSeen[includePathsCacheName].indexOf(match + '.styl') < 0) {
                        // a unique path we haven't seen yet so continue
                        shared.cache.includeFilesSeen[includePathsCacheName].push(match + '.styl')
                        includes.push(match + '.styl')
                    } else {
                        // already seen this include
                    }

                    // import could also be an index stylus file in a sub folder
                    if (shared.cache.includeFilesSeen[includePathsCacheName].indexOf(match + '/index.styl') < 0) {
                        shared.cache.includeFilesSeen[includePathsCacheName].push(match + '/index.styl')
                        includes.push(match + '/index.styl')
                    }
                } else {
                    if (shared.cache.includeFilesSeen[includePathsCacheName].indexOf(match) < 0) {
                        shared.cache.includeFilesSeen[includePathsCacheName].push(match)
                        includes.push(match)
                    }
                }
            }
        }

        if (globs.length > 0) {

            let promiseArray = []

            for (let i in globs) {
                (function() {
                    let ii = i
                    let options = {
                        "nocase"  : true,
                        "nodir"   : false,
                        "realpath": true
                    }
                    promiseArray.push(
                        functions.findFiles(globs[ii], options).then(function(files) {
                            if (files.length > 0) {
                                for (let j in files) {
                                    includes.push(files[j])
                                }
                            }
                        })
                    )
                })()
            } // for

            return Promise.all(promiseArray).then(function() {
                return includes
            })
        } else {
            return includes
        }

    }).then(function(includes) {

        if (includes.length > 0) {
            // now we have an array of includes like ['/full/path/css/_fonts.styl']

            let promiseArray = []

            for (let i in includes) {
                (function() {
                    let ii = i
                    promiseArray.push(
                        functions.fileExists(includes[ii]).then(function(exists) {
                            if (exists) {
                                return functions.readFile(includes[ii]).then(function(data) {
                                    return functions.includePathsStylus(data, includes[ii], includePathsCacheName).then(function(subIncludes) {
                                        for (let j in subIncludes) {
                                            includes.push(subIncludes[j])
                                        }
                                    })
                                })
                            } else {
                                delete includes[ii] // leaves an empty space in the array which we will clean up later

                            }
                        })
                    )
                })()
            } // for

            return Promise.all(promiseArray).then(function() {

                // clean out any empty includes which meant their files could not be found
                includes = functions.cleanArray(includes)

                return includes

            })
        } else {
            return includes
        }

    }).then(function(includes) {

        if (cleanup) {
            delete shared.cache.includeFilesSeen[includePathsCacheName]
        }

        return includes

    })
} // includePathsStylus

//-------------------------------------
// Functions: Reusable Object Building
//-------------------------------------
functions.objBuildWithIncludes = function functions_objBuildWithIncludes(obj, includeFunction) {
    /*
    Figure out if a reusable object, which may have include files, needs to be built in memory.
    @param   {Object}    obj              Reusable object originally created by build.processOneBuild
    @param   {Function}  includeFunction  Function that will parse this particular type of file (stylus for example) and return any paths to include files.
    @return  {Promise}                    Promise that returns a reusable object.
    */
    let destTime = 0
    let sourceExt = functions.fileExtension(obj.source)

    obj.build = false

    return Promise.resolve().then(function() {

        if (obj.data !== '') {
            // a previous promise has filled in the data variable so we should rebuild this file
            obj.build = true
        } else if (obj.dest !== '') {
            // make sure obj.dest does not point to a file in the source directory
            if (functions.inSource(obj.dest)) {
                throw 'functions.objBuildWithIncludes -> ' + shared.language.display('error.destPointsToSource')
            } else {
                // read dest file into memory
                return fsReadFilePromise(obj.dest, { encoding: 'utf8' }).then(function(data) {
                    obj.data = data
                    obj.build = true
                }).catch(function(err) {
                    throw 'functions.objBuildWithIncludes -> ' + shared.language.display('error.missingDest')
                })
            }
        } else {
            // just a source file to work from

            // figure out dest
            obj.dest = functions.sourceToDest(obj.source)

            if (config.option.forcebuild) {
                obj.build = true
            } else {
                // check to see if the source file is newer than a possible dest file
                return functions.filesExistAndTime(obj.source, obj.dest).then(function(files) {
                    if (!files.source.exists) {
                        // missing source file
                        throw 'functions.objBuildWithIncludes -> ' + shared.language.display('error.missingSource')
                    }

                    if (files.dest.exists) {
                        // source and dest exist so compare their times
                        if (files.source.mtime > files.dest.mtime) {
                            obj.build = true
                        }

                        destTime = files.dest.mtime // save destTime so we can check includes against it to see if they are newer
                    } else {
                        // dest file does not exist so build it
                        obj.build = true
                    }
                })
            }
        }

    }).then(function() {

        if (obj.data === '') {
            // read the source because we are either rebuilding or we need to check to see if any include files are newer than our dest file
            return fsReadFilePromise(obj.source, { encoding: 'utf8' }).then(function(data) {
                obj.data = data
            })
        }

    }).then(function() {

        if (!obj.build) {
            // check includes to see if any of them are newer
            return Promise.resolve().then(function() {
                return includeFunction(obj.data, obj.source).then(function(includes) {
                    return functions.includesNewer(includes, sourceExt, destTime)
                })
            })
        }

    }).then(function(includesNewer) {

        if (obj.build || includesNewer) {
            obj.build = true
        }

        return obj

    })
} // objBuildWithIncludes

functions.objBuildInMemory = function functions_objBuildInMemory(obj) {
    /*
    Figure out if a reusable object needs to be built in memory.
    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */
    obj.build = false

    return Promise.resolve().then(function() {

        if (obj.data !== '') {
            // a previous promise has filled in the data variable so we should rebuild this file
            obj.build = true
        } else if (obj.dest !== '') {
            // make sure obj.dest does not point to a file in the source directory
            if (functions.inSource(obj.dest)) {
                throw 'functions.objBuildInMemory -> ' + shared.language.display('error.destPointsToSource')
            } else {
                // read dest file into memory
                return fsReadFilePromise(obj.dest, { encoding: 'utf8' }).then(function(data) {
                    obj.data = data
                    obj.build = true
                }).catch(function(err) {
                    throw 'functions.objBuildInMemory -> ' + shared.language.display('error.missingDest')
                })
            }
        } else {
            // just a source file to work from

            // figure out dest
            obj.dest = functions.sourceToDest(obj.source)

            if (config.option.forcebuild) {
                obj.build = true
            } else {
                // check to see if the source file is newer than a possible dest file
                return functions.filesExistAndTime(obj.source, obj.dest).then(function(files) {
                    if (!files.source.exists) {
                        // missing source file
                        throw 'functions.objBuildInMemory -> ' + shared.language.display('error.missingSource')
                    }

                    if (files.dest.exists) {
                        // source and dest exist so compare their times
                        if (files.source.mtime > files.dest.mtime) {
                            obj.build = true
                        }
                    } else {
                        // dest file does not exist so build it
                        obj.build = true
                    }
                })
            }
        }

    }).then(function() {

        if (obj.build && obj.data === '') {
            // read source file into memory
            return fsReadFilePromise(obj.source, { encoding: 'utf8' }).then(function(data) {
                obj.data = data
            })
        }

    }).then(function() {

        return obj

    })
} // objBuildInMemory

functions.objBuildOnDisk = function functions_objBuildOnDisk(obj) {
    /*
    Figure out if a reusable object needs to be written to disk and if so, prepare for a command line program to use it next.
    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */
    obj.build = false

    return Promise.resolve().then(function() {

        if (obj.data !== '') {
            // a previous promise has filled in the data variable so we should rebuild this file
            obj.build = true

            if (obj.dest === '') {
                obj.dest = functions.sourceToDest(obj.source)
            } else {
                // make sure obj.dest does not point to a file in the source directory
                if (functions.inSource(obj.dest)) {
                    throw 'functions.objBuildOnDisk -> ' + shared.language.display('error.destPointsToSource')
                }
            }

            // write to dest file
            return functions.makeDirPath(obj.dest).then(function() {
                return fsWriteFilePromise(obj.dest, obj.data)
            }).then(function() {
                obj.data = ''

                // set source to dest so any command line programs after this will compile dest to dest
                obj.source = obj.dest
            })
        } else if (obj.dest !== '') {
            // dest file is already in place
            return functions.fileExists(obj.dest).then(function(exists) {
                if (exists) {
                    obj.build = true

                    // set source to dest so any command line programs after this will compile dest to dest
                    obj.source = obj.dest
                } else {
                    obj.dest = ''
                    return functions.objBuildOnDisk(obj)
                }
            })
        } else {
            // just a source file to work from

            // figure out dest
            obj.dest = functions.sourceToDest(obj.source)

            if (config.option.forcebuild) {
                obj.build = true
                return functions.makeDirPath(obj.dest)
            } else {
                // check to see if the source file is newer than a possible dest file
                return functions.filesExistAndTime(obj.source, obj.dest).then(function(files) {
                    if (!files.source.exists) {
                        // missing source file
                        throw 'functions.objBuildOnDisk -> ' + shared.language.display('error.missingSource')
                    }

                    if (files.dest.exists) {
                        // source and dest exist so compare their times
                        if (files.source.mtime > files.dest.mtime) {
                            obj.build = true
                        }
                    } else {
                        // dest file does not exist so build it
                        obj.build = true

                        return functions.makeDirPath(obj.dest)
                    }
                })
            }
        }

    }).then(function() {

        return obj

    })
} // objBuildOnDisk

//---------
// Exports
//---------
module.exports = functions