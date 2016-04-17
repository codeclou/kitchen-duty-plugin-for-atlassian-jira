var Imagemin = require('imagemin');
var imageminOptipng = require('imagemin-optipng');

var helpers = require('./build-helpers-def.js');
var colors = require('colors');

console.log('>> img build'.bold.cyan);

function runCallback(err, files) {
    if (err) {
        helpers.printError(' img> failed to process images');
        helpers.printError(' img> ' + err);
    } else {
        files.forEach(function (file) {
            console.log('        ' + file.path);
        });
        helpers.printSuccess(' img> done');
    }
}

new Imagemin()
    .src('_images/*.{gif,jpg,png,svg}')
    .dest('images')
    .use(Imagemin.jpegtran({progressive: true}))
    .use(imageminOptipng({optimizationLevel: 3}))
    .run(runCallback);

new Imagemin()
    .src('_images/doc/*.{gif,jpg,png,svg}')
    .dest('images/doc/')
    .use(Imagemin.jpegtran({progressive: true}))
    .use(imageminOptipng({optimizationLevel: 3}))
    .run(runCallback);

new Imagemin()
    .src('_images/drawings/*.{gif,jpg,png,svg}')
    .dest('images/drawings/')
    .use(Imagemin.jpegtran({progressive: true}))
    .use(imageminOptipng({optimizationLevel: 3}))
    .run(runCallback);

new Imagemin()
    .src('_images/interactive/*.{gif,jpg,png,svg}')
    .dest('images/interactive/')
    .use(Imagemin.jpegtran({progressive: true}))
    .use(imageminOptipng({optimizationLevel: 3}))
    .run(runCallback);
