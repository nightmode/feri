'use strict'

//----------
// Includes
//----------
const expect = require('expect.js')
const path   = require('path')

const shared    = require('../code/2 - shared.js')
let   config    = require('../code/3 - config.js')
const functions = require('../code/4 - functions.js')
const clean     = require('../code/5 - clean.js')

//-----------
// Variables
//-----------
const configBackup = functions.cloneObj(config)
const testPath = path.join(shared.path.self, 'mocha', 'files', 'clean')

//-------------
// Mocha Tests
//-------------
describe('File -> ../code/5 - clean.js\n', function() {

    beforeEach(function() {
        // runs before each test in this describe block
        config.option.clean = true
        config.option.concurLimit = 1
        config.path.source = path.join(testPath, 'source')
        config.path.dest   = path.join(testPath, 'dest')
    })

    afterEach(function() {
        // runs after each test in this describe block
        config = functions.restoreObj(config, configBackup)
    })

    //-------
    // clean
    //-------
    describe('clean', function() {
        it('should clean up a folder with two orphan files', function() {

            // create some files that should be cleaned up
            return Promise.resolve().then(function() {

                return functions.writeFile(path.join(config.path.dest, 'kodo.txt'), '...')

            }).then(function() {

                return functions.writeFile(path.join(config.path.dest, 'podo.txt'), '...')

            }).then(function() {

                return clean.processClean()

            }).then(function() {

                return functions.findFiles(config.path.dest + '/**/*')

            }).then(function(files) {

                let objDesired = [
                    path.join(config.path.dest, 'css', 'style.css'),
                    path.join(config.path.dest, 'index.html'),
                ]

                expect(files).to.eql(objDesired)

            })

        }) // it

        it('should clean up based on a glob search', function() {

            let kodoFile = path.join(config.path.dest, 'kodo.txt')
            let podoFile = path.join(config.path.dest, 'podo.txt')

            return Promise.resolve().then(function() {

                // create one file that should be cleaned up
                return functions.writeFile(kodoFile, '...')

            }).then(function() {

                // create one file that should not be cleaned up
                return functions.writeFile(podoFile, '...')

            }).then(function() {

                return clean.processClean('kodo*')

            }).then(function() {

                return functions.findFiles(config.path.dest + '/**/*')

            }).then(function(files) {

                // check return to make sur
                let objDesired = [
                    path.join(config.path.dest, 'css', 'style.css'),
                    path.join(config.path.dest, 'index.html'),
                    podoFile
                ]

                expect(files).to.eql(objDesired)

            }).then(function() {

                return functions.removeFile(podoFile)

            })

        }) // it

        it('should clean up based on an array of paths', function() {

            let kodoFile = path.join(config.path.dest, 'kodo.txt')
            let podoFile = path.join(config.path.dest, 'podo.txt')
            let odoFile = path.join(config.path.dest, 'odo.txt')

            return Promise.resolve().then(function() {

                // create a file to be cleaned up
                return functions.writeFile(kodoFile, '...')

            }).then(function() {

                // create onother file that should be cleaned up
                return functions.writeFile(podoFile, '...')

            }).then(function() {

                // create a file that should not be cleaned up
                return functions.writeFile(odoFile, '...')

            }).then(function() {

                return clean.processClean([kodoFile, podoFile])

            }).then(function() {

                return functions.findFiles(config.path.dest + '/**/*')

            }).then(function(files) {

                // check return to make sur
                let objDesired = [
                    path.join(config.path.dest, 'css', 'style.css'),
                    path.join(config.path.dest, 'index.html'),
                    odoFile
                ]

                expect(files).to.eql(objDesired)

            }).then(function() {

                return functions.removeFile(odoFile)

            })

        }) // it
    }) // describe

}) // describe
