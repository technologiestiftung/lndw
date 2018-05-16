'use strict';

var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var sass = require('gulp-sass');

gulp.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: './'
        }
    });
});

gulp.task('sassWatch', function() {
    return gulp.src('scss/root.scss')
        .pipe(sass())
        .pipe(gulp.dest(''))
        .pipe(browserSync.reload({
            stream: true
        }));
});

gulp.task('sass', function() {
    return gulp.src('scss/root.scss')
        .pipe(sass())
        .pipe(gulp.dest('./dist'))
        .pipe(browserSync.reload({
            stream: true
        }));
});

gulp.task('watch', ['browserSync', 'sassWatch'], function() {
    gulp.watch('scss/**/*.scss', ['sassWatch']);
    gulp.watch('index.html', browserSync.reload);
    gulp.watch('js/*.js', browserSync.reload);
});