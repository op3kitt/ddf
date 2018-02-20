gulp = require('gulp');
exec = require('child_process').exec;

gulp.task('default', ['doc']);

gulp.task('doc', function(){
  exec('jsdoc -c .jsdoc.json');
});
