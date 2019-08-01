# Feri - Edge Cases

* [Index Murder Mystery](#index-murder-mystery)
* [Concatenate Responsibly](#concatenate-responsibly)

## Index Murder Mystery

> *The Sherif tipped his hat up higher on his brow as he looked over the morning paper. Index files were knocking each other off left and right again. Looks like that vacation to New Texas was going to have to wait.*

Let's say you have two files. One file is called `/source/index.html` and the other `/source/index.md`. Markdown files get transformed into HTML so both files expect they will become `/dest/index.html`, and they are right, with a catch.

Whichever file is newer, will overwrite `/dest/index.html` believing it is authoritative. They will keep knocking each other off until you put on your deputy badge and break them apart by renaming one of them.

So, if your files are a fighting, you now know why and how to break 'em up!

## Concatenate Responsibly

It may be tempting to include [concatenate](unique-file-types.md#concatenate-concat) files within other `.concat` files. If you do, you'll increase the human cost of figuring out what files are being published from the source directory. Not only do you have to peek inside the first CONCAT file, but you have to trace any included CONCAT files, the files they include, and so on. A nesting nightmare.

Even worse, any CONCAT files that are also [include files](../../readme.MD#include-files) can lead to a twilight zone where files build once but never again. When watching, Feri will try to warn you when she detects this situation but if unheeded... you won't be able to trust that all your source folder changes are being published. Yikes!

## License

MIT © [Kai Nightmode](https://twitter.com/kai_nightmode)