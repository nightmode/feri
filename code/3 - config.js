'use strict'

//----------------
// Includes: Self
//----------------
const color  = require('./color.js')
const shared = require('./2 - shared.js')

//----------
// Includes
//----------
const path = require('path') // ~ 1 ms

//-----------
// Variables
//-----------
const config = {
    // null values will be populated later
    case: { // manually specify how file name cases are handled on the volume for a folder
        // for case sensitive volumes (linux by default), setting 'case' gets you the most speed as the OS can be trusted to match file names exactly
        // for case insensitive volumes (mac and windows by default), setting 'nocase' will get you some speed since feri will not have to write a test file to determine casing for that location
        source: '', // source folder, can be 'lower', 'upper', 'nocase', and 'case'
        dest: '' // destination folder, can be 'lower', 'upper', 'nocase', and 'case'
    },
    concurLimit: 1, // libuv has 4 slots by default so you may want to try setting concurLimit to 2 or 3 for faster clean and build calls
    // concurLimit has no effect on watching which only runs one clean or build task at a time
    extension: { // web browser extension support
        defaultDocument: 'index.html', // will be passed once to each extension client upon connection
        fileTypes: ['css', 'html', 'js'], // only inform extension clients about changes to these file types, file types should be lowercase only
        port: 4000 // websocket server port
    },
    fileType: null, // object that will hold options for individual file types
    includeFileTypes: [], // Used by watch.buildOne to know which file types may use includes.
    includePrefix: '_',   // Files prefixed with this string will not be published directly to the destination directory. Prefixed files can be included inside other files that do get published to destination though.
    glob: { // glob search strings like **/*.gif
        'clean': '', // If specified, use when running clean.processClean without the files parameter.
        'build': '', // If specified, use when running build.processBuild without the files parameter.
        'watch': {
            'source': '', // If specified, use when running watch.processWatch without the sourceFiles parameter.
            'dest'  : ''  // If specified, use when running watch.processWatch without the destFiles parameter.
        }
    },
    language: 'en-us', // should map to a json file in the language directory
    map: {
        'destToSourceExt'  : null, // object of destination file extensions and their possible source file types
        'sourceToDestTasks': null  // object of file extensions, each with an array of building functions
    },
    option: { // options which can be set programmatically or via the command line
        'build'              : true,
        'clean'              : true,
        'debug'              : false,
        'forcebuild'         : false,
        'init'               : false,
        'extensions'         : false,
        'republish'          : false,
        'stats'              : true,
        'watch'              : false
    },
    path: { // paths which can be set programmatically or via the command line
        'source': path.join(shared.path.pwd, 'source'),
        'dest'  : path.join(shared.path.pwd, 'dest')
    },
    playSound: true, // allow functions.playSound() to play sound
    sourceMaps: false,
    sourceRoot: '/source-maps', // The virtual folder all source maps will show up under when using developer tools in a web browser.
    thirdParty: null // object that will hold options for various third party packages
}

//-------------------
// File Type Options
//-------------------
config.fileType = {
    concat: {
        'enabled': true,
        'sourceMaps': false // used by build.concat
    },
    css: {
        'sourceMaps': false // used by build.css
    },
    js: {
        'sourceMaps': false // used by build.js
    }
}

//---------------------------------------------
// Destination Extensions to Source Extensions
//---------------------------------------------
config.map.destToSourceExt = {
    'br'  : ['*'],
    'gz'  : ['*'],
    'html': ['md'],
    'map' : ['*']
}

//--------------------------------------
// Source Extensions to Build Tasks Map
//--------------------------------------
config.map.sourceToDestTasks = {
    'concat': ['concat'],
    'css'   : ['css'],
    'gif'   : ['gif'],
    'htm'   : ['html'],
    'html'  : ['html'],
    'jpg'   : ['jpg'],
    'jpeg'  : ['jpg'],
    'js'    : ['js'],
    'md'    : ['markdown', 'html'],
    'png'   : ['png'],
    'svg'   : ['svg'],
    // copy only tasks
    '7z'    : ['copy'],
    'ai'    : ['copy'],
    'asp'   : ['copy'],
    'aspx'  : ['copy'],
    'br'    : ['copy'],
    'c'     : ['copy'],
    'cfm'   : ['copy'],
    'cfc'   : ['copy'],
    'csv'   : ['copy'],
    'doc'   : ['copy'],
    'docx'  : ['copy'],
    'eot'   : ['copy'],
    'eps'   : ['copy'],
    'exe'   : ['copy'],
    'flv'   : ['copy'],
    'gz'    : ['copy'],
    'h'     : ['copy'],
    'ico'   : ['copy'],
    'ini'   : ['copy'],
    'iso'   : ['copy'],
    'json'  : ['copy'],
    'm3u8'  : ['copy'],
    'm4a'   : ['copy'],
    'map'   : ['copy'],
    'mid'   : ['copy'],
    'midi'  : ['copy'],
    'mov'   : ['copy'],
    'mp3'   : ['copy'],
    'mp4'   : ['copy'],
    'mpd'   : ['copy'],
    'ogg'   : ['copy'],
    'otf'   : ['copy'],
    'pdf'   : ['copy'],
    'php'   : ['copy'],
    'pl'    : ['copy'],
    'ppt'   : ['copy'],
    'pptx'  : ['copy'],
    'psd'   : ['copy'],
    'py'    : ['copy'],
    'rb'    : ['copy'],
    'rss'   : ['copy'],
    'swf'   : ['copy'],
    'tar'   : ['copy'],
    'ttf'   : ['copy'],
    'txt'   : ['copy'],
    'vtt'   : ['copy'],
    'wav'   : ['copy'],
    'weba'  : ['copy'],
    'webm'  : ['copy'],
    'woff'  : ['copy'],
    'woff2' : ['copy'],
    'xls'   : ['copy'],
    'xlsx'  : ['copy'],
    'xml'   : ['copy'],
    'zip'   : ['copy']
}

//---------------------
// Third Party Options
//---------------------
config.thirdParty = {
    chokidar: { // used by watch.*
        // ignore dot objects except for .htaccess files and .nvm directories
        // ignore feri test files created by functions.detectCaseDest and functions.detectCaseSource
        // ignore newly created folders for Mac OS, Ubuntu, and Windows
        'ignored': [/[\/\\]\.(?!htaccess|nvm)/, /[\/\\]ab\.feri/i, '**/untitled folder', '**/Untitled Folder', '**/New folder'],
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
    markdownIt: { // used by build.markdown
        'breaks': false,
        'highlight': null,
        'html': false,
        'langPrefix': 'language-',
        'linkify': true,
        'maxNesting': 100,
        'quotes': '“”‘’',
        'typographer': false,
        'xhtmlOut': false
    },
    svgo: { // used by build.svg
        'full': true, // true means use the defined plugins only
        'js2svg': {
            pretty: false,
            indent: '    '
        },
        'multipass': true,
        'plugins': [
            // the array order is important so do not alpha sort
            // disable a plugin by passing false as the only value
            // enable a plugin by passing true as the only value
            // enable a plugin by passing an object to the plugin -> { removeDesc: { removeAny: true } }
            { 'removeDoctype': true },
            { 'removeXMLProcInst': true },
            { 'removeComments': true },
            { 'removeMetadata': true },
            { 'removeXMLNS': false },
            { 'removeEditorsNSData': true },
            { 'cleanupAttrs': true },
            { 'inlineStyles': true },
            { 'minifyStyles': true },
            { 'convertStyleToAttrs': true },
            { 'cleanupIDs': true },
            { 'prefixIds': false },
            { 'removeRasterImages': false },
            { 'removeUselessDefs': true },
            { 'cleanupNumericValues': true },
            { 'cleanupListOfValues': false },
            { 'convertColors': true },
            { 'removeUnknownsAndDefaults': true },
            { 'removeNonInheritableGroupAttrs': true },
            { 'removeUselessStrokeAndFill': true },
            { 'removeViewBox': true },
            { 'cleanupEnableBackground': true },
            { 'removeHiddenElems': true },
            { 'removeEmptyText': true },
            { 'convertShapeToPath': true },
            { 'convertEllipseToCircle': true },
            { 'moveElemsAttrsToGroup': true },
            { 'moveGroupAttrsToElems': true },
            { 'collapseGroups': true },
            { 'convertPathData': true },
            { 'convertTransform': true },
            { 'removeEmptyAttrs': true },
            { 'removeEmptyContainers': true },
            { 'mergePaths': true },
            { 'removeUnusedNS': true },
            { 'sortAttrs': false },
            { 'sortDefsChildren': true },
            { 'removeTitle': true },
            { 'removeDesc': true },
            { 'removeDimensions': false },
            { 'removeAttrs': false },
            { 'removeAttributesBySelector': false },
            { 'removeElementsByAttr': false },
            { 'removeStyleElement': false },
            { 'removeScriptElement': false },
            { 'removeOffCanvasPaths': false }
            /*
            The following plugins do not support passing false and must be passed options they like in order to use them.
            { 'addAttributesToSVGElement': ... }
            { 'addClassesToSVGElement': ... }
            { 'reusePaths': ... }
            */
        ]
    }
}

//---------
// Exports
//---------
module.exports = config