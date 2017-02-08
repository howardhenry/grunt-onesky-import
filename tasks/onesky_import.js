/*
 * grunt-onesky-import
 * https://github.com/howardhenry/grunt-onesky-import
 *
 * Copyright (c) 2015 Howard Henry
 * Licensed under the MIT license.
 */

var crypto = require('crypto');
var fs = require('fs');
var _ = require('lodash');
var FormData = require('form-data');

var apiRoot = 'https://platform.api.onesky.io/1/';

module.exports = function (grunt) {
    grunt.registerMultiTask('oneskyImport', 'Import translation files into your OneSky project', function () {

        var done = this.async();

        var uploadFiles = [];

        var options = this.options({
            authFile: 'onesky.json',
            projectId: '',
            locale: '',
            file: '',
            files: [],
            fileFormat: 'HIERARCHICAL_JSON',
            isKeepingAllStrings: true
        });

        if (!!options.files.lenght) {
            options.files.push({projectId: options.projectId, locale: options.locale, file: options.file});
        }

        uploadFiles = options.files.map(function(element) {
            return upload(element);
        });

        Promise.all(uploadFiles).then(function() {
            done();
        });

        ///////////////////////////

        function upload(element) {
            var api = getApi(element.projectId);
            var url = api.baseUrl + api.path;

            var _promise = new Promise(function(resolve, reject) {

                var form = new FormData();
                form.append('api_key', api.publicKey);
                form.append('timestamp', api.timestamp);
                form.append('dev_hash', api.devHash);
                form.append('file', fs.createReadStream(element.file));
                form.append('file_format', options.fileFormat);
                form.append('locale', element.locale);
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
                    var importId;
                    var locale;
                    var region;
                    if (_.has(data, 'data.import.id')) { importId = data.data.import.id; }
                    if (_.has(data, 'data.language.locale')) { locale = data.data.language.locale; }
                    if (_.has(data, 'data.language.region')) { region = data.data.language.region; }
                    grunt.log.ok('File: "' + options.file +
                        '" uploaded. Import ID: ' + importId + '. Locale: ' + locale + ' Region: ' + region);
                    resolve();
                }
                function onUploadError(data) {
                    var errorMsg;
                    var statusCode;
                    if (_.has(data, 'meta.status')) { statusCode = data.meta.status; }
                    if (_.has(data, 'meta.message')) { errorMsg = data.meta.message; }
                    grunt.fail.warn(statusCode + ': ' + errorMsg);
                    reject();
                }
            });
            return _promise;
        }
        function getApi(projectId) {
            var oneSkyKeys = grunt.file.readJSON(options.authFile);
            var timestamp = Math.floor(Date.now() / 1000);
            var devHash = crypto.createHash('md5').update(timestamp + oneSkyKeys.secretKey).digest('hex');
            return {
                baseUrl: apiRoot,
                path: 'projects/' + projectId + '/files',
                publicKey: oneSkyKeys.publicKey,
                timestamp: timestamp,
                devHash: devHash
            };
        }
    });
};
