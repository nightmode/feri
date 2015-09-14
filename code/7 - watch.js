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
var chokidarSource   = '' // will become a chokidar object when watching the source folder
var chokidarDest     = '' // will become a chokidar object when watching the destination folder

var chokidarSourceFiles = '' // string or array of source files being watched
var chokidarDestFiles   = '' // string or array of destination files being watched

var chokidarSourceTestFile = '' // file name which will be used to generate source events to test chokidar
var chokidarDestTestFile = '' // file name which will be used to generate destination events to test chokidar

var chokidarSourceReady = false // will be set to true once a chokidarSourceTestFile change has been detected
var chokidarDestReady   = false // will be set to true once a chokidarDestTestFile change has been detected

var livereloadServer = '' // will become a tinyLrFork object when watching the destination folder

var recentFiles = {} // keep track of files that have changed too recently

var watch = {
    'emitterDest'  : new events.EventEmitter(),
    'emitterSource': new events.EventEmitter()
}

//-------------------
// Private Functions
//-------------------
var lazyLoadChokidar = function watch_lazyLoadChokidar () {
    if (typeof chokidar !== 'object') {
        chokidar = require('chokidar')
    }
} // lazyLoadChokidar

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

watch.processWatch = function watch_processWatch(sourceFiles, destFiles) {
    /*
    Watch both source and destination folders for activity.
    @param   {String,Object}  [sourceFiles]  Optional. Glob search string for watching source files like '*.html' or array of full paths like ['/source/about.html', '/source/index.html']
    @param   {String,Object}  [destFiles]    Optional. Glob search string for watching destination files like '*.css' or array of full paths like ['/dest/fonts.css', '/dest/grid.css']
    @return  {Promise}
    */
    if (!config.option.watch) {
        return Promise.resolve()
    } else {
        return Promise.resolve().then(function(good) {

            // start watch timer
            shared.stats.timeTo.watch = functions.sharedStatsTimeTo(shared.stats.timeTo.watch)

            var configPathsAreGood = functions.configPathsAreGood()
            if (configPathsAreGood !== true) {
                throw new Error(configPathsAreGood)
            }

        }).then(function() {

            return functions.fileExists(config.path.source).then(function(exists) {
                if (exists === false) {
                    throw shared.language.display('error.missingSourceDirectory')
                }
            })

        }).then(function() {

            return new Promise(function(resolve, reject) {

                functions.log(chalk.gray('\n' + shared.language.display('words.watch') + '\n'), false)

                return watch.watchSource(sourceFiles).then(function() {
                    //------------
                    // LiveReload
                    //------------
                    if (!config.option.livereload) {
                        resolve()
                    } else {
                        if (typeof tinyLrFork !== 'object') {
                            tinyLrFork = require('tiny-lr-fork')
                        }

                        // stop the livereload server only
                        watch.stop(false, false, true)

                        livereloadServer = new tinyLrFork.Server()
                        livereloadServer.listen(config.thirdParty.livereload.port, function(err) {
                            if (err) {
                                if (shared.cli) {
                                    console.error(err)
                                }
                                reject(err)
                            } else {
                                return watch.watchDest(destFiles).then(function() {

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

watch.stop = function watch_stop(stopSource, stopDest, stopLivereload) {
    /*
    Stop watching the source and/or destination folders. Also stop the LiveReload server.
    @param   {Boolean}  [stopSource]      Optional and defaults to true. If true, stop watching the source folder.
    @param   {Boolean}  [stopDest]        Optional and defaults to true. If true, stop watching the destination folder.
    @param   {Boolean}  [stopLivereload]  Optional and defaults to true. If true, stop the LiveReload server.
    */
    stopSource     = typeof stopSource     === 'boolean' ? stopSource     : true
    stopDest       = typeof stopDest       === 'boolean' ? stopDest       : true
    stopLivereload = typeof stopLivereload === 'boolean' ? stopLivereload : true

    if (stopSource) {
        if (typeof chokidarSource === 'object') {
            // clean up previous watcher
            chokidarSource.close() // remove all listeners
            chokidarSource.unwatch(chokidarSourceFiles)
        }
    }

    if (stopDest) {
        if (typeof chokidarDest === 'object') {
            // clean up previous watcher
            chokidarDest.close() // remove all listeners
            chokidarDest.unwatch(chokidarDestFiles)
        }
    }

    if (stopLivereload) {
        if (typeof livereloadServer === 'object') {
            if (livereloadServer.server._handle === null) {
                // livereload is not running
            } else {
                // stop livereload server and free up port
                livereloadServer.server.removeAllListeners()
                livereloadServer.server.close()
            }
        }
    }
} // stop

watch.testChokidar = function watch_testChokidar(filePath, checkPass) { // bork update docs // bork do we need a mocha test?
    /*
    Write files in order to generate an event to test chokidar watching.
    @param  {String}   filePath     File path like '/source' or '/dest'
    @param  {Number}   [checkPass]  Optional and defaults to 0. This function will take care of using this parameter on itself when recursing.
    @return {Promise}
    */
    return new Promise(function(resolve, reject) {

        checkPass = checkPass || 0

        var chokidarTestFile = ''
        var writeFile = false

        if (filePath === config.path.source) {
            if (chokidarSourceTestFile === '') {
                chokidarSourceTestFile = path.join(config.path.source, 'chokidar-' + new Date().getTime() + '.txt')
            }

            chokidarTestFile = chokidarSourceTestFile

            if (chokidarSourceReady == false) {
                writeFile = true
            }
        } else {
            if (chokidarSourceTestFile === '') {
                chokidarDestTestFile = path.join(config.path.dest, 'chokidar-' + new Date().getTime() + '.txt')
            }

            chokidarTestFile = chokidarDestTestFile

            if (chokidarDestReady == false) {
                writeFile = true
            }
        }

        if (writeFile) {
            if (checkPass === 0) {
                return functions.writeFile(chokidarTestFile, '...').then(function() {

                    setTimeout(function() {
                        return watch.testChokidar(filePath, 1).then(function() {
                            resolve()
                        })
                    }, 10)

                })
            } else {
                if (checkPass >= 20) {
                    checkPass = 0
                } else {
                    checkPass = checkPass + 1
                }

                setTimeout(function() {
                    return watch.testChokidar(filePath, checkPass).then(function() {
                        resolve()
                    })
                }, 10)

            }
        } else {
            return functions.removeFile(chokidarTestFile).then(function() {
                resolve()
            })
        }
    })
} // testChokidar

watch.updateLiveReloadServer = function watch_updateLiveReloadServer(now) {
    /*
    Update the LiveReload server with a list of changed files.
    @param   {Boolean}  now  True meaning we have already waited 300 ms for events to settle.
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
                if (shared.cli) {
                    console.error(err)
                }
                reject(err)
            })

            request.write(postData)
            request.end()

            functions.log(chalk.gray(shared.language.display('message.watchRefreshed').replace('{software}', 'LiveReload') + '\n'))
            resolve(true)
        }
    })
} // updateLiveReloadServer

watch.watchDest = function watch_watchDest(files) {
    /*
    Watch the destination directory for changes in order to update our LiveReload server as needed.
    @param   {String,Object}  [files]  Optional. Glob search string for watching destination files like '*.css' or array of full paths like ['/dest/fonts.css', '/dest/grid.css']
    @return  {Promise}
    */
    return new Promise(function(resolve, reject) {

        lazyLoadChokidar()

        var filesType = typeof files

        if (filesType === 'object') {
            // we already have a specified list to work from
        } else {
            if (filesType === 'string') {
                // string should be a glob
                files = files.replace(config.path.dest, '')
            } else {
                // files is undefined
                if (config.glob.watch.dest !== '') {
                    files = config.glob.watch.dest
                } else {
                    files = ''
                }
            }

            if (files.charAt(0) === '/' || files.charAt(0) === '\\') {
                files = files.substring(1)
            }

            files = config.path.dest + shared.slash + files
        }

        // watch for chokidar test files
        var chokidarTestFiles = config.path.dest + shared.slash + 'chokidar-*'

        if (typeof files === 'string') {
            files = [files]
            if (files[0] !== config.path.dest + shared.slash) {
                files.push(chokidarTestFiles)
            }
        } else {
            files.push(chokidarTestFiles)
        }

        // only test chokidar for watching once
        var watchTested = false

        watch.stop(false, true, false) // stop watching dest

        chokidarDestReady = false

        chokidarDestTestFile = path.join(config.path.dest, 'chokidar-' + new Date().getTime() + '.txt')

        chokidarDestFiles = files

        chokidarDest = chokidar.watch(files, config.thirdParty.chokidar)

        chokidarDest
        .on('add', function(file) {
            if (file === chokidarDestTestFile) {
                chokidarDestReady = true
            } else if (!shared.suppressWatchEvents) {
                var ext = path.extname(file).replace('.', '')
                if (config.livereloadFileTypes.indexOf(ext) >= 0) {
                    functions.log(chalk.gray(functions.trimDest(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.add')))

                    // emit an event
                    watch.emitterDest.emit('add', file)

                    shared.livereload.changedFiles.push(file.replace(config.path.dest + '/', ''))
                    watch.updateLiveReloadServer()
                }
            }
        })
        .on('change', function(file) {
            if (file === chokidarDestTestFile) {
                chokidarDestReady = true
            } else if (!shared.suppressWatchEvents) {
                var ext = path.extname(file).replace('.', '').toLowerCase()
                if (config.livereloadFileTypes.indexOf(ext) >= 0) {
                    functions.log(chalk.gray(functions.trimDest(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.change')))

                    // emit an event
                    watch.emitterDest.emit('change', file)

                    shared.livereload.changedFiles.push(file.replace(config.path.dest + '/', ''))
                    watch.updateLiveReloadServer()
                }
            }
        })
        .on('error', function(error) {
            functions.log(shared.language.display('error.watchingDest'), error)

            // emit an event
            watch.emitterDest.emit('error')

            reject() // a promise can only be resolved or rejected once so if this gets called more than once it will be harmless
        })
        .on('ready', function() {
            // chokidar can return more than one ready event if given a file array with a string and glob like ['file.js', *.html']
            // in the case of multiple ready events, only run watch.testChokidar once and then emit our own ready event
            if (watchTested === false) {
                watchTested = true
                return watch.testChokidar(config.path.dest).then(function() {

                    functions.log(chalk.gray(shared.language.display('message.watchingDirectory').replace('{directory}', '/' + path.basename(config.path.dest))))

                    watch.emitterDest.emit('ready')

                    resolve()

                })
            }
        })
    })
} // watchDest

watch.watchSource = function watch_watchSource(files) {
    /*
    Watch source directory for changes and kick off the appropriate response tasks as needed.
    @param   {String,Object}  [files]  Optional. Glob search string for watching source files like '*.html' or array of full paths like ['/source/about.html', '/source/index.html']
    @return  {Promise}
    */
    return new Promise(function(resolve, reject) {

        lazyLoadChokidar()

        var filesType = typeof files

        if (filesType === 'object') {
            // we already have a specified list to work from
        } else {
            if (filesType === 'string') {
                // string should be a glob
                files = files.replace(config.path.source, '')
            } else {
                // files is undefined
                if (config.glob.watch.source !== '') {
                    files = config.glob.watch.source
                } else {
                    files = ''
                }
            }

            if (files.charAt(0) === '/' || files.charAt(0) === '\\') {
                files = files.substring(1)
            }

            files = config.path.source + shared.slash + files
        }

        // watch for chokidar test files
        var chokidarTestFiles = config.path.source + shared.slash + 'chokidar-*'

        if (typeof files === 'string') {
            files = [files]
            if (files[0] !== config.path.source + shared.slash) {
                files.push(chokidarTestFiles)
            }
        } else {
            files.push(chokidarTestFiles)
        }

        // only test chokidar for watching once
        var watchTested = false

        watch.stop(true, false, false) // stop watching source

        chokidarSourceReady = false

        chokidarSourceTestFile = path.join(config.path.source, 'chokidar-' + new Date().getTime() + '.txt')

        chokidarSourceFiles = files

        chokidarSource = chokidar.watch(files, config.thirdParty.chokidar)

        chokidarSource
        .on('addDir', function(file) {
            if (!shared.suppressWatchEvents) {
                functions.log(chalk.gray(functions.trimSource(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.add') + ' ' + shared.language.display('words.dir')))

                // emit an event
                watch.emitterSource.emit('add directory', file)

                mkdirp(functions.sourceToDest(file), function(err) {
                    if (err) {
                        console.error(err)
                        return
                    }
                })
            }
        })
        .on('unlinkDir', function(file) {
            if (!shared.suppressWatchEvents) {
                functions.log(chalk.gray(functions.trimSource(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.removed') + ' ' + shared.language.display('words.dir')))

                // emit an event
                watch.emitterSource.emit('remove directory', file)

                functions.removeDest(functions.sourceToDest(file)).then(function() {
                    functions.log(' ')
                })
            }
        })
        .on('add', function(file) {
            if (file === chokidarSourceTestFile) {
                chokidarSourceReady = true
            } else if (!shared.suppressWatchEvents) {
                functions.log(chalk.gray(functions.trimSource(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.add')))

                // emit an event
                watch.emitterSource.emit('add', file)

                watch.buildOne(file)
            }
        })
        .on('change', function(file) {
            if (file === chokidarSourceTestFile) {
                chokidarSourceReady = true
            } else if (!shared.suppressWatchEvents) {
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
            }
        })
        .on('unlink', function(file) {
            if (!shared.suppressWatchEvents) {
                if (path.basename(file).indexOf('chokidar-') === 0) {
                    // do not log or emit when chokidar test files are removed
                } else {
                    functions.log(chalk.gray(functions.trimSource(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.removed')))

                    // emit an event
                    watch.emitterSource.emit('remove', file)
                }

                clean.processClean(functions.sourceToDest(file), true).then(function() {
                    functions.log(' ')
                })
            }
        })
        .on('error', function(error) {
            functions.log(shared.language.display('error.watchingSource'), error)

            // emit an event
            watch.emitterSource.emit('error', error)

            reject() // a promise can only be resolved or rejected once so if this gets called more than once it will be harmless
        })
        .on('ready', function() {
            // chokidar can return more than one ready event if given a file array with a string and glob like ['file.js', *.html']
            // in the case of multiple ready events, only run watch.testChokidar once and then emit our own ready event
            if (watchTested === false) {
                watchTested = true
                return watch.testChokidar(config.path.source).then(function() {

                    functions.log(chalk.gray(shared.language.display('message.watchingDirectory').replace('{directory}', '/' + path.basename(config.path.source))))

                    recentFiles = {} // reset recentFiles in case any changes happened while we were loading

                    watch.emitterSource.emit('ready')

                    resolve()
                })
            }
        })

    })
} // watchSource

//---------
// Exports
//---------
module.exports = watch
