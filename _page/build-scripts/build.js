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
var killport = require('killport');

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
    jsFiles: [
        './node_modules/clipboard/dist/clipboard.js',
        './node_modules/jquery/dist/jquery.js',
        './node_modules/lightbox2/dist/js/lightbox.js',
        './node_modules/retina.js/dist/retina.js',
        './node_modules/webcomponents.js/CustomElements.js',
        './node_modules/bootstrap/dist/js/bootstrap.js',
        './_page/js/main.js'
    ],
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

            console.log(('>> livereload started on port 35676').yellow);
            shell.exec('node node_modules/livereloadx/bin/livereloadx.js ' + buildDir + ' ', {async:true, silent:false});


            /* https://www.npmjs.com/package/local-web-server */
            console.log(('>> http-server started on port 7788').yellow);
            console.log(('>> go to http://localhost:7788/kitchen-duty-plugin-for-atlassian-jira/').yellow);

            killport(7788).then(function(out){
                helpers.printSuccess(' server> killed any process on port 7788 before starting server' );
            }).catch(function(err){
                helpers.printError(' server> failed to process on port 7788 before startup of server');
            });

            var express = require('express');
            var serveStatic = require('serve-static');

            var app = express();

            app.use('/kitchen-duty-plugin-for-atlassian-jira', serveStatic(buildDir, {
                maxAge: '1d'
            }));

            app.get('/', function(req, res){
                res.redirect(301, '/kitchen-duty-plugin-for-atlassian-jira/');
            });

            app.listen(7788);

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
            console.log(('>> go to http://localhost:9999/kitchen-duty-plugin-for-atlassian-jira/').yellow);

            var express = require('express');
            var serveStatic = require('serve-static');

            var app = express();

            app.use('/kitchen-duty-plugin-for-atlassian-jira', serveStatic(buildDir, {
                maxAge: '1d'
            }));

            app.get('/', function(req, res){
                res.redirect(301, '/kitchen-duty-plugin-for-atlassian-jira/');
            });

            app.listen(9999);
        }
        waterfallProceed(null, 'startProd');
    }
], function (err, result) {
    helpers.printBuildTime(buildStartTime, moment());
    helpers.printFileSize(jsTaskOptions.jsBundle, 'bundle.js');
    helpers.printFileSize(scssTaskOptions.cssBundle, 'bundle.css');
});
