'use strict'

//----------------
// Includes: Self
//----------------
const color     = require('./color.js')
const shared    = require('./2 - shared.js')
const config    = require('./3 - config.js')
const functions = require('./4 - functions.js')

//----------
// Includes
//----------
const path = require('path') // ~ 1 ms

//-----------
// Variables
//-----------
const clean = {}

//----------------------------
// Clean: Command and Control
//----------------------------
// The following functions control cleaning, setting up promise chains and concurrency.

clean.processClean = async function clean_processClean(files, watching) {
    /*
    Remove the destination directory or start a more complex incremental cleanup.
    @param   {String,Object}  [files]     Optional. Glob search string like '*.html' or array of full paths like ['/web/dest/about.html', '/web/dest/index.html']
    @param   {Boolean}        [watching]  Optional. If true, we are in watch mode so log less information and do not republish.
    @return  {Promise}                    Promise that returns an array of file path strings for the files cleaned like ['/dest/css/style.css', '/dest/index.html']
    */
    watching = watching || false

    let filesCleaned = [] // keep track of any files cleaned

    if (!config.option.clean && !watching) {
        return Promise.resolve()
    }

    if (!watching) {
        // start clean timer
        shared.stats.timeTo.clean = functions.sharedStatsTimeTo(shared.stats.timeTo.clean)
    }

    let configPathsAreGood = functions.configPathsAreGood()

    if (configPathsAreGood !== true) {
        throw new Error(configPathsAreGood)
    }

    let exists = await functions.fileExists(config.path.source)

    if (exists === false) {
        throw new Error(shared.language.display('error.missingSourceDirectory'))
    }

    if (!watching) {
        // display title
        functions.log(color.gray('\n' + shared.language.display('words.clean') + '\n'), false)
    }

    if (config.option.republish && !watching) {
        // remove all files from inside the dest directory
        let options = {
            "nocase"  : true,
            "nodir"   : false,
            "realpath": true
        }

        let findFiles = await functions.findFiles(config.path.dest + '/{*,.*}', options)

        await functions.removeFiles(findFiles)

        filesCleaned = [config.path.dest]
    } else {
        // incremental cleanup

        let filesType = typeof files

        if (filesType === 'object') {
            // we already have a specified list to work from
            filesCleaned = await clean.processFiles(files, watching)
        } else {
            let options = {
                "nocase"  : true,
                "nodir"   : false,
                "realpath": true
            }

            if (filesType === 'string') {
                if (files.charAt(0) === '/') {
                    files = files.replace('/', '')
                }
            } else {
                if (config.glob.clean !== '') {
                    files = config.glob.clean
                } else {
                    files = '**/*'
                }
            }

            let findFiles = await functions.findFiles(config.path.dest + '/' + files, options)

            if (findFiles.length > 0) {
                filesCleaned = await clean.processFiles(findFiles, watching)
            } else {
                filesCleaned = []
            }
        }
    }

    // silently clean any orphaned concat meta files in the source folder
    // these should not add to our filesCleaned array since they are not user generated files
    await functions.concatMetaClean()

    if (!watching) {
        shared.stats.timeTo.clean = functions.sharedStatsTimeTo(shared.stats.timeTo.clean)

        if (filesCleaned.length === 0) {
            functions.log(color.gray(shared.language.display('words.done') + '.'))
        } else if (filesCleaned[0] === config.path.dest) {
            functions.log(color.gray('/' + path.basename(config.path.dest) + ' ' + shared.language.display('words.removed')))
        }
    }

    return filesCleaned
} // processClean

clean.processFiles = function clean_processFiles(files, watching) {
    /*
    Create a promise chain of tasks for each file and control concurrency.
    @param   {Object,String}  files  Array of paths like ['/dest/path1', '/dest/path2'] or a string like '/dest/path'
    @return  {Promise}               Promise that returns an array of file path strings for the files cleaned like ['/dest/css/style.css', '/dest/index.html']
    */
    watching = watching || false

    let filesCleaned = [] // keep track of any files cleaned

    functions.cacheReset()

    return new Promise(function(resolve, reject) {
        if (typeof files === 'string') {
            files = [files]
        }

        let allFiles = []    // array of promises
        let current  = 0     // number of operations running currently
        let resolved = false // true if all tasks have been queued

        function proceed() {
            current--

            if (files.length > 0) {
                queue()
            } else if (!resolved) {
                resolved = true
                resolve(allFiles)
            }
        } // proceed

        function queue() {
            while (current < config.concurLimit && files.length > 0) {
                let file = files.shift()

                allFiles.push(Promise.resolve(file).then(function(file) {
                    return clean.processOneClean(file).then(function(filePath) {
                        if (typeof filePath === 'string') {
                            filesCleaned.push(filePath)
                        }
                        proceed()
                    }).catch(function(err) {
                        proceed()
                        functions.logError(err)
                        throw err
                    })
                }))

                current++
            }
        } // queue

        queue()

    }).then(function(allFiles) {

        return Promise.all(allFiles).then(function() {
            return filesCleaned
        })

    })
} // processFiles

clean.processOneClean = function clean_processOneClean(filePath) {
    /*
    Create a promise chain of cleaning tasks based on a single file type.
    @param   {String}   filePath  Path like '/dest/index.html'
    @return  {Promise}            Promise that returns a file path string if something was cleaned otherwise undefined.
    */
    return new Promise(function(resolve, reject) {
        return functions.fileExists(filePath).then(function(destExists) {

            if (!destExists) {
                throw 'done'
            } else {
                let prefix = path.basename(filePath).substr(0, config.includePrefix.length)

                let fileExt = functions.fileExtension(filePath)

                if (prefix === config.includePrefix || fileExt === 'concat') {
                    // prefixed files are includes and should not be in the destination folder
                    // concat files should not be in the destination folder either
                    return functions.removeDest(filePath).then(function() {
                        throw 'done'
                    })
                } else {
                    return fileExt
                }
            }

        }).then(function(fileExt) {

            // if we got this far we know the destination file exists and it is not an include

            let obj = {
                destFile: filePath,
                destExt: fileExt,
                sourceExists: false
            }

            obj.sourceFiles = functions.possibleSourceFiles(filePath)

            let len = obj.sourceFiles.length

            let p = Promise.resolve()

            for (let i = 0; i < len; i++) {
                (function() {
                    let possibleSourceFile = obj.sourceFiles[i]

                    p = p.then(function(exists) {
                        if (exists) {
                            return true
                        } else {
                            return functions.fileExists(possibleSourceFile)
                        }
                    })
                })()
            }

            p = p.then(function(exists) {
                if (exists) obj.sourceExists = true
                return obj
            })

            return p

        }).then(function(obj) {

            if (!obj.sourceExists) {
                return functions.removeDest(obj.destFile).then(function() {
                    resolve(obj.destFile)
                }).catch(function(err) {
                    console.warn(err)
                    reject(err)
                })
            } else {
                // do not delete the destination file since some equivalent of it exists in the source folder
                resolve()
            }

        }).catch(function(err) {

            if (err === 'done') {
                resolve()
            } else {
                console.warn(err)
                reject(err)
            }

        })
    })
} // processOneClean

//---------
// Exports
//---------
module.exports = clean