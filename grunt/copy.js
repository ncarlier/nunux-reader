module.exports = {
  main: {
    files: [
      {expand: true, cwd: 'client/', src: ['fonts/**'], dest: 'dist/'},
      {expand: true, cwd: 'client/', src: ['icons/**'], dest: 'dist/'},
      {expand: true, cwd: 'client/', src: ['images/**'], dest: 'dist/'},
      {expand: true, cwd: 'client/', src: ['templates/**'], dest: 'dist/'},
      {expand: true, cwd: 'client/', src: ['robots.txt'], dest: 'dist/'},
      {expand: true, cwd: 'client/', src: ['manifest.json'], dest: 'dist/'}
    ]
  }
};
