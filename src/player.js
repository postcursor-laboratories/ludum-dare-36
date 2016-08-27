import {DIRECTION} from "./entity";
import {Character} from "./character";
import Phaser from "phaser";

const PLAYER_HEALTH = 100;

export class Player extends Character {

    constructor(x, y) {
        super("player", x, y, PLAYER_HEALTH);
        this.moveSpeed = 250;
        this.jumpSpeed = 250;
        this.listening = false;
        this.recentlyCollided = false;
        this.animationPriority = ["kneel"].concat(this.animationPriority);
        this.kneeling = false;
    }

    configure(game) {
        super.configure(game);
        this.gameRef.camera.follow(this.sprite, Phaser.Camera.FOLLOW_PLATFORMER);

        this.setupKeys();
        this.loadAnimation();

        this.autoControlHealthBar = false;
        this.disable(game);
    }

    enable(game) {
        this.listening = true;
        this.sprite.revive();
    }

    disable(game) {
        this.listening = false;
        this.sprite.kill();
    }

    setupKeys() {
        const keyboard = this.gameRef.input.keyboard;
        const controlKeys = keyboard.createCursorKeys();
        const wasd = {
            up: false, down: false, left: false, right: false
        };
        const w = keyboard.addKey(Phaser.Keyboard.W);
        const a = keyboard.addKey(Phaser.Keyboard.A);
        const s = keyboard.addKey(Phaser.Keyboard.S);
        const d = keyboard.addKey(Phaser.Keyboard.D);
        [
            [w, "up"],
            [s, "down"],
            [a, "left"],
            [d, "right"]
        ].forEach(e => {
            const key = e[0];
            const arrow = e[1];
            key.onUp.add(() => {
                wasd[arrow] = false;
            });
            key.onDown.add(() => {
                wasd[arrow] = true;
            });
        });

        class Control {
            get up() {
                return controlKeys.up.isDown || wasd.up;
            }

            get down() {
                return controlKeys.down.isDown || wasd.down;
            }

            get left() {
                return controlKeys.left.isDown || wasd.left;
            }

            get right() {
                return controlKeys.right.isDown || wasd.right;
            }
        }
        this.controls = new Control();
    }

    loadAnimation() {
        this.setTexture("player", 0);
        this.addAnimations(4, [
            4, 4, 2, 1
        ]);
    }

    addAnimations(sheetWidth, animationLengths) {
        let names = ["walk", "stationary", "jump", "kneel"];
        let index = 0;
        animationLengths.forEach((animation, j) => {
            if (animation > sheetWidth) {
                throw "sheetWidth exceeded: " + animation + " of " + animationLengths;
            }
            let array = [];
            for (let i = 0; i < animation; i++) {
                array.push(i + index);
            }
            index += sheetWidth;
            // console.log(`${index} + ${animation} => ${names[j]} =`, array);
            this.sprite.animations.add(names[j], array);
        });
        this.sprite.animations.stop();
    }

    update() {
        this.healthBar.update(this);

        if ((this.collide.bottom || this.collide.top) && this.sprite.animations.currentAnim.name == "jump") {
            this.sprite.animations.play("stationary", 4, true);
        }

        if (this.controls.left) {
            this.move(DIRECTION.LEFT);
        } else if (this.controls.right) {
            this.move(DIRECTION.RIGHT);
        } else {
            this.attemptAnim("stationary", 4, true);
        }

        if (this.controls.down && this.collide.bottom) {
            this.keepKneeling();
        } else if (this.kneeling) {
            this.stopKneeling();
        }

        if (this.controls.up && this.collide.bottom) {
            this.jump();
        }

        if (this.jumpAnimationCounter > 0) {
            this.attemptAnim("jump", 5, false);
            this.jumpAnimationCounter--;
        }
    }

    keepKneeling() {
        this.attemptAnim("kneel", 0, false);
        this.kneeling = true;
    }

    stopKneeling() {
        this.sprite.animations.stop();
        this.kneeling = false;
    }

    setFacing(direction) {
        if (direction === DIRECTION.LEFT) {
            this.facing = direction;
            this.sprite.scale.x = -Math.abs(this.sprite.scale.x);
        } else if (direction === DIRECTION.RIGHT) {
            this.facing = direction;
            this.sprite.scale.x = Math.abs(this.sprite.scale.x);
        }
    }

}
