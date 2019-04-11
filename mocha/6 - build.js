'use strict'

//----------
// Includes
//----------
const expect = require('expect.js')
const path   = require('path')

let   shared    = require('../code/2 - shared.js')
let   config    = require('../code/3 - config.js')
const functions = require('../code/4 - functions.js')
const build     = require('../code/6 - build.js')

//-----------
// Variables
//-----------
const sharedBackup = functions.cloneObj(shared)
const configBackup = functions.cloneObj(config)
const testPath = path.join(shared.path.self, 'mocha', 'files', 'build')

//-------------
// Mocha Tests
//-------------
describe('File -> ../code/6 - build.js\n', function() {

    beforeEach(function() {
        // runs before each test in this describe block
        config.option.concurLimit = 1
        config.option.build = true
    })

    afterEach(function() {
        // runs after each test in this describe block
        config = functions.restoreObj(config, configBackup)
        shared = functions.restoreObj(shared, sharedBackup)
    })

    describe('Command and Control', function() {

        //--------------------
        // build.processBuild
        //--------------------
        describe('processBuild', function() {

            it('should build all files in source to dest', function() {

                config.path.source = path.join(testPath, 'processBuild', 'source')
                config.path.dest   = path.join(testPath, 'processBuild', 'dest')

                let destFile1 = path.join(config.path.dest, 'index.html')
                let destFile2 = path.join(config.path.dest, 'sample.html')

                return Promise.resolve().then(function() {

                    return build.processBuild()

                }).then(function() {

                    return functions.findFiles(config.path.dest + '/**/*')

                }).then(function(files) {

                    let objDesired = [destFile1, destFile2]

                    expect(files).to.eql(objDesired)

                }).then(function() {

                    return functions.removeFiles([destFile1, destFile2]).then(function(ok) {
                        expect(ok).to.be(true)
                    })

                })

            }) // it

            it('should build the files specified by a glob search', function() {

                config.path.source = path.join(testPath, 'processBuild', 'source')
                config.path.dest   = path.join(testPath, 'processBuild', 'dest')

                let destFile = path.join(config.path.dest, 'sample.html')

                return Promise.resolve().then(function() {

                    return build.processBuild('*.md')

                }).then(function() {

                    return functions.findFiles(config.path.dest + '/**/*')

                }).then(function(files) {

                    let objDesired = [destFile]

                    expect(files).to.eql(objDesired)

                }).then(function() {

                    return functions.removeFile(destFile)

                })

            }) // it

            it('should build the files specified by an array of paths', function() {

                config.path.source = path.join(testPath, 'processBuild', 'source')
                config.path.dest   = path.join(testPath, 'processBuild', 'dest')

                let destFile = path.join(config.path.dest, 'index.html')

                return Promise.resolve().then(function() {

                    return build.processBuild([
                        path.join(config.path.source, 'index.html')
                    ])

                }).then(function() {

                    return functions.findFiles(config.path.dest + '/**/*')

                }).then(function(files) {

                    let objDesired = [destFile]

                    expect(files).to.eql(objDesired)

                }).then(function() {

                    return functions.removeFile(config.path.dest)

                })

            }) // it
        }) // describe

        //--------------------
        // build.processFiles
        //--------------------
        describe('processFiles', function() {
            it('should return an array of files built', function() {

                config.path.source = path.join(testPath, 'processFiles', 'source')
                config.path.dest   = path.join(testPath, 'processFiles', 'dest')

                let sourceFile1 = path.join(config.path.source, 'index.html')
                let sourceFile2 = path.join(config.path.source, 'readme.txt')

                let destFile1 = path.join(config.path.dest, 'index.html')
                let destFile2 = path.join(config.path.dest, 'readme.txt')

                return Promise.resolve().then(function() {

                    return functions.removeFile(config.path.dest)

                }).then(function(o) {

                    return build.processFiles([sourceFile1, sourceFile2])

                }).then(function(o) {

                    let desiredObj = [destFile1, destFile2]

                    expect(o).to.eql(desiredObj)

                    return functions.removeFile(config.path.dest)

                })

            }) // it
        }) // describe

        //-----------------------
        // build.processOneBuild
        //-----------------------
        describe('processOneBuild', function() {
            it('should build one file\n', function() {

                config.path.source = path.join(testPath, 'processOneBuild', 'source')
                config.path.dest   = path.join(testPath, 'processOneBuild', 'dest')

                let sourceFile = path.join(config.path.source, 'sample.txt')
                let destFile = path.join(config.path.dest, 'sample.txt')

                return Promise.resolve().then(function() {

                    return build.processOneBuild(sourceFile)

                }).then(function() {

                    return functions.fileExists(destFile)

                }).then(function(exists) {

                    expect(exists).to.be(true)

                    return functions.removeFile(config.path.dest)

                })

            }) // it
        }) // describe

    }) // describe

    //------------------
    // Build: In Memory
    //------------------
    describe('Build: In Memory', function() {
        //-----------
        // build.css
        //-----------
        describe('css', function() {
            it('should minify a css file', function() {

                config.path.source = path.join(testPath, 'css', 'source')
                config.path.dest   = path.join(testPath, 'css', 'dest')

                let obj = {
                    'source': path.join(config.path.source, 'style.css'),
                    'dest': '',
                    'data': '',
                    'build': false
                }

                return build.css(obj).then(function(returnObj) {

                    expect(returnObj.data).to.be('.pink{color:pink}')

                })

            }) // it

            it('should minify a css file and create a source map', function() {

                config.path.source = path.join(testPath, 'css', 'source')
                config.path.dest   = path.join(testPath, 'css', 'dest')

                config.sourceMaps = true

                let destMapFile = path.join(config.path.dest, 'style.css.map')

                let obj = {
                    'source': path.join(config.path.source, 'style.css'),
                    'dest': '',
                    'data': '',
                    'build': false
                }

                return Promise.resolve().then(function() {

                    // remove map file from any previous run
                    return functions.removeFile(destMapFile)

                }).then(function() {

                    return build.css(obj)

                }).then(function(returnObj) {

                    expect(returnObj.data).to.be('.pink{color:pink}\n/*# sourceMappingURL=style.css.map */')

                    return functions.readFile(destMapFile)

                }).then(function(map) {

                    let desired = {
                        "version": 3,
                        "sources": ["style.css"],
                        "names": [],
                        "mappings": "AAAA,MACI,MAAO",
                        "sourcesContent": [".pink {\n    color: pink;\n}"],
                        "file": "style.css",
                        "sourceRoot": "/source-maps"
                    }

                    map = JSON.parse(map)

                    expect(map).to.eql(desired)

                    return functions.removeFile(config.path.dest)

                })

            }) // it
        }) // describe

        //------------
        // build.html
        //------------
        describe('html', function() {
            it('should minify a html file', function() {

                config.path.source = path.join(testPath, 'html', 'source')
                config.path.dest   = path.join(testPath, 'html', 'dest')

                let obj = {
                    'source': path.join(config.path.source, 'index.html'),
                    'dest': '',
                    'data': '',
                    'build': false
                }

                return build.html(obj).then(function(returnObj) {

                    expect(returnObj.data).to.be('<html><body><p>Hi</p></body></html>')

                })

            }) // it
        }) // describe

        //----------
        // build.js
        //----------
        describe('js', function() {
            it('should minify a js file', function() {

                config.path.source = path.join(testPath, 'js', 'source')
                config.path.dest   = path.join(testPath, 'js', 'dest')

                let sourceFile = path.join(config.path.source, 'sample.js')
                let destFile = path.join(config.path.dest, 'sample.js')

                let destFileSize = 0
                let sourceFileSize = 0

                let obj = {
                    'source': path.join(config.path.source, 'sample.js'),
                    'dest': '',
                    'data': '',
                    'build': false
                }

                return functions.makeDirPath(config.path.dest, true).then(function() {

                    return functions.removeFile(destFile)

                }).then(function() {

                    return build.js(obj)

                }).then(function(returnObj) {

                    expect(returnObj.build).to.be(true)

                    return functions.fileSize(destFile)

                }).then(function(fileSize) {

                    destFileSize = fileSize

                    return functions.fileSize(sourceFile)

                }).then(function(fileSize) {

                    sourceFileSize = fileSize

                    expect(destFileSize).to.be.lessThan(sourceFileSize)

                    return functions.removeFile(config.path.dest)

                })

            }) // it

            it('should minify a js file and create a source map', function() {

                config.path.source = path.join(testPath, 'js', 'source')
                config.path.dest   = path.join(testPath, 'js', 'dest')

                config.sourceMaps = true

                let destMapFile = path.join(config.path.dest, 'sample.js.map')

                let sourceFile = path.join(config.path.source, 'sample.js')
                let destFile = path.join(config.path.dest, 'sample.js')

                let obj = {
                    'source': path.join(config.path.source, 'sample.js'),
                    'dest': '',
                    'data': '',
                    'build': false
                }

                return functions.makeDirPath(config.path.dest, true).then(function() {

                    // remove files from any previous run
                    return functions.removeFiles([destFile, destMapFile])

                }).then(function() {

                    return build.js(obj)

                }).then(function(returnObj) {

                    expect(returnObj.data).to.be('var mellow="yellow";\n//# sourceMappingURL=sample.js.map')

                    // write file to disk for next test
                    return functions.writeFile(obj.dest, returnObj.data)

                }).then(function() {

                    return functions.readFile(destMapFile)

                }).then(function(map) {

                    let desired = {
                        "version": 3,
                        "file": "sample.js",
                        "sources": ["source/sample.js"],
                        "names": ["mellow"],
                        "mappings": "AAAA,IAAIA,OAAS",
                        "sourceRoot": "/source-maps",
                        "sourcesContent": ["var mellow = 'yellow'"]
                    }

                    map = JSON.parse(map)

                    expect(map).to.eql(desired)

                    // leave generated files in place for the next test

                })

            }) // it

            it('should minify an existing js file with a source map to a new js file with an updated source map', function() {

                config.path.source = path.join(testPath, 'js', 'source')
                config.path.dest   = path.join(testPath, 'js', 'dest')

                config.sourceMaps = true

                let destFile = path.join(config.path.dest, 'sample.js')
                let destMapFile = path.join(config.path.dest, 'sample.js.map')

                let obj = {
                    'source': destFile,
                    'dest': destFile,
                    'data': '',
                    'build': true
                }

                return Promise.resolve().then(function() {

                    return build.js(obj)

                }).then(function(returnObj) {

                    expect(returnObj.data).to.be('var mellow="yellow";\n//# sourceMappingURL=sample.js.map')

                    return functions.readFile(destMapFile)

                }).then(function(map) {

                    let desired = {
                        'version': 3,
                        'file': 'sample.js',
                        'sources': ['source/sample.js'],
                        'names': ['mellow'],
                        'mappings': 'AAAA,IAAIA,OAAS',
                        'sourceRoot': '/source-maps',
                        'sourcesContent': ["var mellow = 'yellow'"]
                    }

                    map = JSON.parse(map)

                    expect(map).to.eql(desired)

                    return functions.removeFile(config.path.dest)

                })

            }) // it
        }) // describe

        //----------------
        // build.markdown
        //----------------
        describe('markdown', function() {
            it('should compile a md file to html\n', function() {

                config.path.source = path.join(testPath, 'markdown', 'source')
                config.path.dest   = path.join(testPath, 'markdown', 'dest')

                let obj = {
                    'source': path.join(config.path.source, 'sample.md'),
                    'dest': '',
                    'data': '',
                    'build': false
                }

                return build.markdown(obj).then(function(returnObj) {

                    expect(returnObj.data).to.be('<h1>Heading</h1>\n')

                })

            }) // it
        }) // describe

    }) // describe

    //----------------
    // Build: On Disk
    //----------------
    describe('Build: On Disk', function() {

        //------------
        // build.copy
        //------------
        describe('copy', function() {
            it('should copy a source file to dest', function() {

                config.path.source = path.join(testPath, 'copy', 'source')
                config.path.dest   = path.join(testPath, 'copy', 'dest')

                let destFile = path.join(config.path.dest, 'small.data')

                let obj = {
                    'source': path.join(config.path.source, 'small.data'),
                    'dest': '',
                    'data': '',
                    'build': false
                }

                return functions.makeDirPath(config.path.dest, true).then(function() {

                    return functions.removeFile(destFile)

                }).then(function() {

                    return build.copy(obj)

                }).then(function(returnObj) {

                    expect(returnObj.build).to.be(true)

                    return functions.fileExists(destFile)

                }).then(function(exists) {

                    expect(exists).to.be(true)

                    return functions.removeFile(config.path.dest)

                })

            }) // it
        }) // describe

        //-----------
        // build.gif
        //-----------
        describe('gif', function() {
            it('should output a dest gif smaller than the source', function() {

                config.path.source = path.join(testPath, 'gif', 'source')
                config.path.dest   = path.join(testPath, 'gif', 'dest')

                let sourceFile = path.join(config.path.source, 'karp.gif')
                let destFile = path.join(config.path.dest, 'karp.gif')

                let destFileSize = 0
                let sourceFileSize = 0

                let obj = {
                    'source': path.join(config.path.source, 'karp.gif'),
                    'dest': '',
                    'data': '',
                    'build': false
                }

                return functions.makeDirPath(config.path.dest, true).then(function() {

                    return functions.removeFile(destFile)

                }).then(function() {

                    return build.gif(obj)

                }).then(function(returnObj) {

                    expect(returnObj.build).to.be(true)

                    return functions.fileSize(destFile)

                }).then(function(fileSize) {

                    destFileSize = fileSize

                    return functions.fileSize(sourceFile)

                }).then(function(fileSize) {

                    sourceFileSize = fileSize

                    expect(destFileSize).to.be.lessThan(sourceFileSize)

                    return functions.removeFile(config.path.dest)

                })

            }) // it
        }) // describe

        //-----------
        // build.jpg
        //-----------
        describe('jpg', function() {
            it('should output a dest jpg smaller than the source', function() {

                config.path.source = path.join(testPath, 'jpg', 'source')
                config.path.dest   = path.join(testPath, 'jpg', 'dest')

                let sourceFile = path.join(config.path.source, 'tassadar.jpg')
                let destFile = path.join(config.path.dest, 'tassadar.jpg')

                let destFileSize = 0
                let sourceFileSize = 0

                let obj = {
                    'source': path.join(config.path.source, 'tassadar.jpg'),
                    'dest': '',
                    'data': '',
                    'build': false
                }

                return functions.makeDirPath(config.path.dest, true).then(function() {

                    return functions.removeFile(destFile)

                }).then(function() {

                    return build.jpg(obj)

                }).then(function(returnObj) {

                    expect(returnObj.build).to.be(true)

                    return functions.fileSize(destFile)

                }).then(function(fileSize) {

                    destFileSize = fileSize

                    return functions.fileSize(sourceFile)

                }).then(function(fileSize) {

                    sourceFileSize = fileSize

                    expect(destFileSize).to.be.lessThan(sourceFileSize)

                    return functions.removeFile(config.path.dest)

                })

            })
        }) // describe

        //-----------
        // build.png
        //-----------
        describe('png', function() {
            it('should output a dest png smaller than the source\n', function() {

                config.path.source = path.join(testPath, 'png', 'source')
                config.path.dest   = path.join(testPath, 'png', 'dest')

                let sourceFile = path.join(config.path.source, 'logo.png')
                let destFile = path.join(config.path.dest, 'logo.png')

                let destFileSize = 0
                let sourceFileSize = 0

                let obj = {
                    'source': path.join(config.path.source, 'logo.png'),
                    'dest': '',
                    'data': '',
                    'build': false
                }

                return functions.removeFile(destFile).then(function() {

                    return build.png(obj)

                }).then(function(returnObj) {

                    expect(returnObj.build).to.be(true)

                    return functions.fileSize(destFile)

                }).then(function(fileSize) {

                    destFileSize = fileSize

                    return functions.fileSize(sourceFile)

                }).then(function(fileSize) {

                    sourceFileSize = fileSize

                    expect(destFileSize).to.be.lessThan(sourceFileSize)

                    return functions.removeFile(config.path.dest)

                })

            }) // it
        }) // describe

    }) // describe

    //----------------------
    // Build: With Includes
    //----------------------
    describe('Build: With Includes', function() {

        //--------------
        // build.concat
        //--------------
        describe('concat', function() {
            it('should compile a concat file', function() {

                config.path.source = path.join(testPath, 'concat', 'source')
                config.path.dest   = path.join(testPath, 'concat', 'dest')

                let obj = {
                    'source': path.join(config.path.source, 'test-1', 'all.txt.concat'),
                    'dest': '',
                    'data': '',
                    'build': false
                }

                return build.concat(obj).then(function(returnObj) {

                    expect(returnObj.data).to.be('one\ntwo')

                })

            }) // it

            it('should compile a js concat file with source maps', function() {

                config.path.source = path.join(testPath, 'concat', 'source')
                config.path.dest   = path.join(testPath, 'concat', 'dest')

                config.sourceMaps = true

                let destMapFile = path.join(config.path.dest, 'test-2', 'all.js.map')

                let obj = {
                    'source': path.join(config.path.source, 'test-2', 'all.js.concat'),
                    'dest': '',
                    'data': '',
                    'build': false
                }

                return Promise.resolve().then(function() {

                    return functions.removeFile(config.path.dest)

                }).then(function() {

                    return build.concat(obj)

                }).then(function(returnObj) {

                    expect(returnObj.data).to.be('var one=1,two=2;\n//# sourceMappingURL=all.js.map')

                    return functions.readFile(destMapFile)

                }).then(function(data) {

                    data = JSON.parse(data)

                    let objDesired = {
                        version       : 3,
                        file          : 'all.js',
                        sources       : ['source/test-2/partials/_01.js', 'source/test-2/partials/_02.js'],
                        names         : [],
                        mappings      : 'AAAA,IAAA,IAAA,ECAA,IAAA',
                        sourcesContent: ['var one = 1', 'var two = 2'],
                        sourceRoot    : '/source-maps'
                    }

                    expect(data).to.eql(objDesired)

                    return functions.removeFile(config.path.dest)

                })

            }) // it

            it('should compile a css concat file with source maps', function() {

                config.path.source = path.join(testPath, 'concat', 'source')
                config.path.dest   = path.join(testPath, 'concat', 'dest')

                config.sourceMaps = true

                let destMapFile = path.join(config.path.dest, 'test-3', 'all.css.map')

                let obj = {
                    'source': path.join(config.path.source, 'test-3', 'all.css.concat'),
                    'dest': '',
                    'data': '',
                    'build': false
                }

                return Promise.resolve().then(function() {

                    return functions.removeFile(config.path.dest)

                }).then(function() {

                    return build.concat(obj)

                }).then(function(returnObj) {

                    expect(returnObj.data).to.be('.one{content:"one"}.two{content:"two"}\n/*# sourceMappingURL=all.css.map */')

                    return functions.readFile(destMapFile)

                }).then(function(data) {

                    data = JSON.parse(data)

                    let objDesired = {
                        version       : 3,
                        sources       : ['source/test-3/partials/_01.css', 'source/test-3/partials/_02.css'],
                        names         : [],
                        mappings      : 'AAAA,KACI,QAAA,MCDJ,KACI,QAAA',
                        file          : 'all.css',
                        sourceRoot    : '/source-maps',
                        sourcesContent: ['.one {\n    content: "one"\n}', '.two {\n    content: "two"\n}']
                    }

                    expect(data).to.eql(objDesired)

                    return functions.removeFile(config.path.dest)

                })

            }) // it
        }) // describe

    }) // describe

    //------------------
    // Build: Finishers
    //------------------
    describe('Build: Finishers', function() {

        //----------------
        // build.finalize
        //----------------
        describe('finalize', function() {
            it('should copy a source file to dest if only source is specified', function() {

                config.path.source = path.join(testPath, 'finalize', 'source')
                config.path.dest   = path.join(testPath, 'finalize', 'dest')

                let destFile = path.join(config.path.dest, 'hello.txt')

                let obj = {
                    'source': path.join(config.path.source, 'hello.txt'),
                    'dest': '',
                    'data': '',
                    'build': false
                }

                return functions.makeDirPath(config.path.dest, true).then(function() {

                    return functions.removeFile(destFile)

                }).then(function() {

                    return build.finalize(obj)

                }).then(function(returnObj) {

                    return functions.fileExists(destFile)

                }).then(function(exists) {

                    expect(exists).to.be(true)

                    return functions.removeFile(config.path.dest)

                })

            }) // it

            it('should get back an error if passed obj.data and an obj.dest path that is in the source directory', function() {

                config.path.source = path.join(testPath, 'finalize', 'source')
                config.path.dest   = path.join(testPath, 'finalize', 'dest')

                let obj = {
                    source: path.join(config.path.source, 'hello.txt'),
                    dest  : path.join(config.path.source, 'hello.txt'),
                    data  : '...',
                    build : false
                }

                return build.finalize(obj).catch(function(err) {

                    return err

                }).then(function(err) {

                    expect(err).to.be('build.finalize -> Destination points to a source directory.')

                })
            }) // it

            it('should return the same obj if both source and dest are specified', function() {

                config.path.source = path.join(testPath, 'finalize', 'source')
                config.path.dest   = path.join(testPath, 'finalize', 'dest')

                let obj = {
                    'source': path.join(config.path.source, 'hello.txt'),
                    'dest': path.join(config.path.dest, 'hello.txt'),
                    'data': '',
                    'build': false
                }

                return Promise.resolve().then(function() {

                    return build.finalize(obj)

                }).then(function(returnObj) {

                    expect(returnObj).to.eql(obj)

                })

            }) // it

            it('should write a dest file if obj.source and obj.data are specified', function() {

                config.path.source = path.join(testPath, 'finalize', 'source')
                config.path.dest   = path.join(testPath, 'finalize', 'dest')

                let destFile = path.join(config.path.dest, 'hello.txt')

                let obj = {
                    'source': path.join(config.path.source, 'hello.txt'),
                    'dest': '',
                    'data': 'hello from the data field',
                    'build': false
                }

                return Promise.resolve().then(function() {

                    return functions.removeFile(destFile)

                }).then(function() {

                    return build.finalize(obj)

                }).then(function() {

                    return functions.readFile(destFile)

                }).then(function(fileData) {

                    expect(fileData).to.be('hello from the data field')

                    return functions.removeFile(config.path.dest)

                })

            }) // it
        }) // describe

        //----------
        // build.br
        //----------
        describe('br', function() {
            it('should create a brotli version of an existing file', function() {

                config.path.source = path.join(testPath, 'br', 'source')
                config.path.dest   = path.join(testPath, 'br', 'dest')

                let destFile = path.join(config.path.dest, 'sample.txt.br')

                let obj = {
                    'source': path.join(config.path.source, 'sample.txt'),
                    'dest': path.join(config.path.dest, 'sample.txt'),
                    'data': '',
                    'build': true
                }

                return Promise.resolve().then(function() {

                    return functions.removeFile(destFile)

                }).then(function() {

                    return build.br(obj)

                }).then(function() {

                    return functions.fileExists(destFile)

                }).then(function(exists) {

                    expect(exists).to.be(true)

                    return functions.removeFile(destFile)

                })

            }) // it
        }) // describe

        //----------
        // build.gz
        //----------
        describe('gz', function() {
            it('should create a gzipped version of an existing file', function() {

                config.path.source = path.join(testPath, 'gz', 'source')
                config.path.dest   = path.join(testPath, 'gz', 'dest')

                let destFile = path.join(config.path.dest, 'sample.txt.gz')

                let obj = {
                    'source': path.join(config.path.source, 'sample.txt'),
                    'dest': path.join(config.path.dest, 'sample.txt'),
                    'data': '',
                    'build': true
                }

                return Promise.resolve().then(function() {

                    return functions.removeFile(destFile)

                }).then(function() {

                    return build.gz(obj)

                }).then(function() {

                    return functions.fileExists(destFile)

                }).then(function(exists) {

                    expect(exists).to.be(true)

                    return functions.removeFile(destFile)

                })

            }) // it
        }) // describe

        //-----------
        // build.map
        //-----------
        describe('map', function() {
            it('should build a map file along with br and gz versions of said file', function() {

                config.path.source = path.join(testPath, 'map', 'source')
                config.path.dest   = path.join(testPath, 'map', 'dest')

                config.sourceMaps = true

                config.map.sourceToDestTasks.map.push('br', 'gz')

                let destMapFile = path.join(config.path.dest, 'treasure.js.map')

                let obj = {
                    'source': path.join(config.path.source, 'treasure.js'),
                    'dest': '',
                    'data': '',
                    'build': false
                }

                return Promise.resolve().then(function() {

                    return functions.removeFile(config.path.dest)

                }).then(function() {

                    return build.js(obj)

                }).then(function() {

                    return functions.readFile(destMapFile)

                }).then(function(data) {

                    let desired = {
                        'version': 3,
                        'sources': ['source/treasure.js'],
                        'names': ['treasure','music'],
                        'mappings': 'AAAA,IAAIA,SAAW,OACXC,MAAQD,SAAW',
                        'file': 'treasure.js',
                        'sourceRoot': '/source-maps',
                        'sourcesContent': ['var treasure = \'gold\'\nvar music = treasure + \' plated records\'']
                    }

                    data = JSON.parse(data)

                    expect(data).to.eql(desired)

                    return functions.fileExists(destMapFile + '.br')

                }).then(function(exists) {

                    expect(exists).to.be(true)

                    return functions.fileExists(destMapFile + '.gz')

                }).then(function(exists) {

                    expect(exists).to.be(true)

                    return functions.removeFile(config.path.dest)

                })

            }) // it
        }) // describe

    }) // describe

}) // describe
