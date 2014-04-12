"use strict";

module.exports = function(grunt) {
  grunt.initConfig({
    shell: {
      test: {
        command: 'npm test',
        options: {
          failOnError: true,
          stderr: true,
          stdout: true
        }
      }
    },
    uglify: {
      options: {
        preserveComments: 'some'
      },
      build: {
        files: {
          'protomatter.min.js': ['protomatter.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-shell');

  grunt.registerTask('build', ['shell:test', 'uglify:build']);
};
