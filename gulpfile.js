const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const cssnano = require('gulp-cssnano');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const env = require('gulp-env');
const gulpif = require('gulp-if');
const clean = require('gulp-clean');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const nested = require('postcss-nested');
const short = require('postcss-short');
const assets = require('postcss-assets');
const postcssPresetEnv = require('postcss-preset-env');
const handlebars = require('gulp-compile-handlebars');
const glob = require('glob');
const rename = require('gulp-rename');
const eslint = require('gulp-eslint');
const stylelint = require('stylelint');
const reporter = require('postcss-reporter');
const imagemin = require('gulp-imagemin');

// Data
const data = require('./src/templates/data/data.json');

// Lint
const rulesStyles = require('./.stylelintrc.json');
const rulesScripts = require('./.eslintrc.json');

// Env
env({
  file: '.env',
  type: 'ini'
});

// Paths
const paths = {
  src: {
    dir: 'src',
    styles: './src/css/**/*.css',
    scripts: './src/js/**/*.js',
    images: './src/images/*',
    fonts: './src/fonts/*'
  },
  dest: {
    dir: 'build',
    styles: './build/css',
    scripts: './build/js',
    images: './build/images',
    fonts: './build/fonts'
  },
  names: {
    styles: 'index.min.css',
    scripts: 'index.min.js'
  },
  templates: 'src/templates/**/*.hbs',
  lint: {
    styles: ['**/*.css', '!node_modules/**/*', '!build/**/*'],
    scripts: ['**/*.js', '!node_modules/**/*', '!build/**/*']
  }
};

// Functions
const styles = () => {
  const plugins = [
    autoprefixer({browsers: ['last 2 versions']}),
    nested(),
    short(),
    assets({
      loadPaths: ['src/images/'],
      relativeTo: 'src/css/'
    }),
    postcssPresetEnv({
      importFrom: './src/css/main.css'
    })
  ];

  return gulp.src(paths.src.styles)
    .pipe(sourcemaps.init())
    .pipe(postcss(plugins))
    .pipe(concat(paths.names.styles))
    .pipe(gulpif(process.env.NODE_ENV === 'production', cssnano()))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.dest.styles));
};
const scripts = () => {
  return gulp.src(paths.src.scripts)
    .pipe(sourcemaps.init())
    .pipe(concat(paths.names.scripts))
    .pipe(babel({
      presets: ['@babel/env']
    }))
    .pipe(gulpif(process.env.NODE_ENV === 'production', uglify()))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.dest.scripts));
};

const server = () => {
  browserSync.init({
    server: {
      baseDir: './build',
    },
    notify: false
  });
  gulp.watch(paths.templates, ['compile']);
  gulp.watch(paths.src.styles, ['css']);
  gulp.watch(paths.src.scripts, ['js']);
  gulp.watch(`${paths.dest.dir}/**/*`).on('change', reload);
};

const reload = () => browserSync.reload();

const cleaning = () => {
  gulp.src('./build', {read: false})
    .pipe(clean());
};

const compile = () => {
  glob(paths.templates, (err, files) => {
    if (!err) {
      const options = {
        ignorePartials: true,
        batch: files.map(item => item.slice(0, item.lastIndexOf('/'))),
        helpers: {
          
        }
      };
      return gulp.src(`${paths.src.dir}/templates/index.hbs`)
        .pipe(handlebars(data, options))
        .pipe(rename('index.html'))
        .pipe(gulp.dest('build'));
    }
  });
};

const jslint = () => {
  return gulp.src(paths.lint.scripts)
    .pipe(eslint(rulesScripts))
    .pipe(eslint.format())
};

const csslint = () => {
  return gulp.src(paths.lint.styles)
    .pipe(postcss([
      stylelint(rulesStyles),
      reporter({
        clearMessages: true,
        throwError: false
      })
    ]));
};

const imgs = () => {
  return gulp.src(paths.src.images)
    .pipe(imagemin())
    .pipe(gulp.dest(paths.dest.images));
};

const fonts = () => {
  return gulp.src(paths.src.fonts)
    .pipe(gulp.dest(paths.dest.fonts));
};

// Tasks
gulp.task('css', styles);
gulp.task('js', scripts);
gulp.task('compile', compile);
gulp.task('images', imgs);
gulp.task('fonts', fonts);
gulp.task('eslint', jslint);
gulp.task('stylelint', csslint);
gulp.task('lint', ['eslint', 'stylelint']);
gulp.task('browserSync', server);
gulp.task('build', ['compile', 'css', 'js', 'images', 'fonts']);
gulp.task('clean', cleaning);
gulp.task('default', ['build']);
gulp.task('dev', ['build', 'browserSync']);
