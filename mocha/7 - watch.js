'use strict'

//----------
// Includes
//----------
var expect = require('expect.js')
var fs     = require('fs')
var path   = require('path')

var shared    = require('../code/2 - shared.js')
var config    = require('../code/3 - config.js')
var functions = require('../code/4 - functions.js')
var clean     = require('../code/5 - clean.js')
var build     = require('../code/6 - build.js')
var watch     = require('../code/7 - watch.js')

//-----------
// Variables
//-----------
var configBackup = functions.cloneObj(config)
var testPath = path.join(shared.path.self, 'mocha', 'files', 'watch')
var reWriteTimer = setTimeout(function() {}, 0)

//-----------
// Functions
//-----------
var reWriter = function reWriter(goCrazy, filePath, data) {
    /*
    Keep on writing a file until chokidar notices us.
    @param  {Boolean}  goCrazy   Start or continue to write a file every 500 ms until someone stops us!
    @param  {String}   filePath  String file path like '/source/file.txt'. Not used if goCrazy is false.
    @param  {String}   [data]    Optional data to write to the file. Defaults to 'changed data'.
    */
    if (goCrazy) {
        data = data || 'changed data'
        fs.writeFileSync(filePath, data)

        reWriteTimer = setTimeout(function() {
            reWriter(goCrazy, filePath, data)
        }, 500)
    } else {
        clearTimeout(reWriteTimer)
    }
}

//------------------------
// Notes for Test Writers
//------------------------
/*
Use Unique File Names

    Specify unique source file names in tests that may use watch.notTooRecent() behind the scenes.
    If you use do not use unique source file names, you may lose events that happen in quick succession.

Chokidar + Mac = Weird

    Let's say you are using chokidar to watch a directory.
    First you create a file in said directory, witness a watch event, then immediately run functions.removeFile to remove the parent directory containing the file.
    You then receive an error like "ENOTEMPTY: directory not empty, rmdir /path/to/file".
    If you have to conpensate for this, delete files first to ensure empty folders. Then remove empty folders.
*/

//-------------
// Mocha Tests
//-------------
describe('File -> ../code/7 - watch.js\n', function() {

    beforeEach(function() {
        // runs before each test in this describe block
        config = functions.restoreObj(config, configBackup)

        config.option.concurLimit = 1
        config.option.watch = true
    })

    afterEach(function() {
        // runs after each test in this describe block

        // remove any event listeners
        watch.emitterDest.removeAllListeners()
        watch.emitterSource.removeAllListeners()

        watch.stop()
    })

    //----------------
    // watch.buildOne
    //----------------
    describe('buildOne', function() {
        it('should build one file', function() {

            config.path.source = path.join(testPath, 'buildOne', 'source')
            config.path.dest   = path.join(testPath, 'buildOne', 'dest')

            var fileSource = path.join(config.path.source, 'buildOne.txt')
            var fileDest = path.join(config.path.dest, 'buildOne.txt')

            return Promise.resolve().then(function() {

                return functions.removeFile(fileDest)

            }).then(function() {

                return watch.buildOne(fileSource)

            }).then(function() {

                return functions.fileExists(fileDest)

            }).then(function(exists) {

                expect(exists).to.be(true)

                return functions.removeFile(fileDest)

            }).then(function() {

                return functions.removeFile(config.path.dest)

            })

        }) // it
    }) // describe

    //--------------------
    // watch.notTooRecent
    //--------------------
    describe('notTooRecent', function() {
        it('should return true if file activity is spaced apart', function(done) {

            watch.notTooRecent('notTooRecent1.txt')
            setTimeout(function() {
                var bool = watch.notTooRecent('notTooRecent1.txt')
                expect(bool).to.be(true)
                done()
            }, 350)

        }) // it

        it('should return false for file activity in quick succession', function() {

            watch.notTooRecent('notTooRecent2.txt')
            var bool = watch.notTooRecent('notTooRecent2.txt')
            expect(bool).to.be(false)

        }) // it
    }) // describe

    //--------------------
    // watch.processWatch
    //--------------------
    describe('processWatch', function() {
        it('should see events for both source and destination', function() {

            config.option.livereload = true

            config.path.source = path.join(testPath, 'processWatch-1', 'source')
            config.path.dest   = path.join(testPath, 'processWatch-1', 'dest')

            var fileSource = path.join(config.path.source, 'one.html')
            var fileDest   = path.join(config.path.dest, 'one.html')

            return Promise.resolve().then(function() {

                return watch.processWatch()

            }).then(function() {

                return new Promise(function(resolve, reject) {

                    var check1 = false
                    var check2 = false

                    function check() {
                        if (check1 && check2) {
                            resolve(true)
                        }
                    }

                    function checkSource(file) {
                        expect(file).to.be(fileSource)
                        check1 = true
                        check()
                    }

                    function checkDest(file) {
                        reWriter(false)
                        expect(file).to.be(fileDest)
                        check2 = true
                        check()
                    }

                    watch.emitterSource.on('change', checkSource)

                    watch.emitterDest.on('change', checkDest)

                    reWriter(true, fileSource)

                })

            }).then(function(checks) {

                expect(checks).to.be(true)

                watch.stop()

                return functions.writeFile(fileSource, 'original data')

            }).then(function() {

                return functions.writeFile(fileDest, 'original data')

            })

        }) // it

        it('should use config.glob.watch strings if available', function() {

            config.option.livereload = true

            config.glob.watch.source = '*.less'
            config.glob.watch.dest = '*.css'

            config.path.source = path.join(testPath, 'processWatch-2', 'source')
            config.path.dest   = path.join(testPath, 'processWatch-2', 'dest')

            var fileSource = path.join(config.path.source, 'two.less')
            var fileDest   = path.join(config.path.dest, 'two.css')

            return Promise.resolve().then(function() {

                return watch.processWatch()

            }).then(function() {

                return new Promise(function(resolve, reject) {

                    var check1 = false
                    var check2 = false

                    function check() {
                        if (check1 && check2) {
                            resolve(true)
                        }
                    }

                    function checkSource(file) {
                        expect(file).to.be(fileSource)
                        check1 = true
                        check()
                    }

                    function checkDest(file) {
                        reWriter(false)
                        expect(file).to.be(fileDest)
                        check2 = true
                        check()
                    }

                    watch.emitterSource.on('change', checkSource)

                    watch.emitterDest.on('change', checkDest)

                    reWriter(true, fileSource, '*{content:"tastes great, less filling"}')
                })

            }).then(function(checks) {

                expect(checks).to.be(true)

                watch.stop()

                return functions.writeFile(fileSource, 'original data')

            }).then(function() {

                return functions.writeFile(fileDest, 'original data')

            })

        }) // it

        it('should use glob search strings as parameters', function() {

            config.option.livereload = true

            config.path.source = path.join(testPath, 'processWatch-3', 'source')
            config.path.dest   = path.join(testPath, 'processWatch-3', 'dest')

            var fileSource = path.join(config.path.source, 'three.js')
            var fileDest   = path.join(config.path.dest, 'three.js')

            var ignoreFileSource = path.join(config.path.source, 'three.html')
            var ignoreFileDest   = path.join(config.path.dest, 'three.html')

            return Promise.resolve().then(function() {

                return watch.processWatch('*.js', '*.js')

            }).then(function() {

                return new Promise(function(resolve, reject) {

                    var check1 = false
                    var check2 = false

                    function check() {
                        if (check1 && check2) {
                            resolve(true)
                        }
                    }

                    function checkSource(file) {
                        expect(file).to.be(fileSource)
                        check1 = true
                        check()
                    }

                    function checkDest(file) {
                        reWriter(false)
                        expect(file).to.be(fileDest)
                        check2 = true
                        check()
                    }

                    watch.emitterSource.on('change', checkSource)

                    watch.emitterDest.on('change', checkDest)

                    return functions.writeFile(ignoreFileSource, 'changed data').then(function() {

                        reWriter(true, fileSource, 'var peanut = "butter"')

                    })

                })

            }).then(function(checks) {

                expect(checks).to.be(true)

                watch.stop()

                return functions.writeFile(fileSource, 'original data')

            }).then(function() {

                return functions.writeFile(fileDest, 'original data')

            }).then(function() {

                return functions.writeFile(ignoreFileSource, 'original data')

            }).then(function() {

                return functions.removeFile(ignoreFileDest) // this file should never be here but remove it just in case

            })

        }) // it

        it('should use arrays with file path strings as parameters', function() {

            config.option.livereload = true

            config.path.source = path.join(testPath, 'processWatch-4', 'source')
            config.path.dest   = path.join(testPath, 'processWatch-4', 'dest')

            var fileSource = path.join(config.path.source, 'four.js')
            var fileDest   = path.join(config.path.dest, 'four.js')

            var ignoreFileSource = path.join(config.path.source, 'four.html')
            var ignoreFileDest   = path.join(config.path.dest, 'four.html')

            return Promise.resolve().then(function() {

                return watch.processWatch([fileSource], [fileDest])

            }).then(function() {

                return new Promise(function(resolve, reject) {

                    var check1 = false
                    var check2 = false

                    function check() {
                        if (check1 && check2) {
                            resolve(true)
                        }
                    }

                    function checkSource(file) {
                        expect(file).to.be(fileSource)
                        check1 = true
                        check()
                    }

                    function checkDest(file) {
                        reWriter(false)
                        expect(file).to.be(fileDest)
                        check2 = true
                        check()
                    }

                    watch.emitterSource.on('change', checkSource)

                    watch.emitterDest.on('change', checkDest)

                    return functions.writeFile(ignoreFileSource, 'changed data').then(function() {

                        reWriter(true, fileSource, 'var jelly = "time"')

                    })

                })

            }).then(function(checks) {

                expect(checks).to.be(true)

                watch.stop()

                return functions.writeFile(fileSource, 'original data')

            }).then(function() {

                return functions.writeFile(fileDest, 'original data')

            }).then(function() {

                return functions.writeFile(ignoreFileSource, 'original data')

            }).then(function() {

                return functions.removeFile(ignoreFileDest) // this file should never be here but remove it just in case

            })

        }) // it
    }) // describe

    //------------
    // watch.stop
    //------------
    // Stop watching the source and/or destination folders. Also stop the livereload server.
    // No need to test since it will be tested by watch.processWatch, watch.watchDest, and watch.watchSource.

    //------------------------------
    // watch.updateLiveReloadServer
    //------------------------------
    describe('updateLiveReloadServer', function() {
        it('should not return an error', function() {

            watch.updateLiveReloadServer('now').then(function(updated) {
                expect(updated).to.be(true)
            })

        }) // it
    }) // describe

    //-----------------
    // watch.watchDest
    //-----------------
    describe('watchDest', function() {
        it('should notice an event in the destination folder', function() {

            config.option.livereload = true

            config.path.source = path.join(testPath, 'watchDest', 'source')
            config.path.dest   = path.join(testPath, 'watchDest', 'dest')

            var fileDest = path.join(config.path.dest, 'watchDest.html')

            return Promise.resolve().then(function() {

                return watch.watchDest()

            }).then(function() {

                return new Promise(function(resolve, reject) {

                    watch.emitterDest.on('change', function() {
                        reWriter(false)
                        resolve(true)
                    })

                    reWriter(true, fileDest)

                })

            }).then(function(emit) {

                expect(emit).to.be(true)

                return functions.writeFile(fileDest, 'original data')

            })

        }) // it
    }) // describe

    //-------------------
    // watch.watchSource
    //-------------------
    describe('watchSource', function() {
        it('should notice an event in the source folder', function() {

            config.path.source = path.join(testPath, 'watchSource', 'source')
            config.path.dest   = path.join(testPath, 'watchSource', 'dest')

            var fileSource = path.join(config.path.source, 'watchSource.html')

            return Promise.resolve().then(function() {

                return watch.watchSource()

            }).then(function() {

                return new Promise(function(resolve, reject) {

                    watch.emitterSource.on('change', function(file) {
                        reWriter(false)
                        resolve(true)
                    })

                    reWriter(true, fileSource)

                })

            }).then(function(emit) {

                expect(emit).to.be(true)

                watch.stop()

                return functions.writeFile(fileSource, 'original data')

            })

        }) // it
    }) // describe

}) // describe
