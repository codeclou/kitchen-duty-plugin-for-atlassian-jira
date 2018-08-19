// ////////////////////////////////////////////////////////////////
// REQUIRE - 3RDPARTY
// ////////////////////////////////////////////////////////////////

var sass = require('node-sass');
var nunjucks = require('nunjucks');
nunjucks.configure({ noCache : true  });
var cleancss = require('clean-css');
var lodash = require('lodash');
var uglifyjs3 = require('uglify-js');
var colors = require('colors');
var shell = require('shelljs');
var async = require('async');
var path = require('path');
var highlightJs = require('highlight.js');
var fse = require('fs-extra');
var through2 = require('through2');
var fs = require('fs');
var glob = require('glob-all');

// ////////////////////////////////////////////////////////////////
// HIGHLIGHT JS - ADDITIONAL LANGUAGES
// ////////////////////////////////////////////////////////////////


/* Highlight JS SOY Definition Author Atlassian: https://bitbucket.org/atlassian/aui/pull-requests/378/aui-1187-adding-syntax-highlighter/diff#chg-auiplugin/src/flatpack/flatpack-extras/docs/highlightjs/ADG.css */
highlightJs.registerLanguage('soy', function(hljs) {

    var soyKeywords = {
        keyword: 'or and not if delpackage alias noAutoescape call literal private data print msg let if elseif else switch case default foreach ifempty for call param css',
        tag: 'template call param namespace sp nil \\r \\n \\t lb rb'
    };

    var param = {
        className: "symbol",
        begin: "\\$[a-zA-Z][a-zA-Z0-9_]*"
    };

    var soyString = {
        className: "string",
        begin: "\"",
        end: "[\"\\n]",
        contains: [
            param
        ]
    };

    var soyStringSingle = {
        className: "string",
        begin: "'",
        end: "['\\n]"
    };

    var soyTags = {
        className: "soyTag",
        begin: "{",
        end: "}",
        keywords: soyKeywords,
        contains: [
            soyString,
            soyStringSingle,
            param,
            {
                className: "title",
                begin: "(namespace |template |call )[a-zA-Z0-9_.]*",
                end: "(}| )",
                returnEnd: true,
                keywords: soyKeywords
            },
            {
                className: "symbol",
                begin: "param [a-zA-Z0-9_.]*",
                end: ":",
                returnEnd: true,
                keywords: soyKeywords
            }
        ]
    };
    return {
        keywords: "or and not",
        contains: [
            param,
            soyString,
            soyStringSingle,
            soyTags,
            {
                className: "comment",
                begin: "/\\*",
                end: "\\*/",
                contains: [
                    {
                        className: "attribute",
                        begin: "@param\\??\\W",
                        end: "\\W",
                        excludeBegin: true
                    }
                ]
            }
        ]
    };
});

// ////////////////////////////////////////////////////////////////
// MODULE - TASKS
// ////////////////////////////////////////////////////////////////

var helpers = require('./build-helpers-def.js');
var exports = module.exports = {};
var csStringHelper = require('./csStringHelper.js').csStringHelper;


// PRE
exports.preBuild = function(options) {
    console.log('>> pre build'.bold.cyan);
    /*shell.rm('-R', options.buildDir);
    shell.mkdir('-p', options.buildDir);*/
};


// HTML
exports.buildHtml = function (options, nextBuildStep) {
    console.log('>> build html'.bold.cyan);

    fse.walk(options.htmlSourceDir)
        .pipe(through2.obj(function (item, enc, nextFile) {
            exports.buildSingleHtmlPage(path.resolve(item.path), options, function () {
                nextFile();
            });
        }))
        .on('data', function (item) { /* do nothing since pipe does the work. */ })
        .on('end', function () {
            helpers.proceedBuild(nextBuildStep, 'buildHtml');
        });

};

exports.buildSingleHtmlPage = function (curFile, options, callback) {
    if (lodash.endsWith(curFile, '.html')) {
        var normalizedHtmlSourceDir = options.htmlSourceDir.replace(/\\/gi,'/');
        var normalizedCurrentFile = curFile.replace(/\\/gi,'/');
        var stripPathRegex = new RegExp('.*' + normalizedHtmlSourceDir, 'gi');
        var currentFileWithStrippedHtmlSourceDir = normalizedCurrentFile.replace(stripPathRegex,'');
        var activePageUrl = '/' + currentFileWithStrippedHtmlSourceDir.replace('index.html', '');
        var sourceFile = path.resolve(curFile);
        var targetFile = options.htmlTargetDir + '/' + currentFileWithStrippedHtmlSourceDir;
        var fullFilePath = path.resolve(targetFile);
        var env = nunjucks.configure(options.htmlLayoutSourceDir, {
            noCache: true
        });
        env.addGlobal('newsItemsArray', options.newsItemsArray);
        env.addGlobal('csStringHelper', csStringHelper);
        env.addFilter('json', function JSONstringify(obj) {
            return JSON.stringify(obj);
        });
        env.addFilter('formatSourceCodeForCopyClipboardDataAttribute', function(code) {
            var ret = '';
            var lines = code.split('\n');
            if (typeof lines !== 'undefined' && lines != null) {
                for (var i = 0; i < lines.length; i++) {
                    var replaced = lines[i].replace(/^[ ]*[|]/, '');
                    /* remove {{{point::3}}} flags */
                    replaced = replaced.replace(/[{]{3}point::[0-9]+[}]{3}/g, '');
                    replaced = replaced.replace(/&#123;/g, '{');
                    replaced = replaced.replace(/&#125;/g, '}');
                    ret = ret + replaced + '\n';
                }
                ret = ret.trim();
            } else {
                ret = code;
            }
            return ret;
        });
        env.addFilter('formatSourceCode', function(code, lang, uniqueId) {
            /*console.log(code);*/
            var ret = '';
            var lines = code.split('\n');
            if (typeof lines !== 'undefined' && lines != null) {
                for (var i = 0; i < lines.length; i++) {
                    var replaced = lines[i].replace(/^[ ]*[|]/, '');
                    replaced = replaced.replace(/&#123;/g, '{');
                    replaced = replaced.replace(/&#125;/g, '}');
                    ret = ret + replaced + '\n';
                }
                ret = ret.trim();
            } else {
                ret = code;
            }
            /* http://highlightjs.readthedocs.org/en/latest/api.html#highlight-name-value-ignore-illegals-continuation */
            var highlightedSource = highlightJs.highlight(lang, ret).value;
            if (uniqueId !== '') {
                return csStringHelper().replacePointsInSourceCode(highlightedSource, uniqueId);
            }
            return highlightedSource;
        });
        fs.readFile(sourceFile, 'utf8', function (err, nunjucksTemplateData) {
            if (err) {
                helpers.printError('html> read ' + currentFileWithStrippedHtmlSourceDir + ' failed');
                if (lodash.isFunction(callback)) {
                    callback();
                }
            } else {
                var htmlText = nunjucks.renderString(nunjucksTemplateData, {
                    htmlSourceDir: path.resolve(options.htmlSourceDir),
                    layoutSourceDir: path.resolve(options.htmlLayoutSourceDir),
                    isLocalhost: options.htmlIsLocalhost,
                    activePageUrl: activePageUrl,
                    isActivePage: function(url) {
                        if (activePageUrl == url) {
                            return true;
                        }
                        return false;
                    },
                    isActiveParentPage: function(url) {
                        if (activePageUrl.substring(0, url.length) == url) {
                            return true;
                        }
                        return false;
                    }
                });
                fse.outputFile(fullFilePath, htmlText, function (err) {
                    helpers.printSuccessOrError(err, 'html> write ' + targetFile);
                    if (lodash.isFunction(callback)) {
                        callback();
                    }
                });
            }
        });
    } else {
        if (lodash.isFunction(callback)) {
            callback();
        }
    }
};

// JS
exports.buildJs = function(options, nextBuildStep) {
    console.log('>> build js'.bold.cyan);
    /* glob seems to delete my array :( that's why we copy it and let glob consume the copy! */
    var jsFilesCopy = [];
    options.jsFiles.forEach(function(jsfile) {
        jsFilesCopy.push(jsfile);
    });
    var _allJsFiles = {};
    var _allJsFilesGlob = glob.sync(jsFilesCopy);
    _allJsFilesGlob.forEach(function(file) {
        _allJsFiles[file] = fs.readFileSync(file, 'utf-8');
    });
    var uglifiedResult = uglifyjs3.minify(_allJsFiles);
    console.log(uglifiedResult.error);
    fse.outputFile(options.jsBundle, uglifiedResult.code, function (err) {
        helpers.printSuccessOrError(err, 'js> write ' + options.jsBundle);
        helpers.proceedBuild(nextBuildStep, 'buildJs');
    });
};


// CSS
exports.buildCss = function(options, nextBuildStep) {
    console.log('>> build scss'.bold.cyan);

    async.each(options.cssReplaceInPlace, function(replaceItem, iteratorNext) {
        var filePath = path.resolve(replaceItem.file);
        var regex = new RegExp(replaceItem.match, 'gi');
        fs.readFile(filePath, 'utf8', function (err, fileContent) {
            if (err) {
                helpers.printIfError(err, 'css> error reading file ' + filePath);
                iteratorNext();
            } else {
                if (lodash.isNull(fileContent.match(regex))) {
                    helpers.printSuccess('css> no match found for ' + replaceItem.name);
                    iteratorNext();
                } else {
                    var replacedFileContent = fileContent.replace(regex, replaceItem.replaceWith);
                    fse.outputFile(filePath, replacedFileContent, function (err) {
                        helpers.printSuccessOrError(err, 'css> write ' + replaceItem.name);
                        iteratorNext();
                    });
                }
            }
        });
    }, function(err){
        helpers.printIfError(err, 'pre> in-place replace processing error');
        sass.render({ file: options.cssScssInputFile }, function (err, sassRenderResult) {
            if (err) {
                helpers.printError('css> scss conversion failed');
                console.log(err.formatted.red);
                helpers.proceedBuild(nextBuildStep, 'buildCss');
            } else {
                helpers.printSuccess('css> scss conversion succeeded');
                var minifiedCss = new cleancss().minify(sassRenderResult.css).styles;
                fse.outputFile(options.cssBundle, minifiedCss, function (error) {
                    helpers.printSuccessOrError(error, 'css> write ' + options.cssBundle);
                    helpers.proceedBuild(nextBuildStep, 'buildCss');
                });
            }
        });
    });
};


// FONTS
exports.buildFonts = function (options, nextBuildStep) {
    console.log('>> build fonts'.bold.cyan);
    async.each(options, function(font, iteratorNext) {
        if (!shell.test('-d', font.fontTargetDir)) {
            shell.mkdir('-p', font.fontTargetDir);
        };
        shell.cp('-Rf', font.fontSourceDir,  font.fontTargetDir);
        helpers.printSuccess('fonts> ' + font.font + ' copied');
        iteratorNext();
    }, function(err){
        helpers.printIfError(err, 'fonts> error processing fonts');
        helpers.proceedBuild(nextBuildStep, 'buildFonts');
    });
};
