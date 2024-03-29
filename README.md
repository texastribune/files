# Texas Tribune Files App

This app powers the frontend of the Texas Tribune's CMS file management system. It provides a flexible [Web Component](https://developer.mozilla.org/en-US/docs/Web/Web_Components) based API for creating a file browser within a web browser.

View [full documentation](https://texastribune.github.io/files)

## Usage

To create a simple in-memory file browser, use the following custom elements on your webpage:

```
<script src="https://texastribune.github.io/files/dist/bundle.js"></script>

<file-browser select-multiple>
  <memory-directory name="memory"></memory-directory>
  <file-browser-context-menu></file-browser-context-menu>
</file-browser>
```

To create an S3 bucket file browser, use the following custom elements on your webpage:

```
<script src="https://texastribune.github.io/files/dist/bundle.js"></script>

<file-browser select-multiple>
    <s3-directory
      url="http://yours3bucket.com/"
      prefix="myfiles/"
      max-keys="100"
    ></s3-directory>
  <file-browser-context-menu></file-browser-context-menu>
</file-browser>
```

NOTE: You may encounter CORS issues if your webpage is not being served from the same domain as your S3 bucket. To get around this, you may need to adjust the CORS settings of your bucket.

View [full documentation](https://texastribune.github.io/files)

## Install

This app requires node 16+. If you use [nvm](https://https://github.com/nvm-sh/nvm), then you can ensure you are using the appropriate version of node.js by running the following command in the root of your project:

```
nvm use
```

Then run `npm install` to install dependencies.

## Development

> TLDR: `make start` to get started. `make build` and commit when your feature is complete.

This repository uses `tsc` for code compilation. Run `npm run build` to build `src` into `lib`. Or run `npm run dev` to watch for changes and rebuild automatically.

This repository includes automatically generated documentation through `typedoc`. It can be generated by running `npm run doc`.

To serve the documentation locally, run `npm run serve:doc`. You can view a rendered instance of the file browser widget at [localhost:3000/UserInterfaceTutorial.html](http://localhost:3000/UserInterfaceTutorial.html), which can be useful for local development. Note that you will need to recompile the source code (using either `npm run build` or `npm run dev`) and then re-run `npm run doc` in order to view changes.

## Styling

Because of the way web components encapsulate CSS within the shadow DOM, you can't alter the styling of the elements inside them using traditional CSS selectors.

The easiest way to re-style the Files app is by targeting the component and then modifying CSS vars used by elements inside it.

Example usage:

```
<head>
  <script src="https://texastribune.github.io/files/dist/bundle.js"></script>
  <style>
    <!-- these CSS vars will bump the magnifying icon glass icon and its container to 25px. It will also restyle the icon with a pink fill  -->
    file-browser {
      --search-height: 25px;
      --search-icon-size: 25px;
      --search-icon-color: pink;
    }
  </style>
</head>

<body>
  <file-browser select-multiple>
      <s3-directory
        url="http://yours3bucket.com/"
        prefix="myfiles/"
        max-keys="100"
      ></s3-directory>
    <file-browser-context-menu></file-browser-context-menu>
  </file-browser>
</body>
```

These are some of the main CSS variables that are available for modification:
```
  --table-row-height
  --table-body-row-height
  --table-header-height
  --table-header-color
  --table-header-text-color
  --search-height
  --search-icon-size
  --search-icon-color
  --icon-size
  --icon-color
  --dropdown-icon-size
  --dropdown-icon-color
  --carrot-icon-size
  --carrot-icon-color
  --uplevel-icon-size
  --uplevel-icon-color
  --doc-icon-width
  --doc-icon-height
  --dialog-item-text-color
  --dialog-header-height
  --dialog-header-background-color
  --body-text-color
  --browser-background;
  --button-color
  --button-hover-color
  --action-icon-color
```
_Note: The list above may not reflect all CSS variables available for modification._
