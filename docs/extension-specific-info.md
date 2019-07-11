# Feri - Extension Specific Information

* [Concatenate (CONCAT)](#concatenate-concat)
* [Brotli (BR)](#brotli-br)
* [Gzip (GZ)](#gzip-gz)

## Concatenate (CONCAT)

### Introduction and Example

Feri thinks you should be able to look through your source folder and with a bit of imagination, know exactly what your destination folder will look like. One of the ways Feri does this is by supporting a special file called CONCAT.

A concatenate file is simply a list of file path strings or globs that point to other files. For example, if you had a directory structure like:

```
/dest
/source
/source/one.js
/source/two.js
```

You might think, it sure would be nice to join both source JS files into one destination file for better performance. Assuming they are going to be joined, we would not want the individual JS files to be published to the destination folder. We can accomplish this by prefixing them with an underscore to mark them as [include](../README.md#include-files) files:

```
/dest
/source
/source/_one.js
/source/_two.js
```

Next, we can create a file called `all.js.concat` in our source folder. Inside this file will be a [glob](https://www.npmjs.com/package/glob) for all JS files in the current directory.

```
// all.js.concat
*.js
```

Our updated directory structure is now:

```
/dest
/source
/source/all.js.concat
/source/_one.js
/source/_two.js
```

The next time `feri` builds, she notices the `all.js.concat` file and using the glob inside it, combines the two JS files into one destination file. The destination file is simply the source file without the `.concat` extension so in our case, `all.js`.

Now our finished directory structure looks like:

```
/dest
/dest/all.js
/source
/source/all.js.concat
/source/_one.js
/source/_two.js
```

Not too hard and if we are working with other developers, they will see the CONCAT file and know what is going on. All without having to consult a build tool's configuration.

### Source Maps

Assuming an option like `config.sourceMaps` is enabled, CONCAT files will generate source maps for JS and CSS files like `all.js.concat` and `all.css.concat`.

### Twilight Zone

You could create a file called `all.js.concat` that includes your prized collection of [OS/2 Warp](https://en.wikipedia.org/wiki/OS/2) binaries but... why?! Surely there are better ways to generate error messages.

## Brotli (BR)

### Enabling Brotli

Feri comes ready to create BR compressed versions of files to live along side of their respective destination files. This is great if your web server can serve precompiled Brotli files to clients that support it. Less work for your web server and even better compression than Gzip.

To enable Brotli compressed versions of your destination files, add the following to your [custom config file](../README.md#custom-config-file).

```js
// add br build task for the following extensions
let types = ['css', 'html', 'js']
for (let i in types) {
    feri.config.map.sourceToDestTasks[types[i]].push('br')
}
```

The above code loops through the types array and adds a build task called 'br' to the end of the tasks list for each file extension.

Feel free to change the types array to whatever file extensions you like.

Note: Feri will only generate a file like `index.html.br` when `index.html` needs to be built. Running `feri --republish` or `feri --forcebuild` once after enabling Brotli will ensure the creation of all relevant files.

## Gzip (GZ)

### Enabling Gzip

Feri comes ready to create GZ compressed versions of files to live along side of their respective destination files. This is great if your web server can serve precompiled Gzip files to clients that support it. Less work for your web server and typically better compression too.

To enable Gzip compressed versions of your destination files, add the following to your [custom config file](../README.md#custom-config-file).

```js
// add gz build task for the following extensions
let types = ['css', 'html', 'js']
for (let i in types) {
    feri.config.map.sourceToDestTasks[types[i]].push('gz')
}
```

The above code loops through the types array and adds a build task called 'gz' to the end of the tasks list for each file extension.

Feel free to change the types array to whatever file extensions you like.

Note: Feri will only generate a file like `index.html.gz` when `index.html` needs to be built. Running `feri --republish` or `feri --forcebuild` once after enabling Gzip will ensure the creation of all relevant files.

## License

MIT © [Kai Nightmode](https://forestmist.org)