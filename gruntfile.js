module.exports = function(grunt) {
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
    requirejs: {
      compile: {
        options: {
          baseUrl: 'public/javascripts',
          mainConfigFile: 'public/javascripts/main.js',
          name: 'main',
          out: 'public-build/javascripts/main.js',
          include: ['views/about', 'views/manage', 'views/timeline']
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
          {expand: true, cwd: 'public/', src: ['lib/requirejs/require.js'], dest: 'public-build/'},
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

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-manifest');

  // Register building task
  grunt.registerTask('build', ['less','requirejs','copy']);
  grunt.registerTask('install', ['clean','build']);
  grunt.registerTask('default', 'mochaTest');
}
