"use strict";

const browserify = require("browserify");
const gulp = require("gulp");
const connect = require("gulp-connect");
const plumber = require("gulp-plumber");
const sourcemaps = require("gulp-sourcemaps");
const watch = require("gulp-watch");
const fs = require("fs");
const mkdirp = require("mkdirp");
const merge = require("merge");
const path = require("path");

const utilities = require("./buildscripts/util");
const timelog = utilities.timelog;
const magicTouchFile = utilities.magicTouchFile;

require("./buildscripts/spritesheet");

// Eww.
var preludeFilePath = path.resolve("./node_modules/browser-pack/prelude.js");
var preludeText = fs.readFileSync(preludeFilePath, {encoding: "utf8"});

// Ensure bin exists
mkdirp.sync("./bin/");
var pages = ["main"].map(function (page) {
        return page + ".js";
    }),
    inputs = pages.map(function (page) {
        return "./src/" + page;
    }),
    outputs = pages.map(function (page) {
        return "./bin/" + page;
    });

function commonTransform(customOpts, watch) {
    var defaults = {
        debug: true,
        prelude: preludeText,
        preludePath: "browserify-prelude.js"
    };
    var opts = merge(defaults, customOpts);
    if (watch) {
        console.log("Enabling watchify");
        opts = merge({
            cache: {},
            packageCache: {},
            plugin: [["watchify", {
                poll: true
            }]]
        }, opts);
    }
    console.log("Using options", JSON.stringify(opts, null, 4));
    var b = browserify(inputs, opts);
    console.log("Applying babelify");
    b = b.transform("babelify");
    console.log("Applying browserify-shim");
    b = b.transform("browserify-shim");
    var doBundle = function doBundle() {
        timelog("Bundling again!");
        return b.bundle(
            function err(err) {
                if (!err) {
                    return;
                }
                timelog("An error occured:");
                console.error(err.toString());
                if (err.codeFrame) {
                    console.error(err.codeFrame);
                }
            })
        //.pipe(showProgress(process.stdout))
            .pipe(fs.createWriteStream(magicTouchFile("bin/game.js")))
            .on("finish", function () {
                timelog("done bundling");
            });
    };
    b.on("update", doBundle);
    b.on("log", function log(msg) {
        timelog(msg);
    });
    b.on("error", function (err) {
        timelog("Browserify error", err.message);
        this.emit("end");
    });
    b.on("transform", function (tr, file) {
        timelog("Applying " + tr.constructor.name + " to " + file);
    });
    return doBundle();
}

gulp.task("transform", function () {
    return commonTransform({}, false);
});
gulp.task("transform-on-my-watch", function () {
    return commonTransform({}, true);
});
// setup gulp.copy
gulp.copy = function (src, dest, doWatch) {
    var stream = gulp.src(src);
    if (doWatch) {
        stream = stream.pipe(watch(src)).pipe(plumber());
    }
    return stream.pipe(gulp.dest(dest));
};
function write(text, file) {
    utilities.magicTouchFile(file);
    fs.writeFile(file, text);
}
gulp.task("write-base-url", function () {
    write(require("process").env.LD_BASE_URL || "/", "bin/config/baseurl.txt");
});
gulp.task("copy-static", function () {
    return gulp.copy(["static/**"], "bin", false);
});
gulp.task("copy-static-on-my-watch", function () {
    gulp.copy(["static/**"], "bin", true);
});
gulp.task("site", ["transform", "copy-static", "sheets", "write-base-url"]);
gulp.task("dev-server", ["transform-on-my-watch", "copy-static-on-my-watch", /*"sheets-watch",*/ "write-base-url"], function () {
    connect.server({
        root: "bin",
        port: 1337,
        livereload: true
    });
});
