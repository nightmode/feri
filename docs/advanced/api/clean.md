# Feri - Clean

Clean is the module dedicated to cleaning destination files.

The clean module can be found inside the file [code/5 - clean.js](../../../code/5%20-%20clean.js)

## Clean Object

* [processClean](#cleanprocessclean)
* [processFiles](#cleanprocessfiles)
* [processOneClean](#cleanprocessoneclean)

## clean.processClean

Type: `function`

Remove the destination directory or start a more complex incremental cleanup.

```
@param   {String,Object}  [files]     Optional. Glob search string like '*.html' or array of full paths like ['/web/dest/about.html', '/web/dest/index.html']
@param   {Boolean}        [watching]  Optional. If true, we are in watch mode so log less information and do not republish.
@return  {Promise}                    Promise that returns an array of file path strings for the files cleaned like ['/dest/css/style.css', '/dest/index.html']
```

Note: This function is also aliased as `feri.action.clean`.

## clean.processFiles

Type: `function`

Create a promise chain of tasks for each file and control concurrency.

```
@param   {Object,String}  files  Array of paths like ['/dest/path1', '/dest/path2'] or a string like '/dest/path'
@return  {Promise}               Promise that returns an array of file path strings for the files cleaned like ['/dest/css/style.css', '/dest/index.html']
```

## clean.processOneClean

Type: `function`

Create a promise chain of cleaning tasks based on a single file type.

```
@param   {String}   filePath  Path like '/dest/index.html'
@return  {Promise}            Promise that returns a file path string if something was cleaned otherwise undefined.
```

## License

MIT © [Kai Nightmode](https://twitter.com/kai_nightmode)