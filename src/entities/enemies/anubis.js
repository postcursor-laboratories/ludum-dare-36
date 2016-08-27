import {Enemy} from "./enemy";
import {mainGame} from "../../main";
import {DIRECTION} from "../../entity";
import {globals} from "../../globals";
import {collideBox} from "../../utils/collision";

const ATTACK_DAMAGE = 10;
export class Anubis extends Enemy {

    constructor(x, y) {
        super("jackal", x, y, 100);
        this.attacking = false;
    }

    configure(game) {
        super.configure(game);
        this.sprite.animations.add("idle", [0,1]);
        this.sprite.animations.add("basicAttack", [2,3,4]);
        this.sprite.animations.play("idle", 1, true);
    }

    update() {
        console.log(this.sprite.x, this.sprite.y)
        super.update();

        let player = globals.player;
        let stillBuf = 5;

        // are we close enough to punch the player with our plunger and/or eggbeater?
        if (!this.attacking) {
            if (Math.abs(this.x - player.x) <= 40 && Math.abs(this.y - player.y) < 32) {
                this.basicAttack();
            }
        }
    }

    basicAttack() {
        this.attacking = true;
        this.sprite.animations.play("basicAttack", 5, false);
        this.sprite.animations.currentAnim.onComplete.add(event => {
            this.attacking = false;
            this.sprite.animations.play("idle", 10, true);
        });

        let hitEnemy = (other) => {
            other.wrapper.damage(ATTACK_DAMAGE);
        };

        let attackTimer = this.gameRef.time.create(true);
        attackTimer.add(750, () => {
            let facingSign = this.facing == DIRECTION.LEFT ? -1 : 1;
            collideBox(this.sprite.x+16*facingSign, this.sprite.y - 32, 32, 64, globals.player, hitEnemy);
        });
        attackTimer.start();
    }
}
