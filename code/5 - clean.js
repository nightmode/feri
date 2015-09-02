'use strict'

//----------------
// Includes: Self
//----------------
var shared    = require('./2 - shared.js')
var config    = require('./3 - config.js')
var functions = require('./4 - functions.js')

//----------
// Includes
//----------
var chalk = require('chalk') // ~ 20 ms
var path  = require('path')  // ~  1 ms

//-----------
// Variables
//-----------
var clean = {}

//----------------------------
// Clean: Command and Control
//----------------------------
// The following functions control cleaning, setting up promise chains and concurrency.

clean.processClean = function clean_processClean(files, watching) {
    /*
    Remove the destination directory or start a more complex incremental cleanup.
    @param   {String,Object}  [files]     Optional. Glob search string like '*.html' or array of full paths like ['/web/dest/about.html', '/web/dest/index.html']
    @param   {Boolean}        [watching]  Optional. If true, we are in watch mode so log less information and do not republish.
    @return  {Promise}                    Promise that returns an array of file path strings for the files cleaned like ['/dest/css/style.css', '/dest/index.html']
    */
    watching = watching || false

    if (!config.option.clean && !watching) {
        return Promise.resolve()
    }

    return Promise.resolve().then(function(good) {

        var configPathsAreGood = functions.configPathsAreGood()
        if (configPathsAreGood !== true) {
            throw new Error(configPathsAreGood)
        }

    }).then(function() {

        return functions.fileExists(config.path.source).then(function(exists) {
            if (exists === false) {
                throw new Error(shared.language.display('error.missingSourceDirectory'))
            }
        })

    }).then(function() {

        if (!watching) {
            // start clean timer
            shared.stats.timeTo.clean = functions.sharedStatsTimeTo(shared.stats.timeTo.clean)

            // display title
            functions.log(chalk.gray('\n' + shared.language.display('words.clean') + '\n'), false)
        }

        if (config.option.republish && !watching) {
            // remove all files from inside the dest directory
            var options = {
                "nocase"  : true,
                "nodir"   : false,
                "realpath": true
            }

            return functions.findFiles(config.path.dest + '/{*,.*}', options).then(function(files) {
                return functions.removeFiles(files).then(function() {
                    return [config.path.dest]
                })
            })
        } else {
            // incremental cleanup

            var filesType = typeof files

            if (filesType === 'object') {
                // we already have a specified list to work from
                return clean.processFiles(files, watching)
            } else {
                var options = {
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

                return functions.findFiles(config.path.dest + '/' + files, options).then(function(files) {
                    if (files.length > 0) {
                        return clean.processFiles(files, watching)
                    } else {
                        return []
                    }
                })
            }
        }

    }).then(function(filesCleaned) {

        if (!watching) {
            shared.stats.timeTo.clean = functions.sharedStatsTimeTo(shared.stats.timeTo.clean)

            if (filesCleaned.length === 0) {
                functions.log(chalk.gray(shared.language.display('words.done') + '.'))
            } else if (filesCleaned[0] === config.path.dest) {
                functions.log(chalk.gray('/' + path.basename(config.path.dest) + ' ' + shared.language.display('words.removed')))
            }
        }

        return filesCleaned

    })
} // processClean

clean.processFiles = function clean_processFiles(files, watching) {
    /*
    Create a promise chain of tasks for each file and control concurrency.
    @param   {Object,String}  files  Array of paths like ['/dest/path1', '/dest/path2'] or a string like '/dest/path'
    @return  {Promise}               Promise that returns an array of file path strings for the files cleaned like ['/dest/css/style.css', '/dest/index.html']
    */
    watching = watching || false

    var filesCleaned = [] // keep track of any files cleaned

    functions.cacheReset()

    return new Promise(function(resolve, reject) {
        if (typeof files === 'string') {
            files = [files]
        }

        var allFiles = []    // array of promises
        var current  = 0     // number of operations running currently
        var resolved = false // true if all tasks have been queued

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
                var file = files.shift()

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
                var prefix = path.basename(filePath).substr(0, config.includePrefix.length)

                if (prefix === config.includePrefix) {
                    // prefixed files are includes and should not be in the dest folder
                    return functions.removeDest(filePath).then(function() {
                        throw 'done'
                    })
                }
            }

        }).then(function() {

            // if we got this far we know the destination file exists and it is not an include

            var obj = {
                destFile: filePath,
                destExt: functions.fileExtension(filePath),
                sourceFile: functions.destToSource(filePath),
                sourceExists: false
            }

            // check if a mapping exists in order to search that mapping for the special '*' indicator
            while (config.map.destToSourceExt.hasOwnProperty(obj.destExt)) {
                if (config.map.destToSourceExt[obj.destExt].indexOf('*') >= 0) {
                    // extension is in addition to another extension
                    // for example, index.html.gz, sample.txt.gz, etc...
                    obj.destExt = functions.fileExtension(functions.removeExt(obj.sourceFile))
                    obj.sourceFile = functions.removeExt(obj.sourceFile)
                } else {
                    break
                }
            }
            // otherwise a simple one to one extension mapping

            return obj

        }).then(function(obj) {

            // figure out which array of functions (if any) apply to this file type
            if (config.map.destToSourceExt.hasOwnProperty(obj.destExt)) {
                var p = Promise.resolve()

                var len = config.map.destToSourceExt[obj.destExt].length
                var possibleExt = ''

                for (var i = 0; i < len; i++) {
                    (function() {
                        var possibleSourceFile = functions.changeExt(obj.sourceFile, config.map.destToSourceExt[obj.destExt][i])

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
            }

            return obj

        }).then(function(obj) {

            if (!obj.sourceExists) {
                // check for a one to one mapping
                return functions.fileExists(obj.sourceFile).then(function(exists) {
                    if (exists) {
                        obj.sourceExists = true
                    }
                    return obj
                })
            } else {
                return obj
            }

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
