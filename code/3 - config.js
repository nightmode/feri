'use strict'

//----------------
// Includes: Self
//----------------
var shared = require('./2 - shared.js')

//----------
// Includes
//----------
var chalk = require('chalk') // ~ 20 ms
var path  = require('path')  // ~ 1 ms

//-----------
// Variables
//-----------
var config = {
    // null values will be populated later
    concurLimit: 1, // 1-3 recommended since node libuv has 4 slots by default
    fileType: null, // object that will hold options for individual file types
    includeFileTypes: ['ejs', 'jade', 'less', 'sass', 'scss', 'styl'], // used by watch.buildOne to trigger a check of every file that could possibly use an include file type. For example, if _header.ejs changes, check every ejs file in case any of them need to be updated.
    includePrefix: '_',   // files prefixed with this string will not be published directly to the destination, their contents can be included inside other files that do though
    glob: { // glob search strings like **/*.gif
        'clean': '', // if specified, use when running clean.processClean() without the files parameter
        'build': '', // if specified, use when running build.processBuild() without the files parameter
    },
    language: 'en-us', // should map to a json file in the language directory
    livereloadFileTypes: ['css', 'html', 'js'], // only refresh the livereload client if one of these file types has been changed
    log: false,
    map: {
        'sourceToDestTasks': null, // object of file extensions, each with an array of building functions
        'destToSourceExt'  : null  // object of destination file extensions and their possible source file types
    },
    option: { // options which can be set programatically or via the command line
        'build'              : true,
        'clean'              : true,
        'debug'              : false,
        'forcebuild'         : false,
        'livereload'         : false,
        'republish'          : false,
        'stats'              : true,
        'watch'              : false
    },
    path: {
        'source': path.join(shared.path.pwd, 'source'),
        'dest'  : path.join(shared.path.pwd, 'dest')
    },
    sourceMaps: false,
    sourceRoot: '/source-maps', // the virtual folder all source maps will show up under when inspecting in a browser
    thirdParty: null // object that will hold options for various third party packages
}

//-------------------
// File Type Options
//-------------------
config.fileType = {
    coffeeScript: {
        'sourceMaps': false // used by build.coffeeScript
    },
    css: {
        'sourceMaps': false // used by build.css
    },
    ejs: {
        'root': '' // will be passed to the EJS rendering engine to figure out include file paths like <% include root + '/partials/_header.ejs' %>
    },
    js: {
        'sourceMaps': false // used by build.js
    },
    less: {
        'sourceMaps': false // used by build.less
    },
    sass: {
        'sourceMaps': false // used by build.sass
    },
    stylus: {
        'sourceMaps': false // used by build.stylus
    }
}

//--------------------------------------
// Source Extensions to Build Tasks Map
//--------------------------------------
config.map.sourceToDestTasks = {
    'coffee': ['coffeeScript', 'js'],
    'css'   : ['css'],
    'ejs'   : ['ejs', 'html'],
    'gif'   : ['gif'],
    'html'  : ['html'],
    'jade'  : ['jade', 'html'],
    'jpg'   : ['jpg'],
    'js'    : ['js'],
    'less'  : ['less'],
    'md'    : ['markdown', 'html'],
    'png'   : ['png'],
    'sass'  : ['sass'],
    'scss'  : ['sass'],
    'styl'  : ['stylus'],
    // copy only tasks
    'ai'    : ['copy'],
    'eot'   : ['copy'],
    'gz'    : ['copy'],
    'ico'   : ['copy'],
    'iso'   : ['copy'],
    'json'  : ['copy'],
    'm4a'   : ['copy'],
    'map'   : ['copy'],
    'mp3'   : ['copy'],
    'mp4'   : ['copy'],
    'ogg'   : ['copy'],
    'otf'   : ['copy'],
    'psd'   : ['copy'],
    'svg'   : ['copy'],
    'ttf'   : ['copy'],
    'txt'   : ['copy'],
    'vtt'   : ['copy'],
    'wav'   : ['copy'],
    'weba'  : ['copy'],
    'webm'  : ['copy'],
    'woff'  : ['copy'],
    'xml'   : ['copy'],
    'zip'   : ['copy']
}

//---------------------------------------------
// Destination Extensions to Source Extensions
//---------------------------------------------
config.map.destToSourceExt = {
    'css' : ['less', 'sass', 'scss', 'styl'],
    'gz'  : ['*'],
    'html': ['ejs', 'jade', 'md'],
    'js'  : ['coffee'],
    'map' : ['*']
}

//---------------------
// Third Party Options
//---------------------
config.thirdParty = {
    chokidar: { // used by watch.*
        'ignored'       : [/\/\.(?!htaccess)/, '**/untitled folder', '**/Untitled Folder', '**/New folder'], // ignore dot objects (except for .htaccess files) and newly created folders for Mac OS, Ubuntu, and Windows
        'ignoreInitial' : true,
        'followSymlinks': false
    },
    cleanCss: { // used by build.css
        'advanced'           : false,
        'aggressiveMerging'  : false,
        'keepSpecialComments': 0,
        'mediaMerging'       : false,
        'processImport'      : false,
        'rebase'             : false,
        'roundingPrecision'  : -1,
        'shorthandCompacting': false
    },
    htmlMinifier: { // used by build.html
        'removeComments'           : true,
        'collapseWhitespace'       : true,
        'collapseBooleanAttributes': true,
        'removeAttributeQuotes'    : true,
        'removeRedundantAttributes': true,
        'removeEmptyAttributes'    : true,
        'minifyJS': {
            'mangle': false
        },
        'minifyCSS': {
            'advanced'           : false,
            'aggressiveMerging'  : false,
            'keepSpecialComments': 0,
            'mediaMerging'       : false,
            'processImport'      : false,
            'restructuring'      : false,
            'shorthandCompacting': false
        },
        'minifyURLs': {
            'output'            : 'rootRelative',
            'removeEmptyQueries': true
        }
    },
    livereload: { // used by watch.*
        'port': 35729
    },
    markdownIt: { // used by build.markdown
        'linkify': true
    }
}

//---------
// Exports
//---------
module.exports = config
