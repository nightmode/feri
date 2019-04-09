'use strict'

//----------
// Includes
//----------
var expect = require('expect.js')
var path   = require('path')

var shared    = require('../code/2 - shared.js')
var config    = require('../code/3 - config.js')
var functions = require('../code/4 - functions.js')
var build     = require('../code/6 - build.js')

//-----------
// Variables
//-----------
var sharedBackup = functions.cloneObj(shared)
var configBackup = functions.cloneObj(config)
var testPath = path.join(shared.path.self, 'mocha', 'files', 'build')

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

                var destFile1 = path.join(config.path.dest, 'index.html')
                var destFile2 = path.join(config.path.dest, 'sample.html')

                return Promise.resolve().then(function() {

                    return build.processBuild()

                }).then(function() {

                    return functions.findFiles(config.path.dest + '/**/*')

                }).then(function(files) {

                    var objDesired = [destFile1, destFile2]

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

                var destFile = path.join(config.path.dest, 'sample.html')

                return Promise.resolve().then(function() {

                    return build.processBuild('*.md')

                }).then(function() {

                    return functions.findFiles(config.path.dest + '/**/*')

                }).then(function(files) {

                    var objDesired = [destFile]

                    expect(files).to.eql(objDesired)

                }).then(function() {

                    return functions.removeFile(destFile)

                })

            }) // it

            it('should build the files specified by an array of paths', function() {

                config.path.source = path.join(testPath, 'processBuild', 'source')
                config.path.dest   = path.join(testPath, 'processBuild', 'dest')

                var destFile = path.join(config.path.dest, 'index.html')

                return Promise.resolve().then(function() {

                    return build.processBuild([
                        path.join(config.path.source, 'index.html')
                    ])

                }).then(function() {

                    return functions.findFiles(config.path.dest + '/**/*')

                }).then(function(files) {

                    var objDesired = [destFile]

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

                var sourceFile1 = path.join(config.path.source, 'index.html')
                var sourceFile2 = path.join(config.path.source, 'readme.txt')

                var destFile1 = path.join(config.path.dest, 'index.html')
                var destFile2 = path.join(config.path.dest, 'readme.txt')

                return Promise.resolve().then(function() {

                    return functions.removeFile(config.path.dest)

                }).then(function(o) {

                    return build.processFiles([sourceFile1, sourceFile2])

                }).then(function(o) {

                    var desiredObj = [destFile1, destFile2]

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

                var sourceFile = path.join(config.path.source, 'sample.txt')
                var destFile = path.join(config.path.dest, 'sample.txt')

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

                var obj = {
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

                var destMapFile = path.join(config.path.dest, 'style.css.map')

                var obj = {
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

                    var desired = {
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

                var obj = {
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

                var sourceFile = path.join(config.path.source, 'sample.js')
                var destFile = path.join(config.path.dest, 'sample.js')

                var destFileSize = 0
                var sourceFileSize = 0

                var obj = {
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

                var destMapFile = path.join(config.path.dest, 'sample.js.map')

                var sourceFile = path.join(config.path.source, 'sample.js')
                var destFile = path.join(config.path.dest, 'sample.js')

                var obj = {
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

                    var desired = {
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

                var destFile = path.join(config.path.dest, 'sample.js')
                var destMapFile = path.join(config.path.dest, 'sample.js.map')

                var obj = {
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

                    var desired = {
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

                var obj = {
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

                var destFile = path.join(config.path.dest, 'small.data')

                var obj = {
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

                var sourceFile = path.join(config.path.source, 'karp.gif')
                var destFile = path.join(config.path.dest, 'karp.gif')

                var destFileSize = 0
                var sourceFileSize = 0

                var obj = {
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

                var sourceFile = path.join(config.path.source, 'tassadar.jpg')
                var destFile = path.join(config.path.dest, 'tassadar.jpg')

                var destFileSize = 0
                var sourceFileSize = 0

                var obj = {
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

                var sourceFile = path.join(config.path.source, 'logo.png')
                var destFile = path.join(config.path.dest, 'logo.png')

                var destFileSize = 0
                var sourceFileSize = 0

                var obj = {
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

                var obj = {
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

                var destMapFile = path.join(config.path.dest, 'test-2', 'all.js.map')

                var obj = {
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

                    var objDesired = {
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

                var destMapFile = path.join(config.path.dest, 'test-3', 'all.css.map')

                var obj = {
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

                    var objDesired = {
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

        //------------
        // build.sass
        //------------
        describe('sass', function() {
            it('should compile a sass file with an include', function() {

                config.path.source = path.join(testPath, 'sass', 'source')
                config.path.dest   = path.join(testPath, 'sass', 'dest')

                var obj = {
                    'source': path.join(config.path.source, 'style.scss'),
                    'dest': '',
                    'data': '',
                    'build': false
                }

                return build.sass(obj).then(function(returnObj) {

                    expect(returnObj.data.toString()).to.be('p{outline:none}\n')

                })

            }) // it

            it('should compile a sass file with an include and create a source map', function() {

                config.path.source = path.join(testPath, 'sass', 'source')
                config.path.dest   = path.join(testPath, 'sass', 'dest')

                config.sourceMaps = true

                var destMapFile = path.join(config.path.dest, 'style.css.map')

                var obj = {
                    'source': path.join(config.path.source, 'style.scss'),
                    'dest': '',
                    'data': '',
                    'build': false
                }

                return Promise.resolve().then(function() {

                    // remove map file from any previous run
                    return functions.removeFile(destMapFile)

                }).then(function() {

                    return build.sass(obj)

                }).then(function(returnObj) {

                    expect(returnObj.data.toString()).to.be('p{outline:none}\n/*# sourceMappingURL=style.css.map */')

                    return functions.readFile(destMapFile)

                }).then(function(map) {

                    var desired = {
                        "version": 3,
                        "sourceRoot": "/source-maps",
                        "file": "style.css",
                        "sources": ["source/style.scss","source/_import.scss"],
                        "sourcesContent": ["@import 'import';", "p {\n    outline: none;\n}"],
                        "mappings":"ACAA,AAAA,CAAC,AAAC,CACE,OAAO,CAAE,IAAI,CAChB",
                        "names":[]
                    }

                    map = JSON.parse(map)

                    expect(map).to.eql(desired)

                    return functions.removeFile(config.path.dest)

                })

            }) // it
        }) // describe

        //--------------
        // build.stylus
        //--------------
        describe('stylus', function() {
            it('should compile a stylus file with an include', function() {

                config.path.source = path.join(testPath, 'stylus', 'source')
                config.path.dest   = path.join(testPath, 'stylus', 'dest')

                var obj = {
                    'source': path.join(config.path.source, 'style.styl'),
                    'dest': '',
                    'data': '',
                    'build': false
                }

                return build.stylus(obj).then(function(returnObj) {

                    expect(returnObj.data).to.be('html{background:transparent}')

                })

            }) // it

            it('should compile a stylus file with an include and create a source map\n', function() {

                config.path.source = path.join(testPath, 'stylus', 'source')
                config.path.dest   = path.join(testPath, 'stylus', 'dest')

                config.sourceMaps = true

                var destMapFile = path.join(config.path.dest, 'style.css.map')

                var obj = {
                    'source': path.join(config.path.source, 'style.styl'),
                    'dest': '',
                    'data': '',
                    'build': false
                }

                return Promise.resolve().then(function() {

                    // remove map file from any previous run
                    return functions.removeFile(destMapFile)

                }).then(function() {

                    return build.stylus(obj)

                }).then(function(returnObj) {

                    expect(returnObj.data).to.be('html{background:transparent}\n/*# sourceMappingURL=style.css.map */')

                    return functions.readFile(destMapFile)

                }).then(function(map) {

                    var desired = {
                        "version": 3,
                        "sources": ["mocha/files/build/stylus/source/_import.styl"],
                        "names": [],
                        "mappings": "AAAA,KACI,WAAW",
                        "file": "style.css",
                        "sourceRoot": "/source-maps",
                        "sourcesContent": [""]
                    }

                    map = JSON.parse(map)

                    expect(map).to.eql(desired)

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

                var destFile = path.join(config.path.dest, 'hello.txt')

                var obj = {
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

                var obj = {
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

                var obj = {
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

                var destFile = path.join(config.path.dest, 'hello.txt')

                var obj = {
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
        // build.gz
        //----------
        describe('gz', function() {
            it('should create a gzipped version of an existing file', function() {

                config.path.source = path.join(testPath, 'gz', 'source')
                config.path.dest   = path.join(testPath, 'gz', 'dest')

                var destFile = path.join(config.path.dest, 'sample.txt.gz')

                var obj = {
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
            it('should build a map file along with a gz version of said file', function() {

                config.path.source = path.join(testPath, 'map', 'source')
                config.path.dest   = path.join(testPath, 'map', 'dest')

                config.sourceMaps = true

                config.map.sourceToDestTasks.map.push('gz')

                var destMapFile = path.join(config.path.dest, 'treasure.js.map')

                var obj = {
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

                    return functions.fileExists(destMapFile + '.gz')

                }).then(function(exists) {

                    expect(exists).to.be(true)

                    return functions.removeFile(config.path.dest)

                })

            }) // it
        }) // describe

    }) // describe

}) // describe
