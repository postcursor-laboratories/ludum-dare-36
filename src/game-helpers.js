import {globals} from "./globals";

export class Resource {

    constructor(name, location) {
        this.name = name;
        this.location = location;
    }

    getName() {
        return this.name;
    }

    getLocation() {
        return this.location;
    }

}

export class GameConfigurable {

    static of(f) {
        let ret = new GameConfigurable();
        ret.configure = f;
        return ret;
    }

    configure(game) {
    }

}

export function setBackgroundImage(game, texture = "default-background") {
    if (!globals.backgroundImageGroup || !globals.backgroundImageGroup.game) {
        // re-init group and sprite
        const group = globals.backgroundImageGroup = game.add.group();
        game.world.sendToBack(group);
        globals.backgroundImageSprite = group.create(0, 0, texture);
        globals.backgroundImageGroup.fixedToCamera = true;
    } else {
        // just set texture
        globals.backgroundImageSprite.loadTexture(texture);
    }
    if (!globals.resizeBackground) {
        globals.resizeBackground = () => {
            globals.backgroundImageSprite.width = game.width;
            globals.backgroundImageSprite.height = game.height;
            game.world.sendToBack(globals.backgroundImageGroup);
        };
    }
    globals.resizeBackground();
}
