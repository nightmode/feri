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
        config.option.watch = true
    })

    afterEach(function() {
        // runs after each test in this describe block
        config = functions.restoreObj(config, configBackup)

        // remove any event listeners
        watch.emitterDest.removeAllListeners()
        watch.emitterSource.removeAllListeners()
    })

    //------------------------
    // Notes for test writers
    //------------------------
    /*
    Use Unique File Names

        Specify unique source file names in tests that may use watch.notTooRecent() behind the scenes.
        If you use do not use unique source file names, you may lose change events that happen in quick succession.

    Chokidar + Mac = Weird

        Issue encountered on September 1st, 2015.
        Let's say you are using chokidar to watch a directory.
        First you create a file in said directory, witness the change event, then immediately run functions.removeFile to remove the parent directory containing the file. You will almost always get an error like "ENOTEMPTY: directory not empty, rmdir /path/to/file".
        Solution for having more reliable tests seems to be deleting the files first to ensure empty folders then removing those empty folders.
        Other solution was to call something like functions.findFiles before removing the directory. Not sure if looking at the file system or the time taken to call the function did the trick. Either way, seems better to just delete files, then folders.
    */

    //-------
    // watch
    //-------
    describe('buildOne', function() {
        it('should build one file', function() {

            config.path.source = path.join(testPath, 'buildOne', 'source')
            config.path.dest   = path.join(testPath, 'buildOne', 'dest')

            var fileSource = path.join(config.path.source, 'hello.txt')
            var fileDest = path.join(config.path.dest, 'hello.txt')

            return functions.removeFile(config.path.dest).then(function() {

                return watch.buildOne(fileSource)

            }).then(function() {

                return functions.fileExists(fileDest)

            }).then(function(exists) {

                expect(exists).to.be(true)

                return functions.removeFile(config.path.dest)

            })

        }) // it
    }) // describe

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

    describe('processWatch', function() {
        it('should see changes in both source and destination', function() {

            config.option.livereload = true

            config.path.source = path.join(testPath, 'processWatch', 'source')
            config.path.dest   = path.join(testPath, 'processWatch', 'dest')

            var fileSource = path.join(config.path.source, 'one.html')
            var fileDest   = path.join(config.path.dest, 'one.html')

            return Promise.resolve().then(function() {

                return functions.removeFile(path.dirname(config.path.dest))

            }).then(function() {

                return functions.makeDirPath(fileSource).then(function() {
                    return functions.writeFile(fileSource, '...')
                })

            }).then(function() {

                return functions.makeDirPath(fileDest).then(function() {
                    return functions.writeFile(fileDest, '...')
                })

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

                    watch.emitterSource.on('change', function(file) {
                        expect(file).to.be(fileSource)

                        check1 = true
                        check()
                    })

                    watch.emitterDest.on('change', function(file) {
                        expect(file).to.be(fileDest)

                        check2 = true
                        check()
                    })

                    return functions.writeFile(fileSource, '...')

                })

            }).then(function(checks) {

                expect(checks).to.be(true)

                return functions.removeFiles([fileSource, fileDest])

            }).then(function() {

                return functions.removeFile(path.dirname(config.path.dest))

            })

        }) // it

        it('should use config.glob.watch strings if available', function() {

            config.option.livereload = true

            config.glob.watch.source = '*.less'
            config.glob.watch.dest = '*.css'

            config.path.source = path.join(testPath, 'processWatch', 'source')
            config.path.dest   = path.join(testPath, 'processWatch', 'dest')

            var fileSource = path.join(config.path.source, 'two.less')
            var fileDest   = path.join(config.path.dest, 'two.css')

            return Promise.resolve().then(function() {

                return functions.removeFile(path.dirname(config.path.dest))

            }).then(function() {

                return functions.makeDirPath(fileSource).then(function() {
                    return functions.writeFile(fileSource, '...')
                })

            }).then(function() {

                return functions.makeDirPath(fileDest).then(function() {
                    return functions.writeFile(fileDest, '...')
                })

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

                    watch.emitterSource.on('change', function(file) {
                        expect(file).to.be(fileSource) // source

                        check1 = true
                        check()
                    })

                    watch.emitterDest.on('change', function(file) {
                        expect(file).to.be(fileDest) // dest

                        check2 = true
                        check()
                    })

                    return functions.writeFile(fileSource, '*{content:"tastes great, less filling"}')
                })

            }).then(function(checks) {

                expect(checks).to.be(true)

                return functions.removeFiles([fileSource, fileDest])

            }).then(function() {

                return functions.removeFile(path.dirname(config.path.dest))

            })

        }) // it

        it('should use glob search strings as parameters', function() {

            config.option.livereload = true

            config.glob.watch.source = '*.less'
            config.glob.watch.dest = '*.css'

            config.path.source = path.join(testPath, 'processWatch', 'source')
            config.path.dest   = path.join(testPath, 'processWatch', 'dest')

            var fileSource = path.join(config.path.source, 'three.js')
            var fileDest   = path.join(config.path.dest, 'three.js')

            var ignoreFileSource = path.join(config.path.source, 'three.html')
            var ignoreFileDest   = path.join(config.path.dest, 'three.html')

            return Promise.resolve().then(function() {

                return functions.removeFile(path.dirname(config.path.dest))

            }).then(function() {

                return functions.makeDirPath(fileSource).then(function() {
                    return functions.writeFile(fileSource, '...')
                })

            }).then(function() {

                return functions.makeDirPath(fileDest).then(function() {
                    return functions.writeFile(fileDest, '...')
                })

            }).then(function() {

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

                    watch.emitterSource.on('change', function(file) {
                        expect(file).to.be(fileSource)

                        check1 = true
                        check()
                    })

                    watch.emitterDest.on('change', function(file) {
                        expect(file).to.be(fileDest)

                        check2 = true
                        check()
                    })

                    return functions.writeFile(ignoreFileSource, '...').then(function() {

                        return functions.writeFile(fileSource, 'var peanut = "butter"')

                    })

                })

            }).then(function(checks) {

                expect(checks).to.be(true)

                return functions.removeFiles([fileSource, fileDest, ignoreFileSource])

            }).then(function() {

                return functions.removeFile(path.dirname(config.path.dest))

            })

        }) // it

        it('should use arrays with file path strings as parameters', function() {

            config.option.livereload = true

            config.glob.watch.source = '*.less'
            config.glob.watch.dest = '*.css'

            config.path.source = path.join(testPath, 'processWatch', 'source')
            config.path.dest   = path.join(testPath, 'processWatch', 'dest')

            var fileSource = path.join(config.path.source, 'four.js')
            var fileDest   = path.join(config.path.dest, 'four.js')

            var ignoreFileSource = path.join(config.path.source, 'four.html')
            var ignoreFileDest   = path.join(config.path.dest, 'four.html')

            return Promise.resolve().then(function() {

                return functions.removeFile(path.dirname(config.path.dest))

            }).then(function() {

                return functions.makeDirPath(fileSource).then(function() {
                    return functions.writeFile(fileSource, '...')
                })

            }).then(function() {

                return functions.makeDirPath(fileDest).then(function() {
                    return functions.writeFile(fileDest, '...')
                })

            }).then(function() {

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

                    watch.emitterSource.on('change', function(file) {
                        expect(file).to.be(fileSource)

                        check1 = true
                        check()
                    })

                    watch.emitterDest.on('change', function(file) {
                        expect(file).to.be(fileDest)

                        check2 = true
                        check()
                    })

                    return functions.writeFile(ignoreFileSource, '...').then(function() {

                        return functions.writeFile(fileSource, 'var jelly = "time"')

                    })

                })

            }).then(function(checks) {

                expect(checks).to.be(true)

                return functions.removeFiles([fileSource, fileDest, ignoreFileSource])

            }).then(function() {

                return functions.removeFile(path.dirname(config.path.dest))

            })

        }) // it
    }) // describe

    //------------
    // watch.stop
    //------------
    // Stop watching the source and/or destination folders. Also stop the livereload server.
    // No need to test since it will be tested by watch.processWatch, watch.watchDest, and watch.watchSource.

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

            var fileDest = path.join(config.path.dest, 'watchDest.html')

            return Promise.resolve().then(function() {

                return functions.removeFile(path.dirname(config.path.dest))

            }).then(function() {

                return functions.makeDirPath(fileDest).then(function() {
                    return functions.writeFile(fileDest, '...')
                })

            }).then(function() {

                return watch.watchDest()

            }).then(function() {

                return new Promise(function(resolve, reject) {

                    watch.emitterDest.on('change', function(file) {
                        resolve(true)
                    })

                    return functions.writeFile(fileDest, '...')
                })

            }).then(function(emit) {

                expect(emit).to.be(true)

                return functions.removeFile(fileDest)

            }).then(function() {

                return functions.removeFile(path.dirname(config.path.dest))

            })

        }) // it
    }) // describe

    describe('watchSource', function() {
        it('should notice a change in the source folder', function() {

            config.option.livereload = true

            config.path.source = path.join(testPath, 'watchSource', 'source')
            config.path.dest   = path.join(testPath, 'watchSource', 'dest')

            var fileSource = path.join(config.path.source, 'watchSource.html')

            return Promise.resolve().then(function() {

                return functions.removeFile(path.dirname(config.path.dest))

            }).then(function() {

                return functions.makeDirPath(fileSource).then(function() {
                    return functions.writeFile(fileSource, '...')
                })

            }).then(function() {

                return watch.watchSource()

            }).then(function() {

                return new Promise(function(resolve, reject) {

                    watch.emitterSource.on('change', function(file) {
                        resolve(true)
                    })

                    return functions.writeFile(fileSource, '...')

                })

            }).then(function(emit) {

                expect(emit).to.be(true)

            }).then(function() {

                return functions.removeFile(fileSource)

            }).then(function() {

                return functions.removeFile(path.dirname(config.path.dest))

            })

        }) // it
    }) // describe

}) // describe
