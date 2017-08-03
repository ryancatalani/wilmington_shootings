var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var headerfooter = require('gulp-headerfooter');

var jsFiles = ['src/js/libs/*.js', 'src/js/dev2.js'],
    jsDest = 'assets';

gulp.task('js', function() {
    return gulp.src(jsFiles)
        .pipe(concat('main.js'))
        .pipe(gulp.dest(jsDest))
        .pipe(rename('main.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(jsDest));
});

var styleFiles = ['src/styles/leaflet.css', 'src/styles/dev.css'],
	styleDest = 'assets';

gulp.task('styles', function() {
	return gulp.src(styleFiles)
		.pipe(concat('main.css'))
		.pipe(gulp.dest(styleDest));
});

var devFullFileList = [
	'src/partials/dev_header.html',
	'src/partials/title.html',
	'src/partials/graphic_map.html',
	'src/partials/graphic_cities.html',
	'src/partials/graphic_juveniles.html',
	'src/partials/dev_footer.html'
];

gulp.task('createDev', function() {
	return gulp.src(devFullFileList)
		.pipe(concat('dev2.html'))
		.pipe(gulp.dest(''))
});

var prodFullFileList = [
	'src/partials/prod_header.html',
	'src/partials/title.html',
	'src/partials/graphic_map.html',
	'src/partials/graphic_cities.html',
	'src/partials/graphic_juveniles.html',
	'src/partials/prod_footer.html'
];

gulp.task('createProd', function() {
	return gulp.src(prodFullFileList)
		.pipe(concat('graphics_all.html'))
		.pipe(gulp.dest(''))
});

var graphicsFiles = [
	'src/partials/graphic_map.html',
	'src/partials/graphic_cities.html',
	'src/partials/graphic_juveniles.html'
];

gulp.task('createIndivFiles', function() {
	return gulp.src(graphicsFiles)
		.pipe(headerfooter.header('src/partials/prod_header.html'))
		.pipe(headerfooter.footer('src/partials/prod_footer.html'))
		.pipe(gulp.dest(''))
})



gulp.task('default', ['js', 'styles', 'createProd']);