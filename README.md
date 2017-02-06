# grunt-onesky-import

> Import translation files into your OneSky project

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-onesky-import --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-onesky-import');
```

## The "oneskyImport" task

### Overview
In your project's Gruntfile, add a section named `oneskyImport` to the data object passed into `grunt.initConfig()`.

IMPORTANT:

* Your translation file should include translation strings in the base language set up in your OneSky project.
* After a successful upload, translations strings may not be immediately available in your project as they are automatically queued to be imported. This process can take a few seconds/minutes dependent on server load.

### Options

#### options.authFile
Type: `String`
Default value: `onesky.json`

A JSON file with your OneSky API keys.
```
{
    "publicKey": "YOUR_PUBLIC_KEY",
    "secretKey": "YOUR_SECRET_KEY"
}
```

#### options.projectId
Type: `String`

Your OneSky project ID

#### options.file
Type: `String`

The path to the translation file to be upload to your OneSky project.

#### options.language
Type: `String` Default value: Your project main language

The language (and region if specified) of your file. For example, you will use `en-GB` if you want to upload a file in english especially for Great Britain.

#### options.fileFormat
Type: `String`

The file format for OneSky to assume when importing translations. See list of available [file formats](https://github.com/onesky/api-documentation-platform/blob/master/reference/format.md).

#### options.isKeepingAllStrings (optional)
Type: `String`
Default value: `true`

When uploading a file which overwrites an existing file in your OneSky project, set this value to `false` to deprecate strings that cannot be found in the existing file. Files with different file names will not be overwritten or deprecate previous strings.

### Usage Examples

```js
grunt.initConfig({
    oneskyImport: {
        options: {
            authFile: 'onesky.json',
            projectId: '12345',
            isKeepingAllStrings: false
        },
        import: {
            options: {
                file: 'media.json',
                fileFormat: 'HIERARCHICAL_JSON'
            }
        }
    },
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style via eslint. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).
