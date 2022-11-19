# Feri - Unique File Types

* [Brotli (BR)](#brotli-br)
* [Concatenate (CONCAT)](#concatenate-concat)
* [Gzip (GZ)](#gzip-gz)
* [JavaScript Server-Side (JSS)](#javascript-server-side-jss)

## Brotli (BR)

### Enabling Brotli

Feri comes ready to create BR compressed versions of files to live alongside their respective destination files. This is great if your web server can serve precompiled Brotli files to clients that support it. Less bandwidth required for your web server and better compression than Gzip.

To enable Brotli compressed versions of your destination files, add the following to your [custom config file](custom-config-file.md#feri---custom-config-file).

```js
// add br build tasks for the following extensions
const types = ['css', 'html', 'js', 'svg']
for (const type of types) {
    feri.config.map.sourceToDestTasks[type].push('br')
}
```

The above code loops through the types array and adds a build task called 'br' to the end of the tasks list for each file extension.

Feel free to change the types array to whatever file extensions you like.

Note: Feri will only generate a file like `index.html.br` when `index.html` needs to be built. Running `feri --republish` or `feri --forcebuild` once after enabling Brotli will ensure the creation of any needed files.

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

## Gzip (GZ)

### Enabling Gzip

Feri comes ready to create GZ compressed versions of files to live alongside their respective destination files. This is great if your web server can serve precompiled Gzip files to clients that support it. Less bandwidth required for your web server and better than on the fly compression.

To enable Gzip compressed versions of your destination files, add the following to your [custom config file](custom-config-file.md#feri---custom-config-file).

```js
// add gz build tasks for the following extensions
const types = ['css', 'html', 'js', 'svg']
for (const type of types) {
    feri.config.map.sourceToDestTasks[type].push('gz')
}
```

The above code loops through the types array and adds a build task called 'gz' to the end of the tasks list for each file extension.

Feel free to change the types array to whatever file extensions you like.

Note: Feri will only generate a file like `index.html.gz` when `index.html` needs to be built. Running `feri --republish` or `feri --forcebuild` once after enabling Gzip will ensure the creation of any needed files.

## JavaScript Server-Side (JSS)

### Warning

JavaScript Server-Side files should be considered experimental. That being said, the author has been using them extensively in production.

### Introduction and Overview

JavaScript Server-Side files allow you to use JavaScript to pre-process any text based file format. Want to use variables inside a CSS file? Want to use includes to build HTML pages? Want to leverage Node.js to do something impressive before your file continues its build journey? Well then, read on!

Any file can be a JSS file as long as it has a special double extension. For example, a text file called `neat.txt` could be enhanced with JavaScript pre-processing by adding the extension `.jss`. The resulting file would then be called `neat.txt.jss` and when it needs to be built, Feri will run the file through a JSS build task and then any normal build tasks.

Using the double extension technique, you could upgrade any normal `index.html`, `style.css`, or `script.js` file to a much more capable `index.html.jss`, `style.css.jss`, or `script.js.jss` file. Each of these files would then be ready to host any number of `<js>` and `</js>` encompassing tags to run custom JavaScript, write output, use includes, or even leverage Node.js libraries.

Although a `.jss` file without any tags is valid, the magic happens once you start adding matching `<js>` and `</js>` tags to your file. Learn the technique on one file format and then take that knowledge to nearly any file format!

### Writing Output

JSS files support writing output via a `write()` function.

```js
// write a string
write('Hello')

// write something that evaluates to a string
write('I ate ' +  Math.floor(Math.random() * 100) + ' oreos today.')
```

Reminder: JSS code must live inside JS blocks like `<js>write('Hello')</js>` within a `.jss` file.

### Includes

JSS files support the use of includes via an `include()` function. Included files can be relative or absolute.

```js
// relative path
include('relative.txt')

// absolute path with the root being the root of your source folder
include('/includes/absolute.txt')
```

Includes can be nested as long as each include file has a `.jss` extension. Then each include will have the power to include other includes, and so on.

Included `.jss` files also have the ability to receive arguments. For example, a main file could pass an object and a boolean to an include file.

```js
// example main file

const complex_object = {
    // so complex!
}

const simple_boolean = true

include('include.file.jss', complex_object, simple_boolean)
```

The included file could then access the object and boolean with the `args` array.

```js
// example include file

const complex_object = args[0]
const simple_boolean = args[1]
```

### Leveraging Node.js

In addition to using JavaScript along with the `write()` and `include()` functions, what if you could use Node.js libraries too? What if it were as simple as:

```js
// example on how to require node libraries
const fs = require('fs')
const crypto = require('crypto')
```

Because spoiler alert, it's that simple!

Plus, any require already in use by Feri or a dependency means free performance. In our example above, calling `require('fs')` is a reference operation since Feri already had a reference for herself.

### Reserved Functions and Strings

The functions `include()` and `write()` are critical to how JSS files get built and their function names must not be redeclared in your own code.

The strings `{{js-include-begin}}` and `{{js-include-end}}` must not be used. String variants like `{{js-0}}` and `{{js-include-0-0}}` where `0` can be replaced with a number must not be used either. All of these strings are used internally when building JSS files.

## License

MIT © [Kai Nightmode](https://nightmode.fm/)

The MIT license does NOT apply to the name `Feri` or any of the images in this repository. Those items are strictly copyrighted to Kai Nightmode.