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
const rimraf = require('rimraf') // ~ 13 ms
const util   = require('util')   // ~  1 ms

//---------------------
// Includes: Promisify
//---------------------
const fsReaddir          = util.promisify(fs.readdir)   // ~ 1 ms
const fsReadFilePromise  = util.promisify(fs.readFile)  // ~ 1 ms
const fsStatPromise      = util.promisify(fs.stat)      // ~ 1 ms
const fsWriteFilePromise = util.promisify(fs.writeFile) // ~ 1 ms
const mkdirpPromise      = util.promisify(mkdirp)       // ~ 1 ms
const rimrafPromise      = util.promisify(rimraf)       // ~ 1 ms

//---------------------
// Includes: Lazy Load
//---------------------
let https     // require('https')           // ~ 33 ms
let playSound // require('node-wav-player') // ~ 11 ms

//-----------
// Variables
//-----------
let playSoundLastFile = '' // used by functions.playSound()
let playSoundPlaying = false // used by functions.playSound()
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

functions.buildEmptyOk = function functions_buildEmptyOk(obj) {
    /*
    Allow empty files to be built in memory once they get to build.finalize.
    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */
    if (obj.build && obj.data === '') {
        // empty files are valid files
        // add a space to obj.data so build.finalize builds the file from memory and does not copy the source file directly to the destination
        obj.data = ' '
    }

    return obj
} // buildEmptyOk

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

functions.concatMetaClean = async function functions_concatMetaClean() {
    /*
    Silently clean up any orphaned '.filename.ext.concat' meta files in the source directory.
    */
    let metaFiles = await functions.findFiles(config.path.source + '/**/.*.concat')

    for (const file of metaFiles) {
        const originalFile = path.join(path.dirname(file), path.basename(file).replace('.', ''))

        const originalExists = await functions.fileExists(originalFile)

        if (originalExists === false) {
            await functions.removeFile(file)
        }
    }
} // concatMetaClean

functions.concatMetaRead = async function functions_concatMetaRead(file) {
    /*
    Read a meta information file which lists the includes used to build a concat file.
    @param  {String}  file  Full file path to a source concat file.
    */
    file = path.join(path.dirname(file), '.' + path.basename(file))

    let data = ''

    try {
        data = await functions.readFile(file)
        data = JSON.parse(data)
        data = data.map(i => path.join(config.path.source, i))
    } catch (error) {
        // do nothing
    }

    return data
} // concatMetaRead

functions.concatMetaWrite = async function functions_concatMetaWrite(file, includeArray) {
    /*
    Write a meta information file with a list of includes used to build a concat file.
    @param  {String}  file          Full file path to a source concat file.
    @param  {Object}  includeArray  Array of include file strings.
    */

    file = path.join(path.dirname(file), '.' + path.basename(file))

    // make sure we are going to write to the source folder only
    if (file.indexOf(config.path.source) !== 0) {
        throw new Error('functions.concatMetaWrite -> refusing to write to non source location "' + file + '"')
    }

    let data = includeArray.map(i => i.replace(config.path.source, ''))
    data = JSON.stringify(data)

    await functions.writeFile(file, data)
} // concatMetaWrite

functions.configPathsAreGood = function functions_configPathsAreGood() {
    /*
    Ensure source and destination are not blank, not the same, and not in each other's path. Also ensure that the destination is not a protected folder.
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
    Convert a destination path to its source equivalent.
    @param   {String}  dest  File path like '/dest/index.html'
    @return  {String}        File path like '/source/index.html'
    */
    let source = dest.replace(config.path.dest, '').replace(config.path.source, '')

    switch (config.case.source) {
        case 'upper':
            source = source.toUpperCase()
            break
        case 'lower':
            source = source.toLowerCase()
            break
    } // switch

    source = config.path.source + source

    return source
} // destToSource

functions.detectCaseDest = async function functions_detectCaseDest() {
    /*
    Find out how a destination folder deals with case. Writes a test file once and then caches that result for subsequent calls.
    @return  {Promise}  Promise that returns a string like 'lower', 'upper', 'nocase', or 'case'.
    */

    /*
    Testing results.
        Mac
            ExFAT = nocase
            MS-DOS (FAT-32) = nocase
            Mac OS Extended (Journaled) = nocase
            Mac OS Extended (Case-sensitive, Journaled) = case
        Linux
            Ext4 = case
        Windows
            NTFS = nocase // beware... windows 10 can supposedly set individual folders to 'case'
    */
    const dest = config.path.dest

    if (shared.folder.dest.lastPath === dest) {
        // dest has not changed since we last checked
        if (shared.folder.dest.case !== '') {
            // case is not empty so return the previuosly figured out case
            return Promise.resolve(shared.folder.dest.case)
        }
    } else {
        shared.folder.dest.lastPath = dest
    }

    const file = 'aB.feri'
    const fileLowerCase = file.toLowerCase()
    const fileUpperCase = file.toUpperCase()

    const fileFullPath = path.join(dest, file)

    try {
        // try to delete a previous test file
        await functions.removeFile(fileFullPath)
    } catch (error) {
        // do nothing
    }

    let result = '' // will be set to 'lower', 'upper', 'nocase', or 'case'

    const writeFile = await functions.writeFile(fileFullPath, 'This is a test file created by Feri. It is safe to delete.')

    if (writeFile === false) {
        throw new Error('functions.detectCaseDest -> could not write a test file to "' + dest + '"')
    }

    const dir = await fsReaddir(dest)

    for (let i in dir) {
        if (fileLowerCase === dir[i].toLowerCase()) {
            // this is our matching file

            if (fileLowerCase === dir[i]) {
                // the destination forces all file names to lowercase
                result = 'lower'
            }

            if (fileUpperCase === dir[i]) {
                // the destination forces all file names to uppercase
                result = 'upper'
            }

            break
        }
    }

    if (result === '') {
        // ask the os for a lower case version of the test file
        let fileExists = false

        try {
            await fsStatPromise(path.join(dest, fileLowerCase))
            fileExists = true
        } catch (error) {
            // do nothing
        }

        if (fileExists) {
            // the destination folder is NOT case sensitive
            result = 'nocase'
        } else {
            // the destination folder is case sensitive
            result = 'case'
        }
    }

    const removeFile = await functions.removeFile(fileFullPath)

    if (removeFile === false) {
        throw new Error('functions.detectCaseDest -> could not remove test file "' + fileFullPath + '"')
    }

    shared.folder.dest.case = result // save the result for next time so we can run faster

    return result
} // detectCaseDest

functions.detectCaseSource = async function functions_detectCaseSource() {
    /*
    Find out how a source folder deals with case. Writes a test file once and then caches that result for subsequent calls.
    @return  {Promise}  Promise that returns a string like 'lower', 'upper', 'nocase', or 'case'.
    */

    /*
    Testing results.
        Mac
            ExFAT = nocase
            MS-DOS (FAT-32) = nocase
            Mac OS Extended (Journaled) = nocase
            Mac OS Extended (Case-sensitive, Journaled) = case
        Linux
            Ext4 = case
        Windows
            NTFS = nocase // beware... windows 10 can supposedly set individual folders to 'case'
    */
    const source = config.path.source

    if (shared.folder.source.lastPath === source) {
        // source has not changed since we last checked
        if (shared.folder.source.case !== '') {
            // case is not empty so return the previuosly figured out case
            return Promise.resolve(shared.folder.source.case)
        }
    } else {
        shared.folder.source.lastPath = source
    }

    const file = 'aB.feri'
    const fileLowerCase = file.toLowerCase()
    const fileUpperCase = file.toUpperCase()

    const fileFullPath = path.join(source, file)

    try {
        // try to delete a previous test file
        await functions.removeFile(fileFullPath)
    } catch (error) {
        // do nothing
    }

    let result = '' // will be set to 'lower', 'upper', 'nocase', or 'case'

    const writeFile = await functions.writeFile(fileFullPath, 'This is a test file created by Feri. It is safe to delete.')

    if (writeFile === false) {
        throw new Error('functions.detectCaseSource -> could not write a test file to "' + source + '"')
    }

    const dir = await fsReaddir(source)

    for (let i in dir) {
        if (fileLowerCase === dir[i].toLowerCase()) {
            // this is our matching file

            if (fileLowerCase === dir[i]) {
                // the source forces all file names to lowercase
                result = 'lower'
            }

            if (fileUpperCase === dir[i]) {
                // the source forces all file names to uppercase
                result = 'upper'
            }

            break
        }
    }

    if (result === '') {
        // ask the os for a lower case version of the test file
        let fileExists = false

        try {
            await fsStatPromise(path.join(source, fileLowerCase))
            fileExists = true
        } catch (error) {
            // do nothing
        }

        if (fileExists) {
            // the source folder is NOT case sensitive
            result = 'nocase'
        } else {
            // the source folder is case sensitive
            result = 'case'
        }
    }

    const removeFile = await functions.removeFile(fileFullPath)

    if (removeFile === false) {
        throw new Error('functions.detectCaseSource -> could not remove test file "' + fileFullPath + '"')
    }

    shared.folder.source.case = result // save the result for next time so we can run faster

    return result
} // detectCaseSource

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
    return functions.fileStat(filePath).then(function() {
        return true
    }).catch(function(err) {
        return false
    })
} // fileExists

functions.fileExistsAndTime = function functions_fileExistsAndTime(filePath) {
    /*
    Find out if a file exists along with its modified time.
    @param   {String}   filePath  Path to a file or folder.
    @return  {Promise}            Promise that returns an object like { exists: true, mtime: 123456789 }
    */
    return functions.fileStat(filePath).then(function(stat) {
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

functions.fileExtension = function functions_fileExtension(filePath) {
    /*
    Return a file extension from a string.
    @param   {String}  filePath  File path like '/conan/riddle-of-steel.txt'
    @return  {String}            String like 'txt'
    */
    return path.extname(filePath).replace('.', '').toLowerCase()
} // fileExtension

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

functions.filesExistAndTime = function functions_filesExistAndTime(source, dest) {
    /*
    Find out if one or both files exist along with their modified time.
    @param   {String}  source  Source file path like '/source/favicon.ico'
    @param   {String}  dest    Destination file path like '/dest/favicon.ico'
    @return  {Promise}         Promise that returns an object like { source: { exists: true, mtime: 123456789 }, dest: { exists: false, mtime: 0 } }
    */

    let files = [source, dest].map(function(file) {
        return functions.fileExistsAndTime(file)
    })

    return Promise.all(files).then(function(array) {
        return {
            'source': array[0],
            'dest': array[1]
        }
    })
} // filesExistAndTime

functions.fileSize = function functions_fileSize(filePath) {
    /*
    Find out the size of a file or folder.
    @param  {String}   filePath  Path to a file or folder.
    @return {Promise}            Promise that will return the number of bytes or 0.
    */
    return functions.fileStat(filePath).then(function(stats) {
        return stats.size
    }).catch(function(err) {
        return 0
    })
} // fileSize

functions.fileStat = async function functions_fileStat(filePath) {
    /*
    Return an fs stats object if a file or folder exists otherwise an error.
    A case sensitive version of fsStatPromise for source and dest locations.
    @param   {String}   filePath  Path to a file or folder.
    @return  {Promise}            Promise that returns an fs stats object if a file or folder exists. An error if not.
    */
    let theCase = '' // can be set to 'lower', 'upper', 'nocase', or 'case'

    if (functions.inDest(filePath)) {
        //check the file case style of the destination volume
        if (config.case.dest !== '') {
            // user specified overide
            theCase = config.case.dest
        } else {
            theCase = await functions.detectCaseDest()
        }
    } else if (functions.inSource(filePath)) {
        //check the file case style of the source volume
        if (config.case.source !== '') {
            // user specified overide
            theCase = config.case.source
        } else {
            theCase = await functions.detectCaseSource()
        }
    } else {
        // this file is not in the source or dest
        // this can happen during mocha tests
        return fsStatPromise(filePath)
    }

    const isConcat = (functions.fileExtension(filePath) === 'concat')

    if (theCase === 'case') {
        // this volume is case sensitive so we can use fsStatPromise to ask for a very specific file like 'inDex.html' and be sure that it will not match a pre-existing file like 'index.html'

        if (isConcat) {
            // do a fuzzy case match for the 'concat' extension part of a file name only
            const dirName = path.dirname(filePath)
            const dir = await fsReaddir(dirName)

            let fileName = path.basename(filePath)
            const fileNameLowerCase = fileName.toLowerCase()
            const fileNameSansConcat = functions.removeExt(fileName)

            for (let i in dir) {
                if (functions.fileExtension(dir[i]) === 'concat') {
                    if (fileNameSansConcat === functions.removeExt(dir[i])) {
                        // irrespective of the concat extension, an exact match
                        fileName = dir[i]
                        break
                    }
                }
            }

            return fsStatPromise(path.join(dirName, fileName))
        } // isConcat

        // ask for an exact file name match
        return fsStatPromise(filePath)
    } else {
        // this volume is NOT case sensitive so a call like fsStatPromise('inDex.html') could return true if a pre-existing file like 'index.html' already exists
        // using fsStatPromise on a volume that is NOT case sensitive can lead to files not being cleaned or built, especially if a file is renamed by changing the case of existing characters only

        const dir = await fsReaddir(path.dirname(filePath))

        let fileName = path.basename(filePath)
        let filePathActual = ''

        if (theCase === 'upper') {
            fileName = fileName.toUpperCase()
        } else if (theCase === 'lower') {
            fileName = fileName.toLowerCase()
        }

        if (isConcat) {
            // do a fuzzy case match for the 'concat' extension part of a file name only
            let fileNameSansConcat = functions.removeExt(fileName)

            for (let i in dir) {
                if (functions.fileExtension(dir[i]) === 'concat') {
                    if (fileNameSansConcat === functions.removeExt(dir[i])) {
                        // irrespective of the concat extension, an exact match
                        filePathActual = filePath
                        break
                    }
                }
            }
        } else {
            for (let i in dir) {
                if (fileName === dir[i]) {
                    // an exact match, including case
                    filePathActual = filePath
                    break
                }
            }
        }

        if (filePathActual === '') {
            throw new Error('functions.fileStat -> "' + filePath + '" does not exist')
        } else {
            // safe to call fsStatPromise since our earlier logic ensures an exact match
            return fsStatPromise(filePath)
        }
    }
} // fileStat

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

functions.inDest = function functions_inDest(filePath) {
    /*
    Find out if a path is in the destination directory.
    @param   {String}   filePath  Full file path like '/projects/dest/index.html'
    @return  {Boolean}            True if the file path is in the destination directory.
    */
    return filePath.indexOf(config.path.dest) === 0
} // inDest

functions.initFeri = async function initFeri() {
    /*
    If needed, create the source and destination folders along with a custom config file in the present working directory.
    @return  {Promise}
    */

    let messageDone = '\n' + color.gray(shared.language.display('words.done') + '.') + '\n'

    // make sure config.path.source is an absolute path in case it was set programmatically
    config.path.source = functions.figureOutPath(config.path.source)

    await functions.makeDirPath(config.path.source, true)

    // make sure config.path.dest is an absolute path in case it was set programmatically
    config.path.dest = functions.figureOutPath(config.path.dest)

    await functions.makeDirPath(config.path.dest, true)

    let configFile = path.join(shared.path.pwd, 'feri.js')
    let configFileAlt = path.join(shared.path.pwd, 'feri-config.js')

    let exists = await functions.filesExist([configFile, configFileAlt])

    if (exists.indexOf(true) >= 0) {
        functions.log(messageDone, false)
        return 'early'
    }

    let data = await functions.readFile(path.join(shared.path.self, 'templates', 'custom-config.js'))

    if (shared.slash === '\\') {
        configFile = configFileAlt
    }

    await functions.writeFile(configFile, data)

    functions.log(messageDone, false)
} // initFeri

functions.inSource = function functions_inSource(filePath) {
    /*
    Find out if a path is in the source directory.
    @param   {String}   filePath  Full file path like '/projects/source/index.html'
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
    @param  {Boolean}  [indent]  Optional and defaults to true. If true, the string will be indented using the shared.indent value.
    */
    if (shared.log) {
        indent = (indent === false) ? '' : shared.indent
        console.info(indent + message)
    }
} // log

functions.logError = function functions_logError(error) {
    /*
    Log a stack trace or text string depending on the type of object passed in.
    @param  {Object,String}  err  Error object or string describing the error.
    */
    let message = error.message || error
    let displayError = false

    if (shared.log) {
        if (message === '') {
            if (typeof error.stack === 'string') {
                displayError = true
            }
        } else {
            if (config.option.watch) {
                displayError = true
            } else {
                // check if we have seen this error before
                if (shared.cache.errorsSeen.indexOf(error) < 0) {
                    // error is unique so cache it for next time
                    shared.cache.errorsSeen.push(error)
                    displayError = true
                }
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

functions.logMultiline = function functions_logMultiline(lines, indent) {
    /*
    Log a multiline message with a single indent for the first line and two indents for subsequent lines.
    @param  {Object}   lines     Array of strings to write on separate lines.
    @param  {Boolean}  [indent]  Optional and defaults to true. If true, each indent will use the shared.indent value.
    */
    if (shared.log) {
        if (typeof lines === 'string') {
            lines = [lines]
        }

        indent = (indent === false) ? '' : shared.indent

        console.info(indent + lines.shift())

        for (const i of lines) {
            console.info(indent + indent + i)
        }
    }
} // logMultiline

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
    @return  {Promise}            Promise that returns true if successful. An error if not.
    */
    isDir = isDir || false

    if (!isDir) {
        filePath = path.dirname(filePath)
    }

    return mkdirpPromise(filePath).then(function(confirmPath) {
        return true
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

functions.playSound = function functions_playSound(file) {
    /*
    Play a sound file using https://www.npmjs.com/package/node-wav-player.
    @param  {String}  file  File path or file name string. A file name without a directory component like 'sound.wav' will be prepended with feri's sound folder location.
    */
    if (config.playSound) {
        if (path.parse(file).dir === '') {
            // prepend the default path to feri sounds
            file = path.join(shared.path.self, 'sound', file)
        }

        if (typeof playSound !== 'object') {
            playSound = require('node-wav-player')
        }

        let proceed = true

        if (playSoundPlaying) {
            // a sound is currently playing
            if (file === playSoundLastFile) {
                // same file requested as file currently playing
                proceed = false
            } else {
                playSound.stop()
            }
        }

        if (proceed) {
            playSoundPlaying = true

            playSound.play({
                path: file,
                sync: true
            }).then(function() {
                playSoundPlaying = false
            }).catch(function(err) {
                playSoundPlaying = false
            })
        }

        playSoundLastFile = file
    }
} // playSound

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
        } else if (destExt === 'br') {
            try {
                let parentFileType = functions.fileExtension(functions.removeExt(filePath))

                if (config.map.sourceToDestTasks[parentFileType].indexOf('br') >= 0) {
                    proceed = true
                }
            } catch(e) {
                // do nothing
            }
        } else {
            // file is not a BR, GZ, or MAP file type
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
    Promisified version of fs.readFile.
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

functions.removeDest = async function functions_removeDest(filePath, log, isDir) {
    /*
    Remove file or folder if unrelated to the source directory.
    @param   {String}   filePath  Path to a file or folder.
    @param   {Boolean}  [log]     Optional and defaults to true. Set to false to disable console log removal messages.
    @param   {Boolean}  [isDir]   Optional and defaults to false. If true, log with 'words.removedDir' instead of 'words.remove'.
    @return  {Promise}            Promise that returns true if the file or folder was removed successfully otherwise an error if not.
    */
    log = (log === false) ? false : true
    isDir = (isDir === true) ? true : false

    if (filePath.indexOf(config.path.source) >= 0) {
        throw new Error('functions.removeDest -> ' + shared.language.display('error.removeDest') + ' -> ' + filePath)
    }

    await functions.removeFile(filePath)

    if (log) {
        let message = 'words.removed'

        if (isDir) {
            message = 'words.removedDirectory'
        }

        functions.log(color.gray(filePath.replace(config.path.dest, '/' + path.basename(config.path.dest)).replace(/\\/g, '/') + ' ' + shared.language.display(message)))
    }

    return true
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
    return rimrafPromise(filePath, { glob: false }).then(function(error) {
        return error || true
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
    Convert a source path to its destination equivalent.
    @param   {String}  source  File path like '/source/index.html'
    @return  {String}          File path like '/dest/index.html'
    */
    let sourceExt = functions.fileExtension(source)

    let dest = source.replace(config.path.source, '').replace(config.path.dest, '')

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

    switch (config.case.dest) {
        case 'upper':
            dest = dest.toUpperCase()
            break
        case 'lower':
            dest = dest.toLowerCase()
            break
    } // switch

    dest = config.path.dest + dest

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

        let desiredPlaces = [0,1,2] // array used for iterating only

        let localVersion = require('../package.json').version
        let remoteVersion = '0.0.0'

        try {
            remoteVersion = JSON.parse(data).version
        } catch(e) {
            // do nothing
        }

        // create arrays
        localVersion  = localVersion.split('.')
        remoteVersion = remoteVersion.split('.')

        // trim arrays
        localVersion  = localVersion.slice(0, 3)
        remoteVersion = remoteVersion.slice(0, 3)

        // pad arrays that are not three places
        desiredPlaces.forEach(function(i) {
            if (typeof localVersion[i] === 'undefined') {
                localVersion.push('0')
            }

            if (typeof remoteVersion[i] === 'undefined') {
                remoteVersion.push('0')
            }
        })

        // convert strings to integers
        desiredPlaces.forEach(function(i) {
            localVersion[i] = parseInt(localVersion[i], 10) || 0
            remoteVersion[i] = parseInt(remoteVersion[i], 10) || 0
        })

        for (let i of desiredPlaces) {
            if (localVersion[i] > remoteVersion[i]) {
                // local version is newer
                break
            } else if (remoteVersion[i] > localVersion[i]) {
                // remote version is newer
                return remoteVersion.join('.')
            }
            // if you made it here, both version numbers for this place are the same, keep checking until out of places
        }

        return false

    }).catch(function(err) {

        return false

    })

} // upgradeAvailable

functions.useExistingSourceMap = async function functions_useExistingSourceMap(filePath) {
    /*
    Use an existing source map if it was modified recently otherwise remove it.
    @param   {String}   filePath  Path to a file that may also have a separate '.map' file associated with it.
    @return  {Promise}            Promise that will return a source map object that was generated recently or a boolean false.
    */
    filePath += '.map'

    let removeFile = false

    let sourceMap = false

    let mapFile = await functions.fileExistsAndTime(filePath)

    if (mapFile.exists) {
        // map file already exists but has it been generated recently?
        if (mapFile.mtime < (new Date().getTime() - 5000)) {
            // map file is older than 5 seconds and most likely not just built
            // remove old map file so the build tool calling this function can genereate a new one
            removeFile = true
        } else {
            let data = await functions.readFile(filePath)

            try {
                sourceMap = JSON.parse(data)
            } catch(e) {
                removeFile = true
            }
        }
    }

    if (removeFile) {
        await functions.removeDest(filePath, false)
        sourceMap = false
    }

    return sourceMap
} // useExistingSourceMap

functions.wait = function functions_wait(ms) {
    /*
    Promise that is useful for injecting delays and testing scenarios.
    @param   {Number}   ms  Number of milliseconds to wait before returning.
    @return  {Promise}
    */
    return new Promise(resolve => setTimeout(resolve, ms))
} // wait

functions.writeFile = function functions_writeFile(filePath, data, encoding) {
    /*
    Promisified version of fs.writeFile.
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
    @param   {String}   fileType      File type like 'concat'.
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
                return functions.fileStat(include).then(function(stat) {
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

    }).then(async function(includes) {

        if (includes.length > 0) {
            // now we have an array of includes like ['/full/path/to/_file.js']

            let promiseArray = []

            for (const i in includes) {
                const exists = await functions.fileExists(includes[i])

                if (exists) {
                    if (functions.fileExtension(includes[i]) === 'concat') {
                        const data = await functions.readFile(includes[i])

                        const subIncludes = await functions.includePathsConcat(data, includes[i], includePathsCacheName)

                        for (let j in subIncludes) {
                            includes.push(subIncludes[j])
                        }
                    }
                } else {
                    delete includes[i] // leaves an empty space in the array which we will clean up later
                }
            } // for

            // clean out any empty includes which meant their files could not be found
            includes = functions.cleanArray(includes)
        }

        return includes

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

//-------------------------------------
// Functions: Reusable Object Building
//-------------------------------------
functions.objBuildWithIncludes = async function functions_objBuildWithIncludes(obj, includeFunction) {
    /*
    Figure out if a reusable object, which may have include files, needs to be built in memory.
    @param   {Object}    obj              Reusable object originally created by build.processOneBuild
    @param   {Function}  includeFunction  Function that will parse this particular type of file (concat for example) and return any paths to include files.
    @return  {Promise}                    Promise that returns a reusable object.
    */
    let destTime = 0
    let sourceExt = functions.fileExtension(obj.source)

    obj.build = false

    let includesNewer = false

    if (obj.data !== '') {
        // a previous promise has filled in the data variable so we should rebuild this file
        obj.build = true
    } else if (obj.dest !== '') {
        // make sure obj.dest does not point to a file in the source directory
        if (functions.inSource(obj.dest)) {
            throw new Error('functions.objBuildWithIncludes -> ' + shared.language.display('error.destPointsToSource'))
        } else {
            // read dest file into memory
            try {
                let data = await fsReadFilePromise(obj.dest, { encoding: 'utf8' })

                obj.data = data
                obj.build = true
            } catch(err) {
                throw new Error('functions.objBuildWithIncludes -> ' + shared.language.display('error.missingDest'))
            }
        }
    } else {
        // just a source file to work from

        // figure out dest
        obj.dest = functions.sourceToDest(obj.source)

        if (config.option.forcebuild) {
            obj.build = true
        } else {
            // check to see if the source file is newer than a possible dest file
            let files = await functions.filesExistAndTime(obj.source, obj.dest)

            if (!files.source.exists) {
                // missing source file
                throw new Error('functions.objBuildWithIncludes -> ' + shared.language.display('error.missingSource'))
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
        }
    }

    if (obj.data === '') {
        // read the source because we are either rebuilding or we need to check to see if any include files are newer than our dest file
        let data = await fsReadFilePromise(obj.source, { encoding: 'utf8' })

        obj.data = data
    }

    if (!obj.build) {
        // check includes to see if any of them are newer
        let includes = await includeFunction(obj.data, obj.source)

        if (functions.fileExtension(obj.source) === 'concat') {
            // check for a concat meta information file, if any
            let concatMeta = await functions.concatMetaRead(obj.source)

            if (concatMeta.toString() !== includes.toString()) {
                obj.build = true
            }
        }

        if (!obj.build) {
            includesNewer = await functions.includesNewer(includes, sourceExt, destTime)
        }
    }

    if (obj.build || includesNewer) {
        obj.build = true
    }

    return obj
} // objBuildWithIncludes

functions.objBuildInMemory = async function functions_objBuildInMemory(obj) {
    /*
    Figure out if a reusable object needs to be built in memory.
    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */
    obj.build = false

    if (obj.data !== '') {
        // a previous promise has filled in the data variable so we should rebuild this file
        obj.build = true
    } else if (obj.dest !== '') {
        // make sure obj.dest does not point to a file in the source directory
        if (functions.inSource(obj.dest)) {
            throw new Error('functions.objBuildInMemory -> ' + shared.language.display('error.destPointsToSource'))
        } else {
            // read dest file into memory
            try {
                let data = await fsReadFilePromise(obj.dest, { encoding: 'utf8' })

                obj.data = data
                obj.build = true
            } catch(err) {
                throw new Error('functions.objBuildInMemory -> ' + shared.language.display('error.missingDest'))
            }
        }
    } else {
        // just a source file to work from

        // figure out dest
        obj.dest = functions.sourceToDest(obj.source)

        if (config.option.forcebuild) {
            obj.build = true
        } else {
            // check to see if the source file is newer than a possible dest file
            let files = await functions.filesExistAndTime(obj.source, obj.dest)

            if (!files.source.exists) {
                // missing source file
                throw new Error('functions.objBuildInMemory -> ' + shared.language.display('error.missingSource'))
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
        }
    }

    if (obj.build && obj.data === '') {
        // read source file into memory
        let data = await fsReadFilePromise(obj.source, { encoding: 'utf8' })

        obj.data = data
    }

    return obj
} // objBuildInMemory

functions.objBuildOnDisk = async function functions_objBuildOnDisk(obj) {
    /*
    Figure out if a reusable object needs to be written to disk and if so, prepare for a command line program to use it next.
    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */
    obj.build = false

    if (obj.data !== '') {
        // a previous promise has filled in the data variable so we should rebuild this file
        obj.build = true

        if (obj.dest === '') {
            obj.dest = functions.sourceToDest(obj.source)
        } else {
            // make sure obj.dest does not point to a file in the source directory
            if (functions.inSource(obj.dest)) {
                throw new Error('functions.objBuildOnDisk -> ' + shared.language.display('error.destPointsToSource'))
            }
        }

        // write to dest file
        await functions.makeDirPath(obj.dest)

        await fsWriteFilePromise(obj.dest, obj.data)

        obj.data = ''

        // set source to dest so any command line programs after this will compile dest to dest
        obj.source = obj.dest
    } else if (obj.dest !== '') {
        // dest file is already in place
        let exists = await functions.fileExists(obj.dest)

        if (exists) {
            obj.build = true

            // set source to dest so any command line programs after this will compile dest to dest
            obj.source = obj.dest
        } else {
            obj.dest = ''
            obj = functions.objBuildOnDisk(obj)
        }
    } else {
        // just a source file to work from

        // figure out dest
        obj.dest = functions.sourceToDest(obj.source)

        if (config.option.forcebuild) {
            obj.build = true
            await functions.makeDirPath(obj.dest)
        } else {
            // check to see if the source file is newer than a possible dest file
            let files = await functions.filesExistAndTime(obj.source, obj.dest)

            if (files.source.exists === false) {
                // missing source file

                if (files.dest.exists) {
                    // a missing source file and an existing dest file is most likely a rename caught while watching
                    // it is tempting to delete obj.dest but that would cause other issues since chokidar can report events out of order
                    throw 'done'
                } else {
                    throw new Error('functions.objBuildOnDisk -> ' + shared.language.display('error.missingSource'))
                }
            }

            if (files.dest.exists) {
                // source and dest exist so compare their times
                if (files.source.mtime > files.dest.mtime) {
                    obj.build = true
                }
            } else {
                // dest file does not exist so build it
                obj.build = true

                await functions.makeDirPath(obj.dest)
            }
        }
    }

    return obj
} // objBuildOnDisk

//---------
// Exports
//---------
module.exports = functions