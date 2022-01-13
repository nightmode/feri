#!/usr/bin/env node

'use strict'

//-------------------
// Load Timer: Begin
//-------------------
const time = new Date().getTime()

//-----------------------
// Includes: Self Part 1
//-----------------------
const color  = require('./color.js')
const shared = require('./2 - shared.js')

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
} // catch

//----------
// Includes
//----------
const fs   = require('fs')   // ~ 1 ms
const path = require('path') // ~ 1 ms
const util = require('util') // ~ 1 ms

//---------------------
// Includes: Promisify
//---------------------
const fsStatPromise = util.promisify(fs.stat) // ~ 1 ms

//-------------------------
// Global or Local Install
//-------------------------
try {
    let pathToModules = path.join(shared.path.self, 'node_modules')
    shared.global = typeof(fs.statSync(pathToModules)) === 'object'
} catch(e) {
    shared.global = false
} // catch

//-----------------------
// Includes: Self Part 2
//-----------------------
const config    = require('./3 - config.js')
const functions = require('./4 - functions.js')
const clean     = require('./5 - clean.js')
const build     = require('./6 - build.js')
const watch     = require('./7 - watch.js')

//-----------
// Variables
//-----------
const feri = {
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
} // feri

//-----------
// Functions
//-----------
const commandLine = async function commandLine() {
    /*
    Command Line checks, options, and startup procedures.

    @return  {Promise}
    */

    let configFile = path.join(shared.path.pwd, 'feri.js')
    let configFileExists = false

    // enable console logging since we are running as a command line program
    shared.log = true

    try {
        // check for a feri.js file
        configFileExists = await fsStatPromise(configFile)
    } catch (error) {
        // check for a feri-config.js file
        try {
            configFile = path.join(shared.path.pwd, 'feri-config.js')
            configFileExists = await fsStatPromise(configFile)
        } catch (error) {
            // do nothing
        } // catch
    } // catch

    try {
        if (configFileExists) {
            try {
                require(configFile)(feri) // share our feri reference with this require
            } catch(e) {
                throw new Error('Loading ' + configFile + ' \n\n' + 'Make sure the file is a valid module like...\n\n' + 'module.exports = function(feri) { /* code */ }')
            } // catch
        } // if

        if (config.language !== 'en-us') {
            await functions.setLanguage()
        } // if

        //----------------------------------------------
        // Command Line Options: Source and Destination
        //----------------------------------------------
        (function() {
            let foundSource = false

            for (let i in commandLineOptions) {
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
                } // if
            } // for
        })()

        //----------------------
        // Command Line Options
        //----------------------
        if (inOptions(['--version', '-v'])) {
            shared.help = true
            //-------------------------------
            // Command Line Options: Version
            //-------------------------------
            let localVersion = require('../package.json').version

            console.log('\n' + color.cyan('Feri') + color.gray(' version ') + color.cyan(localVersion))

            let upgradeVersion = await functions.upgradeAvailable()

            if (upgradeVersion) {
                let message = ''

                message += '\n' + color.gray('    Upgrade to version ')
                message += color.cyan(upgradeVersion) + color.gray(' -> ')
                message += color.green('npm install -g feri') + '\n'

                console.log(message)
            } else {
                console.log()
            } // if
        } else if (inOptions(['--help', '-h'])) {
            shared.help = true
            //----------------------------
            // Command Line Options: Help
            //----------------------------
            console.log()
            console.log('Usage:')
            console.log()
            console.log('    ' + color.cyan('feri [options] [source] [destination]'))
            console.log()
            console.log('Options:')
            console.log()
            console.log('    -c, --clean          clean the destination directory')
            console.log('    -b, --build          build source files to destination')
            console.log('    -w, --watch          watch source to clean and build as needed')
            console.log('    -e, --extensions     monitor destination directory for extensions')
            console.log('    -s, --stats          display statistics')
            console.log()
            console.log('    -nc, --noclean       no clean')
            console.log('    -nb, --nobuild       no build')
            console.log('    -nw, --nowatch       no watch')
            console.log('    -ne, --noextensions  no extensions')
            console.log('    -ns, --nostats       no statistics')
            console.log()
            console.log('    -a, --all            clean, build, watch, extensions, stats')
            console.log('    -f, --forcebuild     overwrite destination files without consideration')
            console.log('    -r, --republish      remove all destination files and then build')
            console.log('    -i, --init           create source, destination, and custom config file')
            console.log('    -d, --debug          enable verbose console logging')
            console.log('    -v, --version        version')
            console.log('    -h, --help           help')
            console.log()
            console.log('    ' + color.gray('Negating options like "--noclean" are stronger than their counterparts.'))
            console.log('    ' + color.gray('For example, "feri --clean --noclean" would result in not cleaning.'))
            console.log()
            console.log('    ' + color.gray('Options "--all", "--forcebuild", and "--republish" are even stronger.'))
            console.log()
            console.log('    ' + color.gray('Want even more options? Try a custom config file.'))
            console.log('    ' + color.gray('https://github.com/nightmode/feri#custom-config-file'))
            console.log()
            console.log('Source:')
            console.log()
            console.log('    Optional source directory to build files from.')
            console.log('    ' + color.gray('Defaults to "./source"'))
            console.log()
            console.log('Destination:')
            console.log()
            console.log('    Optional destination directory to build files to.')
            console.log('    ' + color.gray('Defaults to "./dest"'))
            console.log()
            console.log('Examples:')
            console.log()
            console.log('    ' + color.gray('// clean, build, and stats are enabled by default'))
            console.log('    ' + color.cyan('feri'))
            console.log()
            console.log('    ' + color.gray('// clean, do not build, then watch'))
            console.log('    ' + color.cyan('feri --nobuild --watch'))
            console.log()
            console.log('    ' + color.gray('// republish from a specific source folder to a specific destination'))
            console.log('    ' + color.cyan('feri --republish /source /destination'))
            console.log()
        } else if (commandLineOptions.length > 0) {
            //-----------------------------
            // Command Line Options: Clean
            //-----------------------------
            if (inOptions(['--clean', '-c'])) {
                config.option.clean = true
            } // if

            if (inOptions(['--noclean', '-nc'])) {
                config.option.clean = false
            } // if

            //-----------------------------
            // Command Line Options: Build
            //-----------------------------
            if (inOptions(['--build', '-b'])) {
                config.option.build = true
            } // if

            if (inOptions(['--nobuild', '-nb'])) {
                config.option.build = false
            } // if

            //-----------------------------
            // Command Line Options: Watch
            //-----------------------------
            if (inOptions(['--extensions', '-e'])) {
                config.option.extensions = true
                config.option.watch = true // extensions on so better turn on watch too
            } // if

            if (inOptions(['--noextensions', '-ne'])) {
                config.option.extensions = false
            } // if

            if (inOptions(['--watch', '-w'])) {
                config.option.watch = true
            } // if

            if (inOptions(['--nowatch', '-nw'])) {
                config.option.watch = false
                config.option.extensions = false // no watch, no point in extensions
            } // if

            //-----------------------------
            // Command Line Options: Stats
            //-----------------------------
            if (inOptions(['--stats', '-s'])) {
                config.option.stats = true
            } // if

            if (inOptions(['--nostats', '-ns'])) {
                config.option.stats = false
            } // if

            //---------------------------
            // Command Line Options: All
            //---------------------------
            if (inOptions(['--all', '-a'])) {
                config.option.build = true
                config.option.clean = true
                config.option.watch = true
                config.option.stats = true
                config.option.extensions = true
            } // if

            //-----------------------------------
            // Command Line Options: Force Build
            //-----------------------------------
            if (inOptions(['--forcebuild', '-f'])) {
                // forcebuild is a stronger option than nobuild
                config.option.build = true
                config.option.forcebuild = true
            } // if

            //---------------------------------
            // Command Line Options: Republish
            //---------------------------------
            if (inOptions(['--republish', '-r'])) {
                // republish is a stronger option than noclean and nobuild
                config.option.republish = true
                config.option.clean = true
                config.option.build = true
            } // if

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

        //-----------------
        // Load Timer: End
        //-----------------
        shared.stats.timeTo.load = functions.sharedStatsTimeTo(time)

        if (!shared.help) {
            if (config.option.init) {
                await functions.initFeri()
            } else {
                if (configFileExists) {
                    functions.log(color.gray(shared.language.display('message.usingConfigFile').replace('{file}', '"' + path.basename(configFile) + '"')), false)
                } // if

                //-------
                // Clean
                //-------
                if (config.option.clean) {
                    await clean.processClean()
                } // if

                //-------
                // Build
                //-------
                if (config.option.build) {
                    await build.processBuild()
                } // if

                //-------
                // Watch
                //-------
                if (config.option.watch) {
                    shared.suppressWatchEvents = true // suppress watch events until the title "Watching" is displayed

                    await watch.processWatch()
                } // if

                //-------
                // Stats
                //-------
                if (!config.option.stats) {
                    functions.log('', false)
                } else {
                    functions.log(color.gray('\n' + shared.language.display('words.stats') + '\n'), false)

                    if (shared.stats.timeTo.load > 0) {
                        functions.log(color.gray(shared.language.display('paddedGroups.stats.load')) + ' ' + color.cyan(shared.stats.timeTo.load))
                    }

                    if (shared.stats.timeTo.clean > 0) {
                        functions.log(color.gray(shared.language.display('paddedGroups.stats.clean')) + ' ' + color.cyan(shared.stats.timeTo.clean))
                    }

                    if (shared.stats.timeTo.build > 0) {
                        functions.log(color.gray(shared.language.display('paddedGroups.stats.build')) + ' ' + color.cyan(shared.stats.timeTo.build))
                    }

                    if (shared.stats.timeTo.watch > 0) {
                        functions.log(color.gray(shared.language.display('paddedGroups.stats.watch')) + ' ' + color.cyan(shared.stats.timeTo.watch))
                    }

                    let totalTime = shared.stats.timeTo.load + shared.stats.timeTo.clean + shared.stats.timeTo.build + shared.stats.timeTo.watch

                    totalTime = functions.mathRoundPlaces(totalTime, 3)

                    functions.log('', false)
                    functions.log(color.gray(shared.language.display('paddedGroups.stats.total')) + ' ' + color.cyan(totalTime) + color.gray(' ' + shared.language.display('words.seconds') + '\n'))
                } // if

                //----------
                // Watching
                //----------
                if (config.option.watch) {
                    functions.log(color.gray(shared.language.display('words.watching')) + '\n', false)

                    shared.suppressWatchEvents = false
                }
            } // if (config.option.init)

        } // if (!shared.help)

    } catch(err) {
        let message = shared.language.display('error.halted')
        message = message.replace('{software}', 'Feri')
        message = message.replace('{version}', require('../package.json').version)

        const lastLine = (shared.platform === 'win32') ? '' : '\n'

        if (err.message === shared.language.display('error.missingSourceDirectory')) {
            // missing source directory
            functions.log('', false)
            functions.log(color.gray(message) + '\n', false)
            functions.log(color.red(err.message) + '\n', false)
            functions.log(color.gray(shared.language.display('message.missingSourceHelp')) + lastLine, false)
        } else if (err.code === 'EADDRINUSE') {
            // address already in use
            const errorMessage = shared.language.display('error.portInUse').replace('{port}', config.extension.port)

            functions.log('', false)
            functions.log(color.gray(message) + '\n', false)
            functions.log(color.red(errorMessage) + '\n', false)
            functions.log(color.gray(shared.language.display('message.portInUse')) + lastLine, false)

            // stop watching source, watching dest, and the extension server
            await watch.stop()
        } else {
            functions.log('\n' + color.gray(message), false)

            functions.logError(err)
        } // if

        // play an error sound before exiting
        await functions.playSound('error.wav')

        // exit with a failure code of 1
        process.exit(1)
    } // catch
} // commandLine

const inOptions = function inOptions(search) {
    /*
    Find out if the options variable has any occurence of what we are searching for.

    @param  {Object}  search  Array of strings like ['--clean', '-c']
    */

    for (let i in search) {
        if (commandLineOptions.indexOf(search[i]) >= 0) {
            return true
        }
    } // for

    return false
} // inOptions

//-------------------------
// Command Line or Require
//-------------------------
let commandLineOptions = process.argv.slice(2)

if (shared.cli) {
    //--------------
    // Command Line
    //--------------
    (async function() {
        await commandLine()
    })()

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
} // if

//---------
// Exports
//---------
module.exports = feri