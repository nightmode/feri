'use strict'

//----------------
// Includes: Self
//----------------
var shared    = require('./2 - shared.js')
var config    = require('./3 - config.js')
var functions = require('./4 - functions.js')
var clean     = require('./5 - clean.js')
var build     = require('./6 - build.js')

//----------
// Includes
//----------
var chalk       = require('chalk')       // ~ 20 ms
var events      = require('events')      // ~  1 ms
var glob        = require('glob')        // ~ 13 ms
var mkdirp      = require('mkdirp')      // ~  1 ms
var path        = require('path')        // ~  1 ms
var querystring = require('querystring') // ~  2 ms

//---------------------
// Includes: Lazy Load
//---------------------
var chokidar   // require('chokidar')     // ~ 75 ms
var http       // require('http')         // ~ 17 ms
var tinyLrFork // require('tiny-lr-fork') // ~ 52 ms

//-----------
// Variables
//-----------
var recentFiles = {} // keep track of files that have changed too recently
var watch = {
    'emitterDest'  : new events.EventEmitter(),
    'emitterSource': new events.EventEmitter()
}

//-----------
// Functions
//-----------
watch.buildOne = function watch_buildOne(fileName) {
    /*
    Figure out which files should be processed after receiving an add or change event from the source directory watcher.
    @param   {String}   fileName  File path like '/source/js/combined.js'
    @return  {Promise}
    */
    return new Promise(function(resolve, reject) {

        if (path.basename(fileName).substr(0, config.includePrefix.length) === config.includePrefix) {
            var ext = functions.fileExtension(fileName)

            if (config.includeFileTypes.indexOf(ext) >= 0) {
                // included file could be in any of this type of file so check them all
                glob(config.path.source + "/**/*." + ext, functions.globOptions(), function(err, files) {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(files)
                    }
                })
            } else {
                resolve([])
            }
        } else {
            resolve([fileName])
        }

    }).then(function(files) {

        if (files.length > 0) {
            return build.processBuild(files, true)
        }

    })
} // buildOne

watch.notTooRecent = function watch_notTooRecent(file) {
    /*
    Suppress subsequent file change notifications if they happen within 300 ms of a previous event.
    @param   {String}   file  File path like '/path/readme.txt'
    @return  {Boolean}        True if a file was not active recently.
    */
    var time = new Date().getTime()
    var expireTime = time - 300

    // clean out old entries in recentFiles
    for (var x in recentFiles) {
        if (recentFiles[x] < expireTime) {
            // remove this entry
            delete recentFiles[x]
        }
    }

    if (recentFiles.hasOwnProperty(file)) {
        return false
    } else {
        // add entry and return true as in this file was not active recently
        recentFiles[file] = time
        return true
    }
} // notTooRecent

watch.processWatch = function watch_processWatch() {
    /*
    Watch both source and destination folders for activity.
    @return  {Promise}
    */
    if (!config.option.watch) {
        return Promise.resolve()
    } else {
        return Promise.resolve().then(function(good) {

            if (functions.configPathsAreGood() === false) {
                throw shared.language.display('error.configPaths')
            }

        }).then(function() {

            return functions.fileExists(config.path.source).then(function(exists) {
                if (exists === false) {
                    throw shared.language.display('error.missingSourceDirectory')
                }
            })

        }).then(function() {

            return new Promise(function(resolve, reject) {
                // start watch timer
                shared.stats.timeTo.watch = functions.sharedStatsTimeTo(shared.stats.timeTo.watch)

                functions.log(chalk.gray('\n' + shared.language.display('words.watch') + '\n'), false)

                if (typeof chokidar !== 'object') {
                    chokidar = require('chokidar')
                }

                return watch.watchSource().then(function() {
                    //------------
                    // LiveReload
                    //------------
                    if (!config.option.livereload) {
                        resolve()
                    } else {
                        if (typeof tinyLrFork !== 'object') {
                            tinyLrFork = require('tiny-lr-fork')
                        }

                        tinyLrFork().listen(config.thirdParty.livereload.port, function(err) {
                            if (err) {
                                reject(err)
                            } else {
                                return watch.watchDest().then(function() {
                                    functions.log(chalk.gray(shared.language.display('message.listeningOnPort').replace('{software}', 'LiveReload').replace('{port}', config.thirdParty.livereload.port)))
                                        resolve()
                                }).catch(function(err) {
                                    reject(err)
                                })
                            }
                        })
                    }
                })

            }).then(function() {

                shared.stats.timeTo.watch = functions.sharedStatsTimeTo(shared.stats.timeTo.watch)

            })
        })
    }
} // processWatch

watch.updateLiveReloadServer = function watch_updateLiveReloadServer(now) {
    /*
    Update the LiveReload server with a list of changed files.
    @param   {Boolean}  now  True meaning we have already waited 300 ms for events to settle
    @return  {Promise}       Promise that returns true if everything is ok otherwise an error.
    */
    return new Promise(function(resolve, reject) {
        now = now || false

        if (!now) {
            // will proceed 300 ms from now in order for things to settle
            clearTimeout(shared.livereload.calmTimer)
            shared.livereload.calmTimer = setTimeout(function() {
                watch.updateLiveReloadServer(true)
            }, 300)
            resolve(true)
        } else {
            if (typeof http !== 'object') {
                http = require('http')
            }

            var postData = '{"files": ' + JSON.stringify(shared.livereload.changedFiles) + '}'

            shared.livereload.changedFiles = []

            var requestOptions = {
                'port'  : config.thirdParty.livereload.port,
                'path'  : '/changed',
                'method': 'POST',
                'headers': {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': postData.length
                }
            }

            var request = http.request(requestOptions)

            request.on('error', function(err) {
                console.error(err)
                reject(err)
            })

            request.write(postData)
            request.end()

            functions.log(chalk.gray(shared.language.display('message.watchRefreshed').replace('{software}', 'LiveReload') + '\n'))
            resolve(true)
        }
    })
} // updateLiveReloadServer

watch.watchDest = function watch_watchDest() {
    /*
    Watch the destination directory for changes in order to update our LiveReload server as needed.
    @return  {Promise}
    */
    return new Promise(function(resolve, reject) {

        var watcher = chokidar.watch(config.path.dest, config.thirdParty.chokidar)

        watcher
        .on('add', function(file) {
            var ext = path.extname(file).replace('.', '')
            if (config.livereloadFileTypes.indexOf(ext) >= 0) {
                functions.log(chalk.gray(functions.trimDest(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.add')))

                // emit an event
                watch.emitterDest.emit('add', file)

                shared.livereload.changedFiles.push(file.replace(config.path.dest + '/', ''))
                watch.updateLiveReloadServer()
            }
        })
        .on('change', function(file) {
            var ext = path.extname(file).replace('.', '').toLowerCase()
            if (config.livereloadFileTypes.indexOf(ext) >= 0) {
                functions.log(chalk.gray(functions.trimDest(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.change')))

                // emit an event
                watch.emitterDest.emit('change', file)

                shared.livereload.changedFiles.push(file.replace(config.path.dest + '/', ''))
                watch.updateLiveReloadServer()
            }
        })
        .on('error', function(error) {
            functions.log(shared.language.display('error.watchingDest'), error)

            // emit an event
            watch.emitterDest.emit('error')

            reject() // a promise can only be resolved or rejected once so if this gets called more than once it will be harmless
        })
        .on('ready', function() {
            functions.log(chalk.gray(shared.language.display('message.watchingDirectory').replace('{directory}', '/' + path.basename(config.path.dest))))

            // emit an event
            watch.emitterDest.emit('ready')

            resolve()
        })

    })
} // watchDest

watch.watchSource = function watch_watchSource() {
    /*
    Watch source directory for changes and kick off the appropriate response tasks as needed.
    @return  {Promise}
    */
    return new Promise(function(resolve, reject) {

        var watcher = chokidar.watch(config.path.source, config.thirdParty.chokidar)

        watcher
        .on('addDir', function(file) {
            functions.log(chalk.gray(functions.trimSource(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.add') + ' ' + shared.language.display('words.dir')))

            // emit an event
            watch.emitterSource.emit('add directory', file)

            mkdirp(functions.sourceToDest(file), function(err) {
                if (err) {
                    console.error(err)
                    return
                }
            })
        })
        .on('unlinkDir', function(file) {
            functions.log(chalk.gray(functions.trimSource(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.removed') + ' ' + shared.language.display('words.dir')))

            // emit an event
            watch.emitterSource.emit('remove directory', file)

            functions.removeDest(functions.sourceToDest(file)).then(function() {
                functions.log(' ')
            })
        })
        .on('add', function(file) {
            functions.log(chalk.gray(functions.trimSource(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.add')))

            // emit an event
            watch.emitterSource.emit('add', file)

            watch.buildOne(file)
        })
        .on('change', function(file) {
            if (watch.notTooRecent(file)) {
                functions.log(chalk.gray(functions.trimSource(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.change')))

                // emit an event
                watch.emitterSource.emit('change', file)

                watch.buildOne(file)
            } else {
                if (config.option.debug) {
                    functions.log(chalk.yellow(shared.language.display('message.fileChangedTooRecently').replace('{file}', functions.trimSource(file).replace(/\\/g, '/'))))
                }
            }
        })
        .on('unlink', function(file) {
            functions.log(chalk.gray(functions.trimSource(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.removed')))

            // emit an event
            watch.emitterSource.emit('remove', file)

            clean.processClean(functions.sourceToDest(file), true).then(function() {
                functions.log(' ')
            })
        })
        .on('error', function(error) {
            functions.log(shared.language.display('error.watchingSource'), error)

            // emit an event
            watch.emitterSource.emit('error', error)

            reject() // a promise can only be resolved or rejected once so if this gets called more than once it will be harmless
        })
        .on('ready', function() {
            functions.log(chalk.gray(shared.language.display('message.watchingDirectory').replace('{directory}', '/' + path.basename(config.path.source))))
            recentFiles = {} // reset recentFiles in case any changes happened while we were loading

            // emit an event
            watch.emitterSource.emit('ready')

            resolve()
        })

    })
} // watchSource

//---------
// Exports
//---------
module.exports = watch
