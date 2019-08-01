# Feri - Feri Extension

Reload a web browser tab when files change with the [Feri Extension](https://github.com/nightmode/feri-extension#feri-extension) for Chrome and Firefox.

## Extension Server

Use the command line option `--extensions` or set `feri.config.option.extensions` to `true` to run an extension server.

You can also customize the `feri.config.extension` object to change the server port, default document, and files types involved.

```
extension: { // web browser extension support
    defaultDocument: 'index.html', // will be passed once to each extension client upon connection
    fileTypes: ['css', 'html', 'js'], // only inform extension clients about changes to these file types
    port: 4000 // websocket server port
}
```

## Extension Client

Visit the [Feri Extension](https://github.com/nightmode/feri-extension#feri-extension) project for an overview, install information, usage guide, and more.

## License

MIT © [Kai Nightmode](https://twitter.com/kai_nightmode)