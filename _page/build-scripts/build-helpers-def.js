// ////////////////////////////////////////////////////////////////
// REQUIRE - 3RDPARTY
// ////////////////////////////////////////////////////////////////

var moment =    require('moment');
require('moment-duration-format');
var gaze =      require('gaze');
var colors =    require('colors');
var lodash =    require('lodash');
var fs =        require('fs');
var filesize =  require('filesize');

// ////////////////////////////////////////////////////////////////
// MODULE - HELPERS
// ////////////////////////////////////////////////////////////////

var exports = module.exports = {};

exports.printBuildTime = function (startDateMoment, endDateMoment) {
    var durationMilliSeconds = endDateMoment.toDate().getTime() - startDateMoment.toDate().getTime();
    var duration = moment.duration(durationMilliSeconds, 'ms').format('m [min] s [sec] S [ms]');
    console.log(('>> build time: ' + duration ).magenta);
};

exports.watchFilesAndTriggerBuild = function (what, fileGlob, callback) {
    console.log(('>> watching: ' + what + ' with glob: ' + fileGlob).yellow);
    gaze(fileGlob, function() {
        this.on('changed', function(filepath) {
            console.log(('>> watcher triggered for ' + what + ' (' + filepath + ' = changed)').yellow);
            callback(filepath);
        });
        this.on('added', function(filepath) {
            console.log(('>> watcher triggered for ' + what + ' (' + filepath + ' = added)').yellow);
            callback(filepath);
        });
        this.on('deleted', function(filepath) {
            console.log(('>> watcher triggered for ' + what + ' (' + filepath + ' = deleted)').yellow);
            // FIXME: deleted
            callback(filepath);
        });
    });
};

exports.proceedBuild = function (callback, currentStepName) {
    if (lodash.isFunction(callback)) {
        callback(null, currentStepName);
    }
};

exports.printIfError = function (err, message) {
    if (err) {
        console.log(('   \u2717 ' + message).red);
    }
};

exports.printSuccessOrError = function (err, message) {
    if (err) {
        console.log(('   \u2717 ' + message + ' failed').red);
    } else {
        console.log(('   \u2713 ' + message + ' succeeded').green);
    }
};

exports.printSuccess = function (message) {
    console.log(('   \u2713 ' + message).green);
};

exports.printError = function (message) {
    console.log(('   \u2717 ' + message).red);
};


exports.printFileSize = function (fullFilePath, fileNameShort) {
    fs.stat(fullFilePath, function(err, stats) {
        console.log(('>> size of ' + fileNameShort + ' = ' + filesize(stats['size'])).magenta);
    });
};
