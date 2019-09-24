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
const util        = require('util')        // ~ 1 ms

//---------------------
// Includes: Promisify
//---------------------
const mkdirpPromise = util.promisify(mkdirp) // ~ 1 ms

//---------------------
// Includes: Lazy Load
//---------------------
let chokidar  // require('chokidar') // ~ 75 ms
let WebSocket // require('ws')       // ~ 34 ms

//-----------
// Variables
//-----------
let chokidarSource = '' // will become a chokidar object when watching the source folder
let chokidarDest   = '' // will become a chokidar object when watching the destination folder

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
watch.buildOne = async function watch_buildOne(fileName) {
    /*
    Figure out which files should be processed after receiving an add or change event from the source directory watcher.
    @param   {String}   fileName  File path like '/source/js/combined.js'
    @return  {Promise}
    */

    // chill for a bit to let things settle
    await functions.wait(100)

    // since rename events can be chaotic, does the source file or folder still exist?
    let fileExists = await functions.fileExists(fileName)

    if (fileExists === false) {
        return 'early'
    }

    let ext = functions.fileExtension(fileName)

    let files = []

    let checkConcatFiles = false

    const isIncludePrefixFile = path.basename(fileName).substr(0, config.includePrefix.length) === config.includePrefix

    if (isIncludePrefixFile) {
        if (config.includeFileTypes.indexOf(ext) >= 0) {
            // included file could be in any of this type of file so check them all
            files = await functions.findFiles(config.path.source + "/**/*." + ext)
        } else {
            checkConcatFiles = true
        }
    } else {
        // not an include prefixed file
        files.push(fileName) // this file should be built
        checkConcatFiles = true
    }

    if (checkConcatFiles && config.fileType.concat.enabled) {

        if (ext === 'concat') {
            if (isIncludePrefixFile) {
                // concat files that are also _ prefixed include files will not trigger a rebuild of their parent concat file when modified
                // only a modification of the parent concat file or the modification of any non-concat included files would trigger a rebuild
                // in other words, avoid creating files like _edgeCase.js.concat
                functions.log(color.red(shared.language.display('error.concatInclude')))
                functions.log(color.gray('https://github.com/nightmode/feri/blob/master/docs/extension-specific-info.md#twilight-zone') + '\n')
            }

            ext = functions.fileExtension(functions.removeExt(fileName))
        }

        // .concat files can concat almost anything so check all fileName.ext.concat files
        let possibleFiles = await functions.findFiles(config.path.source + '/**/*.' + ext + '.concat')

        if (possibleFiles.length > 0) {
            for (let x in possibleFiles) {
                let data = await functions.readFile(possibleFiles[x])

                let includeFiles = await functions.includePathsConcat(data, possibleFiles[x])

                let concatMeta = await functions.concatMetaRead(possibleFiles[x])

                if (concatMeta.toString() !== includeFiles.toString()) {
                    files.push(possibleFiles[x])
                } else if (includeFiles.indexOf(fileName) >= 0) {
                    files.push(possibleFiles[x])
                }
            }
        }
    }

    if (files.length > 0) {
        files = files.filter(function(y) {
            // filter out any _ prefixed includes
            return path.basename(y).substr(0, config.includePrefix.length) !== config.includePrefix
        })

        if (files.includes(fileName)) {
            // things can be weird during rename events

            // does the source file or folder still exist?
            fileExists = await functions.fileExists(fileName)

            if (fileExists === false) {
                return 'late but not too late'
            }

            // delete the dest file to ensure a new file is built with the correct case
            await functions.removeDest(functions.sourceToDest(fileName), false, false)
        }

        return build.processBuild(files, true)
    }
} // buildOne

watch.checkExtensionClients = function watch_checkExtensionClients() {
    /*
    Ping clients to make sure they are still connected. Terminate clients which have not responded to three or more pings.
    */
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

watch.extensionServer = async function watch_extensionServer() {
    /*
    Run an extension server for clients.
    @return  {Promise}
    */

    if (config.option.extensions) {
        lazyLoadWebSocket()

        // stop the extension server only
        await watch.stop(false, false, true)

        await new Promise(function(resolve, reject) {
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

watch.processWatch = async function watch_processWatch(sourceFiles, destFiles) {
    /*
    Watch the source folder. Optionally watch the destination folder and start an extension server.
    @param   {String,Object}  [sourceFiles]  Optional. Glob search string for watching source files like '*.html' or array of full paths like ['/source/about.html', '/source/index.html']
    @param   {String,Object}  [destFiles]    Optional. Glob search string for watching destination files like '*.css' or array of full paths like ['/dest/fonts.css', '/dest/grid.css']
    @return  {Promise}
    */
    if (config.option.watch) {
        // start watch timer
        shared.stats.timeTo.watch = functions.sharedStatsTimeTo(shared.stats.timeTo.watch)

        let configPathsAreGood = functions.configPathsAreGood()

        if (configPathsAreGood !== true) {
            throw new Error(configPathsAreGood)
        }

        let exists = await functions.fileExists(config.path.source)

        if (exists === false) {
            throw new Error(shared.language.display('error.missingSourceDirectory'))
        }

        functions.log(color.gray('\n' + shared.language.display('words.watch') + '\n'), false)

        await watch.watchSource(sourceFiles)

        if (config.option.extensions) {
            await watch.watchDest(destFiles)
        } // if

        if (config.option.extensions) {
            await watch.extensionServer()
        }

        shared.stats.timeTo.watch = functions.sharedStatsTimeTo(shared.stats.timeTo.watch)
    }
} // processWatch

watch.removeOne = async function watch_removeOne(fileName) {
    /*
    Figure out if file or folder should be removed after an unlink or unlinkdir event from the source directory watcher.
    @param   {String}   fileName    File path like '/source/js/combined.js'
    @return  {Promise}
    */

    // chill for a bit to let things settle
    await functions.wait(100)

    const destFile = functions.sourceToDest(fileName)

    const sourceFileExists = await functions.fileExists(fileName)
    const destFileExists = await functions.fileExists(destFile)

    if (sourceFileExists === true || destFileExists === false) {
        return 'early'
    }

    await functions.removeDest(destFile, false)
} // removeOne

watch.stop = function watch_stop(stopSource, stopDest, stopExtension) {
    /*
    Stop watching the source and/or destination folders. Optionally stop the extensions server.
    @param   {Boolean}  [stopSource]     Optional and defaults to true. If true, stop watching the source folder.
    @param   {Boolean}  [stopDest]       Optional and defaults to true. If true, stop watching the destination folder.
    @param   {Boolean}  [stopExtension]  Optional and defaults to true. If true, stop the extension server.
    @return  {Promise}
    */
    stopSource    = typeof stopSource    === 'boolean' ? stopSource    : true
    stopDest      = typeof stopDest      === 'boolean' ? stopDest      : true
    stopExtension = typeof stopExtension === 'boolean' ? stopExtension : true

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

        if (stopExtension) {
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

watch.updateExtensionServer = async function watch_updateExtensionServer(now) {
    /*
    Update the extension server with a list of changed files.
    @param   {Boolean}  [now]  Optional and defaults to false. True means we have already waited 300 ms for events to settle.
    @return  {Promise}
    */
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

            functions.log(color.gray(shared.language.display('message.watchUpdated').replace('{software}', 'Extension server') + '\n'))
        }
    }
} // updateExtensionServer

watch.watchDest = async function watch_watchDest(files) {
    /*
    Watch the destination directory for changes in order to update the extensions server as needed.
    @param   {String,Object}  [files]  Optional. Glob search string for watching destination files like '*.css' or array of full paths like ['/dest/fonts.css', '/dest/grid.css']
    @return  {Promise}
    */
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

    await watch.stop(false, true, false) // stop watching dest

    let readyCalled = false

    await new Promise(function(resolve, reject) {
        chokidarDestFiles = files

        chokidarDest = chokidar.watch([], config.thirdParty.chokidar)

        chokidarDest
        .on('add', function(file) {
            if (!shared.suppressWatchEvents) {
                let ext = functions.fileExtension(file)
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
                let ext = functions.fileExtension(file)
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
            if (error.code === 'EPERM' && shared.platform === 'win32') {
                // ignore eperm errors on windows which can happen when deleting folders
                return 'early'
            }

            functions.log(shared.language.display('error.watchingDest'))
            functions.logError(error)

            // emit an event
            watch.emitterDest.emit('error', error)

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
} // watchDest

watch.watchSource = async function watch_watchSource(files) {
    /*
    Watch source directory for changes and kick off the appropriate response tasks as needed.
    @param   {String,Object}  [files]  Optional. Glob search string for watching source files like '*.html' or array of full paths like ['/source/about.html', '/source/index.html']
    @return  {Promise}
    */
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

    await watch.stop(true, false, false) // stop watching source

    let readyCalled = false

    await new Promise(function(resolve, reject) {
        chokidarSourceFiles = files

        chokidarSource = chokidar.watch([], config.thirdParty.chokidar)

        chokidarSource
        .on('add', function(file) {
            if (!shared.suppressWatchEvents) {
                functions.log(color.gray(functions.trimSource(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.add')))

                // emit an event
                watch.emitterSource.emit('add', file)

                watch.workQueueAdd('source', 'add', file)
            }
        })
        .on('addDir', function(file) {
            if (!shared.suppressWatchEvents) {
                functions.log(color.gray(functions.trimSource(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.addDirectory')))

                // emit an event
                watch.emitterSource.emit('add directory', file)

                watch.workQueueAdd('source', 'adddir', file)
            }
        })
        .on('change', function(file) {
            if (!shared.suppressWatchEvents) {
                if (watch.notTooRecent(file)) {
                    functions.log(color.gray(functions.trimSource(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.change')))

                    // emit an event
                    watch.emitterSource.emit('change', file)

                    watch.workQueueAdd('source', 'change', file)
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

                watch.workQueueAdd('source', 'unlink', file)
            }
        })
        .on('unlinkDir', function(file) {
            if (!shared.suppressWatchEvents) {
                functions.log(color.gray(functions.trimSource(file).replace(/\\/g, '/') + ' ' + shared.language.display('words.removedDirectory')))

                // emit an event
                watch.emitterSource.emit('removed directory', file)

                watch.workQueueAdd('source', 'unlinkdir', file)
            }
        })
        .on('error', function(error) {
            if (error.code === 'EPERM' && shared.platform === 'win32') {
                // ignore eperm errors on windows which can happen when deleting folders
                return 'early'
            }

            functions.log(shared.language.display('error.watchingSource'))
            functions.logError(error)

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
} // watchSource

watch.workQueueAdd = function watch_workQueueAdd(location, task, path) {
    /*
    Add an event triggered task to the shared.watch.workQueue array.
    @param  {String}  location  A string like 'source' or 'dest'.
    @param  {String}  task      An event triggered task string like 'add', 'change', and so on.
    @param  {String}  path      A string with the full path to a file or folder.
    */
    shared.watch.workQueue.push({
        location: location,
        task: task,
        path: path
    })

    watch.workQueueProcess()
} // workQueueAdd

watch.workQueueProcess = async function watch_workQueueProcess() {
    /*
    Process the shared.watch.workQueue array and run tasks one at a time to match the order of events.
    @return  {Promise}
    */
    if (shared.watch.working || shared.watch.workQueue.length === 0) {
        // an instance of this function is already working the queue or there is nothing to do
        return 'early'
    }

    shared.watch.working = true // so subsequent calls to this function know we are working the queue

    do {
        let work = shared.watch.workQueue.shift() // removes the first item from the array

        try {
            if (work.location === 'source') {
                switch (work.task) {
                    case 'add':
                        await watch.buildOne(work.path)
                        break

                    case 'adddir':
                        await mkdirpPromise(functions.sourceToDest(work.path))
                        break

                    case 'change':
                        await watch.buildOne(work.path)
                        break

                    case 'unlink':
                        await watch.removeOne(work.path)
                        break

                    case 'unlinkdir':
                        await watch.removeOne(work.path)
                        break

                    default:
                        functions.log('watch.workQueueProcess -> unknown source work task "' + work.task + '"')
                        break
                } // switch
            } else {
                functions.log('watch.workQueueProcess -> unknown work location "' + work.location + '"')
            }
        } catch (error) {
            functions.log('watch.workQueueProcess -> try catch error')
            functions.logError(error)
        }
    } while (shared.watch.workQueue.length > 0)

    shared.watch.working = false
} // workQueueProcess

//---------
// Exports
//---------
module.exports = watch