# Feri - Edge Cases

* [Index Murder Mystery](#index-murder-mystery)

## Index Murder Mystery

> *The Sherif tipped his hat up higher on his brow as he looked over the morning paper. Index files were knocking each other off left and right again. Looks like that vacation to New Texas was going to have to wait.*

Let's say you have two files. One file is called `/source/index.html` and the other `/source/index.md`. Markdown files get transformed into HTML so both files expect they will become `/dest/index.html`, and they are right, with a catch.

Whichever file is newer, will overwrite `/dest/index.html` believing it is authoritative. They will keep knocking each other off until you put on your deputy badge and break them apart by renaming one of them.

So, if your files are a fighting, you now know why and how to break 'em up!

## License

MIT © [Kai Nightmode](https://twitter.com/kai_nightmode)