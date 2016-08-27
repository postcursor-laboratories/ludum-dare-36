import {ExtendedSprite} from "./sprite-extension";

export class ExitArea extends ExtendedSprite {

    constructor(x, y, width, height) {
        super("transparent", x, y);
        this.width = width;
        this.height = height;
    }

    configure(game) {
        super.configure(game);
        game.physics.enable(this.sprite);
        this.sprite.width = this.width;
        this.sprite.height = this.height;
        this.sprite.body.syncBounds = true;
        this.sprite.body.allowGravity = false;
        this.sprite.body.immovable = true;
    }

    update() {
        const player = this.gameRef.promethium.player;
        if (player) {
            this.gameRef.physics.arcade.collide(this.sprite, player.sprite, () => {
                // no collision processing
            }, () => {
                this.gameRef.promethium.nextLevel();
                // deny collision
                return false;
            });
        }
    }

}
