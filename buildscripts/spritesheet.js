"use strict";

const gulp = require("gulp");
const gspritesmith = require("gulp.spritesmith");
const layout = require("layout");
const plumber = require("gulp-plumber");
const merge = require("merge-stream");
const fs = require("fs");

const utilities = require("./util");

const FILE_DEFINED = "fileDefined";

const SPRITE_METADATA = require("../spritesheets/data");

function loadSpriteData(sheet) {
    return SPRITE_METADATA[sheet];
}

const NEWLINE = "//$NEWLINE$//";

function addAlgoForSheet(sheet) {
    const definedAlgo = FILE_DEFINED + "-" + sheet;
    const spriteData = loadSpriteData(sheet);
    const flatList = spriteData['spriteList'].map(obj => {
        if (obj.type === "normal") {
            return obj.name;
        } else if (obj.type === "newline") {
            return NEWLINE;
        }
    });
    utilities.timelog(spriteData);
    layout.addAlgorithm(definedAlgo, {
        sort: function sort(images) {
            var width = undefined;
            var height = undefined;
            images.forEach((image) => {
                if (width !== undefined) {
                    if (image.width !== width) {
                        throw "mixed widths";
                    }
                } else {
                    width = image.width;
                }
                if (height !== undefined) {
                    if (image.height !== height) {
                        throw "mixed heights";
                    }
                } else {
                    height = image.height;
                }
                var filepath = image.meta.img._filepath;
                var name = utilities.getFileName(filepath).replace(".png", "");
                let idx = flatList.indexOf(name);
                if (idx === -1) {
                    throw "no index for " + name;
                }
                image.idx = idx;
            });
            return images.sort((a, b) => a.idx - b.idx);
        }, placeItems: function placeItems(images) {
            const width = images[0].width;
            const height = images[0].height;
            let col = 0;
            let row = 0;
            let currentIndex = -1;
            images.forEach(function place(image) {
                let nextIdx = image.idx;
                while ((currentIndex + 1) !== nextIdx) {
                    // Non-continuous indexes -> check for newline
                    let data = flatList[currentIndex + 1];
                    if (data !== NEWLINE) {
                        throw `not a newline @ ${currentIndex + 1} (image idx = ${nextIdx})? wtf`;
                    }
                    row++;
                    col = 0;
                    currentIndex++;
                }
                currentIndex++;
                image.x = col * width;
                image.y = row * height;
                col++;
            });
            return images;
        }
    });
    return definedAlgo;
}
var sheetNames = Object.keys(SPRITE_METADATA);
utilities.timelog("Detected sheets", sheetNames);
var sheets = sheetNames.map(name => [name, `spritesheets/${name}/**/*.png`]);
var algorithms = (() => {
    var tmp = {};
    for (var name of sheetNames) {
        tmp[name] = addAlgoForSheet(name);
    }
    return tmp;
})();
function makeSheet(data) {
    var src = data[1];
    var spriteData = gulp.src(src);
    spriteData = spriteData.pipe(gspritesmith({
        imgName: data[0] + ".png",
        cssName: "never.used.css",
        algorithm: algorithms[data[0]]
    }));
    utilities.timelog("Making sheet:", data[0]);
    return spriteData.img.pipe(gulp.dest("bin/sprites"));
}

gulp.task("sheets", function processSheets() {
    return merge(sheets.map(sheet => makeSheet(sheet)));
});
gulp.task("sheets-watch", ["sheets"], function processSheets() {
    gulp.watch("spritesheets/**/*.png", ["sheets"]);
});
