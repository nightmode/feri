# Feri - Custom Build Task

Feri comes with a lot of great build tasks by default but sometimes you need something a bit more specialized. That is where custom build tasks come in. Custom build tasks must return a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) but before we go into specifics, lets review how Feri builds files behind the scenes.

## config.map.sourceToDestTasks

Build tasks are defined in [config.map.sourceToDestTasks](api/config.md#configmapsourcetodesttasks). Each extension has an array of one or more tasks. The tasks can be strings or functions. Strings signify that the build task exists in the [build](api/build.md) module. Functions signify a custom build task.

For example, here is the entry for Markdown:

```js
config.map.sourceToDestTasks.md = ['markdown', 'html']
```

In the above array, the two strings mean run any `.md` files through [build.markdown](api/build.md#buildmarkdown) and then [build.html](api/build.md#buildhtml). The first task converts Markdown to HTML. The second task minifies the resulting HTML.

If instead, our source to destination tasks for Markdown looked like...

```js
function magicSauce() {
    // do magical things
}

config.map.sourceToDestTasks.md = ['markdown', magicSauce]
```

We would surmise that any `.md` files would first run through [build.markdown](api/build.md#buildmarkdown) and then a custom build task called `magicSauce`.

## Reusable Object Building

Before any task defined in `config.map.sourceToDestTasks` is run, a command and control function called [build.processOneBuild](api/build.md#buildprocessonebuild) creates an object that will be passed between build tasks for each file. Assuming the source file we are building is called `hello.txt`, the object would look like the following.

```js
obj = {
    'source': '/source/hello.txt',
    'dest': '',
    'data': '',
    'build': false
}
```

The property `source` is the source path and file name. This field will always be filled out.

The property `dest` is the destination file path and name. This is typically figured out by the first build task.

The property `data` is used to pass strings between build functions that work in memory. Functions that write to disk will not use this field.

The property `build` will be set to true if a file needs to be built.

Obviously, we want our custom build task to receive a reusable object. For extra points we will also make sure it returns the reusable object so it can be chained with other build tasks.

## Define a Custom Build Task

Let's imagine we want a workflow that will replace instances of a string `{name}` with `Susan` in text files.

```
Hello {name}! Lovely weather we are having today.
```

Using code from `build.html` as our template, we can simplify our custom build task down to the following:

```js
function nameReplace(obj) {
    return feri.functions.objBuildInMemory(obj).then(function(obj) {

        if (obj.build) {
            obj.data = obj.data.replace('{name}', 'Susan')
            return obj
        } else {
            // no further chained promises should be called
            throw 'done'
        }

    })
}

// don't forget to assign your custom build task to a file extension
feri.config.map.sourceToDestTasks.txt = [nameReplace]
```

First, we create a function called `nameReplace` that expects an object.

Next, we leverage a really neat [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) called [functions.objBuildInMemory](api/functions.md#functionsobjbuildinmemory) that does quite a few things for us.

* It figures out that the destination path should be `/dest/hello.txt` and writes that to `obj.dest`.
* Assuming the destination file does not exist **or** if the source file is newer than the destination, it sets `obj.build` to `true`.
* Assuming `obj.build` is `true`, it reads the source file content into `obj.data`.

### Scenario I: Build is True

When our promise returns, we have an object like the following:

```js
obj = {
    'source': '/source/hello.txt',
    'dest': '/dest/hello.txt',
    'data': 'Hello {name}! Lovely weather we are having today.',
    'build': true
}
```

Wow, our job is actually pretty easy now.

With `obj.build` set to `true` we run a simple replace on `obj.data` and then return the entire `obj`. If another build task receives our `obj` it will see the following:

```js
obj = {
    'source': '/source/hello.txt',
    'dest': '/dest/hello.txt',
    'data': 'Hello Susan! Lovely weather we are having today.',
    'build': true
}
```

You may be thinking, wait a second... we didn't actually write a file and you're right. Every chain of build tasks has a special finisher task called [build.finalize](api/build.md#buildfinalize) that takes care of writing our files to disk for us. So convenient!

If we instead choose to write `obj.data` to disk ourselves, it would be a good idea to clear `obj.data` before passing it along to any subsequent tasks like `build.finalize`. That way data isn't written twice.

### Scenario II: Build is False

Let's say our promise returns an object like the following:

```js
obj = {
    'source': '/source/hello.txt',
    'dest': '/dest/hello.txt',
    'data': ''
    'build': false
}
```

There is no reason to return the object for any further build tasks. Knowing there is nothing to do, we can `throw 'done'` to break out of our promise chain in a nice way. With less work, Feri runs faster!

## More Complex Tasks

When building more complex tasks, your best friends will be [functions.objBuildInMemory](api/functions.md#functionsobjbuildinmemory), [functions.objBuildOnDisk](api/functions.md#functionsobjbuildondisk), and [functions.objBuildWithIncludes](api/functions.md#functionsobjbuildwithincludes). Each of these is used in various bundled [build](api/build.md) tasks so feel free to use any of built-in tasks as a starter for your own awesome thing!

## License

MIT © [Kai Nightmode](https://forestmist.org)