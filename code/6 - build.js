'use strict'

//----------------
// Includes: Self
//----------------
var shared    = require('./2 - shared.js')
var config    = require('./3 - config.js')
var functions = require('./4 - functions.js')

//----------
// Includes
//----------
var chalk     = require('chalk')          // ~ 20 ms
var fs        = require('fs')             // ~  1 ms
var path      = require('path')           // ~  1 ms
var promisify = require('promisify-node') // ~  8 ms

//---------------------
// Includes: Promisify
//---------------------
var execPromise        = promisify(require('child_process').exec) // ~ 13 ms
var fsWriteFilePromise = promisify(fs.writeFile)                  // ~  1 ms

//-----------------------------
// Includes: Paths to Binaries
//-----------------------------
// ~ 0 ms instead of ~ 297 ms with require('gifsicle').path
var gif = path.join(shared.path.self, 'node_modules', 'gifsicle', 'vendor', 'gifsicle')

// ~ 0 ms instead of ~ 297 ms with require('jpegtran-bin').path
var jpg = path.join(shared.path.self, 'node_modules', 'jpegtran-bin', 'vendor', 'jpegtran')

// ~ 0 ms instead of ~ 287 ms with require('optipng-bin').path
var png = path.join(shared.path.self, 'node_modules', 'optipng-bin', 'vendor', 'optipng')

//---------------------
// Includes: Lazy Load
//---------------------
var css          // require('clean-css')                   // ~  83 ms
var coffeeScript // require('coffee-script')               // ~  36 ms
var ejs          // require('ejs')                         // ~   4 ms
var gzipme       // require('gzipme')                      // ~   6 ms
var html         // require('html-minifier').minify        // ~   4 ms
var jade         // require('jade')                        // ~ 363 ms
var less         // require('less')                        // ~  89 ms
var markdown     // require('markdown-it')()               // ~  56 ms
var sassPromise  // promisify(require('node-sass').render) // ~   7 ms
var stylus       // require('stylus')                      // ~  98 ms
var js           // require('uglify-js')                   // ~  83 ms

//-----------
// Variables
//-----------
var build = {}

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

    return Promise.resolve().then(function(good) {

        if (functions.configPathsAreGood() === false) {
            throw shared.language.display('error.configPaths')
        }

    }).then(function() {

        return functions.fileExists(config.path.source).then(function(exists) {
            if (exists === false) {
                throw shared.language.display('error.missingSourceDirectory')
            }
        })

    }).then(function() {

        if (!watching) {
            // start build timer
            shared.stats.timeTo.build = functions.sharedStatsTimeTo(shared.stats.timeTo.build)

            // display title
            functions.log(chalk.gray('\n' + shared.language.display('words.build') + '\n'), false)
        }

        var filesType = typeof files

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
                var array = shared.cache.missingMapBuild.slice()
                var len = array.length

                if (len > 0) {
                    for (var i = 0; i < len; i++) {
                        array[i] = '.' + array[i]
                    }

                    functions.log('\n    ' + chalk.gray(shared.language.display('message.missingSourceToDestTasks') + '\n        ' + array.sort().join('\n        ')), false)
                }
            } else {
                functions.log(chalk.gray(shared.language.display('words.done') + '.'))
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
    var filesBuilt = [] // keep track of any files built

    return new Promise(function(resolve, reject) {

        if (typeof files === 'string') {
            files = [files]
        }

        functions.cacheReset()

        var allFiles = []    // array of promises
        var current  = 0     // number of operations running currently
        var resolved = false // true if all tasks have been queued

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
                var file = files.shift()

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
    var fileExt = functions.fileExtension(filePath)

    // reusable object that will be passed between build functions
    var object = {
        'source': filePath,
        'dest': '',
        'data': '',
        'build': false
    }

    var p = Promise.resolve(object)

    // figure out which array of functions apply to this file type
    if (config.map.sourceToDestTasks.hasOwnProperty(fileExt)) {
        var len = config.map.sourceToDestTasks[fileExt].length

        for (var i = 0; i < len; i++) {
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

build.coffeeScript = function build_coffeeScript(obj) {
    /*
    CoffeeScript using https://www.npmjs.com/package/coffee-script.
    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */
    return functions.objBuildInMemory(obj).then(function(obj) {

        functions.logWorker('build.coffeeScript', obj)

        if (obj.build) {
            if (typeof coffeeScript !== 'object') {
                coffeeScript = require('coffee-script')
            }

            if (config.sourceMaps || config.fileType.coffeeScript.sourceMaps) {
                var coffeeObj = coffeeScript.compile(obj.data, {
                    sourceMap: true,
                    bare: true
                })

                obj.data = coffeeObj.js + '//# sourceMappingURL=' + path.basename(obj.dest) + '.map'

                var map = JSON.parse(coffeeObj.v3SourceMap)

                map.file = path.basename(obj.dest)
                map.sourceRoot = config.sourceRoot

				var mapSources = obj.source.replace(config.path.source, path.basename(config.path.source))

				if (shared.slash === '/') {
				    map.sources = [mapSources]
				} else {
					// we are on windows
					map.sources = [mapSources.replace(/\\/g, '/')]
				}

                return functions.readFile(obj.source).then(function(data) {

                    map.sourcesContent = [data.replace(/"/g, '\"')]

                }).then(function() {

                    map = JSON.stringify(map)
                    return functions.makeDirPath(obj.dest)

                }).then(function() {

                    return fsWriteFilePromise(obj.dest + '.map', map)

                }).then(function() {

                    if (config.map.sourceToDestTasks.map.indexOf('gz') >= 0) {
                        // manually kick off a gz task for the new .map file
                        return build.gz({
                            'source': obj.source,
                            'dest': obj.dest + '.map',
                            'data': '',
                            'build': true
                        })
                    }

                }).then(function() {

                    return obj

                })
            } else {
                obj.data = coffeeScript.compile(obj.data)
                return obj
            }
        } else {
            // no further chained promises should be called
            throw 'done'
        }

    }).then(function(obj) {

        return obj

    })
} // coffeeScript

build.css = function build_css(obj) {
    /*
    Minify CSS using https://www.npmjs.com/package/clean-css.
    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */
    var buildAlreadySet = obj.build

    var sourceBaseName = path.basename(config.path.source)

    return functions.objBuildInMemory(obj).then(function(obj) {

        functions.logWorker('build.css', obj)

        if (!obj.build) {
            // no further chained promises should be called
            throw 'done'
        } else if (typeof css !== 'object') {
            css = require('clean-css')
        }

    }).then(function() {

        var options = functions.cloneObj(config.thirdParty.cleanCss)

        if (config.sourceMaps || config.fileType.css.sourceMaps) {
            options.sourceMap = true
            options.sourceMapInlineSources = true
            options.target = path.dirname(obj.dest)
        }

        var cssMin = new css(options).minify(obj.data)

        if (config.sourceMaps || config.fileType.css.sourceMaps) {

            obj.data = cssMin.styles + '\n/*# sourceMappingURL=' + path.basename(obj.dest) + '.map */'

            var map = JSON.parse(cssMin.sourceMap.toString())

            map.file = path.basename(obj.dest)
            map.sourceRoot = config.sourceRoot
            map.sources = [path.basename(obj.source)]

            map = JSON.stringify(map)

            return functions.makeDirPath(obj.dest).then(function() {

                return fsWriteFilePromise(obj.dest + '.map', map)

            }).then(function() {

               if (config.map.sourceToDestTasks.map.indexOf('gz') >= 0) {
                    // manually kick off a gz task for the new .map file
                    return build.gz({
                        'source': obj.source,
                        'dest': obj.dest + '.map',
                        'data': '',
                        'build': true
                    })
                }

            })

        } else {
            obj.data = cssMin.styles
        }

    }).then(function() {

        return obj

    })
} // css

build.html = function build_html(obj) {
    /*
    Minify HTML using https://www.npmjs.com/package/html-minifier.
    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */
    return functions.objBuildInMemory(obj).then(function(obj) {

        functions.logWorker('build.html', obj)

        if (obj.build) {
            if (typeof html !== 'object') {
                html = require('html-minifier').minify
            }

            obj.data = html(obj.data, config.thirdParty.htmlMinifier)
            return obj
        } else {
            // no further chained promises should be called
            throw 'done'
        }

    })
} // html

build.js = function build_js(obj) {
    /*
    Minify JavaScript using https://www.npmjs.com/package/uglify-js.
    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */
    var buildAlreadySet = obj.build

    return functions.objBuildInMemory(obj).then(function(obj) {

        functions.logWorker('build.js', obj)

        if (obj.build) {

            if (typeof js !== 'object') {
                js = require('uglify-js')
            }

            if ((config.sourceMaps || config.fileType.js.sourceMaps) && buildAlreadySet) {
                // check if a map file already exists
                return functions.fileExistsAndTime(obj.dest + '.map').then(function(mapFile) {

                    if (mapFile.exists) {
                        // map file already exists but has it been generated recently?
                        if (mapFile.mtime < (new Date().getTime() - 5000)) {
                            // map file is older than 5 seconds and most likely not just built
                            // remove old map file since we will generate a new one
                            return functions.removeDest(obj.dest + '.map', false).then(function() {
                                return false
                            })
                        } else {
                            return functions.readFile(obj.dest + '.map').then(function(data) {
                                return JSON.parse(data)
                            })
                        }
                    }

                })
            } // if
        } else {
            // no further chained promises should be called
            throw 'done'
        }

    }).then(function(existingSourceMap) {

        existingSourceMap = existingSourceMap || false

        var options = {
            'fromString': true
        }

        var outputFileName = path.basename(obj.dest)

        if (config.sourceMaps || config.fileType.js.sourceMaps) {
            options.outSourceMap = outputFileName + '.map'
            options.sourceRoot = config.sourceRoot
            if (existingSourceMap) {
                existingSourceMap.sourceRoot = '' // remove existing sourceRoot since it will confuse uglifyJs and cause it to generate duplicate source and sourceContent entries
                options.inSourceMap = existingSourceMap
            }
        }

        return js.minify(obj.data, options)

    }).then(function(js) {

        var origData = obj.data

        obj.data = js.code

        if (config.sourceMaps || config.fileType.js.sourceMaps) {
            return Promise.resolve().then(function() {

                return functions.makeDirPath(obj.dest)

            }).then(function() {

                var map = JSON.parse(js.map)

                if (map.sourceRoot !== config.sourceRoot) {
                    map.sourceRoot = config.sourceRoot
                }

                if (map.sources.length === 1 && map.sources[0] === '?') {
    				var mapSources = obj.source.replace(config.path.source, path.basename(config.path.source))
    				mapSources = mapSources.replace(config.path.dest, path.basename(config.path.dest))
    				if (shared.slash === '/') {
    				    map.sources = [mapSources]
    				} else {
    					// we are on windows
    					map.sources = [mapSources.replace(/\\/g, '/')]
    				}
                }

                if (typeof map.sourcesContent === 'undefined') {
                    map.sourcesContent = [origData]
                }

                return fsWriteFilePromise(obj.dest + '.map', JSON.stringify(map))

            }).then(function() {

                if (config.map.sourceToDestTasks.map.indexOf('gz') >= 0) {
                    // manually kick off a gz task for the new .map file
                    return build.gz({
                        'source': obj.dest + '.map',
                        'dest': obj.dest + '.map',
                        'data': '',
                        'build': true
                    })
                }

            })
        }

    }).then(function() {

        return obj

    })
} // js

build.markdown = function build_markdown(obj) {
    /*
    Markdown using https://www.npmjs.com/package/markdown-it.
    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */
    return functions.objBuildInMemory(obj).then(function(obj) {

        functions.logWorker('build.markdown', obj)

        if (obj.build) {
            if (typeof markdown !== 'object') {
                markdown = require('markdown-it')()
            }

            markdown.options = config.thirdParty.markdownIt

            obj.data = markdown.render(obj.data)

            return obj
        } else {
            // no further chained promises should be called
            throw 'done'
        }

    })
} // markdown

//----------------
// Build: On Disk
//----------------
// The following functions like working on disk based files.

build.copy = function build_copy(obj) {
    /*
    Copy source to destination.
    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */
    return functions.objBuildOnDisk(obj).then(function() {

        functions.logWorker('build.copy', obj)

        if (obj.build) {

            return new Promise(function(resolve, reject) {

                var sourceFile = fs.createReadStream(obj.source)
                sourceFile.on('error', reject)

                var destFile = fs.createWriteStream(obj.dest)
                destFile.on('error', reject)
                destFile.on('finish', resolve)

                sourceFile.pipe(destFile)

            }).then(function() {

                functions.logOutput(obj.dest, 'copy')

            })
        }

    }).then(function() {

        return obj

    })
} // copy

build.gif = function build_gif(obj) {
    /*
    Losslessly optimize GIF files using https://www.npmjs.com/package/gifsicle.
    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */
    return functions.objBuildOnDisk(obj).then(function(obj) {

        functions.logWorker('build.gif', obj)

        if (obj.build) {
            return execPromise('"' + gif + '" --output "' + obj.dest + '" --optimize=3 --no-extensions "' + obj.source + '"')
        } else {
            // no further chained promises should be called
            throw 'done'
        }

    }).then(function() {

        functions.logOutput(obj.dest)
        return obj

    })
} // gif

build.jpg = function build_jpg(obj) {
    /*
    Losslessly optimize JPG files using https://www.npmjs.com/package/jpegtran-bin.
    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */
    return functions.objBuildOnDisk(obj).then(function(obj) {

        functions.logWorker('build.jpg', obj)

        if (obj.build) {
            return execPromise('"' + jpg + '" -copy none -optimize -progressive -outfile "' +  obj.dest + '" "' + obj.source + '"')
        } else {
            // no further chained promises should be called
            throw 'done'
        }

    }).then(function() {

        functions.logOutput(obj.dest)
        return obj

    })
} // jpg

build.png = function build_png(obj) {
    /*
    Losslessly optimize PNG files using https://www.npmjs.com/package/optipng-bin.
    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */
    return functions.objBuildOnDisk(obj).then(function(obj) {

        functions.logWorker('build.png', obj)

        if (obj.build) {
            var cmd = '"' + png + '" -clobber -o2 -strip all -out "' + obj.dest + '" "' + obj.source + '"'
            return execPromise(cmd).then(function() {
                // get rid of the possible .bak file optipng makes when overwriting an existing dest file with a different source file
                return functions.removeDest(obj.dest + '.bak', false)
            })
        } else {
            // no further chained promises should be called
            throw 'done'
        }

    }).then(function() {

        functions.logOutput(obj.dest)
        return obj

    })
} // png

//----------------------
// Build: With Includes
//----------------------
// The following functions are for file types that may contain includes.

build.ejs = function build_ejs(obj) {
    /*
    Embedded JavaScript templates using https://www.npmjs.com/package/ejs.
    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */
    return functions.objBuildWithIncludes(obj, functions.includePathsEjs).then(function(obj) {

        functions.logWorker('build.ejs', obj)

        if (obj.build) {
            if (typeof ejs !== 'object') {
                ejs = require('ejs')
            }

            var options = {
                'filename': obj.source, // needed by EJS to figure out includes
                'root': config.fileType.ejs.root // variable exposed to EJS include statements
            }

            obj.data = ejs.render(obj.data, options)
        } else {
            // no further chained promises should be called
            throw 'done'
        }

        return obj

    })
} // ejs

build.jade = function build_jade(obj) {
    /*
    Jade using https://www.npmjs.com/package/jade.
    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */
    return functions.objBuildWithIncludes(obj, functions.includePathsJade).then(function(obj) {

        functions.logWorker('build.jade', obj)

        if (obj.build) {
            if (typeof jade !== 'object') {
                jade = require('jade')
            }

            obj.data = jade.render(obj.data, {
                filename: obj.source
            })
        } else {
            // no further chained promises should be called
            throw 'done'
        }

        return obj

    })
} // jade

build.less = function build_less(obj) {
    /*
    Less using https://www.npmjs.com/package/less.
    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */
    return functions.objBuildWithIncludes(obj, functions.includePathsLess).then(function(obj) {

        functions.logWorker('build.less', obj)

        if (obj.build) {
            if (typeof less !== 'object') {
                less = require('less')
            }

            return new Promise(function(resolve, reject) {
                var options = {
                    filename: path.basename(obj.source),
                    paths: [path.dirname(obj.source)],
                    compress: true
                }

                if (config.sourceMaps || config.fileType.less.sourceMaps) {
                    options.sourceMap = {
                        'sourceMapFullFilename': obj.source
                    }
                }

                less.render(obj.data, options,
                function(e, output) {
                    if (e) {
                        reject(e)
                    } else {

                        if (config.sourceMaps || config.fileType.less.sourceMaps) {

                            obj.data = output.css + '\n/*# sourceMappingURL=' + path.basename(obj.dest) + '.map */'

                            var map = JSON.parse(output.map)

                            map.file = path.basename(obj.dest)
                            map.sourceRoot = config.sourceRoot
                            map.sources[0] = obj.source

                            return functions.readFiles(map.sources).then(function(dataArray) {

                                map.sourcesContent = dataArray

                            }).then(function() {

                                var replaceString = path.dirname(config.path.source) + shared.slash
                                for (var i in map.sources) {
                                    map.sources[i] = map.sources[i].replace(replaceString, '').replace('\\', '/')
                                }
                                map = JSON.stringify(map)
                                return functions.makeDirPath(obj.dest)

                            }).then(function() {

                                return fsWriteFilePromise(obj.dest + '.map', map)

                            }).then(function() {

                                if (config.map.sourceToDestTasks.map.indexOf('gz') >= 0) {
                                    // manually kick off a gz task for the new .map file
                                    return build.gz({
                                        'source': obj.source,
                                        'dest': obj.dest + '.map',
                                        'data': '',
                                        'build': true
                                    })
                                }

                            }).then(function() {

                                resolve()

                            })

                        } else {
                            obj.data = output.css
                            resolve()
                        }
                    }
                })
            }) // promise
        } else {
            // no further chained promises should be called
            throw 'done'
        }

    }).then(function() {

        return obj

    })
} // less

build.sass = function build_sass(obj) {
    /*
    Sass using https://www.npmjs.com/package/node-sass.
    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */
    return functions.objBuildWithIncludes(obj, functions.includePathsSass).then(function(obj) {

        functions.logWorker('build.sass', obj)

        if (obj.build) {
            if (typeof sassPromise !== 'object') {
                sassPromise = promisify(require('node-sass').render)
            }

            var options = {
                file: obj.source,
                outputStyle: 'compressed' // without this, node-sass seems to mess up source maps
            }

            if (config.sourceMaps || config.fileType.sass.sourceMaps) {
                options.outFile = obj.dest
                options.sourceMap = obj.dest + '.map'
                options.sourceMapContents = true
                options.sourceMapRoot = config.sourceRoot
            }

            return sassPromise(options).then(function(data) {

                if (config.sourceMaps || config.fileType.sass.sourceMaps) {
                    data.css = data.css.toString().replace(/\n\n/g, '\n')

                    var map = JSON.parse(data.map.toString())

                    for (var i in map.sources) {
                        map.sources[i] = map.sources[i].replace(/\.\.\//g, '')
                    }

                    map = JSON.stringify(map)

                    return functions.makeDirPath(obj.dest).then(function() {

                        return fsWriteFilePromise(obj.dest + '.map', map)

                    }).then(function() {

                       if (config.map.sourceToDestTasks.map.indexOf('gz') >= 0) {
                            // manually kick off a gz task for the new .map file
                            return build.gz({
                                'source': obj.source,
                                'dest': obj.dest + '.map',
                                'data': '',
                                'build': true
                            }).then(function() {
                                return data.css
                            })
                        } else {
                            return data.css
                        }

                    })
                } else {
                    return data.css
                }

            }).then(function(css) {

                obj.data = css

            })

        } else {
            // no further chained promises should be called
            throw 'done'
        }

    }).then(function() {

        return obj

    })
} // sass

build.stylus = function build_stylus(obj) {
    /*
    Stylus using https://www.npmjs.com/package/stylus.
    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */
    return functions.objBuildWithIncludes(obj, functions.includePathsStylus).then(function(obj) {

        functions.logWorker('build.stylus', obj)

        if (obj.build) {
            if (typeof stylus !== 'object') {
                stylus = require('stylus')
            }

            return new Promise(function(resolve, reject) {

                var style = stylus(obj.data)
                    .set('compress', true)
                    .set('filename', obj.source)
                    .set('paths', [path.dirname(obj.source)])

                if (config.sourceMaps || config.fileType.stylus.sourceMaps) {
                    style.set('sourcemap', {
                        'sourceRoot': config.sourceRoot
                    })
                }

                style.render(function(err, css) {
                    if (err) {
                        functions.log(err)
                        reject(err)
                    } else {
                        if (config.sourceMaps || config.fileType.stylus.sourceMaps) {
                            var string = '/*# sourceMappingURL='
                            var pos = css.indexOf(string)

                            if (pos > 0) {
                                css = css.substr(0, pos) + '\n' + string + path.basename(obj.dest) + '.map */'
                            }

                            obj.data = css

                            var map = style.sourcemap

                            var sources = []
                            var basename = path.basename(config.path.source)

                            for (var i in map.sources) {
                                sources.push(map.sources[i].replace(basename, config.path.source))
                            }

                            return functions.readFiles(sources).then(function(dataArray) {

                                map.sourcesContent = dataArray

                                map = JSON.stringify(map)

                                return functions.makeDirPath(obj.dest)

                            }).then(function() {

                                return fsWriteFilePromise(obj.dest + '.map', map)

                            }).then(function() {

                               if (config.map.sourceToDestTasks.map.indexOf('gz') >= 0) {
                                    // manually kick off a gz task for the new .map file
                                    return build.gz({
                                        'source': obj.source,
                                        'dest': obj.dest + '.map',
                                        'data': '',
                                        'build': true
                                    }).then(function() {
                                        resolve()
                                    })
                                } else {
                                    resolve()
                                }

                            })
                        } else {
                            obj.data = css
                            resolve()
                        }
                    }
                }) // style.render
            })
        } else {
            // no further chained promises should be called
            throw 'done'
        }

    }).then(function() {

        return obj

    })
} // stylus

//------------------
// Build: Finishers
//------------------
// The following functions are typically called at the end of a build chain.
// Unlike most build functions, they don't bother to check if a source file is
// newer than a destination file since that should have been handled already.

build.finalize = function build_finalize(obj) {
    /*
    Finalize by writing memory to disk or copying source to dest, if needed.
    @param   {Object}   obj  Reusable object originally created by build.processOneBuild
    @return  {Promise}  obj  Promise that returns a reusable object.
    */
    return Promise.resolve().then(function() {
        functions.logWorker('build.finalize', obj)

        if (obj.data !== '') {
            // write obj.data to dest

            if (obj.dest === '') {
                obj.dest = functions.sourceToDest(obj.source)
            } else if (functions.inSource(obj.dest)) {
                // obj.dest points to a file in the source directory which could be dangerous
                throw 'build.finalize -> ' + shared.language.display('error.destPointsToSource')
            }

            return functions.makeDirPath(obj.dest).then(function() {

                return fsWriteFilePromise(obj.dest, obj.data)

            }).then(function() {

                obj.data = ''

                functions.logOutput(obj.dest)

                return obj

            })
        } else if (obj.dest === '') {
            // copy source to dest
            return build.copy(obj)
        } else {
            return obj
        }
    })
} // finalize

build.gz = function build_gz(obj) {
    /*
    Create a gzipped version of a file to live alongside the original.
    @param   {Object}          obj  Reusable object originally created by build.processOneBuild
    @return  {Promise,Object}  obj  Promise that returns a reusable object or just the reusable object.
    */
    if (obj.build) {
        return build.finalize(obj).then(function() { // build.finalize ensures our destination file is ready to be compressed

            functions.logWorker('build.gz', obj)

            if (shared.slash === '/') {
                return execPromise('gzip -9 -k -n -f "' + obj.dest + '"')
            } else {
                // we are on windows
                if (typeof gzipme !== 'object') {
                    gzipme = require('gzipme')
                }
                gzipme(obj.dest, false, 'best')
            }

        }).then(function() {

            return obj

        })
    } else {
        return obj
    }
} // gz

//---------
// Exports
//---------
module.exports = build
