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
var configBackup = functions.cloneObj(config)

//-------------
// Mocha Tests
//-------------
describe('File -> ../code/2 - shared.js\n', function() {

    beforeEach(function() {
        // runs before each test in this describe block
    })

    afterEach(function() {
        // runs after each test in this describe block
        config = functions.restoreObj(config, configBackup)
    })

    //--------
    // shared
    //--------
    describe('shared', function() {
        it('should have two language sub objects that exactly match the contents of ../language/en-us.json', function() {

            return Promise.resolve().then(function() {

                return functions.readFile(path.join(shared.path.self, 'language', 'en-us.json'))

            }).then(function(data) {

                data = JSON.parse(data)

                expect(data).to.eql(shared.language.base)
                expect(data).to.eql(shared.language.loaded)

            })

        }) // it

        it('uniqueNumber.generate() should return incrementing numbers', function() {

            var test1 = shared.uniqueNumber.generate()
            var test2 = shared.uniqueNumber.generate()

            expect(test1).to.be.a('number')
            expect(test2).to.be.a('number')

            expect(test1).not.to.be(test2)

        }) // it
    }) // describe

}) // describe
