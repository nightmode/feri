'use strict'

//----------
// Includes
//----------
const expect = require('expect.js')
const path   = require('path')

const shared    = require('../code/2 - shared.js')
let   config    = require('../code/3 - config.js')
const functions = require('../code/4 - functions.js')

//-----------
// Variables
//-----------
const configBackup = functions.cloneObj(config)

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
    }) // describe

}) // describe
