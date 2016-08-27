import {GameConfigurable} from "./game-helpers";
import {globals} from "./globals";
import Phaser from "phaser";
import PIXI from "pixi";

function* tileLoopGen(map, layer) {
    for (let x = 0; x < layer.width; x++) {
        for (let y = 0; y < layer.height; y++) {
            var tile = map.getTile(x, y, layer);
            if (tile) {
                yield tile;
            }
        }
    }
}

function dumpTiles(map, layer) {
    for (let tile of tileLoopGen(map, layer)) {
        console.log(tile);
    }
}

/**
 *
 * @param map {Phaser.Tilemap} Map data
 * @param layers {Array.<Phaser.TilemapLayer>} Layer data
 * @param tileSets {Array.<string>} Name of tile sets
 */
function applyCollision(map, layers, tileSets) {
    map.tilesets.forEach(tset => {
        if (tileSets.indexOf(tset.name) >= 0) {
            for (let i = 0; i < tset.total; i++) {
                let props = (tset.tileProperties && tset.tileProperties[i]) || {collide: false};
                if (props.collide) {
                    const gid = tset.firstgid + i;
                    layers.forEach(layer => map.setCollision(gid, true, layer));
                }
            }
        }
    });
}

export class TileMap extends GameConfigurable {

    /**
     * @param jsonSource {Resource} JSON file to load from, as a Resource. Don't load this yourself
     * @param layers {Array.<string>} Layers to load.
     * @param tileSets {Array.<string>} Tile sets to add. They will be loaded from {@code `sprites/${name}.png`
     * @param checkCollideTileSets {Array.<string>} Check collision for these tile sets
     * @param checkCollideLayers {Array.<string>} Check collision for the tile sets on these layers
     */
    constructor(jsonSource, tileSets = ["tiles"], layers = ["ground"], checkCollideTileSets = ["tiles"], checkCollideLayers = ["ground"]) {
        super();
        this.jsonSource = jsonSource;
        this.checkCollideTileSets = checkCollideTileSets;
        this.checkCollideLayers = checkCollideLayers;
        this.tileSets = tileSets.map(name => {
            return {
                name: name,
                tsetName: `${name}TileSet`,
                spriteLocation: `sprites/${name}.png`
            };
        });
        this.layers = layers;
    }

    configure(game) {
        game.load.json(this.jsonSource.getName(), this.jsonSource.getLocation());
        game.load.tilemap(this.jsonSource.getName(), this.jsonSource.getLocation(), null, Phaser.Tilemap.TILED_JSON);
        this.tileSets.forEach(tset => game.load.image(tset.tsetName, tset.spriteLocation));
    }

    getNormalConfigurable() {
        // TODO PR phaser to load opacity from TiledJSON.
        return GameConfigurable.of(game => {
        });
    }

    loadAsWorld(game) {
        const map = game.add.tilemap(this.jsonSource.getName());
        const json = game.cache.getJSON(this.jsonSource.getName());
        const jsonLayerMap = {};
        json.layers.forEach(layer => {
            jsonLayerMap[layer.name] = layer;
        });
        this.tileSets.forEach(tset => map.addTilesetImage(tset.name, tset.tsetName));
        let largestLayer = undefined;
        this.phaserLayers = [];
        let collisionLayers = [];
        this.layers.forEach(layerName => {
            const isCollisionLayer = this.checkCollideLayers.indexOf(layerName) >= 0;
            let layer = map.createLayer(layerName);
            layer.texture.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;
            layer.setScale(2, 2);
            layer.alpha = jsonLayerMap[layerName].opacity;
            layer.sendToBack();
            this.phaserLayers.push(layer);
            if (isCollisionLayer) {
                collisionLayers.push(layer);
            }
            if (largestLayer === undefined || (layer.width > largestLayer.width || layer.height > largestLayer.height)) {
                largestLayer = layer;
            }
        });
        if (!largestLayer) {
            throw "no layers";
        }
        this.largestLayer = largestLayer;
        this.collisionLayers = collisionLayers;
        this.phaserMap = map;
        applyCollision(map, collisionLayers, this.checkCollideTileSets);
        this.largestLayer.resizeWorld();
        if (globals.resizeBackground) {
            globals.resizeBackground();
        }
        globals.collisionLayers = this.collisionLayers;
    }

    scaledCoords(x, y) {
        return [x * this.largestLayer.scale.x, y * this.largestLayer.scale.y];
    }

    destroy() {
        globals.collisionLayers = undefined;
        this.phaserMap.destroy();
        this.phaserLayers.forEach(l => {
            console.log("trashing", l);
            l.destroy();
        });
    }

}
