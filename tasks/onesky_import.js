/*
 * grunt-onesky-import
 * https://github.com/howardhenry/grunt-onesky-import
 *
 * Copyright (c) 2015 Howard Henry
 * Licensed under the MIT license.
 */

var crypto = require('crypto');
var fs = require('fs');
var FormData = require('form-data');
var Bluebird = require('bluebird');
var _ = require('lodash');

var BASE_URL = 'https://platform.api.onesky.io/1/';

module.exports = function (grunt) {
    grunt.registerMultiTask('oneskyImport', 'Import translation files into your OneSky project', function () {
        var done = this.async();
        var options = this.options({
            authFile: 'onesky.json',
            projectId: '',
            locale: '',
            file: '',
            files: [],
            fileFormat: 'HIERARCHICAL_JSON',
            isKeepingAllStrings: true
        });
        var hasSingleFile = !!options.file;
        var hasMultipleFiles = _.isArray(options.files) && options.files.length;
        var uploadQueue = [];

        if (hasSingleFile && hasMultipleFiles) {
            grunt.fail.fatal('Import task may contain only "options.file" OR "options.files", not both.');
        } else if (!hasSingleFile && !hasMultipleFiles) {
            grunt.fail.fatal('Import task must specify at least one file to upload');
        } else if (hasSingleFile) {
            uploadQueue.push(upload(options.file));
        } else if (hasMultipleFiles) {
            grunt.file
                .expand({}, options.files)
                .forEach(function (file) {
                    uploadQueue.push(upload(file));
                });
        }

        Bluebird.all(uploadQueue)
            .finally(function () {
                done();
            });

        ///////////////////////////

        function upload(file) {
            return new Bluebird(function (resolve, reject) {
                var api = getApi();
                var url = api.baseUrl + api.path;

                var form = new FormData();
                form.append('api_key', api.publicKey);
                form.append('timestamp', api.timestamp);
                form.append('dev_hash', api.devHash);
                form.append('file', fs.createReadStream(file));
                form.append('file_format', options.fileFormat);
                form.append('locale', options.locale);

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
                }

                function onUploadSuccess(data) {
                    var message = 'Success: ' + file + '.';

                    if (_.get(data, 'data.import.id')) {
                        message += ' Import ID: ' + data.data.import.id + '.';
                    }
                    if (_.get(data, 'data.language.locale')) {
                        message += ' Locale: ' + data.data.language.locale + '.';
                    }
                    if (_.get(data, 'data.language.region')) {
                        message += ' Region: ' + data.data.language.region + '.';
                    }

                    grunt.log.ok(message);

                    resolve();
                }

                function onUploadError(data) {
                    var message = 'Error: ' + file + '.';

                    if (_.get(data, 'meta.status')) {
                        message += ' Status: ' + data.meta.status + '.';
                    }
                    if (_.get(data, 'meta.message')) {
                        message += ' Details: ' + data.meta.message + '.';
                    }

                    grunt.fail.warn(message);

                    reject();
                }
            });
        }

        function getApi() {
            var oneSkyKeys = grunt.file.readJSON(options.authFile);

            var timestamp = Math.floor(Date.now() / 1000);
            var devHash = crypto.createHash('md5').update(timestamp + oneSkyKeys.secretKey).digest('hex');

            return {
                baseUrl: BASE_URL,
                path: 'projects/' + options.projectId + '/files',
                publicKey: oneSkyKeys.publicKey,
                timestamp: timestamp,
                devHash: devHash
            };
        }
    });
};
