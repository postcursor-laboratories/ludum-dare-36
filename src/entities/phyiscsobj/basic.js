import {Entity} from "../../entity";


export class BasicPhysicsObject extends Entity {
    constructor(image, x, y, maxHealth) {
        super(image, x, y, maxHealth);
        this.isPhysgunEnabled = true;
        this.grabbed = false;
    }
}