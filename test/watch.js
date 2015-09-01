'use strict'

//----------
// Includes
//----------
var expect = require('expect.js')
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
var testPath = path.join(shared.path.self, 'test', 'files', 'watch')

//-------------
// Mocha Tests
//-------------
describe('File -> ../code/7 - watch.js\n', function() {

    beforeEach(function() {
        // runs before each test in this describe block
        config.option.concurLimit = 1
        config.option.log = false
        config.option.watch = true
    })

    afterEach(function() {
        // runs after each test in this describe block
        config = functions.restoreObj(config, configBackup)

        // remove any event listeners
        watch.emitterDest.removeAllListeners()
        watch.emitterSource.removeAllListeners()
    })

    //-------
    // watch
    //-------
    describe('buildOne', function() {
        it('should build one file', function() {

            config.path.source = path.join(testPath, 'buildOne', 'source')
            config.path.dest   = path.join(testPath, 'buildOne', 'dest')

            var fileSource = path.join(config.path.source, 'hello.txt')
            var fileDest = path.join(config.path.dest, 'hello.txt')

            return functions.makeDirPath(fileDest).then(function() {

                // make sure the dest file doesn't exist from a previous run
                return functions.removeFile(fileDest)

            }).then(function() {

                return watch.buildOne(fileSource)

            }).then(function() {

                return functions.fileExists(fileDest)

            }).then(function(exists) {

                expect(exists).to.be(true)

                // remove dest folder
                return functions.removeFile(config.path.dest)

            })

        }) // it
    }) // describe

    describe('notTooRecent', function() {
        it('should return true if file activity is spaced apart', function(done) {

            watch.notTooRecent('file1.txt')
            setTimeout(function() {
                var bool = watch.notTooRecent('file1.txt')
                expect(bool).to.be(true)
                done()
            }, 350)

        }) // it

        it('should return false for file activity in quick succession', function() {
            watch.notTooRecent('file2.txt')
            var bool = watch.notTooRecent('file2.txt')
            expect(bool).to.be(false)
        }) // it
    }) // describe

    describe('processWatch', function() {
        it('should see changes in both source and destination', function() {

            config.option.livereload = true

            config.path.source = path.join(testPath, 'processWatch', 'source')
            config.path.dest   = path.join(testPath, 'processWatch', 'dest')

            var files = [path.join(config.path.source, 'sample.html'),
                         path.join(config.path.dest, 'sample.html')]

            return functions.makeDirPath(config.path.source, true).then(function() {

                return functions.makeDirPath(config.path.dest, true)

            }).then(function() {

                // make sure files from any previous run are removed
                return functions.removeFiles(files)

            }).then(function() {

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

                    watch.emitterSource.on('add', function(file) {
                        check1 = true
                        check()
                    })

                    watch.emitterDest.on('add', function(file) {
                        check2 = true
                        check()
                    })

                    return functions.writeFile(path.join(config.path.source, 'sample.html'), '...')
                })

            }).then(function(checks) {

                expect(checks).to.be(true)

                return functions.removeFiles(files)

            }).then(function() {

                // remove parent folder
                return functions.removeFile(path.dirname(config.path.dest))

            })

        }) // it
    }) // describe

    describe('updateLiveReloadServer', function() {
        it('should not return an error', function() {

            watch.updateLiveReloadServer('now').then(function(updated) {
                expect(updated).to.be(true)
            })

        }) // it
    }) // describe

    describe('watchDest', function() {
        it('should notice a change in the destination folder', function() {

            config.option.livereload = true

            config.path.source = path.join(testPath, 'watchDest', 'source')
            config.path.dest   = path.join(testPath, 'watchDest', 'dest')

            var file = path.join(config.path.dest, 'sample.html')

            return functions.makeDirPath(config.path.source, true).then(function() {

                return functions.makeDirPath(config.path.dest, true)

            }).then(function() {

                // make sure files from any previous run are removed
                return functions.removeFile(file)

            }).then(function() {

                return watch.watchDest()

            }).then(function() {

                return new Promise(function(resolve, reject) {

                    watch.emitterDest.on('add', function(file) {
                        resolve(true)
                    })

                    return functions.writeFile(file, '...')
                })

            }).then(function(emit) {

                expect(emit).to.be(true)

                // remove parent folder
                return functions.removeFile(path.dirname(config.path.dest))

            })

        }) // it
    }) // describe

    describe('watchSource', function() {
        it('should notice a change in the source folder', function() {

            config.path.source = path.join(testPath, 'watchSource', 'source')
            config.path.dest   = path.join(testPath, 'watchSource', 'dest')

            var file = path.join(config.path.source, 'sample.html')

            return functions.makeDirPath(config.path.source, true).then(function() {

                return functions.makeDirPath(config.path.dest, true)

            }).then(function() {

                // make sure file from any previous run is removed
                return functions.removeFile(file)

            }).then(function() {

                return watch.watchSource()

            }).then(function() {

                return new Promise(function(resolve, reject) {

                    watch.emitterSource.on('add', function(file) {
                        resolve(true)
                    })

                    return functions.writeFile(file, '...')
                })

            }).then(function(emit) {

                expect(emit).to.be(true)

                // make sure file from any previous run is removed
                return functions.removeFile(file)

            }).then(function() {

                // remove parent folder
                return functions.removeFile(path.dirname(config.path.dest))

            })

        }) // it
    }) // describe

}) // describe
