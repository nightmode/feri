# Feri - Watch

Watch is all about watching the source and destination folders for changes. Initiating the proper clean or build tasks in response to file system events.

The watch module can be found inside the file [code/7 - watch.js](../../../code/7%20-%20watch.js)

## Watch Object

* [buildOne](#watchbuildone)
* [checkExtensionClients](#watchcheckextensionclients)
* [emitterDest](#watchemitterdest)
* [emitterSource](#watchemittersource)
* [extensionServer](#watchextensionServer)
* [notTooRecent](#watchnottoorecent)
* [processWatch](#watchprocesswatch)
* [removeOne](#watchremoveone)
* [stop](#watchstop)
* [updateExtensionServer](#watchupdateextensionserver)
* [watchDest](#watchwatchdest)
* [watchSource](#watchwatchsource)
* [workQueueAdd](#watchworkqueueadd)
* [workQueueProcess](#watchworkqueueprocess)

## watch.buildOne

Type: `function`

Figure out which files should be processed after receiving an add or change event from the source directory watcher.

```
@param   {String}   fileName  File path like '/source/js/combined.js'
@return  {Promise}
```

## watch.checkExtensionClients

Type: `function`

Ping clients to make sure they are still connected. Terminate clients which have not responded to three or more pings.

## watch.emitterDest

Type: `object`

An instance of [nodejs.org/api/events.html](https://nodejs.org/api/events.html) for the destination folder. Can emit the following events.

* add
* change
* error
* ready

Example

```js
return feri.action.watch().then(function() {
    feri.watch.emitterDest.on('add', function(file) {
        console.log('detected add event for ' + file)
    })
})

// pretend a file called 'sample.txt' was just added to the destination folder

// display 'detected add event for /dest/sample.txt'
```

## watch.emitterSource

Type: `object`

An instance of [nodejs.org/api/events.html](https://nodejs.org/api/events.html) for the source folder. Can emit the following events.

* add
* addDir
* change
* error
* ready
* unlink
* unlinkDir

Example

```js
return feri.action.watch().then(function() {
    feri.watch.emitterSource.on('unlinkDir', function(file) {
        console.log('A directory called ' + file + ' was removed.')
    })
})

// pretend a directory called 'css' was just removed from the source folder

// display 'A directory called /source/css was removed.'
```

## watch.extensionServer

Type: `function`

Run an extension server for clients.

```
@return  {Promise}
```

## watch.notTooRecent

Type: `function`

Suppress subsequent file change notifications if they happen within 300 ms of a previous event.

```
@param   {String}   file  File path like '/path/readme.txt'
@return  {Boolean}        True if a file was not active recently.
```

## watch.processWatch

Type: `function`

Watch the source folder. Optionally watch the destination folder and start an extension server.

```
@param   {String,Object}  [sourceFiles]  Optional. Glob search string for watching source files like '*.html' or array of full paths like ['/source/about.html', '/source/index.html']
@param   {String,Object}  [destFiles]    Optional. Glob search string for watching destination files like '*.css' or array of full paths like ['/dest/fonts.css', '/dest/grid.css']
@return  {Promise}
```

Example

```js
config.option.watch = true      // watch the source folder
config.option.extensions = true // watch the destination folder for the extension server

return watch.processWatch().then(function() {
    // we are now watching
})
```

Note: This function is also aliased as `feri.action.watch`.

## watch.removeOne

Type: `function`

Figure out if file or folder should be removed after an unlink or unlinkdir event from the source directory watcher.

```
@param   {String}   fileName    File path like '/source/js/combined.js'
@return  {Promise}
```

## watch.stop

Type: `function`

Stop watching the source and/or destination folders. Optionally stop the extensions server.

```
@param  {Boolean}  [stopSource]     Optional and defaults to true. If true, stop watching the source folder.
@param  {Boolean}  [stopDest]       Optional and defaults to true. If true, stop watching the destination folder.
@param  {Boolean}  [stopExtension]  Optional and defaults to true. If true, stop the extension server.
```

## watch.updateExtensionServer

Type: `function`

Update the extension server with a list of changed files.

```
@param   {Boolean}  [now]  Optional and defaults to false. True means we have already waited 300 ms for events to settle.
@return  {Promise}
```

## watch.watchDest

Type: `function`

Watch the destination directory for changes in order to update the extension server as needed.

```
@param   {String,Object}  [files]  Optional. Glob search string for watching destination files like '*.css' or array of full paths like ['/dest/fonts.css', '/dest/grid.css']
@return  {Promise}
```

## watch.watchSource

Type: `function`

Watch source directory for changes and kick off the appropriate response tasks as needed.

```
@param   {String,Object}  [files]  Optional. Glob search string for watching source files like '*.html' or array of full paths like ['/source/about.html', '/source/index.html']
@return  {Promise}
```

## watch.workQueueAdd

Type: `function`

Add an event triggered task to the `shared.watch.workQueue` array.

```
@param  {String}  location  A string like 'source' or 'dest'.
@param  {String}  task      An event triggered task string like 'add', 'change', and so on.
@param  {String}  path      A string with the full path to a file or folder.
```

## watch.workQueueProcess

Type: `function`

Process the `shared.watch.workQueue` array and run tasks one at a time to match the order of events.

```
@return  {Promise}
```

## License

MIT © [Kai Nightmode](https://twitter.com/kai_nightmode)