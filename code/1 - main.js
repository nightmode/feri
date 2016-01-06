#!/usr/bin/env node

'use strict'

//-------------------
// Load Timer: Begin
//-------------------
var time = new Date().getTime()

//-----------------------
// Includes: Self Part 1
//-----------------------
var shared = require('./2 - shared.js')

//-------------------------
// Command Line or Require
//-------------------------
try {
    if (require.main.filename === __filename) {
        // we are running on the command line
        shared.cli = true
    }
} catch(e) {
    // do nothing
}

//-----------------------
// Includes: Self Part 2
//-----------------------
var config    = require('./3 - config.js')
var functions = require('./4 - functions.js')
var clean     = require('./5 - clean.js')
var build     = require('./6 - build.js')
var watch     = require('./7 - watch.js')

//----------
// Includes
//----------
var chalk = require('chalk') // ~ 20 ms
var path  = require('path')  // ~  1 ms

//-----------
// Variables
//-----------
var feri = {
    'action': {
        'clean': clean.processClean,
        'build': build.processBuild,
        'watch': watch.processWatch,
    },
    'shared'   : shared,
    'config'   : config,
    'functions': functions,
    'clean'    : clean,
    'build'    : build,
    'watch'    : watch
}

//-----------
// Functions
//-----------
var inOptions = function inOptions(search) {
    /*
    Find out if the options variable has any occurence of what we are searching for.
    @param  {Object}  search  Array of strings like ['--clean', '-c']
    */
    for (var i in search) {
        if (commandLineOptions.indexOf(search[i]) >= 0) {
            return true
        }
    }
    
    return false
} // inOptions

//-------------------------
// Command Line or Require
//-------------------------
if (shared.cli) {
    //--------------
    // Command Line
    //--------------
    var commandLineOptions = process.argv.slice(2)
    var configFile = path.join(shared.path.pwd, 'feri-config.js')
    var configFileExists = false

    // enable console logging since we are running as a command line program
    shared.log = true

    return Promise.resolve().then(function() {

        // check for an feri-config.js config file
        return functions.fileExists(configFile).then(function(exists) {
            configFileExists = exists
        })

    }).then(function() {

        if (configFileExists) {
            try {
                require(configFile)(feri) // share our feri reference with this require
            } catch(e) {
                throw 'Loading ' + configFile + ' \n\n' + 'Make sure the file is a valid module like...\n\n' + 'module.exports = function(feri) { /* code */ }'
            }
        }

        if (config.language !== 'en-us') {
            return functions.setLanguage()
        }

    }).then(function() {

        //----------------------------------------------
        // Command Line Options: Source and Destination
        //----------------------------------------------
        (function() {
            var foundSource = false

            for (var i in commandLineOptions) {
                if (commandLineOptions[i].charAt(0) !== '-') {
                    // found a path
                    if (foundSource === false) {
                        foundSource = true
                        config.path.source = functions.figureOutPath(commandLineOptions[i])
                    } else {
                        config.path.dest = functions.figureOutPath(commandLineOptions[i])
                    }
                } else {
                    // lower case this option
                    commandLineOptions[i] = commandLineOptions[i].toLowerCase()
                }
            }
        })()

        //----------------------
        // Command Line Options
        //----------------------
        if (inOptions(['--version', '-v'])) {
            shared.help = true
            //-------------------------------
            // Command Line Options: Version
            //-------------------------------
            console.log('\n' + chalk.cyan('feri') + chalk.gray(' version ') + chalk.green(require('../package.json').version) + '\n')

        } else if (inOptions(['--help', '-h'])) {
            shared.help = true
            //----------------------------
            // Command Line Options: Help
            //----------------------------
            console.log()
            console.log('Usage:')
            console.log()
            console.log('    ' + chalk.cyan('feri [options] [source] [destination]'))
            console.log()
            console.log('Options:')
            console.log()
            console.log('    -c, --clean          clean the destination directory')
            console.log('    -b, --build          build source files to destination')
            console.log('    -w, --watch          watch source to clean and build as needed')
            console.log('    -l, --livereload     monitor destination directory for livereload')
            console.log('    -s, --stats          display statistics')
            console.log()
            console.log('    -nc, --noclean       no clean')
            console.log('    -nb, --nobuild       no build')
            console.log('    -nw, --nowatch       no watch')
            console.log('    -nl, --nolivereload  no livereload')
            console.log('    -ns, --nostats       no statistics')
            console.log()
            console.log('    -a, --all            clean, build, watch, livereload, stats')
            console.log('    -f, --forcebuild     overwrite destination files without consideration')
            console.log('    -r, --republish      remove all destination files and then build')
            console.log('    -i, --init           create source, destination, and feri-config.js')
            console.log('    -d, --debug          enable verbose console logging')
            console.log('    -v, --version        version')
            console.log('    -h, --help           help')
            console.log()
            console.log('    ' + chalk.gray('Negating options like "--noclean" are stronger than their counterparts.'))
            console.log('    ' + chalk.gray('For example, "feri --clean --noclean" would result in not cleaning.'))
            console.log()
            console.log('    ' + chalk.gray('Options "--all", "--forcebuild", and "--republish" are even stronger.'))
            console.log()
            console.log('    ' + chalk.gray('Want even more options? Try a custom config file.'))
            console.log('    ' + chalk.gray('https://github.com/ForestMist/feri#custom-config-file'))
            console.log()
            console.log('Source:')
            console.log()
            console.log('    Optional source directory to build files from.')
            console.log('    ' + chalk.gray('Defaults to "./source"'))
            console.log()
            console.log('Destination:')
            console.log()
            console.log('    Optional destination directory to build files to.')
            console.log('    ' + chalk.gray('Defaults to "./dest"'))
            console.log()
            console.log('Examples:')
            console.log()
            console.log('    ' + chalk.gray('// clean, build, and stats are enabled by default'))
            console.log('    ' + chalk.cyan('feri'))
            console.log()
            console.log('    ' + chalk.gray('// clean, do not build, then watch'))
            console.log('    ' + chalk.cyan('feri --nobuild --watch'))
            console.log()
            console.log('    ' + chalk.gray('// republish from a specific source folder to a specific destination'))
            console.log('    ' + chalk.cyan('feri --republish /source /destination'))
            console.log()

        } else if (commandLineOptions.length > 0) {
            //-----------------------------
            // Command Line Options: Clean
            //-----------------------------
            if (inOptions(['--clean', '-c'])) {
                config.option.clean = true
            }

            if (inOptions(['--noclean', '-nc'])) {
                config.option.clean = false
            }

            //-----------------------------
            // Command Line Options: Build
            //-----------------------------
            if (inOptions(['--build', '-b'])) {
                config.option.build = true
            }

            if (inOptions(['--nobuild', '-nb'])) {
                config.option.build = false
            }

            //-----------------------------
            // Command Line Options: Watch
            //-----------------------------
            if (inOptions(['--livereload', '-l'])) {
                config.option.livereload = true
                config.option.watch = true // livereload on so better turn on watch too
            }

            if (inOptions(['--nolivereload', '-nl'])) {
                config.option.livereload = false
            }

            if (inOptions(['--watch', '-w'])) {
                config.option.watch = true
            }

            if (inOptions(['--nowatch', '-nw'])) {
                config.option.watch = false
                config.option.livereload = false // no watch, no point in livereload
            }

            //-----------------------------
            // Command Line Options: Stats
            //-----------------------------
            if (inOptions(['--stats', '-s'])) {
                config.option.stats = true
            }

            if (inOptions(['--nostats', '-ns'])) {
                config.option.stats = false
            }

            //---------------------------
            // Command Line Options: All
            //---------------------------
            if (inOptions(['--all', '-a'])) {
                config.option.build = true
                config.option.clean = true
                config.option.watch = true
                config.option.stats = true
                config.option.livereload = true
            }

            //-----------------------------------
            // Command Line Options: Force Build
            //-----------------------------------
            if (inOptions(['--forcebuild', '-f'])) {
                // forcebuild is a stronger option than nobuild
                config.option.build = true
                config.option.forcebuild = true
            }

            //---------------------------------
            // Command Line Options: Republish
            //---------------------------------
            if (inOptions(['--republish', '-r'])) {
                // republish is a stronger option than noclean and nobuild
                config.option.republish = true
                config.option.clean = true
                config.option.build = true
            }

            //----------------------------
            // Command Line Options: Misc
            //----------------------------
            if (inOptions(['--debug', '-d'])) {
                config.option.debug = true
            }
            
            if (inOptions(['--init', '-i'])) {
                config.option.init = true
            }
        } // if

    }).then(function() {
        //-----------------
        // Load Timer: End
        //-----------------
        shared.stats.timeTo.load = functions.sharedStatsTimeTo(time)

        if (!shared.help) {
            
            if (config.option.init) {
                
                return functions.initFeri()
                
            } else {
                
                if (configFileExists) {
                    functions.log(chalk.gray(shared.language.display('message.usingConfigFile').replace('{file}', '"feri-config.js"')), false)
                }
    
                var p = Promise.resolve()
    
                p = p.then(function() {
    
                    //-------
                    // Clean
                    //-------
                    if (config.option.clean) {
                        return clean.processClean()
                    }
    
                }).then(function() {
    
                    //-------
                    // Build
                    //-------
                    if (config.option.build) {
                        return build.processBuild()
                    }
    
                }).then(function() {
    
                    //-------
                    // Watch
                    //-------
                    if (config.option.watch) {
                        shared.suppressWatchEvents = true // suppress watch events until the title "Watching" is displayed
    
                        return watch.processWatch()
                    }
    
                }).then(function() {
    
                    //-------
                    // Stats
                    //-------
                    if (!config.option.stats) {
                        functions.log('', false)
                    } else {
                        functions.log(chalk.gray('\n' + shared.language.display('words.stats') + '\n'), false)
    
                        if (shared.stats.timeTo.load > 0) {
                            functions.log(chalk.gray(shared.language.display('paddedGroups.stats.load')) + ' ' + chalk.cyan(shared.stats.timeTo.load))
                        }
    
                        if (shared.stats.timeTo.clean > 0) {
                            functions.log(chalk.gray(shared.language.display('paddedGroups.stats.clean')) + ' ' + chalk.cyan(shared.stats.timeTo.clean))
                        }
    
                        if (shared.stats.timeTo.build > 0) {
                            functions.log(chalk.gray(shared.language.display('paddedGroups.stats.build')) + ' ' + chalk.cyan(shared.stats.timeTo.build))
                        }
    
                        if (shared.stats.timeTo.watch > 0) {
                            functions.log(chalk.gray(shared.language.display('paddedGroups.stats.watch')) + ' ' + chalk.cyan(shared.stats.timeTo.watch))
                        }
    
                        var totalTime = shared.stats.timeTo.load + shared.stats.timeTo.clean + shared.stats.timeTo.build + shared.stats.timeTo.watch
    
                        totalTime = functions.mathRoundPlaces(totalTime, 3)
    
                        functions.log('', false)
                        functions.log(chalk.gray(shared.language.display('paddedGroups.stats.total')) + ' ' + chalk.cyan(totalTime) + chalk.gray(' ' + shared.language.display('words.seconds') + '\n'))
                    }
    
                }).then(function() {
    
                    //----------
                    // Watching
                    //----------
                    if (config.option.watch) {
                        functions.log(chalk.gray(shared.language.display('words.watching')) + '\n', false)
    
                        shared.suppressWatchEvents = false
                    }
    
                })
    
                return p
            
            } // if (config.option.init)
            
        } // if (!shared.help)
        
    }).catch(function(err) {

        functions.logError(err)

        var message = shared.language.display('error.halted') + '\n'
        message = message.replace('{software}', chalk.cyan('feri'))
        message = message.replace('{version}', chalk.green(require('../package.json').version))

        functions.log(chalk.gray(message), false)
        throw err

    })
} else {
    //---------
    // Require
    //---------

    // set sensible defaults for programatic consumers
    config.option.clean = true
    config.option.build = true
    config.option.watch = true

    //-----------------
    // Load Timer: End
    //-----------------
    shared.stats.timeTo.load = functions.sharedStatsTimeTo(time)
}

//---------
// Exports
//---------
module.exports = feri
