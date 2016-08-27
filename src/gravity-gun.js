import Phaser from "phaser";
import {globals} from "./globals";

const VELOCITY_SCALE_FACTOR = (2);
const DEFAULT_SHOT_FORCE = (5);

export function getGrabbableAtPoint(x, y) {
    for (var i = 0; i < globals.currentLevel.interactables.length; i++) {
        if (globals.phaserGame.physics.p2.hitTest(new Phaser.Point(x, y), [globals.currentLevel.interactables[i].sprite])[0]) {
            return globals.currentLevel.interactables[i];
        }
    }
    return undefined;
}

export class GravityGun {
    constructor(entity, maxRange) {
        this.controller = entity;
        this.isGrabbing = false;
        this.grabbedEntity = null;
        this.maxRange = maxRange;
    }

    grab(entity) {
        if (!entity.isPhysgunEnabled) {
            console.warn("tried to grab entity without physgun enabled!");
        }
        this.grabbedEntity = entity;
        this.grabbedEntity.grabbed = true;
        this.isGrabbing = true;
    }
    
    moveGrabbedTo(x, y) {
        if (this.grabbedEntity === null) {
            console.warn("tried to move null entity");
        }
        var controllerPos = new Phaser.Point(this.controller.sprite.position.x, this.controller.sprite.position.y);
        var targetPos = new Phaser.Point(x, y);
        var angle = controllerPos.angle(targetPos);
        var dist = controllerPos.distance(targetPos);
        dist = Math.min(dist, this.maxRange);
        var destOffset = new Phaser.Point(Math.cos(angle) * dist, Math.sin(angle) * dist);
        var destPos = Phaser.Point.add(destOffset, controllerPos);

        this.grabbedEntity.sprite.body.velocity.x = (destPos.x - this.grabbedEntity.sprite.position.x) * VELOCITY_SCALE_FACTOR;
        this.grabbedEntity.sprite.body.velocity.y = (destPos.y - this.grabbedEntity.sprite.position.y) * VELOCITY_SCALE_FACTOR;
    }

    drop() {
        this.grabbedEntity.grabbed = false;
        this.grabbedEntity = null;
        this.isGrabbing = false;
    }

    shoot(force = DEFAULT_SHOT_FORCE) {
        this.grabbedEntity.sprite.body.velocity.x = (this.grabbedEntity.sprite.position.x -
                                                     this.controller.sprite.position.x) * force;
        this.grabbedEntity.sprite.body.velocity.y = (this.grabbedEntity.sprite.position.y -
                                                     this.controller.sprite.position.y) * force;
        this.drop();
    }
    
}