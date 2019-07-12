'use strict'

//----------------
// Includes: Self
//----------------
const color     = require('./color.js')
const shared    = require('./2 - shared.js')
const config    = require('./3 - config.js')
const functions = require('./4 - functions.js')
const clean     = require('./5 - clean.js')
const build     = require('./6 - build.js')

//----------
// Includes
//----------
const events      = require('events')      // ~ 1 ms
const mkdirp      = require('mkdirp')      // ~ 1 ms
const path        = require('path')        // ~ 1 ms
const querystring = require('querystring') // ~ 2 ms

//---------------------
// Includes: Lazy Load
//---------------------
let chokidar  // require('chokidar') // ~ 75 ms
let WebSocket // require('ws')       // ~ 34 ms

//-----------
// Variables
//-----------
let chokidarSource   = '' // will become a chokidar object when watching the source folder
let chokidarDest     = '' // will become a chokidar object when watching the destination folder

let chokidarSourceFiles = '' // string or array of source files being watched
let chokidarDestFiles   = '' // string or array of destination files being watched

let extensionServer      = '' // will become a WebSocket object if config.option.extensions is enabled
let extensionServerTimer = '' // will become a setInterval object if config.option.extensions is enabled

let recentFiles = {} // keep track of files that have changed too recently

const watch = {
    'emitterDest'  : new events.EventEmitter(),
    'emitterSource': new events.EventEmitter()
}

//-------------------
// Private Functions
//-------------------
const lazyLoadChokidar = function watch_lazyLoadChokidar() {
    if (typeof chokidar !== 'object') {
        chokidar = require('chokidar')
    }
} // lazyLoadChokidar

const lazyLoadWebSocket = function watch_lazyLoadWebSocket() {
    if (typeof WebSocket !== 'object') {
        WebSocket = require('ws')
    }
} // lazyLoadWebSocket

//-----------
// Functions
//-----------
watch.buildOne = function watch_buildOne(fileName) {
    /*
    Figure out which files should be processed after receiving an add or change event from the source directory watcher.
    @param   {String}   fileName  File path like '/source/js/combined.js'
    @return  {Promise}
    */
    return Promise.resolve().then(function() {

        let ext = functions.fileExtension(fileName)

        let checkConcatFiles = false

        let isInclude = path.basename(fileName).substr(0, config.includePrefix.length) === config.includePrefix

        if (isInclude) {
            if (config.includeFileTypes.indexOf(ext) >= 0) {
                // included file could be in any of this type of file so check them all
                return functions.findFiles(config.path.source + "/**/*." + ext)
            } else {
                checkConcatFiles = true
            }
        } else {
            checkConcatFiles = true
        }

        if (checkConcatFiles && config.fileType.concat.enabled) {
            if (ext === 'concat') {
                return [fileName]
            } else {
                if (ext !== '') {
                    ext = '.' + ext
                }

                // .concat files can concat almost anything so check all name.ext.concat files
                return functions.findFiles(config.path.source + '/**/*' + ext + '.concat').then(function(files) {
                    if (!isInclude) {
                        files.unshift(fileName)
                    }
                    return files
                })
            }
        }

    }).then(function(files) {

        if (files.length > 0) {
            return build.processBuild(files, true)
        }

    })
} // buildOne

watch.extensionServer = function watch_extensionServer() {
    /*
    Extension server for clients.
    @return  {Promise}
    */

    return Promise.resolve().then(function() {

        if (config.option.extensions) {
            lazyLoadWebSocket()

            // stop the extension server only
            return watch.stop(false, false, true)
        }

    }).then(function() {

        if (config.option.extensions) {
            return new Promise(function(resolve, reject) {
                extensionServer = new WebSocket.Server({ port: config.extension.port }, function(err) {
                    if (err) {
                        if (shared.cli) {
                            console.error(err)
                        }
                        reject(err)
                    } else {
                        extensionServer.on('connection', function connection(server) {
                            server._pingAttempt = 0

                            server.on('message', function incoming(message) {
                                if (message === 'ping') {
                                    // reply with pong
                                    server.send('pong')
                                } else if (message === 'pong') {
                                    // client responded to a ping so reset _pingAttempt
                                    server._pingAttempt = 0
                                }
                            })

                            server.on('close', function close(o) {
                                // do nothing
                            })

                            // send the default document once
                            server.send(JSON.stringify({ defaultDocument: config.extension.defaultDocument }))
                        })

                        // check clients for dropped connections every 10 seconds
                        extensionServerTimer = setInterval(watch.checkExtensionClients, 10000)

                        // extension server is running
                        functions.log(color.gray(shared.language.display('message.listeningOnPort').replace('{software}', 'Extension server').replace('{port}', config.extension.port)))

                        resolve()
                    }
                })
            })
        }
    })
} // extensionServer

watch.notTooRecent = function watch_notTooRecent(file) {
    /*
    Suppress subsequent file change notifications if they happen within 300 ms of a previous event.
    @param   {String}   file  File path like '/path/readme.txt'
    @return  {Boolean}        True if a file was not active recently.
    */
    let time = new Date().getTime()
    let expireTime = time - 300

    // clean out old entries in recentFiles
    for (let x in recentFiles) {
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
    Watch the source folder. Optionally watch the destination folder and start an extension server.
    @param   {String,Object}  [sourceFiles]  Optional. Glob search string for watching source files like '*.html' or array of full paths like ['/source/about.html', '/source/index.html']
    @param   {String,Object}  [destFiles]    Optional. Glob search string for watching destination files like '*.css' or array of full paths like ['/dest/fonts.css', '/dest/grid.css']
    @return  {Promise}
    */
    if (!config.option.watch) {
        return Promise.resolve()
    } else {
        return Promise.resolve().then(function() {

            // start watch timer
            shared.stats.timeTo.watch = functions.sharedStatsTimeTo(shared.stats.timeTo.watch)

            let configPathsAreGood = functions.configPathsAreGood()
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

                functions.log(color.gray('\n' + shared.language.display('words.watch') + '\n'), false)

                return watch.watchSource(sourceFiles).then(function() {

                    if (!config.option.extensions) {
                        resolve()
                    } else {
                        return watch.watchDest(destFiles).then(function() {
                            resolve()
                        }).catch(function(err) {
                            reject(err)
                        })
                    } // if

                }) // function

            }).then(function() {

                if (config.option.extensions) {
                    return watch.extensionServer()
                }

            }).then(function() {

                shared.stats.timeTo.watch = functions.sharedStatsTimeTo(shared.stats.timeTo.watch)

            })
        })
    }
} // processWatch

watch.stop = function watch_stop(stopSource, stopDest, stopExtensions) {
    /*
    Stop watching the source and/or destination folders. Optionally stop the extensions server.
    @param   {Boolean}  [stopSource]      Optional and defaults to true. If true, stop watching the source folder.
    @param   {Boolean}  [stopDest]        Optional and defaults to true. If true, stop watching the destination folder.
    @param   {Boolean}  [stopExtensions]  Optional and defaults to true. If true, stop the extensions server.
    @return  {Promise}
    */
    stopSource     = typeof stopSource     === 'boolean' ? stopSource     : true
    stopDest       = typeof stopDest       === 'boolean' ? stopDest       : true
    stopExtensions = typeof stopExtensions === 'boolean' ? stopExtensions : true

    return new Promise(function(resolve, reject) {
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

        if (stopExtensions) {
            clearInterval(extensionServerTimer) // no need to check for disconnected clients anymore

            if (typeof extensionServer === 'object') {
                extensionServer.close(function() {
                    resolve()
                })
            } else {
                resolve()
            }
        } else {
            resolve()
        }
    })
} // stop

watch.checkExtensionClients = function watch_checkExtensionClients() {
    extensionServer.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            if (client._pingAttempt >= 3) {
                // disconnected client
                client.terminate()
            } else {
                client._pingAttempt += 1
                client.send('ping')
            }
        }
    })
} // checkExtensionClients

watch.updateExtensionServer = function watch_updateExtensionServer(now) {
    /*
    Update the extension server with a list of changed files.
    @param   {Boolean}  now  True meaning we have already waited 300 ms for events to settle.
    @return  {Undefined}
    */
    return Promise.resolve().then(function() {
        now = now || false

        if (!now) {
            // will proceed 300 ms from now in order for things to settle
            clearTimeout(shared.extension.calmTimer)

            shared.extension.calmTimer = setTimeout(function() {
                watch.updateExtensionServer(true)
            }, 300)
        } else {
            if (shared.extension.changedFiles.length > 0) {
                let fileList = '{"files": ' + JSON.stringify(shared.extension.changedFiles) + '}'

                shared.extension.changedFiles = []

                extensionServer.clients.forEach(function each(client) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(fileList)
                    }
                })

                functions.log(color.gray(shared.language.display('message.watchRefreshed').replace('{software}', 'Extension server') + '\n'))
            }
        }
    })
} // updateExtensionServer

watch.watchDest = function watch_watchDest(files) {
    /*
    Watch the destination directory for changes in order to update our extensions server as needed.
    @param   {String,Object}  [files]  Optional. Glob search string for watching destination files like '*.css' or array of full paths like ['/dest/fonts.css', '/dest/grid.css']
    @return  {Promise}
    */
    return Promise.resolve().then(function() {

        lazyLoadChokidar()

        let filesType = typeof files

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

            // chokidar will be happier without backslashes
            files = config.path.dest.replace(/\\/g, '/') + '/' + files
        }

        return watch.stop(false, true, false) // stop watching dest

    }).then(function() {

        let readyCalled = false

        return new Promise(function(resolve, reject) {

            chokidarDestFiles = files

            chokidarDest = chokidar.watch([], config.thirdParty.chokidar)

            chokidarDest
            .on('add', function(file) {
                if (!shared.suppressWatchEvents) {
                    let ext = path.extname(file).replace('.', '')
                    if (config.extension.fileTypes.indexOf(ext) >= 0) {
                        functions.log(color.gray(functions.trimDest(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.add')))

                        // emit an event
                        watch.emitterDest.emit('add', file)

                        shared.extension.changedFiles.push(file.replace(config.path.dest + '/', ''))

                        watch.updateExtensionServer()
                    }
                }
            })
            .on('change', function(file) {
                if (!shared.suppressWatchEvents) {
                    let ext = path.extname(file).replace('.', '').toLowerCase()
                    if (config.extension.fileTypes.indexOf(ext) >= 0) {
                        functions.log(color.gray(functions.trimDest(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.change')))

                        // emit an event
                        watch.emitterDest.emit('change', file)

                        shared.extension.changedFiles.push(file.replace(config.path.dest + '/', ''))

                        watch.updateExtensionServer()
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
                // in the case of multiple ready events, emit our own ready event only once
                if (readyCalled === false) {
                    readyCalled = true

                    functions.log(color.gray(shared.language.display('message.watchingDirectory').replace('{directory}', '/' + path.basename(config.path.dest))))

                    watch.emitterDest.emit('ready')

                    resolve()
                }
            })

            chokidarDest.add(files)
        })
    })
} // watchDest

watch.watchSource = function watch_watchSource(files) {
    /*
    Watch source directory for changes and kick off the appropriate response tasks as needed.
    @param   {String,Object}  [files]  Optional. Glob search string for watching source files like '*.html' or array of full paths like ['/source/about.html', '/source/index.html']
    @return  {Promise}
    */
    return Promise.resolve().then(function() {

        return watch.stop(true, false, false) // stop watching source

    }).then(function() {

        return new Promise(function(resolve, reject) {

            lazyLoadChokidar()

            let filesType = typeof files

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

                // chokidar will be happier without backslashes
                files = config.path.source.replace(/\\/g, '/') + '/' + files
            }

            let readyCalled = false

            chokidarSourceFiles = files

            chokidarSource = chokidar.watch([], config.thirdParty.chokidar)

            chokidarSource
            .on('addDir', function(file) {
                if (!shared.suppressWatchEvents) {
                    functions.log(color.gray(functions.trimSource(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.addDirectory')))

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
                    functions.log(color.gray(functions.trimSource(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.removedDirectory')))

                    // emit an event
                    watch.emitterSource.emit('removed directory', file)

                    functions.removeDest(functions.sourceToDest(file), true, true)
                }
            })
            .on('add', function(file) {
                if (!shared.suppressWatchEvents) {
                    functions.log(color.gray(functions.trimSource(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.add')))

                    // emit an event
                    watch.emitterSource.emit('add', file)

                    watch.buildOne(file)
                }
            })
            .on('change', function(file) {
                if (!shared.suppressWatchEvents) {
                    if (watch.notTooRecent(file)) {
                        functions.log(color.gray(functions.trimSource(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.change')))

                        // emit an event
                        watch.emitterSource.emit('change', file)

                        watch.buildOne(file)
                    } else {
                        if (config.option.debug) {
                            functions.log(color.yellow(shared.language.display('message.fileChangedTooRecently').replace('{file}', functions.trimSource(file).replace(/\\/g, '/'))))
                        }
                    }
                }
            })
            .on('unlink', function(file) {
                if (!shared.suppressWatchEvents) {
                    functions.log(color.gray(functions.trimSource(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.removed')))

                    // emit an event
                    watch.emitterSource.emit('removed', file)

                    clean.processClean(functions.sourceToDest(file), true)
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
                // in the case of multiple ready events, emit our own ready event only once
                if (readyCalled === false) {
                    readyCalled = true

                    functions.log(color.gray(shared.language.display('message.watchingDirectory').replace('{directory}', '/' + path.basename(config.path.source))))

                    recentFiles = {} // reset recentFiles in case any changes happened while we were loading

                    watch.emitterSource.emit('ready')

                    resolve()
                }
            })

            chokidarSource.add(files)

        })
    })
} // watchSource

//---------
// Exports
//---------
module.exports = watch