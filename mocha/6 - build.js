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
            it('should compile a md file to html', function() {

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

        //-----------
        // build.svg
        //-----------
        describe('svg', function() {
            it('should optimize a svg file\n', function() {

                config.path.source = path.join(testPath, 'svg', 'source')
                config.path.dest   = path.join(testPath, 'svg', 'dest')

                let obj = {
                    'source': path.join(config.path.source, 'phone.svg'),
                    'dest': '',
                    'data': '',
                    'build': false
                }

                let desiredObj = '<svg width="1152" height="810.671" viewBox="0 0 1080 760" xmlns="http://www.w3.org/2000/svg"><g fill-rule="evenodd" transform="translate(0 -292.36)"><path fill="#26c6da" d="M0 292.36h1080v760H0z"/><circle cx="540.29" cy="672.78" r="279.58" fill="#00bcd4"/><rect x="467.7" y="559.65" width="142.99" height="255.96" ry="5.888" fill="#607d8b"/><path fill="#455a64" d="M472.11 580.58h134.68v216.77H472.11z"/><ellipse cx="513.12" cy="569.54" rx="3.526" ry="3.898" fill="#b0bec5"/><rect x="523.62" y="566.46" width="41.742" height="6.359" ry="1.325" fill="#b0bec5"/><path d="M530 815.58v26.786h20V815.58z" fill="#ececec"/><path d="M535 842.36v105c0 6 4 10 10 10h49.949c6.05 0 10.051-4 10.051-9.798V887.36c0-3 2-5 5-5h45c3 0 5 2 5 5v165h10v-170c0-6-4-10-10-10h-55c-5 0-10 5-10 10v60.076c0 2.924-2 4.924-4.824 4.947l-40.013-.044C547 947.36 545 945.36 545 942.562v-100.2zm494-106.12v31.021h-34.898V736.24z" fill="#ececec"/><path d="M994.49 746.6h-90c-6-.239-10 4.761-10 10v295.26l10-.505v-289.7c.066-2.804 1-5.29 5-5.065l85 .014zm40.01-18.88l-5 4.137v41.369l5 4.137h30V727.72z" fill="#ececec"/><path d="M1064.5 712.36v80h15v-80z" fill="#4d4d4d"/><circle cx="1072.2" cy="719.96" r="5" fill="#ffc107"/><path fill="#78909c" d="M514.67 641.74h51.013v96.47H514.67zm10.36-6.32h29.8v6.061h-29.8z"/><path fill="#607d8b" d="M516.69 643.76h46.972v89.651H516.69z"/><path d="M516.69 709.92c18.366 3.369 30.562-13.803 46.972-2.768v26.258H516.69z" fill="#b2ff59"/></g></svg>'

                return build.svg(obj).then(function(returnObj) {

                    expect(returnObj.data).to.eql(desiredObj)

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

                    expect(err.message).to.be('build.finalize -> Destination points to a source directory.')

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
