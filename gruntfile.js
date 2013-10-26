module.exports = function(grunt) {
  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
        },
        src: ['tests/**/*.js']
      }
    },
    jshint: {
      backend: ['app.js', 'lib/*.js', 'routes/*.js', 'bin/*.js'],
      frontend: {
        options: {
          globalstrict: true,
          browser: true,
          globals: {
            '$': false,
            console: false,
            angular: false,
            moment: false,
            alert: false,
            confirm: false,
            humane: false,
            qrcode: false
          }
        },
        src: ['public/javascripts/**/*.js']
      }
    },
    clean: ["public-build"],
    bower: {
      install: {
        options: {
          targetDir: 'public/lib',
          cleanup: true,
          verbose: false
        }
      }
    },
    less: {
      compile: {
        options: {
          paths: ['public/stylesheets'],
          yuicompress: true
        },
        files: {
          'public-build/stylesheets/style.css': 'public/stylesheets/style.less',
          'public-build/stylesheets/home.css': 'public/stylesheets/home.less'
        }
      }
    },
    ngmin: {
      dist: {
        expand: true,
        cwd: 'public/javascripts',
        src: ['**/*.js'],
        dest: 'public-build/javascripts'
      }
    },
    uglify: {
      dist: {
        expand: true,
        cwd: 'public-build/javascripts',
        src: ['**/*.js'],
        dest: 'public-build/javascripts'
      }
    },
    copy: {
      main: {
        files: [
          {expand: true, cwd: 'public/', src: ['icons/**'], dest: 'public-build/'},
          {expand: true, cwd: 'public/', src: ['fonts/**'], dest: 'public-build/'},
          {expand: true, cwd: 'public/', src: ['images/**'], dest: 'public-build/'},
          {expand: true, cwd: 'public/', src: ['views/**'], dest: 'public-build/'},
          {expand: true, cwd: 'public/', src: ['lib/**'], dest: 'public-build/'},
          {expand: true, cwd: 'public/', src: ['robots.txt'], dest: 'public-build/'}
        ]
      }
    }
  });

  // Register building task
  grunt.registerTask('build', ['less','ngmin', 'uglify','copy']);
  grunt.registerTask('install', ['clean','build']);
  grunt.registerTask('default', 'mochaTest');
}
