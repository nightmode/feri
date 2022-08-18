module.exports = function(feri) {
    //---------
    // Aliases
    //---------
    const { build, clean, config, functions, shared, watch } = feri

    //----------
    // Language
    //----------
    // config.language = 'de-ch' // German (Switzerland)
    // config.language = 'de-de' // German (Germany)
    // config.language = 'en-us' // English (US)
    // config.language = 'fr-fr' // French (France)
    // config.language = 'it-ch' // Italian (Switzerland)
    // config.language = 'it-it' // Italian (Italy)
    // config.language = 'pt-br' // Portuguese (Brazil)
    // config.language = 'sv-se' // Swedish (Sweden)

    //-----------------------------------------
    // Create Brotli and Gzip Compressed Files
    //-----------------------------------------
    // for (const type of ['css', 'html', 'js', 'svg']) {
    //     config.map.sourceToDestTasks[type].push('br', 'gz')
    // }

    //---------
    // Options
    //---------
    // config.option.clean      = true
    // config.option.build      = true
    // config.option.watch      = true
    // config.option.extensions = true

    //-------
    // Paths
    //-------
    // config.path.source = 'source'
    // config.path.dest   = 'dest'

    // Looking for even more options?
    // https://github.com/nightmode/feri/blob/main/docs/advanced/api/config.md
}