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
    concat: {
      options: {
        separator: ';',
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        src: [
          'public/lib/jquery/jquery.min.js',
          'public/lib/bootstrap/bootstrap.min.js',
          'public/lib/moment/moment.min.js',
          'public/lib/qrcode-generator/qrcode.js',
          'public/lib/humane-js/humane.min.js',
          'public/lib/mousetrap/mousetrap.min.js',
          'public/lib/angular/angular.min.js',
          'public/lib/angular/angular-sanitize.min.js',
          'public/lib/ngUpload/ng-upload.min.js',
          'public-build/javascripts/app.js',
          'public-build/javascripts/modules/*.js'
        ],
        dest: 'public-build/javascripts/reader.min.js'
      }
    },
    copy: {
      main: {
        files: [
          {expand: true, cwd: 'public/', src: ['lib/**'], dest: 'public-build/'},
          {expand: true, cwd: 'public/', src: ['icons/**'], dest: 'public-build/'},
          {expand: true, cwd: 'public/', src: ['fonts/**'], dest: 'public-build/'},
          {expand: true, cwd: 'public/', src: ['images/**'], dest: 'public-build/'},
          {expand: true, cwd: 'public/', src: ['views/**'], dest: 'public-build/'},
          {expand: true, cwd: 'public/', src: ['robots.txt'], dest: 'public-build/'}
        ]
      }
    }
  });

  // Register building task
  grunt.registerTask('build', ['less','ngmin','uglify','concat','copy']);
  grunt.registerTask('install', ['clean','build']);
  grunt.registerTask('default', 'mochaTest');
}
