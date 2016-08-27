import {globals} from "../globals";
import {Resource, setBackgroundImage} from "../game-helpers";
import {TileMap} from "../tilemap";
import {Player} from "../player";
import {ExitArea} from "../exit-area";

function newCall(Cls, args) {
    return new (Function.prototype.bind.apply(Cls, [null].concat(args)));
}

export class Level {

    constructor(name, tileMapName, background = undefined, extraArgs = []) {
        this.name = name;
        this.tileMap = newCall(TileMap, [new Resource(tileMapName, `tilemaps/${tileMapName}.json`)].concat(extraArgs));
        this.background = background;
        this.interactables = [];
        this.objectHooks = {
            "player": this.initializePlayer,
            "exitarea": this.initializeExitArea,
            "interactable": this.initializeInteractable
        };
    }

    preloadConfigure(game) {
        this.tileMap.configure(game);
    }

    loadConfigure(game) {
        this.tileMap.getNormalConfigurable().configure(game);
    }

    enterLevel(game) {
        globals.tileMap = this.tileMap;
        globals.tileMap.loadAsWorld(game);
        if (this.background) {
            setBackgroundImage(game, this.background);
        }
        this.initializeObjectData(game);
    }

    initializeObjectData(game) {
        const forEachKV = obj => {
            return callback => {
                Object.keys(obj).forEach(k => {
                    return callback(k, obj[k]);
                });
            };
        };
        forEachKV(this.tileMap.phaserMap.objects)((name, objLayer) => {
            for (let obj of objLayer) {
                const type = obj.type;
                if (this.objectHooks[type]) {
                    this.objectHooks[type].call(this, game, obj);
                } else {
                    console.warn("Warning: no object hook found for", type);
                }
            }
        });
    }

    initializePlayer(game, obj) {
        const xy = this.tileMap.scaledCoords(obj.x + obj.width / 2, obj.y + obj.height / 2);
        this.createPlayer(game, xy[0], xy[1]);
    }

    initializeExitArea(game, obj) {
        const ourGame = game.promethium;
        const xy = this.tileMap.scaledCoords(obj.x, obj.y);
        const wh = this.tileMap.scaledCoords(obj.width, obj.height);
        ourGame.exitArea = new ExitArea(xy[0], xy[1], wh[0], wh[1]);
        ourGame.exitArea.configure(game);
    }

    initializeInteractable(game, obj) {
        const xy = this.tileMap.scaledCoords(obj.x + obj.width / 2, obj.y + obj.height / 2);
        const wh = this.tileMap.scaledCoords(obj.width, obj.height);
        this.createInteractable(game, xy[0], xy[1], wh[0], wh[1], obj.properties.image);
    }

    createPlayer(game, x, y) {
        const ourGame = game.promethium;
        ourGame.player = new Player(x, y);
        ourGame.player.configure(game);
        ourGame.player.enable(game);
        globals.player.add(ourGame.player.sprite);
    }

    createInteractable(game, x, y, width, height, image) {
        // const item = new GoldenItem(image, x, y, width, height);
        // item.configure(game);
        // item.sprite.body.allowGravity = false;
        // this.interactables.push(item);
    }

    tickLevel(game) {
    }

    exitLevel(game) {
        const ourGame = game.promethium;
        this.interactables.forEach(i => {
            i.sprite.destroy();
        });
        this.interactables = [];
        globals.tileMap.destroy();
        globals.tileMap = undefined;
        ourGame.player.destroy();
        ourGame.player = undefined;
        ourGame.exitArea.destroy();
        ourGame.exitArea = undefined;
    }

}