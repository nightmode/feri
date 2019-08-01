# Feri - Unique File Types

* [Concatenate (CONCAT)](#concatenate-concat)
* [Brotli (BR)](#brotli-br)
* [Gzip (GZ)](#gzip-gz)

## Concatenate (CONCAT)

### Introduction and Example

Feri thinks you should be able to look through your source folder and with a bit of imagination, know exactly what your destination folder will look like. One of the ways Feri does this is by supporting concatenate files that use `.concat` as their file extension.

A concatenate file is a list of file path strings and/or globs that point to other files. For example, if you had a directory structure like:

```
/dest
/source
/source/one.js
/source/two.js
```

You might want to join both source JS files into one destination file for better performance. Assuming the contents of both files are going to be joined, we would not want the individual files to also be published to the destination folder. We can accomplish this by prefixing both JS files with an underscore to mark them as [include](../../README.md#include-files) files:

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

The next time Feri builds, she notices the `all.js.concat` file and using the glob inside it, combines the two JS files into one destination file. The destination file name is the source file name without the `.concat` extension. So in our case, the destination file would be named `all.js`.

Now our finished directory structure looks like:

```
/dest
/dest/all.js
/source
/source/all.js.concat
/source/_one.js
/source/_two.js
```

Not too hard to setup and if we are working with other developers, they will see the CONCAT file and understand what that means when source folder changes are published to the destination folder.

At this point you might be wondering if you can nest `.concat` files and if so, please read [concatenate responsibly](edge-cases.md#concatenate-responsibly) first.

### Source Maps

Assuming an option like `config.sourceMaps` is enabled, CONCAT files will generate source maps for JS and CSS files like `fileName.js.concat` and `fileName.css.concat`.

## Brotli (BR)

### Enabling Brotli

Feri comes ready to create BR compressed versions of files to live alongside their respective destination files. This is great if your web server can serve precompiled Brotli files to clients that support it. Less bandwidth required for your web server and better compression than Gzip.

To enable Brotli compressed versions of your destination files, add the following to your [custom config file](custom-config-file.md#feri---custom-config-file).

```js
// add br build task for the following extensions
let types = ['css', 'html', 'js']
for (let i in types) {
    feri.config.map.sourceToDestTasks[types[i]].push('br')
}
```

The above code loops through the types array and adds a build task called 'br' to the end of the tasks list for each file extension.

Feel free to change the types array to whatever file extensions you like.

Note: Feri will only generate a file like `index.html.br` when `index.html` needs to be built. Running `feri --republish` or `feri --forcebuild` once after enabling Brotli will ensure the creation of any needed files.

## Gzip (GZ)

### Enabling Gzip

Feri comes ready to create GZ compressed versions of files to live alongside their respective destination files. This is great if your web server can serve precompiled Gzip files to clients that support it. Less bandwidth required for your web server and better than on the fly compression.

To enable Gzip compressed versions of your destination files, add the following to your [custom config file](custom-config-file.md#feri---custom-config-file).

```js
// add gz build task for the following extensions
let types = ['css', 'html', 'js']
for (let i in types) {
    feri.config.map.sourceToDestTasks[types[i]].push('gz')
}
```

The above code loops through the types array and adds a build task called 'gz' to the end of the tasks list for each file extension.

Feel free to change the types array to whatever file extensions you like.

Note: Feri will only generate a file like `index.html.gz` when `index.html` needs to be built. Running `feri --republish` or `feri --forcebuild` once after enabling Gzip will ensure the creation of any needed files.

## License

MIT © [Kai Nightmode](https://twitter.com/kai_nightmode)