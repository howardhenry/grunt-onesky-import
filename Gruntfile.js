/*
 * grunt-onesky-import
 * https://github.com/howardhenry/grunt-onesky-import
 *
 * Copyright (c) 2015 Howard Henry
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {
    // Loads relevant npm grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Project configuration.
    grunt.initConfig({
        mocha: {
            test: {
                src: ['tests/**/*.spec.js']
            }
        },
        eslint: {
            options: {
                configFile: '.eslintrc'
            },
            target: [
                '**/*.js',
                '!Gruntfile.js',
                '!node_modules/**/*.js',
                '!test/**/*.js'
            ]
        }
    });

    grunt.loadTasks('tasks');

    grunt.registerTask('default', ['eslint']);
    grunt.registerTask('test', ['mocha']);

};
