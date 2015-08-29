# Feri - Extension Specific Information

 * [Cascading Style Sheets (CSS)](#cascading-style-sheets-css)
 * [Embedded JavaScript (EJS)](#embedded-javascript-ejs)
 * [Gzip (GZ)](#gzip-gz)

## Cascading Style Sheets (CSS)

### Chaining Source Map Build Tasks
Feri can generate source maps for CSS, Less, Sass, and Stylus files. These will all work as intended with a default config.

Where things can get weird is if you change the default build chain of something like Sass from...

```js
config.map.sourceToDestTasks.sass = ['sass']
```

To a chain of tasks that has the built-in CSS task come after something that just generated a CSS source map like...

```js
config.map.sourceToDestTasks.sass = ['sass', 'css']
```

In the above setup, the built-in Sass task would generate a valid source map. Next, the built-in CSS task would have trouble consuming the existing source map and generate a new source map. The new source map does not have mappings back to the original Sass file so its utility in your browser is greatly reduced.

Feri thinks this is happening because of a bug in [clean-css](https://www.npmjs.com/package/clean-css) or one of its dependencies as of August 2015. This issue will most likely be resolved at some point in the future.

For now, be careful when chaining the 'css' task onto anything generating an existing source map if you want proper source maps.

## Embedded JavaScript (EJS)

### Smarter Includes

Feri supports passing a variable called "root" into your EJS files. This is super useful for includes because instead of having dot dot slash nightmares like...

```js
<% include ('../../../../partials/header.ejs') %>
```

You can instead set "root" to the same path as your source folder and then write beautiful includes like...

```js
<% include (root + '/partials/header.ejs') %>
```

Now the include will work from any depth. Even better, the parent file containing the code can be moved without having to update the include path.

To enable pretty includes, simply add the following to your [custom config file](custom-config-file.md).

```js
// set root variable for ejs includes
config.fileType.ejs.root = config.path.source
```

## Gzip (GZ)

### Enabling Gzip

Feri comes ready to create GZ versions of files to live along side of their respective destination files. This is great if you have a web server like [nginx](http://wiki.nginx.org/Main) which can serve precompiled Gzip files to clients that support it. Less work for your web server and typically better compression too.

To enable Gzip versions of your destination files, add the following to your [custom config file](custom-config-file.md).

```js
// add gz build task for the following extensions
var types = ['css', 'html', 'js']
for (var i in types) {
    config.map.sourceToDestTasks[types[i]].push('gz')
}
```

The above code loops through the types array and adds a build task called 'gz' to the end of the tasks list for each particular extension.

Feel free to change the types array to whatever extensions you like of course.

## License

MIT © [Daniel Gagan](https://forestmist.org)