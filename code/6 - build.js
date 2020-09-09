'use strict'

//----------------
// Includes: Self
//----------------
const color     = require('./color.js')
const shared    = require('./2 - shared.js')
const config    = require('./3 - config.js')
const functions = require('./4 - functions.js')

//----------
// Includes
//----------
const fs   = require('fs')   // ~  1 ms
const glob = require('glob') // ~ 13 ms
const path = require('path') // ~  1 ms
const util = require('util') // ~  1 ms
const zlib = require('zlib') // ~  6 ms

//---------------------
// Includes: Promisify
//---------------------
const brotliPromise      = util.promisify(zlib.brotliCompress) // ~ 1 ms
const execFilePromise    = util.promisify(require('child_process').execFile) // ~ 9 ms
const fsWriteFilePromise = util.promisify(fs.writeFile) // ~ 1 ms
const gzipPromise        = util.promisify(zlib.gzip) // ~ 1 ms

//-----------------------------
// Includes: Paths to Binaries
//-----------------------------
let gif  = '',
    jpg  = '',
    png  = '',
    webp = ''

if (shared.global) {
    // each of these take ~ 0 ms instead of ~ 297 ms when using require('name').path
    gif  = path.join(shared.path.self, 'node_modules', 'gifsicle', 'vendor', 'gifsicle')
    jpg  = path.join(shared.path.self, 'node_modules', 'jpegtran-bin', 'vendor', 'jpegtran')
    png  = path.join(shared.path.self, 'node_modules', 'optipng-bin', 'vendor', 'optipng')
    webp = path.join(shared.path.self, 'node_modules', 'cwebp-bin', 'vendor', 'cwebp')
} else {
    gif  = path.join(shared.path.self, '..', 'gifsicle', 'vendor', 'gifsicle')
    jpg  = path.join(shared.path.self, '..', 'jpegtran-bin', 'vendor', 'jpegtran')
    png  = path.join(shared.path.self, '..', 'optipng-bin', 'vendor', 'optipng')
    webp = path.join(shared.path.self, '..', 'cwebp-bin', 'vendor', 'cwebp')
}

//---------------------
// Includes: Lazy Load
//---------------------
let css                // require('clean-css')                      // ~  83 ms
let html               // require('html-minifier').minify           // ~   4 ms
let js                 // require('terser')                         // ~  41 ms
let markdown           // require('markdown-it')()                  // ~  56 ms
let transferMap        // require('multi-stage-sourcemap').transfer // ~  20 ms
let sourceMapGenerator // require('source-map').SourceMapGenerator  // ~  13 ms
let svg                // require('svgo')                           // ~ 121 ms

//-----------
// Variables
//-----------
const build = {}

//----------------------------
// Build: Command and Control
//----------------------------
// The following functions control building, setting up promise chains and concurrency.

build.processBuild = function build_processBuild(files, watching) {
    /*
    Find all source files or optionally use the files parameter to start a build process.

    @param   {String,Object}  [files]     Optional. Glob search string like '*.html' or array of paths like ['/source/about.html', 'source/index.html']
    @param   {Boolean}        [watching]  Optional and defaults to false. If true, log less information.
    @return  {Promise}                    Promise that returns an array of file path strings for the files built like ['/dest/css/style.css', '/dest/index.html']
    */

    watching = watching || false

    if (!config.option.build && !watching) {
        return Promise.resolve()
    }

    return Promise.resolve().then(function() {

        if (!watching) {
            // start build timer
            shared.stats.timeTo.build = functions.sharedStatsTimeTo(shared.stats.timeTo.build)
        }

        let configPathsAreGood = functions.configPathsAreGood()
        if (configPathsAreGood !== true) {
            throw new Error(configPathsAreGood)
        }

    }).then(function() {

        return functions.fileExists(config.path.source).then(function(exists) {
            if (exists === false) {
                throw new Error(shared.language.display('error.missingSourceDirectory'))
            }
        })

    }).then(function() {

        if (!watching) {
            // display title
            functions.log(color.gray('\n' + shared.language.display('words.build') + '\n'), false)
        }

        let filesType = typeof files

        if (filesType === 'object') {
            // we already have a specified list to work from
            return files
        } else {
            if (filesType === 'string') {
                if (files.charAt(0) === '/') {
                    files = files.replace('/', '')
                }
            } else {
                if (config.glob.build !== '') {
                    files = config.glob.build
                } else {
                    files = '**/{*,.htaccess}'
                }
            }

            return functions.findFiles(config.path.source + '/' + files)
        }

    }).then(function(files) {

        if (files.length > 0) {
            return build.processFiles(files)
        } else {
            return []
        }

    }).then(function(filesBuilt) {

        if (!watching) {
            if (filesBuilt.length > 0) {
                //------------------------
                // Missing Build Mappings
                //------------------------
                let array = shared.cache.missingMapBuild.slice()
                let len = array.length

                if (len > 0) {
                    for (let i = 0; i < len; i++) {
                        array[i] = '.' + array[i]
                    }

                    functions.log('\n    ' + color.gray(shared.language.display('message.missingSourceToDestTasks') + '\n        ' + array.sort().join('\n        ')), false)
                }
            } else {
                functions.log(color.gray(shared.language.display('words.done') + '.'))
            }

            //------------
            // Timer: End
            //------------
            shared.stats.timeTo.build = functions.sharedStatsTimeTo(shared.stats.timeTo.build)

            return filesBuilt
        }
    })
} // processBuild

build.processFiles = function build_processFiles(files) {
    /*
    Create a promise chain of tasks for each file and control concurrency.

    @param   {Object,String}  files  Array of paths like ['/source/path1', '/source/path2'] or a string like '/source/path'
    @return  {Promise}               Promise that returns an array of file path strings for the files built like ['/dest/css/style.css', '/dest/index.html']
    */

    let filesBuilt = [] // keep track of any files built

    return new Promise(function(resolve, reject) {

        if (typeof files === 'string') {
            files = [files]
        }

        functions.cacheReset()

        let allFiles = []    // array of promises
        let current  = 0     // number of operations running currently
        let resolved = false // true if all tasks have been queued

        function proceed() {
            current--

            if (files.length > 0) {
                queue()
            } else if (!resolved) {
                resolved = true
                resolve(allFiles)
            }
        } // proceed

        function queue() {
            while (current < config.concurLimit && files.length > 0) {
                let file = files.shift()

                allFiles.push(Promise.resolve(file).then(function(file) {
                    return build.processOneBuild(file).then(function(filePath) {
                        if (typeof filePath === 'string') {
                            filesBuilt.push(filePath)
                        }
                        proceed()
                    }).catch(function(err) {
                        proceed()
                        functions.logError(err)
                        throw err
                    })
                }))

                current++
            }
        } // queue

        queue()

    }).then(function(allFiles) {

        return Promise.all(allFiles).then(function() {
            return filesBuilt
        })

    })
} // processFiles

build.processOneBuild = function build_processOneBuild(filePath) {
    /*
    Create a promise chain of building tasks based on a single file type.

    @param   {String}   filePath  Full path to a file like '/web/source/rss.xml'
    @return  {Promise}            Promise that returns a file path string if something was built otherwise undefined.
    */

    let fileExt = functions.fileExtension(filePath)

    // reusable object that will be passed between build functions
    let object = {
        'source': filePath,
        'dest': '',
        'data': '',
        'build': false
    }

    let p = Promise.resolve(object)

    // figure out which array of functions apply to this file type
    if (config.map.sourceToDestTasks.hasOwnProperty(fileExt)) {
        let len = config.map.sourceToDestTasks[fileExt].length

        for (let i = 0; i < len; i++) {
            if (typeof config.map.sourceToDestTasks[fileExt][i] === 'string') {
                // built-in build task
                p = p.then(build[config.map.sourceToDestTasks[fileExt][i]])
            } else {
                // custom build task function
                p = p.then(config.map.sourceToDestTasks[fileExt][i])
            }
        }
    } else {
        if (shared.cache.missingMapBuild.indexOf(fileExt) < 0 && fileExt !== '') {
            shared.cache.missingMapBuild.push(fileExt)
        }
        p = p.then(build.copy) // add default copy task
    }

    p = p.then(build.finalize).then(function(obj) {
        if (obj.build) {
            return obj.dest
        }
    }).catch(function(err) {
        if (err !== 'done') {
            functions.logError(err)
            throw err
        }
    })

    return p
} // processOneBuild

//------------------
// Build: In Memory
//------------------
// The following functions do their primary task in memory.

build.css = function build_css(obj) {
    /*
    Minify CSS using https://www.npmjs.com/package/clean-css.

    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */

    let buildAlreadySet = obj.build

    let sourceBaseName = path.basename(config.path.source)

    return functions.objBuildInMemory(obj).then(function(obj) {

        functions.logWorker('build.css', obj)

        if (!obj.build) {
            // no further chained promises should be called
            throw 'done'
        }

        if (typeof css !== 'object') {
            css = require('clean-css')
        }

        if ((config.sourceMaps || config.fileType.css.sourceMaps) && buildAlreadySet) {
            return functions.useExistingSourceMap(obj.dest)
        }

    }).then(function(existingSourceMap) {

        existingSourceMap = existingSourceMap || false

        if (existingSourceMap) {
            // temporarily set any sourceMappingURL to a full path for clean-css
            let string = '/*# sourceMappingURL='
            let pos = obj.data.indexOf(string)

            if (pos > 0) {
                obj.data = obj.data.substr(0, pos) + '\n' + string + path.dirname(obj.dest) + shared.slash + path.basename(obj.dest) + '.map */'
            }
        }

        let options = functions.cloneObj(config.thirdParty.cleanCss)

        if (config.sourceMaps || config.fileType.css.sourceMaps) {
            options.sourceMap = true
            options.sourceMapInlineSources = true
            options.rebaseTo = path.dirname(obj.dest)
        }

        const cssMin = new css(options).minify(obj.data)

        if (config.sourceMaps || config.fileType.css.sourceMaps) {

            obj.data = cssMin.styles + '\n/*# sourceMappingURL=' + path.basename(obj.dest) + '.map */'

            let sourceMap = JSON.parse(cssMin.sourceMap.toString())

            if (existingSourceMap) {
                sourceMap.sources = existingSourceMap.sources
                sourceMap.sourcesContent = existingSourceMap.sourcesContent
            } else {
                sourceMap.sources = [path.basename(obj.source)]
            }

            sourceMap = functions.normalizeSourceMap(obj, sourceMap)

            const mapObject = functions.objFromSourceMap(obj, sourceMap)

            return build.map(mapObject)

        } else {
            obj.data = cssMin.styles
        }

    }).then(function() {

        obj = functions.buildEmptyOk(obj)

        return obj

    })
} // css

build.html = async function build_html(obj) {
    /*
    Minify HTML using https://www.npmjs.com/package/html-minifier.

    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */

    obj = await functions.objBuildInMemory(obj)

    functions.logWorker('build.html', obj)

    if (obj.build) {
        if (typeof html !== 'object') {
            html = require('html-minifier').minify
        }

        obj.data = html(obj.data, config.thirdParty.htmlMinifier)

        obj = functions.buildEmptyOk(obj)

        return obj
    } else {
        // no further chained promises should be called
        throw 'done'
    }
} // html

build.js = function build_js(obj) {
    /*
    Minify JavaScript using https://www.npmjs.com/package/terser.

    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */

    let buildAlreadySet = obj.build

    let previousSourceMap = false

    return functions.objBuildInMemory(obj).then(function(obj) {

        functions.logWorker('build.js', obj)

        if (obj.build) {

            if (typeof js !== 'object') {
                js = require('terser')
            }

            if ((config.sourceMaps || config.fileType.js.sourceMaps) && buildAlreadySet) {
                // What if buildAlready set is not set?
                // Like there is a '.map' file in the source folder.
                // Is this worth worrying about?
                if (typeof transferMap !== 'object') {
                    transferMap = require('multi-stage-sourcemap').transfer
                }

                return functions.useExistingSourceMap(obj.dest).then(function(existingSourceMap) {
                    // set parent variable for possible use later
                    previousSourceMap = existingSourceMap
                })
            }
        } else {
            // no further chained promises should be called
            throw 'done'
        }

    }).then(function() {

        let options = {
            'keep_classnames': true,
            'keep_fnames': true,
            'mangle': false
            /*
            // the following code is great for troubleshooting source maps
            output: {
                beautify: true
            },
            beautify: {
                semicolons: false
            }
            */
        }

        let outputFileName = path.basename(obj.dest)

        if (config.sourceMaps || config.fileType.js.sourceMaps) {
            options.sourceMap = {
                'url': outputFileName + '.map'
            }

            if (previousSourceMap !== false) {
                previousSourceMap.sourceRoot = '' // remove pre-existing sourceRoot since we do not want the upcoming transform function using it in path names
            }
        }

        return js.minify(obj.data, options)

    }).then(function(jsMin) {

        if (jsMin.error) {
            if (shared.cli) {
                // display an error for command line users

                const file = obj.source.replace(path.dirname(config.path.source), '')

                let multiline = [
                    /* line 1 */
                    jsMin.error.name + ' ' + shared.language.display('words.in') + ' ' + file,
                    /* line 2 */
                    shared.language.display('error.locationInCode')
                        .replace('{error}', jsMin.error.message)
                        .replace('{number}', jsMin.error.line)
                        .replace('{position}', jsMin.error.pos),
                    /* line 3 */
                    shared.language.display('message.fileWasNotBuilt')
                ]

                multiline = multiline.map(line => color.red(line))

                functions.logMultiline(multiline)

                functions.playSound('error.wav')

                throw 'done'
            } else {
                // api users
                throw jsMin.error
            }
        }

        if (config.sourceMaps || config.fileType.js.sourceMaps) {
            let sourceMap = JSON.parse(jsMin.map)

            if (previousSourceMap !== false) {
                // associate each source path with its corresponding source content value for later
                let sourcesToContent = {}

                for (let i in previousSourceMap.sources) {
                    sourcesToContent[previousSourceMap.sources[i]] = previousSourceMap.sourcesContent[i]
                }

                // transfer the new source map to the previous one
                // uglify 2.6.2 could not do this without help but we have since switched to terser so perhaps this code is not needed anymore
                // needs testing

                sourceMap = transferMap({
                    fromSourceMap: sourceMap,
                    toSourceMap: previousSourceMap
                })

                sourceMap = JSON.parse(sourceMap)

                sourceMap.sourcesContent = []

                for (let i in sourceMap.sources) {
                    sourceMap.sourcesContent.push(sourcesToContent[sourceMap.sources[i]])
                }
            } else {
                // new source map
                sourceMap.sources = [
                    path.basename(config.path.source) + '/' + path.basename(obj.source)
                ]

                for (let i in sourceMap.sourcesContent) {
                    sourceMap.sourcesContent[i] = sourceMap.sourcesContent[i].replace('//# sourceMappingURL=' + path.basename(obj.dest) + '.map', '')
                }
            }

            sourceMap = functions.normalizeSourceMap(obj, sourceMap)

            let mapObject = functions.objFromSourceMap(obj, sourceMap)

            return build.map(mapObject).then(function() {
                return jsMin
            })
        }

        return jsMin

    }).then(function(jsMin) {

        obj.data = jsMin.code

        obj = functions.buildEmptyOk(obj)

        return obj

    })
} // js

build.markdown = async function build_markdown(obj) {
    /*
    Markdown using https://www.npmjs.com/package/markdown-it.

    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */

    obj = await functions.objBuildInMemory(obj)

    functions.logWorker('build.markdown', obj)

    if (obj.build) {
        if (typeof markdown !== 'object') {
            markdown = require('markdown-it')()
        }

        markdown.options = config.thirdParty.markdownIt

        obj.data = markdown.render(obj.data)

        obj = functions.buildEmptyOk(obj)

        return obj
    } else {
        // no further chained promises should be called
        throw 'done'
    }
} // markdown

build.svg = async function build_svg(obj) {
    /*
    Optimize SVG files using https://www.npmjs.com/package/svgo.

    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */

    obj = await functions.objBuildInMemory(obj)

    functions.logWorker('build.svg', obj)

    if (obj.build) {
        if (typeof svg !== 'object') {
            svg = require('svgo')
        }

        let svgo = new svg(config.thirdParty.svgo)

        let result = await svgo.optimize(obj.data)

        obj.data = result.data

        return obj
    } else {
        // no further chained promises should be called
        throw 'done'
    }
} // svg

//----------------
// Build: On Disk
//----------------
// The following functions like working on disk based files.

build.copy = async function build_copy(obj) {
    /*
    Copy source to destination.

    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */

    functions.logWorker('build.copy', obj)

    if (obj.data === '') {
        obj = await functions.objBuildOnDisk(obj)

        if (obj.build) {

            await new Promise(function(resolve, reject) {

                let sourceFile = fs.createReadStream(obj.source)
                sourceFile.on('error', reject)

                let destFile = fs.createWriteStream(obj.dest)
                destFile.on('error', reject)
                destFile.on('finish', resolve)

                // copy source to dest
                sourceFile.pipe(destFile)

            })

            functions.logOutput(obj.dest, 'copy')

        } else {
            // obj.build is false so no further chained promises should be called
            throw 'done'
        }
    } else {
        // do nothing and let build.finalize take care of writing obj.data
    }

    return obj
} // copy

build.gif = async function build_gif(obj) {
    /*
    Losslessly optimize GIF files using https://www.npmjs.com/package/gifsicle.

    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */

    obj = await functions.objBuildOnDisk(obj)

    functions.logWorker('build.gif', obj)

    if (obj.build) {
        await execFilePromise(gif, ['--output', obj.dest, '--optimize=3', '--no-extensions', obj.source])
    } else {
        // no further chained promises should be called
        throw 'done'
    }

    functions.logOutput(obj.dest)

    return obj
} // gif

build.jpg = async function build_jpg(obj) {
    /*
    Losslessly optimize JPG files using https://www.npmjs.com/package/jpegtran-bin.

    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */

    obj = await functions.objBuildOnDisk(obj)

    functions.logWorker('build.jpg', obj)

    if (obj.build) {
        await execFilePromise(jpg, ['-copy', 'none', '-optimize', '-progressive', '-outfile', obj.dest, obj.source])
    } else {
        // no further chained promises should be called
        throw 'done'
    }

    functions.logOutput(obj.dest)

    return obj
} // jpg

build.png = async function build_png(obj) {
    /*
    Losslessly optimize PNG files using https://www.npmjs.com/package/optipng-bin.

    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */

    obj = await functions.objBuildOnDisk(obj)

    functions.logWorker('build.png', obj)

    if (obj.build) {
        await execFilePromise(png, ['-clobber', '-o2', '-strip', 'all', '-out', obj.dest, obj.source])

        // get rid of the possible .bak file optipng makes when overwriting an existing dest file with a different source file
        await functions.removeDest(obj.dest + '.bak', false)
    } else {
        // no further chained promises should be called
        throw 'done'
    }

    functions.logOutput(obj.dest)

    return obj
} // png

build.webp = async function build_webp(obj) {
    /*
    Losslessly optimize WEBP files using https://www.npmjs.com/package/cwebp-bin.

    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */

    obj = await functions.objBuildOnDisk(obj)

    functions.logWorker('build.webp', obj)

    if (obj.build) {
        // on the next line "-z 9" means lossless preset and slowest level to make the smallest possible file without using lossy compression
        await execFilePromise(webp, ['-z', '9', obj.source, '-o', obj.dest])

        // losslessly compressing a lossy source file can lead a larger destination file
        // get the file size of the source and destination
        const files = await functions.filesExistAndSize(obj.source, obj.dest)

        // check the size of the source and destination
        if (files.source.size < files.dest.size || files.dest.size === 0) {
            // source file is smaller or destination is zero bytes

            if (files.dest.exists === true) {
                // remove the destination file
                await functions.removeFile(obj.dest)
            }

            // copy source to destination
            await build.copy(obj)
        } else {
            functions.logOutput(obj.dest)
        }
    } else {
        // no further chained promises should be called
        throw 'done'
    }

    return obj
} // webp

//----------------------
// Build: With Includes
//----------------------
// The following functions are for file types that may contain includes.

build.concat = function build_concat(obj) {
    /*
    Concatenate files like 'all.js.concat' which can contain globs and/or file path strings that point to other files.

    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */

    return functions.objBuildWithIncludes(obj, functions.includePathsConcat).then(function(obj) {

        functions.logWorker('build.concat', obj)

        if (obj.build && config.fileType.concat.enabled) {

            let filePaths = []

            return functions.includePathsConcat(obj.data, obj.source).then(function(includeFiles) {

                filePaths = includeFiles

                return functions.concatMetaWrite(obj.source, filePaths)

            }).then(function() {

                return functions.readFiles(filePaths)

            }).then(function(arrayData) {

                // empty obj.data in preparation to populate it with include file contents
                obj.data = ''

                let fileExtDest = functions.fileExtension(obj.dest)

                let arrayDataLength = arrayData.length - 1

                for (let i in arrayData) {
                    obj.data += arrayData[i]

                    if (i < arrayDataLength) {
                        obj.data += '\n'

                        if (fileExtDest === 'js') {
                            // add a safety separator for javascript
                            obj.data += ';'
                        }
                    }
                }

                let createSourceMaps = false

                let configConcatMaps = config.sourceMaps || config.fileType.concat.sourceMaps

                if (fileExtDest === 'js' && (configConcatMaps || config.fileType.js.sourceMaps)) {
                    createSourceMaps = true
                } else if (fileExtDest === 'css' && (configConcatMaps || config.fileType.css.sourceMaps)) {
                    createSourceMaps = true
                }

                if (createSourceMaps) {
                    if (typeof sourceMapGenerator !== 'object') {
                        sourceMapGenerator = require('source-map').SourceMapGenerator
                    }

                    let map = new sourceMapGenerator({
                        file: path.basename(obj.dest)
                    })

                    let totalLines = 0

                    for (let i in filePaths) {
                        let lineArray = arrayData[i].split(/\r?\n/)
                        let linesInFile = arrayData[i].split(/^.*$/gm).length - 1

                        let sourceFile = filePaths[i].replace(config.path.source, path.basename(config.path.source)).replace(/\\/g, '/')

                        for (let x = 0; x < linesInFile; x++) {
                            totalLines += 1

                            let line = lineArray[x].trimRight()

                            let col = line.length - line.trimLeft().length

                            let mapping = {
                                source: sourceFile,
                                original: { line: x + 1, column: col },
                                generated: { line: totalLines, column: col }
                            }

                            map.addMapping(mapping)
                        }
                    }

                    let sourceMap = JSON.parse(map.toString())

                    sourceMap.sourceRoot = config.sourceRoot
                    sourceMap.sourcesContent = []

                    for (let i in arrayData) {
                        sourceMap.sourcesContent.push(arrayData[i])
                    }

                    if (fileExtDest === 'js') {
                        obj.data += '\n//# sourceMappingURL=' + path.basename(obj.dest) + '.map'
                    } else if (fileExtDest === 'css') {
                        obj.data += '\n/*# sourceMappingURL=' + path.basename(obj.dest) + '.map */'
                    }

                    let mapObject = functions.objFromSourceMap(obj, sourceMap)

                    return build.map(mapObject)
                }

            })
        } else {
            // no further chained promises should be called
            throw 'done'
        }

    }).then(function() {

        obj = functions.buildEmptyOk(obj)

        let fileExtSource = path.basename(obj.source).split('.').reverse()[1] // for example, return 'js' for a file named 'file.js.concat'

        // now return a chain of build tasks just like build.processOneBuild but don't add build.finalize since that will run after our final return anyway
        let p = Promise.resolve(obj)

        // figure out which array of functions apply to this file type
        if (config.map.sourceToDestTasks.hasOwnProperty(fileExtSource)) {
            let len = config.map.sourceToDestTasks[fileExtSource].length

            for (let i = 0; i < len; i++) {
                if (typeof config.map.sourceToDestTasks[fileExtSource][i] === 'string') {
                    // built-in build task
                    p = p.then(build[config.map.sourceToDestTasks[fileExtSource][i]])
                } else {
                    // custom build task function
                    p = p.then(config.map.sourceToDestTasks[fileExtSource][i])
                }
            }
        } else {
            if (shared.cache.missingMapBuild.indexOf(fileExtSource) < 0 && fileExtSource !== '') {
                shared.cache.missingMapBuild.push(fileExtSource)
            }
            p = p.then(build.copy) // add default copy task
        }

        return p

    }).then(function() {

        return obj

    })
} // concat

build.jss = async function build_jss(obj) {
    /*
    JavaScript Static Server (JSS) files.

    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */

    try {
        obj = await functions.objBuildWithIncludes(obj, functions.includePathsJss)

        functions.logWorker('build.jss', obj)

        if (obj.build === false) {
            // no further chained promises should be called
            throw 'done'
        }

        let placeNumber = 0 // will increment to ensure unique placeholders

        async function recurse(data, filePath, parentIncludes) {
            /*
            Recursively process JS blocks.

            @param  {String}  data              String with zero or more <js>...</js> blocks.
            @param  {String}  filePath          Full path to the file that supplied the data.
            @param  {Object}  [parentIncludes]  Optional array of full path strings to parent include files. Used when recursing.
            */

            parentIncludes = parentIncludes || []

            let jssCode = []
            let jssIncludes = []
            let localPlace = 0

            //-----------------------
            // Find <js> code blocks
            //-----------------------
            data = data.replace(/<js>(.*?)<\/js>/gs, function(match, p1) {
                // add <js> code to jssCode
                jssCode.push({
                    place: placeNumber,
                    code: functions.removeJsComments(p1)
                })

                // leave a {{js-0}} numbered placeholder
                return '{{js-' + (placeNumber++) + '}}'
            })

            if (jssCode.length === 0) {
                // return early
                return data
            }

            //--------------------------
            // Find include() functions
            //--------------------------
            for (let i = 0; i < jssCode.length; i++) {
                jssCode[i].code = jssCode[i].code.replace(/(?:^|\s)include\(['|"](.*?)['|"]\s*,?/gs, function(match, p1) {
                    // in the regex above, we want to capture "include('...'" without any additional arguments or a closing parentheses
                    // this will allow us pass those arguments to the include file later

                    // add include function to jssIncludes
                    jssIncludes.push({
                        jssNumber: i,
                        place: jssCode[i].place,
                        localPlace: localPlace,
                        code: p1
                    })

                    // leave a {{js-include-0-0}} numbered placeholder
                    return '{{js-include-' + jssCode[i].place + '-' + (localPlace++) + '}}'
                })
            }

            //----------------------
            // Recurse for includes
            //----------------------
            if (jssIncludes.length > 0) {
                for (let i = 0; i < jssIncludes.length; i++) {
                    const include = jssIncludes[i]

                    let fullPath = ''

                    if (include.code.charAt(0) === '/') {
                        // path starting from source
                        fullPath = path.join(config.path.source, include.code)
                    } else {
                        // relative path
                        fullPath = path.join(path.dirname(filePath), include.code)
                    }

                    if (parentIncludes.indexOf(fullPath) >= 0) {
                        // endless nesting detected

                        parentIncludes.push(filePath) // add ourself for error logging
                        parentIncludes.push(fullPath) // add next include for error logging

                        const file = obj.source.replace(path.dirname(config.path.source), '')

                        const errorSequence = parentIncludes.map(pi => pi.replace(config.path.source, '')).join(' -> ')

                        if (shared.cli) {
                            // display an error for command line users

                            let multiline = [
                                /* line 1 */
                                'Endless nesting ' + shared.language.display('words.in') + ' ' + file,
                                /* line 2 */
                                errorSequence,
                                /* line 3 */
                                shared.language.display('message.fileWasNotBuilt')
                            ]

                            multiline = multiline.map(line => color.red(line))

                            functions.logMultiline(multiline)

                            functions.playSound('error.wav')

                            throw 'done'
                        } else {
                            // api users
                            throw new Error('build.jss -> Endless nesting in sequence -> ' + errorSequence)
                        }
                    } else {
                        parentIncludes.push(filePath) // add ourself for the next recurse
                    }

                    let fileData = await functions.readFile(fullPath)

                    let result = await recurse(fileData, fullPath, parentIncludes)

                    let lookFor = '{{js-include-' + include.place + '-' + include.localPlace + '}}'

                    // replace {{js-include-0-0}} numbered placeholders with a begin type placeholder, the result of the recurse call, and an end type placeholder
                    jssCode[include.jssNumber].code = jssCode[include.jssNumber].code.replace(lookFor, '{{js-include-begin}}</js>' + result + '<js>{{js-include-end}}')
                } // for
            } // jssIncludes.length > 0

            for (let i = 0; i < jssCode.length; i++) {
                // replace placeholders with code
                data = data.replace('{{js-' + jssCode[i].place + '}}', '<js>' + jssCode[i].code + '</js>')
            }

            return data
        } // recurse

        let data = await recurse(obj.data, obj.source)

        data = data.replace(/<js>\s*<\/js>/gm, '') // remove empty <js> pairs

        data = data.replace(/{{js-include-begin}}/g, ';await (async function(sourcePath, shared, ...args){').replace(/{{js-include-end}}/g, '})(sourcePath, shared,') // because we originally captured "include('...'" without the last parentheses in case there were extra arguments to pass, do no include the last parentheses here

        data = data.replace(/\(sourcePath, shared,\)/g, '(sourcePath, shared)') // clean up any trailing commas

        let jssCode = []
        let localPlace = 0

        //-----------------------
        // Find <js> code blocks
        //-----------------------
        data = data.replace(/<js>(.*?)<\/js>/gs, function(match, p1) {
            // add <js> code to jssCode
            jssCode.push({
                place: localPlace,
                code: p1
            })

            // leave a {{js-0}} numbered placeholder
            return '{{js-' + (localPlace++) + '}}'
        })

        //--------------------------------
        // Add place param to write calls
        //--------------------------------
        for (const jss of jssCode) {
            // have each write pass the current place value
            jss.code = jss.code.replace(/(write\(['|"]?.*?)\)/gs, function(match, p1) {
                return p1 + ', place)'
            })
        }

        //------------------------------------
        // Create a write buffer and function
        //------------------------------------
        let writeBuffer = []

        function writeFunction(string, place) {
            writeBuffer.push({
                place: place,
                string: string
            })
        }

        //-------------------
        // Construct daFunc!
        //-------------------
        let daFunc = '' // a function built out of strings? madness!

        daFunc += 'return async function(write, require, sourcePath, shared) {' + '\n'
        daFunc += '    let place = 0;' + '\n'

        for (const jss of jssCode) {
            daFunc += '    place = ' + jss.place + ';' + '\n'
            daFunc += '    ' + jss.code + '' + '\n'
        }

        daFunc += '}' + '\n'

        const sourcePath = config.path.source

        const sharedObj = {} // a shared object reference which will be accesible from any include

        await Function(daFunc)()(writeFunction, require, sourcePath, sharedObj) // create with first () then run with second ()

        //-------------------------------------------------
        // Replace placeholders with write buffer elements
        //-------------------------------------------------
        for (const i of writeBuffer) {
            let placeHolder = '{{js-' + i.place + '}}'

            // replace {{js-0}} numbered placeholders
            data = data.replace(placeHolder, i.string + placeHolder) // prepend strings before our placeholder in case write() was called more than once
        }

        data = data.replace(/{{js-[0-9]+}}/g, '') // remove any remaining js placeholders

        obj.data = data

        obj = functions.buildEmptyOk(obj)

        //-------------------------------
        // Create a chain of build tasks
        //-------------------------------
        let fileExtSource = path.basename(obj.source).split('.').reverse()[1] // for example, return 'html' for a file named 'file.html.jss'

        // now return a chain of build tasks just like build.processOneBuild but don't add build.finalize since that will run after our final return anyway
        let p = Promise.resolve(obj)

        // figure out which array of functions apply to this file type
        if (config.map.sourceToDestTasks.hasOwnProperty(fileExtSource)) {
            let len = config.map.sourceToDestTasks[fileExtSource].length

            for (let i = 0; i < len; i++) {
                if (typeof config.map.sourceToDestTasks[fileExtSource][i] === 'string') {
                    // built-in build task
                    p = p.then(build[config.map.sourceToDestTasks[fileExtSource][i]])
                } else {
                    // custom build task function
                    p = p.then(config.map.sourceToDestTasks[fileExtSource][i])
                }
            }
        } else {
            if (shared.cache.missingMapBuild.indexOf(fileExtSource) < 0 && fileExtSource !== '') {
                shared.cache.missingMapBuild.push(fileExtSource)
            }
            p = p.then(build.copy) // add default copy task
        }

        await p

        //--------------------------------------------------------
        // Return the reusable object for any further build tasks
        //--------------------------------------------------------
        return obj

    } catch(error) {
        if (error === 'done') {
            // rethrow done
            throw 'done'
        }

        const errorFile = obj.source.replace(config.path.source, '')

        let multiline = [] // array for writing multiline messages to the console for command line users

        if (error.code === 'ENOENT') {
            // include file not found

            const errorInclude = error.path.replace(config.path.source, '')

            if (shared.cli) {
                // command line users

                multiline.push(
                    'Include not found while building ' + errorFile,
                    'Missing include ' + errorInclude,
                    shared.language.display('message.fileWasNotBuilt')
                )
            } else {
                // api users
                throw new Error('build.jss -> missing include -> ' + errorInclude + ' in ' + errorFile)
            }
        } else {
            // all other errors

            if (shared.cli) {
                // command line users

                multiline.push(
                    'Error in ' + errorFile,
                    error.message + '.',
                    shared.language.display('message.fileWasNotBuilt')
                )
            } else {
                // api users
                let errorMessage = error.message

                if (errorMessage.slice(-1) === '.') {
                    // remove the last period
                    errorMessage = errorMessage.slice(0, -1)
                }

                throw new Error('build.jss -> ' + errorMessage + ' in ' + errorFile)
            }
        } // if

        if (shared.cli) {
            // command line users
            multiline = multiline.map(line => color.red(line))

            functions.logMultiline(multiline)

            functions.playSound('error.wav')

            throw 'done'
        } // if
    } // catch
} // jss

//------------------
// Build: Finishers
//------------------
// The following functions are typically called at the end of a build chain.
// Unlike most build functions, they don't bother to check if a source file is
// newer than a destination file since that should have been handled already.

build.finalize = async function build_finalize(obj) {
    /*
    Finalize by writing memory to disk or copying source to dest, if needed.

    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */

    functions.logWorker('build.finalize', obj)

    if (obj.data !== '') {
        // write obj.data to dest

        if (obj.dest === '') {
            obj.dest = functions.sourceToDest(obj.source)
        } else if (functions.inSource(obj.dest)) {
            // obj.dest points to a file in the source directory which could be dangerous
            throw new Error('build.finalize -> ' + shared.language.display('error.destPointsToSource'))
        }

        await functions.makeDirPath(obj.dest)

        await fsWriteFilePromise(obj.dest, obj.data)

        obj.data = ''

        functions.logOutput(obj.dest)

        return obj
    } else if (obj.dest === '') {
        // copy source to dest
        return build.copy(obj)
    } else {
        return obj
    }
} // finalize

build.br = async function build_br(obj) {
    /*
    Create a brotli compressed version of a file to live alongside the original.

    @param   {Object}          obj  Reusable object originally created by build.processOneBuild
    @return  {Promise,Object}  obj  Promise that returns a reusable object or just the reusable object.
    */

    if (obj.build) {
        obj = await build.finalize(obj) // build.finalize ensures our destination file is ready to be compressed

        functions.logWorker('build.br', obj)

        let data = await functions.readFile(obj.dest)

        let dataCompress = await brotliPromise(data, {
            params: {
                // the default compression level is 11 which is exactly what we want
                [zlib.constants.BROTLI_PARAM_SIZE_HINT]: data.length
            }
        })

        await fsWriteFilePromise(obj.dest + '.br', dataCompress, 'binary')
    }

    return obj
} // br

build.gz = async function build_gz(obj) {
    /*
    Create a gzip compressed version of a file to live alongside the original.

    @param   {Object}          obj  Reusable object originally created by build.processOneBuild
    @return  {Promise,Object}  obj  Promise that returns a reusable object or just the reusable object.
    */

    if (obj.build) {
        obj = await build.finalize(obj) // build.finalize ensures our destination file is ready to be compressed

        functions.logWorker('build.gz', obj)

        let data = await functions.readFile(obj.dest)

        let dataCompress = await gzipPromise(data, {
            level: 9
        })

        await fsWriteFilePromise(obj.dest + '.gz', dataCompress, 'binary')
    }

    return obj
} // gz

build.map = async function build_map(obj) {
    /*
    Build a map file and if needed, also make a br and/or gz version of said map file.

    @param   {Object}          obj  Reusable object originally created by build.processOneBuild
    @return  {Promise,Object}  obj  Promise that returns a reusable object or just the reusable object.
    */

    // Troubleshooting a JavaScript source map? Try http://sokra.github.io/source-map-visualization/ and https://sourcemaps.io
    if (obj.build) {
        obj = await build.finalize(obj) // build.finalize ensures our destination file is written to disk

        functions.logWorker('build.map', obj)

        if (config.map.sourceToDestTasks.map.indexOf('br') >= 0) {
            // manually kick off a br task for the new .map file
            await build.br({
                'source': obj.dest,
                'dest': obj.dest,
                'data': '',
                'build': true
            })
        }

        if (config.map.sourceToDestTasks.map.indexOf('gz') >= 0) {
            // manually kick off a gz task for the new .map file
            await build.gz({
                'source': obj.dest,
                'dest': obj.dest,
                'data': '',
                'build': true
            })
        }
    }

    return obj
} // map

//---------
// Exports
//---------
module.exports = build