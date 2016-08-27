import {Level} from "./level.js";
import {BasicPhysicsObject} from "../entities/phyiscsobj/basic";
import {Anubis} from "../entities/enemies/anubis";

export class TestLevel extends Level {
    constructor(name, tileMapName, background = undefined, extraArgs = []) {
        super(name, tileMapName, background = undefined, extraArgs);
        this.objectHooks["enemy"] = this.initializeEnemy;
        this.objectHooks["physicsobj"] = this.initializePhysicsObj;
    }

    initializeEnemy(game, obj) {
        if (obj.properties.subtype == "jackal") {
            var enemy = new Anubis(obj.x*2,obj.y*2);
            enemy.configure(game);
            this.interactables.push(enemy);
        }
    }

    initializePhysicsObj(game, obj) {
        if (obj.properties.subtype == "basic") {
            var physobj = new BasicPhysicsObject(obj.properties.image, obj.x, obj.y, 100);
            physobj.configure(game);
            this.interactables.push(physobj);
        }
    }
}
