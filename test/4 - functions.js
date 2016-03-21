'use strict'

//----------
// Includes
//----------
var expect = require('expect.js')
var path   = require('path')

var shared    = require('../code/2 - shared.js')
var config    = require('../code/3 - config.js')
var functions = require('../code/4 - functions.js')

//-----------
// Variables
//-----------
var sharedBackup = functions.cloneObj(shared)
var configBackup = functions.cloneObj(config)
var testPath = path.join(shared.path.self, 'test', 'files', 'functions')

//-------------
// Mocha Tests
//-------------
describe('File -> ../code/4 - functions.js\n', function() {

    beforeEach(function() {
        // runs before each test in this descibe block
        config.option.concurLimit = 1
    })

    afterEach(function() {
        // runs after each test in this describe block
        config = functions.restoreObj(config, configBackup)

        shared = functions.restoreObj(shared, sharedBackup)
    })

    describe('Functions', function() {

        //------------------------------
        // functions.addDestToSourceExt
        //------------------------------
        describe('addDestToSourceExt', function() {
            it('should add and append mappings to without harming existing entries', function() {

                var desiredObj = {
                    'karp' : ['splash', 'stare'],
                    'js'   : ['coffee', 'tea']
                }

                // add new mapping
                functions.addDestToSourceExt('karp', ['splash', 'stare'])

                // append to existing mapping
                functions.addDestToSourceExt('js', 'tea')

                expect(config.map.destToSourceExt.karp).to.eql(desiredObj.karp)

                expect(config.map.destToSourceExt.js).to.eql(desiredObj.js)

            }) // it
        }) // describe

        //----------------------
        // functions.cacheReset
        //----------------------
        describe('cacheReset', function() {
            it('should reset cache objects', function() {

                shared.cache.errorsSeen = ['wee, an error']

                shared.cache.includeFilesSeen.ext1 = ['sample.txt']

                shared.cache.includesNewer = {
                    'some': 'entry'
                }

                shared.cache.missingMapBuild = ['mystery extension']

                functions.cacheReset()

                expect(shared.cache.errorsSeen).to.be.an('object')
                expect(shared.cache.errorsSeen).to.be.empty()

                expect(shared.cache.includeFilesSeen).to.be.an('object')
                expect(shared.cache.includeFilesSeen).to.be.empty()

                expect(shared.cache.includesNewer).to.be.an('object')
                expect(shared.cache.includesNewer).to.be.empty()

                expect(shared.cache.missingMapBuild).to.be.an('array')
                expect(shared.cache.missingMapBuild).to.be.empty()

            }) // it
        }) // describe

        //---------------------
        // functions.changeExt
        //---------------------
        describe('changeExt', function() {
            it('should return file path with changed extension', function() {

                var test = functions.changeExt('index.jade', 'html')

                expect(test).to.be('index.html')

            }) // it
        }) // describe

        //----------------------
        // functions.cleanArray
        //----------------------
        describe('cleanArray', function() {
            it('should should return an array without empty slots', function() {

                var test = functions.cleanArray([1,,3])

                expect(test).to.eql([1,3])

            }) // it
        }) // describe

        //--------------------
        // functions.cloneObj
        //--------------------
        describe('cloneObj', function() {
            it('should return a cloned object that has no reference to the original', function() {

                var objOne = {
                    'meep': 'moop'
                }

                var test = functions.cloneObj(objOne)

                test.meep = false

                expect(objOne.meep).to.be('moop')

            }) // it
        }) // describe

        //------------------------------
        // functions.configPathsAreGood
        //------------------------------
        describe('configPathsAreGood', function() {
            it('should return true for unique paths', function() {

                config.path.source = path.join('web', 'source')
                config.path.dest = path.join('web', 'dest')

                expect(functions.configPathsAreGood()).to.be(true)

            }) // it

            it('should return an error string for duplicate paths', function() {

                config.path.source = path.join('web', 'source')
                config.path.dest = config.path.source

                expect(functions.configPathsAreGood()).to.be.a('string')

            }) // it

            it('should return an error string if source or dest is located within the other', function() {

                config.path.source = path.join('web', 'source')
                config.path.dest = path.join('web', 'source', 'css')

                expect(functions.configPathsAreGood()).to.be.a('string')

                config.path.source = path.join('web', 'source', 'css')
                config.path.dest = path.join('web', 'source')

                expect(functions.configPathsAreGood()).to.be.a('string')

            }) // it

            it('should return error strings when appropriate for protected destinations', function() {

                config.path.source = path.join('imaginary', 'path')

                if (shared.slash === '\\') {
                    // we are on windows
                    if (typeof process.env.windir === 'string') {
                        config.path.dest = process.env.windir
                        expect(functions.configPathsAreGood()).to.be.a('string')

                        config.path.dest = path.join(process.env.windir, 'system32')
                        expect(functions.configPathsAreGood()).to.be.a('string')

                        config.path.dest = path.join(process.env.windir, 'system32', 'drivers')
                        expect(functions.configPathsAreGood()).to.be.a('string')
                    }

                    var env = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], path.dirname(process.env.USERPROFILE)]

                    for (var i in env) {
                        if (typeof env[i] === 'string') {
                            config.path.dest = env[i]
                            expect(functions.configPathsAreGood()).to.be.a('string')

                            config.path.dest = path.join(env[i], 'second')
                            expect(functions.configPathsAreGood()).to.be.a('string')

                            config.path.dest = path.join(env[i], 'second', 'third')
                            expect(functions.configPathsAreGood()).to.be(true)
                        }
                    }

                    config.path.dest = 'c:\\'
                    expect(functions.configPathsAreGood()).to.be.a('string')
                } else {
                    if (typeof process.env.HOME === 'string') {
                        config.path.dest = path.dirname(process.env.HOME)
                        expect(functions.configPathsAreGood()).to.be.a('string')

                        config.path.dest = path.join(config.path.dest, 'name') // path like '/Users/name'
                        expect(functions.configPathsAreGood()).to.be.a('string')

                        config.path.dest = path.join(config.path.dest, 'project') // path like '/Users/name/project'
                        expect(functions.configPathsAreGood()).to.be(true)
                    }

                    config.path.dest = '/'
                    expect(functions.configPathsAreGood()).to.be.a('string')
                }

            }) // it
        }) // describe

        //------------------------
        // functions.destToSource
        //------------------------
        describe('destToSource', function() {
            it('should convert destination path to source equivalent', function() {

                var test = functions.destToSource(path.join(config.path.dest, 'about', 'index.html'))

                expect(test).to.be(path.join(config.path.source, 'about', 'index.html'))

            }) // it
        }) // describe

        //-------------------------
        // functions.figureOutPath
        //-------------------------
        describe('figureOutPath', function() {
            it('should resolve a relative path to an absolute version', function() {

                expect(functions.figureOutPath('source') === config.path.source)

            }) // it

            it('should leave an absolute path as is', function() {

                var imaginaryPath = path.join(shared.path.pwd, 'some', 'folder')

                expect(functions.figureOutPath(imaginaryPath) === imaginaryPath)

            }) // it
        }) // describe

        //----------------------
        // functions.fileExists
        //----------------------
        describe('fileExists', function() {
            it('should confirm that one file exists and another does not', function() {

                return functions.fileExists(path.join(testPath, 'fileExists', 'file.txt')).then(function(exists) {

                    expect(exists).to.be(true)

                }).then(function() {

                    functions.fileExists(path.join(testPath, 'fileExists', 'missing.txt')).then(function(exists) {

                        expect(exists).to.be(false)

                    })

                })

            }) // it
        }) // describe

        //----------------------
        // functions.filesExist
        //----------------------
        describe('filesExist', function() {
            it('should confirm that one file exists and another does not', function() {

                var file1 = path.join(testPath, 'filesExist', 'file.txt')
                var file2 = path.join(testPath, 'filesExist', 'missing.txt')

                return functions.filesExist([file1, file2]).then(function(exists) {

                    expect(exists).to.eql([true, false])

                })

            }) // it
        }) // describe

        //-----------------------------
        // functions.fileExistsAndTime
        //-----------------------------
        describe('fileExistsAndTime', function() {
            it('should find out if a file exists and its modified time', function() {

                var file = path.join(testPath, 'fileExistsAndTime', 'file.txt')

                return functions.fileExistsAndTime(file).then(function(obj) {

                    expect(obj.exists).to.be(true)
                    expect(obj.mtime).to.be.a('number')

                })

            }) // it
        }) // describe

        //-----------------------------
        // functions.filesExistAndTime
        //-----------------------------
        describe('filesExistAndTime', function() {
            it('should find if one or both files exist and their modified times', function() {

                var file1 = path.join(testPath, 'filesExistAndTime', 'file.txt')
                var file2 = path.join(testPath, 'filesExistAndTime', 'missing.txt')

                return functions.filesExistAndTime(file1, file2).then(function(obj) {

                    expect(obj.source.exists).to.be(true)
                    expect(obj.source.mtime).to.be.a('number')

                    expect(obj.dest.exists).to.be(false)
                    expect(obj.dest.mtime).to.be(0)

                })

            }) // it
        }) // describe

        //-------------------------
        // functions.fileExtension
        //-------------------------
        describe('fileExtension', function() {
            it('should return file extension in string', function() {

                var test = functions.fileExtension('/conan/riddle-of-steel.txt')

                expect(test).to.be('txt')

            }) // it
        }) // describe

        //--------------------
        // functions.fileSize
        //--------------------
        describe('fileSize', function() {
            it('should should return the size of an existing file', function() {

                var file = path.join(testPath, 'fileSize', 'file.txt')

                return functions.fileSize(file).then(function(size) {

                    expect(size).to.be(3)

                })

            }) // it

            it('should should return 0 for a missing file', function() {

                var file = path.join(testPath, 'fileSize', 'missing.txt')

                return functions.fileSize(file).then(function(size) {

                    expect(size).to.be(0)

                })

            }) // it
        }) // describe

        //---------------------
        // functions.findFiles
        //---------------------
        describe('findFiles', function() {
            it('should find array of files', function() {

                return functions.findFiles('test/files/functions/findFiles/*.js').then(function(files) {

                    expect(files).to.be.an('array')
                    expect(files).to.not.be.empty()

                })

            }) // it
        }) // describe

        //--------------------
        // functions.initFeri
        //--------------------
        describe('initFeri', function() {
            it('should create source and destination folders along with a feri-config.js file', function() {

                shared.path.pwd = path.join(testPath, 'initFeri')

                config.path.source = path.join(testPath, 'initFeri', 'source')
                config.path.dest   = path.join(testPath, 'initFeri', 'dest')

                var configFile = path.join(testPath, 'initFeri', 'feri-config.js')

                var files = [config.path.source, config.path.dest, configFile]

                return functions.initFeri().then(function() {

                    return functions.filesExist(files)

                }).then(function(filesExist) {

                    expect(filesExist).to.eql([true, true, true])

                    return functions.removeFiles(files)

                }).then(function(filesRemoved) {

                    expect(filesRemoved).to.be(true)

                })

            }) // it

            it('should create source and destination folders but not touch an existing feri-config.js file', function() {

                shared.path.pwd = path.join(testPath, 'initFeri', 'existingConfig')

                config.path.source = path.join(shared.path.pwd, 'source')
                config.path.dest   = path.join(shared.path.pwd, 'dest')

                var configFile = path.join(shared.path.pwd, 'feri-config.js')

                var files = [config.path.source, config.path.dest, configFile]

                return functions.initFeri().then(function() {

                    return functions.filesExist(files)

                }).then(function(filesExist) {

                    expect(filesExist).to.eql([true, true, true])

                    return functions.removeFiles([config.path.source, config.path.dest])

                }).then(function(filesRemoved) {

                    expect(filesRemoved).to.be(true)

                    return functions.readFile(configFile)

                }).then(function(data) {

                    expect(data).to.be('module.exports = function(feri) {}')

                })

            }) // it
        }) // describe

        //-----------------------
        // functions.globOptions
        //-----------------------
        describe('globOptions', function() {
            it('should ', function() {

                var obj = functions.globOptions()

                var desiredObj = {
                    'ignore'  : '**/_*',
                    'nocase'  : true,
                    'nodir'   : true,
                    'realpath': true
                }

                expect(obj).to.eql(desiredObj)

            }) // it
        }) // describe

        //--------------------
        // functions.inSource
        //--------------------
        describe('inSource', function() {
            it('should return true for a source file path', function() {

                var test = functions.inSource(path.join(config.path.source, 'index.ejs'))

                expect(test).to.be(true)

            }) // it

            it('should return false for a dest file path', function() {

                var test = functions.inSource(path.join(config.path.dest, 'index.html'))

                expect(test).to.be(false)

            }) // it
        }) // describe

        //------------------
        // functions.isGlob
        //------------------
        describe('isGlob', function() {
            it('should return true for various glob strings', function() {

                expect(functions.isGlob('*')).to.be(true)
                expect(functions.isGlob('?')).to.be(true)
                expect(functions.isGlob('!')).to.be(true)
                expect(functions.isGlob('+')).to.be(true)
                expect(functions.isGlob('@')).to.be(true)
                expect(functions.isGlob('(')).to.be(true)
                expect(functions.isGlob(')')).to.be(true)
                expect(functions.isGlob('[')).to.be(true)
                expect(functions.isGlob(']')).to.be(true)

            }) // it

            it('should return false for non-glob strings', function() {

                expect(functions.isGlob('hello')).to.be(false)
                expect(functions.isGlob('i love you')).to.be(false)
                expect(functions.isGlob('won\'t you tell me your name')).to.be(false)

            }) // it
        }) // describe

        //---------------
        // functions.log
        //---------------
        // Display a console message if logging is enabled.
        // No need to test.

        //--------------------
        // functions.logError
        //--------------------
        // Log a stack trace or simple text string depending on the type of object passed in.
        // No need to test.

        //---------------------
        // functions.logOutput
        //---------------------
        // Log a pretty output message with a relative looking path.
        // No need to test.

        //---------------------
        // functions.logWorker
        //---------------------
        // Overly chatty logging utility used by build functions.
        // No need to test.

        //-----------------------
        // functions.makeDirPath
        //-----------------------
        describe('makeDirPath', function() {
            it('should create an entire path leading up to a file if needed', function() {

                var pathToMake = path.join(testPath, 'makeDirPath')

                return Promise.resolve().then(function() {

                    // remove folder
                    return functions.removeFile(pathToMake).then(function(ok) {

                        expect(ok).to.be(true)

                    })

                }).then(function() {

                    return functions.makeDirPath(path.join(pathToMake, 'file.txt')).then(function(ok) {

                        expect(ok).to.be(true)

                    })

                }).then(function() {

                    // remove folder
                    return functions.removeFile(pathToMake).then(function(ok) {

                        expect(ok).to.be(true)

                    })

                })

            }) // it

            it('should create an entire path leading up to a folder if needed', function() {

                var pathToMake = path.join(testPath, 'makeDirPath', 'folder')

                return Promise.resolve().then(function() {

                    // remove folder
                    return functions.removeFile(pathToMake).then(function(ok) {

                        expect(ok).to.be(true)

                    })

                }).then(function() {

                    // create the path
                    return functions.makeDirPath(pathToMake, true).then(function(ok) {

                        expect(ok).to.be(true)

                    })

                }).then(function() {

                    // remove parent folder
                    return functions.removeFile(path.dirname(pathToMake)).then(function(ok) {

                        expect(ok).to.be(true)

                    })

                })

            }) // it
        }) // describe

        //---------------------------
        // functions.mathRoundPlaces
        //---------------------------
        describe('mathRoundPlaces', function() {
            it('should round a number to a certain amount of decimal places', function() {

                var test = functions.mathRoundPlaces(1.153, 2)

                expect(test).to.be(1.15)

            }) // it
        }) // describe

        //-----------------------
        // functions.occurrences
        //-----------------------
        describe('occurrences', function() {
            it('should find three occurrences of a character in our test string', function() {

                expect(functions.occurrences('sulu says, oh my', ' ')).to.be(3)

            }) // it
        }) // describe

        //-------------------------------
        // functions.possibleSourceFiles
        //-------------------------------
        describe('possibleSourceFiles', function() {
            it('should return the desired objects', function() {

                var file
                var arrayDesired
                var test

                //------------
                // index.html
                //------------
                file = path.join(config.path.dest, 'index.html')

                arrayDesired = [
                    path.join(config.path.source, 'index.html'),
                    path.join(config.path.source, 'index.html.concat'),
                    path.join(config.path.source, 'index.ejs'),
                    path.join(config.path.source, 'index.ejs.concat'),
                    path.join(config.path.source, 'index.jade'),
                    path.join(config.path.source, 'index.jade.concat'),
                    path.join(config.path.source, 'index.md'),
                    path.join(config.path.source, 'index.md.concat')
                ]

                test = functions.possibleSourceFiles(file)

                expect(test).to.eql(arrayDesired)

                //---------
                // code.js
                //---------
                file = path.join(config.path.dest, 'code.js')

                arrayDesired = [
                    path.join(config.path.source, 'code.js'),
                    path.join(config.path.source, 'code.js.concat'),
                    path.join(config.path.source, 'code.coffee'),
                    path.join(config.path.source, 'code.coffee.concat')
                ]

                test = functions.possibleSourceFiles(file)

                expect(test).to.eql(arrayDesired)

                //-------------------------------
                // style.css.map with sourceMaps
                //-------------------------------
                config.fileType.css.sourceMaps = true

                file = path.join(config.path.dest, 'style.css.map')

                arrayDesired = [
                    path.join(config.path.source, 'style.css.map'),
                    path.join(config.path.source, 'style.css.map.concat'),
                    path.join(config.path.source, 'style.css'),
                    path.join(config.path.source, 'style.css.concat'),
                    path.join(config.path.source, 'style.less'),
                    path.join(config.path.source, 'style.less.concat'),
                    path.join(config.path.source, 'style.sass'),
                    path.join(config.path.source, 'style.sass.concat'),
                    path.join(config.path.source, 'style.scss'),
                    path.join(config.path.source, 'style.scss.concat'),
                    path.join(config.path.source, 'style.styl'),
                    path.join(config.path.source, 'style.styl.concat')
                ]

                test = functions.possibleSourceFiles(file)

                expect(test).to.eql(arrayDesired)

                //-----------------------------------------
                // code.js.map.gz with sourceMaps and Gzip
                //-----------------------------------------
                config.fileType.js.sourceMaps = true

                config.map.sourceToDestTasks.map.push('gz')
                config.map.sourceToDestTasks.js.push('gz')

                file = path.join(config.path.dest, 'code.js.map.gz')

                arrayDesired = [
                    path.join(config.path.source, 'code.js.map.gz'),
                    path.join(config.path.source, 'code.js.map.gz.concat'),
                    path.join(config.path.source, 'code.js.map'),
                    path.join(config.path.source, 'code.js.map.concat'),
                    path.join(config.path.source, 'code.js'),
                    path.join(config.path.source, 'code.js.concat'),
                    path.join(config.path.source, 'code.coffee'),
                    path.join(config.path.source, 'code.coffee.concat')
                ]

                test = functions.possibleSourceFiles(file)

                expect(test).to.eql(arrayDesired)

            }) // it
        }) // describe

        //--------------------
        // functions.readFile
        //--------------------
        describe('readFile', function() {
            it('should get back the contents of a file', function() {

                var file = path.join(testPath, 'readFile', 'readme.txt')

                return functions.readFile(file).then(function(data) {

                    expect(data).to.be('Why hello there!')

                })

            }) // it
        }) // describe

        //---------------------
        // functions.readFiles
        //---------------------
        describe('readFiles', function() {
            it('should get back and array with the contents of each file', function() {

                var file1 = path.join(testPath, 'readFiles', 'chapter-one.txt')
                var file2 = path.join(testPath, 'readFiles', 'chapter-two.txt')

                return functions.readFiles([file1, file2]).then(function(dataArray) {

                    expect(dataArray[0]).to.be('Chapter One')
                    expect(dataArray[1]).to.be('Chapter Two')

                })

            }) // it
        }) // describe

        //----------------------
        // functions.removeDest
        //----------------------
        describe('removeDest', function() {
            it('should remove file or folder if unrelated to the source directory', function() {

                var pathToRemove = path.join(testPath, 'removeDest')

                return Promise.resolve().then(function() {

                    // create the path leading up to a file
                    return functions.makeDirPath(path.join(pathToRemove, 'file.txt')).then(function(ok) {

                        expect(ok).to.be(true)

                    })

                }).then(function() {

                    // remove folder
                    return functions.removeDest(pathToRemove, false).then(function(ok) {

                        expect(ok).to.be(true)

                    })

                }).then(function() {

                    // try to remove an imaginary file from the source directory
                    return functions.removeDest(path.join(config.path.source, 'imaginary.file'), false).then(function(ok) {

                        expect(ok).to.be(false)

                    }).catch(function(err) {

                        expect(err).to.be.a('string')

                    })

                })

            }) // it
        }) // describe

        //---------------------
        // functions.removeExt
        //---------------------
        describe('removeExt', function() {
            it('should remove one extension from a file path', function() {

                var test = functions.removeExt('/folder/index.html.gz')

                expect(test).to.be('/folder/index.html')

            }) // it
        }) // describe

        //----------------------
        // functions.removeFile
        //----------------------
        describe('removeFile', function() {
            it('should return true after removing a file', function() {

                var file = path.join(testPath, 'removeFile', 'sample.txt')

                return functions.makeDirPath(file).then(function(ok) {

                    expect(ok).to.be(true)

                    return functions.writeFile(file, '...')

                }).then(function(ok) {

                    expect(ok).to.be(true)

                    return functions.removeFile(file)

                }).then(function(ok) {

                    expect(ok).to.be(true)

                    // make sure the file no longer exists
                    return functions.fileExists(file)

                }).then(function(exists) {

                    expect(exists).to.be(false)

                    // remove empty directory
                    return functions.removeFile(path.dirname(file))

                })

            }) // it
        }) // describe

        //-----------------------
        // functions.removeFiles
        //-----------------------
        describe('removeFiles', function() {
            it('should support removing one file', function() {

                var file = path.join(testPath, 'removeFiles', 'sample.txt')

                return functions.makeDirPath(file).then(function(ok) {

                    expect(ok).to.be(true)

                    return functions.writeFile(file, '...')

                }).then(function(ok) {

                    expect(ok).to.be(true)

                    return functions.removeFiles(file)

                }).then(function(ok) {

                    expect(ok).to.be(true)

                    // make sure the file no longer exists
                    return functions.fileExists(file)

                }).then(function(exists) {

                    expect(exists).to.be(false)

                    // remove empty directory
                    return functions.removeFile(path.dirname(file))

                })

            }) // it

            it('should support removing multiple files', function() {

                var file1 = path.join(testPath, 'removeFiles', 'one.txt')
                var file2 = path.join(testPath, 'removeFiles', 'two.txt')

                return functions.makeDirPath(file1).then(function(ok) {

                    return functions.writeFile(file1, '...')

                }).then(function(wroteFile1) {

                    expect(wroteFile1).to.be(true)

                    return functions.writeFile(file2, '...')

                }).then(function(wroteFile2) {

                    expect(wroteFile2).to.be(true)

                    return functions.removeFiles([file1, file2])

                }).then(function(ok) {

                    expect(ok).to.be(true)

                    // make sure the file no longer exists
                    return functions.filesExist([file1, file2])

                }).then(function(exists) {

                    expect(exists).to.eql([false, false])

                    // remove empty directory
                    return functions.removeFile(path.dirname(file1))

                })

            }) // it
        }) // describe

        //----------------------
        // functions.restoreObj
        //----------------------
        describe('restoreObj', function() {
            it('should delete any existing properties and restore them based on another object without keeping a reference to that other object', function() {

                var objToRestore = {
                    'bjork': true
                }

                var objToRestoreFrom = {
                    'army': ['of', 'lovers']
                }

                objToRestore = functions.restoreObj(objToRestore, objToRestoreFrom)

                expect(objToRestore.hasOwnProperty('bjork')).to.be(false)

                objToRestoreFrom.army = false

                expect(objToRestore.army).to.eql(['of', 'lovers'])

            }) // it
        }) // describe

        //-----------------------------
        // functions.sharedStatsTimeTo
        //-----------------------------
        describe('sharedStatsTimeTo', function() {
            it('should return the number of elapsed seconds after getting the initial time', function() {

                return new Promise(function(resolve, reject) {

                    var time = functions.sharedStatsTimeTo()

                    setTimeout(function() {
                        time = functions.sharedStatsTimeTo(time)
                        expect(time).to.be.greaterThan(0.5)
                        resolve()
                    }, 510)

                })

            }) // it
        }) // describe

        //-----------------------
        // functions.setLanguage
        //-----------------------
        describe('setLanguage', function() {
            it('should return true if a language file exists', function() {

                return functions.setLanguage('en-us').then(function(ok) {

                    expect(ok).to.be(true)

                })

            }) // it

            it('should return an error if a language file does not exist', function() {

                return functions.setLanguage('klingon').catch(function(err) {

                    expect(err).to.be.an('object')

                })

            }) // it
        }) // describe

        //------------------------
        // functions.sourceToDest
        //------------------------
        describe('sourceToDest', function() {
            it('should convert a source path to its destination equivalent', function() {

                var source = path.join(config.path.source, 'index.html')
                var dest = path.join(config.path.dest, 'index.html')

                var test = functions.sourceToDest(source)

                expect(test).to.be(dest)

            }) // it
        }) // describe

        //-----------------
        // functions.stats
        //-----------------
        describe('stats', function() {
            it('should return the object desired', function() {

                var objDesired = {
                    'timeTo': {
                        'load' : 0,
                        'clean': 0,
                        'build': 0,
                        'watch': 0
                    }
                }

                var test = functions.stats()

                expect(test).to.eql(objDesired)

            }) // it
        }) // describe

        //----------------------
        // functions.trimSource
        //----------------------
        describe('trimSource', function() {
            it('should return path from source directory onwards', function() {

                config.path.source = '/web/projects/source'

                var test = functions.trimSource('/web/projects/source/index.html')

                expect(test).to.be('/source/index.html')

            }) // it
        }) // describe

        //--------------------
        // functions.trimDest
        //--------------------
        describe('trimDest', function() {
            it('should return path from destination directory onwards', function() {

                config.path.dest = '/web/projects/dest'

                var test = functions.trimDest('/web/projects/dest/index.html')

                expect(test).to.be('/dest/index.html')

            }) // it
        }) // describe

        //-----------------------
        // functions.uniqueArray
        //-----------------------
        describe('uniqueArray', function() {
            it('should return array that contains only unique values', function() {

                var test = functions.uniqueArray([0,0,7])

                expect(test).to.eql([0,7])

            }) // it
        }) // describe

        //----------------------------
        // functions.upgradeAvailable
        //----------------------------
        describe('upgradeAvailable', function() {

            var localVersion = require('../package.json').version

            it('should return false if the remote version is less than the local version', function() {

                return functions.upgradeAvailable('0.0.0').then(function(result) {
                    expect(result).to.be(false)
                })

            }) // it

            it('should return false if the remote version equals the local version', function() {

                return functions.upgradeAvailable(localVersion).then(function(result) {
                    expect(result).to.be(false)
                })

            }) // it

            it('should return a version string if the remote verion is newer than the local version', function() {

                return functions.upgradeAvailable('9.9.9').then(function(result) {
                    expect(result).to.be('9.9.9')
                })

            }) // it
        }) // describe

        //---------------------
        // functions.writeFile
        //---------------------
        describe('writeFile', function() {
            it('should write a file\n', function() {

                var file = path.join(testPath, 'writeFile', 'file.txt')

                return functions.makeDirPath(file).then(function(ok) {

                    return functions.writeFile(file, '...')

                }).then(function(ok) {

                    expect(ok).to.be(true)

                    return functions.removeFile(file)

                }).then(function(ok) {

                    expect(ok).to.be(true)

                    // make sure the file no longer exists
                    return functions.fileExists(file)

                }).then(function(exists) {

                    expect(exists).to.be(false)

                    // remove empty directory
                    return functions.removeFile(path.dirname(file))

                })

            }) // it
        }) // describe

    }) // describe

    describe('Functions: Includes', function() {

        //-------------------------
        // functions.includesNewer
        //-------------------------
        describe('includesNewer', function() {
            it('should confirm include files are newer than a past date', function() {

                var file1 = path.join(testPath, 'includesNewer', 'partials', '_header.ejs')
                var file2 = path.join(testPath, 'includesNewer', 'partials', '_footer.ejs')

                var includes = [file1, file2]

                return Promise.resolve().then(function() {

                    // check if includes are newer than a past date
                    return functions.includesNewer(includes, 'ejs', 207187200, false)

                }).then(function(includesNewer) {

                    expect(includesNewer).to.be(true)

                })

            }) // it

            it('should confirm include files are not newer than right now', function() {

                var file1 = path.join(testPath, 'includesNewer', 'partials', '_header.ejs')
                var file2 = path.join(testPath, 'includesNewer', 'partials', '_footer.ejs')

                var includes = [file1, file2]

                return Promise.resolve().then(function() {

                    var now = new Date().getTime()

                    // check if includes are newer than now
                    return functions.includesNewer(includes, 'ejs', now, false)

                }).then(function(includesNewer) {

                    expect(includesNewer).to.be(false)

                })

            }) // it
        }) // describe

        //------------------------------
        // functions.includePathsConcat
        //------------------------------
        describe('includePathsConcat', function() {
            it('should find files to concatenate and return our desired object', function() {

                config.path.source = path.join(testPath, 'includePathsConcat')

                var file = path.join(config.path.source, 'all.txt.concat')

                return Promise.resolve().then(function() {

                    return functions.readFile(file)

                }).then(function(data) {

                    return functions.includePathsConcat(data, file)

                }).then(function(returnObj) {

                    var desiredObj = [
                        path.join(config.path.source, 'partials', '_01.txt'),
                        path.join(config.path.source, 'partials', '_02.txt')
                    ]

                    expect(returnObj).to.eql(desiredObj)

                })

            }) // it
        }) // describe

        //---------------------------
        // functions.includePathsEjs
        //---------------------------
        describe('includePathsEjs', function() {
            it('should find includes and return our desired object', function() {

                config.path.source = path.join(testPath, 'includePathsEjs')

                var file = path.join(config.path.source, 'index.ejs')

                return Promise.resolve().then(function() {

                    return functions.readFile(file)

                }).then(function(data) {

                    return functions.includePathsEjs(data, file)

                }).then(function(returnObj) {

                    var desiredObj = [
                        path.join(config.path.source, 'partials', '_01.ejs'),
                        path.join(config.path.source, 'partials', '_02.ejs'),
                        path.join(config.path.source, 'partials', '_03.ejs'),
                        path.join(config.path.source, 'partials', '_04.ejs')
                    ]

                    expect(returnObj).to.eql(desiredObj)

                })

            }) // it
        }) // describe

        //----------------------------
        // functions.includePathsJade
        //----------------------------
        describe('includePathsJade', function() {
            it('should find includes and return our desired object', function() {

                config.path.source = path.join(testPath, 'includePathsJade')

                var file = path.join(config.path.source, 'index.jade')

                return Promise.resolve().then(function() {

                    return functions.readFile(file)

                }).then(function(data) {

                    return functions.includePathsJade(data, file)

                }).then(function(returnObj) {

                    var desiredObj = [
                        path.join(config.path.source, 'partials', '_header.jade'),
                        path.join(config.path.source, 'partials', '_footer.jade')
                    ]

                    expect(returnObj).to.eql(desiredObj)

                })

            }) // it
        }) // describe

        //----------------------------
        // functions.includePathsLess
        //----------------------------
        describe('includePathsLess', function() {
            it('should find includes and return our desired object', function() {

                config.path.source = path.join(testPath, 'includePathsLess')

                var file = path.join(config.path.source, 'style.less')

                return Promise.resolve().then(function() {

                    return functions.readFile(file)

                }).then(function(data) {

                    return functions.includePathsLess(data, file)

                }).then(function(returnObj) {

                    var desiredObj = [
                        path.join(config.path.source, 'partials', '_fonts.less'),
                        path.join(config.path.source, 'partials', '_grid.less')
                    ]

                    expect(returnObj).to.eql(desiredObj)

                })

            }) // it
        }) // describe

        //----------------------------
        // functions.includePathsSass
        //----------------------------
        describe('includePathsSass', function() {
            it('should find includes and return our desired object', function() {

                config.path.source = path.join(testPath, 'includePathsSass')

                var file = path.join(config.path.source, 'style.scss')

                return Promise.resolve().then(function() {

                    return functions.readFile(file)

                }).then(function(data) {

                    return functions.includePathsSass(data, file)

                }).then(function(returnObj) {

                    var desiredObj = [
                        path.join(config.path.source, 'partials', '_fonts.scss'),
                        path.join(config.path.source, 'partials', '_grid.scss')
                    ]

                    expect(returnObj).to.eql(desiredObj)

                })

            }) // it
        }) // describe

        //------------------------------
        // functions.includePathsStylus
        //------------------------------
        describe('includePathsStylus', function() {
            it('should find includes and return our desired object\n', function() {

                config.path.source = path.join(testPath, 'includePathsStylus')

                var file = path.join(config.path.source, 'style.styl')

                return Promise.resolve().then(function() {

                    return functions.readFile(file)

                }).then(function(data) {

                    return functions.includePathsStylus(data, file)

                }).then(function(returnObj) {

                    var desiredObj = [
                        path.join(config.path.source, 'partials', '_fonts.styl'),
                        path.join(config.path.source, 'partials', '_grid.styl')
                    ]

                    expect(returnObj).to.eql(desiredObj)

                })

            }) // it
        }) // describe

    }) // describe

    describe('Functions: Reusable Object Building', function() {

        //--------------------------------
        // functions.objBuildWithIncludes
        //--------------------------------
        describe('objBuildWithIncludes', function() {

            it('should set obj.build to true if obj.data is populated', function() {

                config.path.source = path.join(testPath, 'objBuildWithIncludes', 'source')
                config.path.dest   = path.join(testPath, 'objBuildWithIncludes', 'dest')

                var obj = {
                    source: path.join(config.path.source, 'index.ejs'),
                    dest  : '',
                    data  : '...',
                    build : false
                }

                return functions.makeDirPath(config.path.dest, true).then(function() {

                    return functions.objBuildWithIncludes(obj, functions.includePathsEjs)

                }).then(function(obj) {

                    expect(obj.build).to.be(true)

                    // remove empty directory
                    return functions.removeFile(config.path.dest)

                })

            }) // it

            it('should get back an error if passed an obj.dest path that is in the source directory', function() {

                config.path.source = path.join(testPath, 'objBuildWithIncludes', 'source')
                config.path.dest   = path.join(testPath, 'objBuildWithIncludes', 'dest')

                var obj = {
                    source: path.join(config.path.source, 'index.ejs'),
                    dest  : path.join(config.path.source, 'index.ejs'),
                    data  : '',
                    build : false
                }

                return functions.objBuildWithIncludes(obj, null).catch(function(err) {

                    return err

                }).then(function(err) {

                    expect(err).to.be('functions.objBuildWithIncludes -> Destination points to a source directory.')

                })

            }) // it

            it('should set obj.build to true and populate obj.data if obj.dest is provided', function() {

                config.path.source = path.join(testPath, 'objBuildWithIncludes', 'source')
                config.path.dest   = path.join(testPath, 'objBuildWithIncludes', 'dest')

                var obj = {
                    source: path.join(config.path.source, 'index.ejs'),
                    dest  : path.join(config.path.dest, 'index.html'),
                    data  : '',
                    build : false
                }

                return functions.makeDirPath(obj.dest).then(function() {

                    // create our dest file with some sample data
                    return functions.writeFile(obj.dest, 'sample data')

                }).then(function() {

                        return functions.objBuildWithIncludes(obj, functions.includePathsEjs)

                }).then(function(returnObj) {

                    expect(returnObj.data).to.be('sample data')
                    expect(returnObj.build).to.be(true)

                    return functions.removeFile(config.path.dest)

                })

            }) // it

            it('should get back objDesired if only obj.source is specified', function() {

                config.path.source = path.join(testPath, 'objBuildWithIncludes', 'source')
                config.path.dest   = path.join(testPath, 'objBuildWithIncludes', 'dest')

                var obj = {
                    source: path.join(config.path.source, 'index.ejs'),
                    dest  : '',
                    data  : '',
                    build : false
                }

                var objDesired = {
                    source: obj.source,
                    dest  : path.join(testPath, 'objBuildWithIncludes', 'dest', 'index.html'),
                    data  : '<!doctype html>\n<html lang="en">\n<head>\n    <meta charset="utf-8">\n    <title>...</title>\n</head>\n<body>\n\n    <%- include(\'partials/_hello.ejs\') %>\n\n</body>\n</html>',
                    build : true
                }

                return functions.objBuildWithIncludes(obj, functions.includePathsEjs).then(function(returnObj) {

                    expect(returnObj).to.eql(objDesired)

                })

            }) // it

            it('should get back objDesired when config.option.forcebuild is true', function() {

                config.path.source = path.join(testPath, 'objBuildWithIncludes', 'source')
                config.path.dest   = path.join(testPath, 'objBuildWithIncludes', 'dest')

                var sourceFile = path.join(config.path.source, 'index.ejs')
                var destFile = path.join(config.path.dest, 'index.html')

                var obj = {
                    source: sourceFile,
                    dest  : '',
                    data  : '',
                    build : false
                }

                var objDesired = {
                    source: sourceFile,
                    dest  : destFile,
                    data  : '<!doctype html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"utf-8\">\n    <title>...</title>\n</head>\n<body>\n\n    <%- include(\'partials/_hello.ejs\') %>\n\n</body>\n</html>',
                    build : true
                }

                return functions.removeFile(config.path.dest).then(function() {

                    return functions.makeDirPath(destFile)

                }).then(function() {

                    return functions.objBuildWithIncludes(obj, functions.includePathsEjs)

                }).then(function(returnObj) {

                    return functions.writeFile(returnObj.dest, returnObj.data)

                }).then(function() {

                    // now a newer destination file exists

                    config.option.forcebuild = true

                    return functions.objBuildWithIncludes(obj, functions.includePathsEjs)

                }).then(function(returnObj) {

                    expect(returnObj).to.eql(objDesired)

                }).then(function() {

                    // remove empty directory
                    return functions.removeFile(config.path.dest)

                })

            }) // it
        }) // describe

        //----------------------------
        // functions.objBuildInMemory
        //----------------------------
        describe('objBuildInMemory', function() {
            it('should set obj.build to true if obj.data is populated', function() {

                config.path.source = path.join(testPath, 'objBuildInMemory', 'source')
                config.path.dest   = path.join(testPath, 'objBuildInMemory', 'dest')

                var obj = {
                    source: path.join(config.path.source, 'index.html'),
                    dest  : '',
                    data  : '...',
                    build : false
                }

                return functions.objBuildInMemory(obj).then(function(obj) {

                    expect(obj.build).to.be(true)

                })

            }) // it

            it('should get back an error if passed an obj.dest path that is in the source directory', function() {

                config.path.source = path.join(testPath, 'objBuildInMemory', 'source')
                config.path.dest   = path.join(testPath, 'objBuildInMemory', 'dest')

                var obj = {
                    source: path.join(config.path.source, 'index.html'),
                    dest  : path.join(config.path.source, 'index.html'),
                    data  : '',
                    build : false
                }

                return functions.objBuildInMemory(obj).catch(function(err) {

                    return err

                }).then(function(err) {

                    expect(err).to.be('functions.objBuildInMemory -> Destination points to a source directory.')

                })

            }) // it

            it('should set obj.build to true and populate obj.data if obj.dest is provided', function() {

                config.path.source = path.join(testPath, 'objBuildInMemory', 'source')
                config.path.dest   = path.join(testPath, 'objBuildInMemory', 'dest')

                var obj = {
                    source: path.join(config.path.source, 'index.html'),
                    dest  : path.join(config.path.dest, 'index.html'),
                    data  : '',
                    build : false
                }

                return functions.makeDirPath(obj.dest).then(function() {

                    // create our destination file with some sample data
                    return functions.writeFile(obj.dest, 'sample data')

                }).then(function() {

                    return functions.objBuildInMemory(obj)

                }).then(function(returnObj) {

                    expect(returnObj.data).to.be('sample data')

                    expect(obj.build).to.be(true)

                }).then(function() {

                    // remove dest folder
                    return functions.removeFile(config.path.dest)

                })

            }) // it

            it('should get back objDesired if only obj.source is specified', function() {

                config.path.source = path.join(testPath, 'objBuildInMemory', 'source')
                config.path.dest   = path.join(testPath, 'objBuildInMemory', 'dest')

                var obj = {
                    source: path.join(config.path.source, 'index.html'),
                    dest  : '',
                    data  : '',
                    build : false
                }

                var objDesired = {
                    source: obj.source,
                    dest  : path.join(testPath, 'objBuildInMemory', 'dest', 'index.html'),
                    data  : '<!doctype html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"utf-8\">\n    <title>...</title>\n</head>\n<body>\n\n    <p>Hello from a html file.</p>\n\n</body>\n</html>',
                    build : true
                }

                return functions.objBuildInMemory(obj).then(function(returnObj) {

                    expect(returnObj).to.eql(objDesired)

                })

            }) // it

            it('should get back objDesired when config.option.forcebuild is true', function() {

                config.path.source = path.join(testPath, 'objBuildInMemory', 'source')
                config.path.dest   = path.join(testPath, 'objBuildInMemory', 'dest')

                var sourceFile = path.join(config.path.source, 'index.html')
                var destFile = path.join(config.path.dest, 'index.html')

                var obj = {
                    source: sourceFile,
                    dest  : '',
                    data  : '',
                    build : false
                }

                var objDesired = {
                    source: sourceFile,
                    dest  : destFile,
                    data  : '<!doctype html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"utf-8\">\n    <title>...</title>\n</head>\n<body>\n\n    <p>Hello from a html file.</p>\n\n</body>\n</html>',
                    build : true
                }

                return functions.makeDirPath(destFile).then(function() {

                    // remove destination file from any previous run
                    return functions.removeFile(destFile)

                }).then(function() {

                    return functions.objBuildInMemory(obj)

                }).then(function(returnObj) {

                    return functions.writeFile(returnObj.dest, returnObj.data)

                }).then(function() {

                    // now a newer destination file exists

                    config.option.forcebuild = true

                    return functions.objBuildInMemory(obj)

                }).then(function(returnObj) {

                    expect(returnObj).to.eql(objDesired)

                }).then(function() {

                    return functions.removeFile(config.path.dest)

                })

            }) // it
        }) // describe

        //--------------------------
        // functions.objBuildOnDisk
        //--------------------------
        describe('objBuildOnDisk', function() {

            it('should get back objDesired if obj.source and obj.data are specified', function() {

                config.path.source = path.join(testPath, 'objBuildOnDisk', 'source')
                config.path.dest   = path.join(testPath, 'objBuildOnDisk', 'dest')

                var obj = {
                    source: path.join(config.path.source, 'sample.txt'),
                    dest  : '',
                    data  : '...',
                    build : false
                }

                return functions.makeDirPath(config.path.dest, true).then(function() {

                    return functions.objBuildOnDisk(obj)

                }).then(function(returnObj) {

                     var objDesired = {
                        source: path.join(config.path.dest, 'sample.txt'),
                        dest  : path.join(config.path.dest, 'sample.txt'),
                        data  : '',
                        build : true
                    }

                    expect(returnObj).to.eql(objDesired)

                }).then(function() {

                    // remove dest folder
                    return functions.removeFile(config.path.dest)

                })
            }) // it

            it('should get back an error if obj.data is not empty and obj.dest points to a source location', function() {

                config.path.source = path.join(testPath, 'objBuildOnDisk', 'source')
                config.path.dest   = path.join(testPath, 'objBuildOnDisk', 'dest')

                var obj = {
                    source: path.join(config.path.source, 'sample.txt'),
                    dest  : path.join(config.path.source, 'sample.txt'),
                    data  : '...',
                    build : false
                }

                return functions.objBuildOnDisk(obj).catch(function(err) {

                    return err

                }).then(function(err) {

                    expect(err).to.be('functions.objBuildOnDisk -> Destination points to a source directory.')

                })
            }) // it

            it('should return build to true and source to dest when dest is specified', function() {

                config.path.source = path.join(testPath, 'objBuildOnDisk', 'source')
                config.path.dest   = path.join(testPath, 'objBuildOnDisk', 'dest')

                var obj = {
                    source: path.join(config.path.source, 'sample.txt'),
                    dest  : path.join(config.path.dest, 'sample.txt'),
                    data  : '...',
                    build : false
                }

                return functions.makeDirPath(obj.dest).then(function() {

                    return functions.writeFile(obj.dest, '...')

                }).then(function() {

                    return functions.objBuildOnDisk(obj)

                }).then(function(returnObj) {

                    expect(returnObj.build).to.be(true)
                    expect(returnObj.source).to.be(obj.dest)

                    // remove dest folder
                    return functions.removeFile(config.path.dest)

                })

            }) // it

            it('should set obj.build to true if only obj.source is populated', function() {

                config.path.source = path.join(testPath, 'objBuildOnDisk', 'source')
                config.path.dest   = path.join(testPath, 'objBuildOnDisk', 'dest')

                var obj = {
                    source: path.join(config.path.source, 'sample.txt'),
                    dest  : '',
                    data  : '',
                    build : false
                }

                return functions.objBuildOnDisk(obj).then(function(returnObj) {

                    expect(returnObj.build).to.be(true)

                })

            }) // it

            it('should get back objDesired when config.option.forcebuild is true', function() {

                config.path.source = path.join(testPath, 'objBuildOnDisk', 'source')
                config.path.dest   = path.join(testPath, 'objBuildOnDisk', 'dest')

                var sourceFile = path.join(config.path.source, 'sample.txt')
                var destFile = path.join(config.path.dest, 'sample.txt')

                var obj = {
                    source: sourceFile,
                    dest  : '',
                    data  : '',
                    build : false
                }

                return functions.makeDirPath(config.path.dest, true).then(function() {

                    // remove destination file from any previous run
                    return functions.removeFile(destFile)

                }).then(function() {

                    return functions.objBuildOnDisk(obj)

                }).then(function(returnObj) {

                    // now a newer destination file exists

                    config.option.forcebuild = true

                    return functions.objBuildOnDisk(obj)

                }).then(function(returnObj) {

                    expect(returnObj.build).to.be(true)

                }).then(function() {

                    // remove dest folder
                    return functions.removeFile(config.path.dest)

                })

            }) // it
        }) // describe

    }) // describe

}) // describe
