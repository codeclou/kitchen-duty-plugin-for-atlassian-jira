// ////////////////////////////////////////////////////////////////
// REQUIRE - 3RDPARTY
// ////////////////////////////////////////////////////////////////

var yargs = require('yargs');
var glob = require('glob-all');
var async = require('async');
var moment = require('moment');
var Hashids = require("hashids");
var lodash = require('lodash');
var shell = require('shelljs');

// ////////////////////////////////////////////////////////////////
// REQUIRE - BUILD FILES
// ////////////////////////////////////////////////////////////////

var tasks = require('./build-tasks-def.js');
var helpers = require('./build-helpers-def.js');


// ////////////////////////////////////////////////////////////////
// DEFINITIONS
// ////////////////////////////////////////////////////////////////

var buildStartTime = moment();
var watch = yargs.argv.watch;
var start = yargs.argv.start;
var environment = yargs.argv.environment;
var hashids = new Hashids("fooSaltBar", 8);
var uniqueVersionHash = hashids.encode(moment().millisecond());
var buildDir = '.';


// PRE
var preBuildTaskOptions = {
    buildDir: buildDir
};


// SCSS
var scssTaskOptions = {
    cssScssInputFile: '_page/css/main.scss',
    cssBundle: buildDir + '/generated/bundle.css',
    cssReplaceInPlace: [
        /*{
         name: 'cep-field-type-font',
         file: './stuff/3rdparty/font-cep-field-type/css/cep-field-types.css',
         match: '[.]/cep-field-types',
         replaceWith: '/fonts/cep-field-types'
         }*/
    ]
};


// JS
var jsTaskOptions = {
    jsFiles: glob.sync([
        './node_modules/clipboard/dist/clipboard.js',
        './node_modules/jquery/dist/jquery.js',
        './node_modules/jquery.scrollto/jquery.scrollTo.js',
        './node_modules/waypoints/lib/jquery.waypoints.js',
        './node_modules/lightbox2/dist/js/lightbox.js',
        './node_modules/retina.js/dist/retina.js',
        './node_modules/webcomponents.js/CustomElements.js',
        './node_modules/bootstrap/dist/js/bootstrap.js',
        './_page/js/main.js'
    ]),
    jsBundle: buildDir + '/generated/bundle.js',
    jsUglifyOptions: { }
};
if (environment === 'dev') {
    jsTaskOptions.jsUglifyOptions = {
        mangle: false,
        compress: false,
        output: {
            beautify: true
        }
    };
}


// HTML
var htmlTaskOptions = {
    htmlSourceDir: '_page/pages/',
    htmlTargetDir: buildDir,
    htmlLayoutSourceDir: '_page/layout/',
    htmlIsLocalhost: false
};
if (environment === 'dev') {
    htmlTaskOptions.htmlIsLocalhost = true;
}

// FONTS
var fontsTaskOptions = [
    {
        font: 'fontawesome',
        fontSourceDir: './node_modules/font-awesome/fonts/*',
        fontTargetDir: buildDir + '/fonts/'
    }
];

// WATCHERS
var watchers = [
    {
        what: 'html pages',
        watchGlob: './_page/**/*.html',
        watchCallback: function (filepath) {
            tasks.buildSingleHtmlPage(filepath, htmlTaskOptions);
        }
    },
    {
        what: 'html templates',
        watchGlob: './_page/layout/**/*.html',
        watchCallback: function (filepath) {
            tasks.buildHtml(htmlTaskOptions);
        }
    },
    {
        what: 'javascript',
        watchGlob: './_page/js/**/*.js',
        watchCallback: function (filepath) {
            tasks.buildJs(jsTaskOptions);
        }
    },
    {
        what: 'scss',
        watchGlob: './_page/css/**/*.scss',
        watchCallback: function (filepath) {
            tasks.buildCss(scssTaskOptions);
        }
    }
];


// ////////////////////////////////////////////////////////////////
// TASK RUN DEFINITIONS
// ////////////////////////////////////////////////////////////////

async.waterfall([
    function(waterfallProceed) {
        tasks.preBuild(preBuildTaskOptions);
        waterfallProceed(null, 'pre');
    },
    function(previousStepName, waterfallProceed) {
        async.parallel(
            [
                function(callback) { tasks.buildJs(jsTaskOptions, callback) },
                function(callback) { tasks.buildCss(scssTaskOptions, callback); },
                function(callback) { tasks.buildHtml(htmlTaskOptions, callback); },
                function(callback) { tasks.buildFonts(fontsTaskOptions, callback); }
            ],
            function () {
                waterfallProceed(null, 'build');
            }
        );
    },
    function(previousStepName, waterfallProceed) {
        if (!lodash.isUndefined(watch) && !lodash.isNull(watch) && watch === 'true') {

            /* https://github.com/Raynos/live-reload */
            console.log(('>> livereload started on port 35676').yellow);
            shell.exec('live-reload ' + buildDir + ' --port=35676 --delay=1', {async:true, silent:false});

            /* https://www.npmjs.com/package/local-web-server */
            console.log(('>> http-server started on port 8080').yellow);
            shell.exec('ws  --log-format dev --port 8080 --directory ' + buildDir , {async:true, silent:false});

            watchers.forEach(function (watcher) {
                helpers.watchFilesAndTriggerBuild(watcher.what, watcher.watchGlob, watcher.watchCallback);
            });

            /* shell.exec('opener http://localhost:8080', {async:false}); */
        }
        waterfallProceed(null, 'watch');
    },
    function(previousStepName, waterfallProceed) {
        if (!lodash.isUndefined(start) && !lodash.isNull(start) && start === 'true') {
            /* https://www.npmjs.com/package/local-web-server */
            console.log(('>> http-server started on port 9999').yellow);
            shell.exec('ws  --log-format dev --port 9999 --directory ' + buildDir , {async:true, silent:false});

            /* shell.exec('opener http://localhost:9999', {async:false}); */
        }
        waterfallProceed(null, 'startProd');
    }
], function (err, result) {
    helpers.printBuildTime(buildStartTime, moment());
    helpers.printFileSize(jsTaskOptions.jsBundle, 'bundle.js');
    helpers.printFileSize(scssTaskOptions.cssBundle, 'bundle.css');
});
