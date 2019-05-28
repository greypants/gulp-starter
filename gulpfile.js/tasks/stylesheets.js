if(!TASK_CONFIG.stylesheets) return

var gulp                = require('gulp')
var autoprefixer        = require('autoprefixer')
var browserSync         = require('browser-sync')
var cssnano             = require('cssnano')
var gulpif              = require('gulp-if')
var handleErrors        = require('../lib/handleErrors')
var postcss             = require('gulp-postcss')
var postcssSass         = require('@csstools/postcss-sass')
var postcssScss         = require('postcss-scss')
var projectPath         = require('../lib/projectPath')
var rename              = require('gulp-rename')
var sourcemaps          = require('gulp-sourcemaps')
var stripInlineComments = require('postcss-strip-inline-comments')

var sassTask = function () {

  var paths = {
    src: projectPath(PATH_CONFIG.src, PATH_CONFIG.stylesheets.src, '**/*.{' + TASK_CONFIG.stylesheets.extensions + '}'),
    dest: projectPath(PATH_CONFIG.dest, PATH_CONFIG.stylesheets.dest)
  }

  if (TASK_CONFIG.stylesheets.sass && TASK_CONFIG.stylesheets.sass.includePaths) {
    TASK_CONFIG.stylesheets.sass.includePaths = TASK_CONFIG.stylesheets.sass.includePaths.map(function(includePath) {
      return projectPath(includePath)
    })
  }

  var cssnanoConfig = TASK_CONFIG.stylesheets.cssnano || {}
  cssnanoConfig.autoprefixer = false // this should always be false, since we're autoprefixing separately

  var autoprefixerConfig = TASK_CONFIG.stylesheets.autoprefixer || {}

  var preprocess = TASK_CONFIG.stylesheets.sass

  var postcssPlugins = TASK_CONFIG.stylesheets.postcss.plugins || []
  var postcssOptions = TASK_CONFIG.stylesheets.postcss.options || {}
  var postprocess = TASK_CONFIG.stylesheets.postcss === true
                    || postcssPlugins.length > 0
                    || notEmpty(postcssOptions)

  if (!findPostCssPlugin(postcssPlugins, 'autoprefixer')) {
    postcssPlugins.push(autoprefixer(autoprefixerConfig))
  }

  if (global.production && !findPostCssPlugin(postcssPlugins, 'cssnano')) {
    postcssPlugins.push(cssnano(cssnanoConfig))
  }

  if (preprocess) {
    postcssPlugins.push(postcssSass(TASK_CONFIG.stylesheets.sass))
    postcssPlugins.push(stripInlineComments)
    postcssOptions['parser'] = postcssScss
    postcssOptions['syntax'] = postcssScss
  }

  return gulp.src(paths.src)
    .pipe(gulpif(!global.production, sourcemaps.init()))
    .pipe(gulpif(preprocess || postprocess, postcss(postcssPlugins, postcssOptions)))
    .on('error', handleErrors)
    .pipe(rename({
      extname: ".css"
    }))
    .pipe(gulpif(!global.production, sourcemaps.write()))
    .pipe(gulp.dest(paths.dest))
    .pipe(browserSync.stream())

  function notEmpty(obj) {
    return Object.getOwnPropertyNames(obj).length !== 0;
  }

  function findPostCssPlugin(plugins, name) {
    return !!plugins.find(p => p.postCssPlugin === name)
  }
}

const { alternateTask = () => sassTask } = TASK_CONFIG.stylesheets
const stylesheetsTask = alternateTask(gulp, PATH_CONFIG, TASK_CONFIG)

gulp.task('stylesheets', stylesheetsTask)
module.exports = stylesheetsTask
