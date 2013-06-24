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
          'public-build/stylesheets/style.css': 'public/stylesheets/style.less'
        }
      }
    },
    ngmin: {
      dist: {
        files: [{
          expand: true,
          cwd: 'public/javascripts',
          src: '*.js',
          dest: 'public-build/javascripts',
        }]
      }
    },
    uglify: {
      dist: {
        files: {
          'public-build/javascripts/scripts.js': [
            'public-build/javascripts/scripts.js'
          ]
        }
      }
    },
    copy: {
      main: {
        files: [
          {expand: true, cwd: 'public/', src: ['lib/html5shiv/html5shiv.js'], dest: 'public-build/'},
          {expand: true, cwd: 'public/', src: ['icons/**'], dest: 'public-build/'},
          {expand: true, cwd: 'public/', src: ['images/**'], dest: 'public-build/'},
          {expand: true, cwd: 'public/', src: ['templates/**'], dest: 'public-build/'},
          {expand: true, cwd: 'public/', src: ['lib/jquery/jquery.js'], dest: 'public-build/'}
        ]
      }
    },
    manifest: {
      generate: {
        options: {
          basePath: 'public-build/',
          cache: ['javascripts/main.js', 'stylesheets/style.css'],
          preferOnline: true,
          verbose: false,
          timestamp: true
        },
        src: [
          'templates/*.html',
          'lib/**/*.js',
          'images/*.png'
        ],
        dest: 'public-build/manifest.appcache'
      }
    }
  });

  // Register building task
  grunt.registerTask('build', ['less','ngmin', 'uglify','copy']);
  grunt.registerTask('install', ['clean','build']);
  grunt.registerTask('default', 'mochaTest');
}
