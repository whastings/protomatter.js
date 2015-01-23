var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    mocha = require('gulp-mocha'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify');

gulp.task('specs', function() {
  return gulp.src('./spec/**/*.js')
    .pipe(mocha());
});

gulp.task('build', ['specs'], function() {
  return gulp.src('./protomatter.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(uglify())
    .pipe(rename('protomatter.min.js'))
    .pipe(gulp.dest('.'));
});
