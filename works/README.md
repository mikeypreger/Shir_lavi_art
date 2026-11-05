# Adding a work to the site

Each work takes two steps on github.com: upload the file, then add it to the list.

## 1. Upload the file

1. Open this `works` folder on GitHub.
2. Click **Add file**, then **Upload files**.
3. Drag in your image or video.
4. Click **Commit changes**.

Tips:

- **Size:** each file must be under 25 MB to upload this way, so compress long videos first.
- **Videos:** use MP4.
- **Images:** use JPG or PNG. iPhone HEIC photos need converting first.
- **File names:** short names without spaces are easiest, like `blue-room.jpg`.

## 2. Add it to the list

1. Open [`works.js`](../works.js), which is one folder up from here.
2. Click the pencil icon to edit it.
3. Paste this straight under the `const WORKS = [` line, and fill it in:

   ```js
   {
     file: `blue-room.jpg`,
     title: `Blue room`,
     description: `A sentence or two about the work.`,
   },
   ```

4. Click **Commit changes**.

The site updates by itself, usually within a few minutes. If you don't see the work, refresh the page.

## Grouping several files into one work

To show a video and photos of the same work on one card, upload all the files, then use `files` instead of `file`:

```js
{
  files: [`blue-room.mp4`, `blue-room-detail.jpg`, `blue-room-side.jpg`],
  title: `Blue room`,
  description: `A sentence or two about the work.`,
},
```

The first file shows large, with small thumbnails underneath to switch between them. They all share one title and description. Put a comma between the files, with `` ` `` marks around each one.

## Rules for the list

- `file` must match the file's name exactly, including capital letters and the ending (`.jpg`).
- `title` and `description` are optional. Delete those lines if you don't want them. Without a title, the site shows the file name.
- Keep the `` ` `` marks around each value, and the commas after each value and after the closing `}`.
- The work at the top of the list appears first in the gallery.
- A description can run over several lines, and it can be in Hebrew or English.

## If something goes wrong

- **"The list of works couldn't be loaded":** there is a typo in `works.js`, usually a missing `` ` `` or comma. Check the last thing you changed.
- **"This work couldn't be displayed":** the name in `file` doesn't match the uploaded file, it's missing its ending (like `.mp4`), or the browser can't play that format. In a group, the thumbnail with a `!` is the file with the problem.

## Removing a work

Delete its block from `works.js`, then delete its file from this folder.
