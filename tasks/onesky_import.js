/*
 * grunt-onesky-import
 * https://github.com/howardhenry/grunt-onesky-import
 *
 * Copyright (c) 2015 Howard Henry
 * Licensed under the MIT license.
 */

'use strict';

var crypto = require('crypto');
var fs = require('fs');
var _ = require('lodash');
var FormData = require('form-data');

var apiRoot = 'https://platform.api.onesky.io/1/';

module.exports = function (grunt) {
    grunt.registerMultiTask('oneskyImport', 'Import translation files into your OneSky project', function () {

        var done = this.async();

        var queue = [];

        var options = this.options({
            authFile: 'onesky.json',
            projectId: '',
            file: '',
            files: [],
            fileFormat: 'HIERARCHICAL_JSON',
            isKeepingAllStrings: true
        });

        queue = queue.concat(grunt.file.expand(options.files));

        if (options.file) {
            queue.push(options.file);
        }

        next();

        ///////////////////////////

        function next() {
            if (queue.length) {
                upload(queue.shift());
            }else {
                done();
            }
        }

        function upload(file) {
            var api = getApi();
            var url = api.baseUrl + api.path;

            var form = new FormData();
            form.append('api_key', api.publicKey);
            form.append('timestamp', api.timestamp);
            form.append('dev_hash', api.devHash);
            form.append('file', fs.createReadStream(file));
            form.append('file_format', options.fileFormat);

            if (_.isBoolean(options.isKeepingAllStrings)) {
                form.append('is_keeping_all_strings', options.isKeepingAllStrings.toString());
            } else {
                grunt.fail.warn('Expected "options.isKeepingAllStrings" to be a boolean');
            }

            form.submit(url, onUpload);

            function onUpload(error, response) {
                if (error) { throw error; }

                response.on('data', function (data) {
                    data = JSON.parse(data);

                    if (response.statusCode === 201) {
                        onUploadSuccess(data);
                    } else {
                        onUploadError(data);
                    }
                });

                response.resume();

                next();
            }

            function onUploadSuccess(data) {
                var importId;
                var locale;

                if (_.has(data, 'data.import.id')) { importId = data.data.import.id; }
                if (_.has(data, 'data.language.locale')) { locale = data.data.language.locale; }

                grunt.log.ok('File: "' + file + '" uploaded. Import ID: ' + importId + '. Locale: ' + locale);
            }


            function onUploadError(data) {
                var errorMsg;
                var statusCode;

                if (_.has(data, 'meta.status')) { statusCode = data.meta.status; }
                if (_.has(data, 'meta.message')) { errorMsg = data.meta.message; }

                grunt.fail.warn(statusCode + ': ' + errorMsg);
            }
        }


        function getApi() {
            var oneSkyKeys = grunt.file.readJSON(options.authFile);

            var timestamp = Math.floor(Date.now() / 1000);
            var devHash = crypto.createHash('md5').update(timestamp + oneSkyKeys.secretKey).digest('hex');

            return {
                baseUrl: apiRoot,
                path: 'projects/' + options.projectId + '/files',
                publicKey: oneSkyKeys.publicKey,
                timestamp: timestamp,
                devHash: devHash
            };
        }
    });
};
