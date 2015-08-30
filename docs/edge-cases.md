# Feri - Edge Cases

* [Index Murder Mystery](#index-murder-mystery)
* [Remora Files](#remora-files)

## Index Murder Mystery

> *The Sherif tipped his hat up higher on his brow as he looked over the morning paper. Index files were knocking each other off left and right again. Looks like that vacation to New Texas was going to have to wait.*

Let's say you have two files. One file is called `/source/index.html` and the other `/source/index.ejs`. EJS files get transformed into HTML so both files expect they will become `/dest/index.html`, and they are right, with a catch.

Whichever file is newer, will overwrite `/dest/index.html` believing it is authoritative. They will keep knocking each other off until you put on your deputy badge and break them apart by renaming one of them.

So, if your files are a fighting, you now know why and how to break 'em up!

## Remora Files

Remora files live alongside the file they are based on. In a default install of Feri, the most likely remora files will be MAP and GZ files.

Say we have a destination file called `main.css` which has two remora files, `main.css.map` and `main.css.gz`. When the cleaning part of Feri encounters these files, it knows to strip the GZ extension off the file and then try to find a match for `main.css` in the source directory. Whether the match is `main.css`, `main.less` or some other file doesn't matter. All the clean function cares about is if it can find any match and if it does, it leaves the file as is.

So, let's say you turn on MAP and GZ files and run build. Then you realize that you didn't need any MAP or GZ files so you turn those options off. You run the the clean routine but Feri uses the same logic as before and even though it isn't outputting MAP or GZ files, it finds a source file that these files must have come from so it leaves them alone.

So, now you have two files sitting around in your destination that really shouldn't be there. Obviously having an outdated source map isn't a big issue but an outdated `main.css.gz` file may be served by your web server instead of `main.css`. Ahh, so that is why the `main.css` file you are furiously updating never gets to the client! Darn it!

Don't panic! There is a plan to improve this behavior in future versions of Feri. Until then just remember... if you enable/disable source maps and/or gzip files, republish. Not only will it save you a lot of troubleshooting but you'll have that nice clean feeling too. Ahh. ^_^

## License

MIT © [Daniel Gagan](https://forestmist.org)