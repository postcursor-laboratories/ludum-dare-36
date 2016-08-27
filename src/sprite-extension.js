import {GameConfigurable} from "./game-helpers";
import {globals} from "./globals";

/**
 * A wrapper around a Phaser sprite. Essentially just a little interfacing.
 */
export class ExtendedSprite extends GameConfigurable {

    constructor(image, x, y, group = undefined) {
        super();
        this.__unconstructedData = {
            image: image,
            x: x,
            y: y,
            group: group
        };
        this.initImage = image;
        this.__gameSprite = undefined;
        this.gameRef = undefined;
        this.collideCallback = null;
    }

    configure(game) {
        let data = this.__unconstructedData;
        let group = data.group;
        this.__unconstructedData = undefined;
        this.gameRef = game;
        let addSprite = group ? group.create.bind(group) : game.add.sprite.bind(game.add);
        this.__gameSprite = addSprite(data.x, data.y, data.image);
        this.sprite.extension = this;
        game.promethium.allSprites.push(this);
    }

    destroy() {
        const index = this.gameRef.promethium.allSprites.indexOf(this);
        if (index == -1) {
            console.warn("ASKED TO DESTROY", this, "BUT NOBODY CAME");
        } else {
            this.gameRef.promethium.allSprites.splice(index, 1);
        }
        this.sprite.destroy();
    }

    set x(x) {
        (this.__unconstructedData || this.__gameSprite).x = x;
    }

    get x() {
        return (this.__unconstructedData || this.__gameSprite).x;
    }

    set y(y) {
        (this.__unconstructedData || this.__gameSprite).y = y;
    }

    get y() {
        return (this.__unconstructedData || this.__gameSprite).y;
    }

    set group(group) {
        this.__unconstructedData.group = group;
    }

    get group() {
        return this.__unconstructedData.group;
    }

    get sprite() {
        if (this.__gameSprite) {
            return this.__gameSprite;
        }
        throw "game sprite not initialized";
    }

    /**
     * Call {@code fn} with a lexical this of the phaser sprite.
     * Also passes the sprite in as a parameter.
     * @param fn - The configure function
     */
    configureSprite(fn) {
        fn.call(this.sprite, this.sprite);
    }

    get position() {
        return [this.x, this.y];
    }

    set position(xy) {
        this.x = xy[0];
        this.y = xy[1];
    }

    update() {
    }

    render() {
        //this.gameRef.debug.body(this.sprite);
    }

    checkCollision() {
        let any = false;
        if (globals.collisionLayers) {
            globals.collisionLayers.forEach(layer => any |= this.gameRef.physics.arcade.collide(this.sprite, layer, this.collideCallback));
        }
        return any;
    }

    setTexture(texture, frame = undefined) {
        let args = [texture];
        if (frame !== undefined) {
            args.push(frame);
        }
        this.sprite.animations.stop();
        this.sprite.loadTexture.apply(this.sprite, args);
    }

}
