# Feri - Custom Config File

If you are using the command line, Feri will look for a file called `feri.js` or `feri-config.js` in the directory you call her from. This file can specify not only which command line options you want enabled, but also [config](api/config.md#feri---config) settings.

For example, Feri will clean and build by default but what if you want her to always watch too? You could type `feri --watch` every time you want to work on your project or setup a custom config like the one below.

```js
module.exports = function(feri) {
    // clean and build are enabled by default
    feri.config.option.watch = true
}
```

Now you can type `feri` and the custom config file will take of the rest. Even better, command line switches still take precedence. That means typing `feri --nowatch` will temporarily override the config file setting.

Custom config files can be created manually like in the example above but for an even better template, run `feri --init` to have a custom config file created for you.

Protip: Not just the [config](api/config.md#feri---config) but indeed all [API](docs/advanced/api/index.md#feri---api) features are available inside custom config files.

## License

MIT © [Kai Nightmode](https://nightmode.fm/)

The MIT license does NOT apply to the name `Feri` or any of the images in this repository. Those items are strictly copyrighted to Kai Nightmode.