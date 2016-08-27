import {Entity, DIRECTION} from "./entity";

class Collide {
    constructor() {
        this.left = false;
        this.right = false;
        this.top = false;
        this.bottom = false;
    }
}

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
        const bod = this.sprite.body;
        bod.allowSleep = false;
        bod.fixedRotation = true;
        this.setupCollisionRectangles();
        this.facing = DIRECTION.RIGHT;
    }

    setupCollisionRectangles() {
        const CTX = "collision-sides";
        const bod = this.sprite.body;
        const width = this.sprite.width / 2;
        const height = this.sprite.height / 2;
        const x0 = -width;
        const y0 = -height;
        const x1 = width;
        const y1 = height;
        const left = bod.addRectangle(1, height * 1.75, x0, y0 + height);
        const right = bod.addRectangle(1, height * 1.75, x1, y0 + height);
        const top = bod.addRectangle(width * 1.75, 1, x0 + width, y0);
        const bottom = bod.addRectangle(width * 1.75, 1, x0 + width, y1);
        const coll = this.collide = new Collide();
        bod.onBeginContact.removeAll(CTX);
        bod.onEndContact.removeAll(CTX);
        const on = (shape, set) => {
            if (shape.id === left.id) {
                coll.left = set;
            } else if (shape.id === right.id) {
                coll.right = set;
            } else if (shape.id === top.id) {
                coll.top = set;
            } else if (shape.id === bottom.id) {
                coll.bottom = set;
            } else {
                // console.log("none", shape.id, left.id, right.id, top.id, bottom.id);
            }
        };
        bod.onBeginContact.add((p2body, body, localShape) => {
            on(localShape, true);
        }, CTX);
        bod.onEndContact.add((p2body, body, localShape) => {
            on(localShape, false);
        }, CTX);
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

        if (this.collide.bottom) {
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
