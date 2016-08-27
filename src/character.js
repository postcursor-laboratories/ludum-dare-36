import {Entity, DIRECTION} from "./entity";

export class Character extends Entity {

    constructor(sprite, x, y, maxHealth) {
        super(sprite, x, y, maxHealth);
        this.jumpSpeed = 200;
        this.jumpAnimationCounter = 0;
        this.jumpingTime = 25;
        this.facing = DIRECTION.RIGHT;
        this.animationPriority = ["jump", "walk", "stationary"];
    }

    configure(game) {
        super.configure(game);
        this.facing = DIRECTION.RIGHT;
    }

    addAnimations(sheetWidth, animationLengths) {
        throw "cannot call base method";
    }

    attemptAnim(name, frameRate, loop) {
        if (this.canOverrideAnimation(name)) {
            this.sprite.animations.play(name, frameRate, loop, false);
            return true;
        } else {
            return false;
        }
    }

    jump() {
        this.jumpAnimationCounter = this.jumpingTime;
        super.move(DIRECTION.UP, this.jumpSpeed);
    }

    move(direction) {
        switch (direction) {
            case DIRECTION.LEFT:
                this.setFacing(DIRECTION.LEFT);
                this.sprite.body.velocity.x = Math.max(-this.moveSpeed, this.sprite.body.velocity.x - 10);
                this.attemptAnim("walk", Math.max(4, Math.round(Math.abs(this.sprite.body.velocity.x) / 15)), false);
                break;
            case DIRECTION.RIGHT:
                this.setFacing(DIRECTION.RIGHT);
                this.sprite.body.velocity.x = Math.min(this.moveSpeed, this.sprite.body.velocity.x + 10);
                this.attemptAnim("walk", Math.max(4, Math.round(Math.abs(this.sprite.body.velocity.x) / 15)), false);
                break;
            default:
                throw "Unrecognized direction in Character.move";
        }
    }

    canOverrideAnimation(animationName) {
        const currentAnim = this.sprite.animations.currentAnim;
        if (currentAnim == null || currentAnim.isFinished || !currentAnim.isPlaying) {
            return true;
        }
        return this.animationPriority.indexOf(animationName) < this.animationPriority.indexOf(currentAnim.name);
    }

    update() {
        super.update();
        this.checkCollision();

        if (this.sprite.body.touching.down || this.sprite.body.onFloor()) {
            this.sprite.body.velocity.x *= 0.8;
        } else {
            this.sprite.body.velocity.x *= 0.98;
        }

        this.attemptAnim("stationary", 4, true);

        if (this.jumpAnimationCounter > 0) {
            this.attemptAnim("jump", 5, false);
            this.jumpAnimationCounter--;
        }
    }

    setFacing(direction) {
        if (direction == DIRECTION.LEFT) {
            this.facing = direction;
            this.sprite.scale.x = -Math.abs(this.sprite.scale.x);
        } else if (direction == DIRECTION.RIGHT) {
            this.facing = direction;
            this.sprite.scale.x = Math.abs(this.sprite.scale.x);
        }
    }
}
