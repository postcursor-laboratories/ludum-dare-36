import {Level} from "./level.js";
import {BasicPhysicsObject} from "../entities/phyiscsobj/basic";


export class TestLevel extends Level {
    constructor(name, tileMapName, background = undefined, extraArgs = []) {
        super(name, tileMapName, background = undefined, extraArgs);
        this.objectHooks["physicsobj"] = this.initializePhysicsObj;
    }
    
    initializePhysicsObj(game, obj) {
        if (obj.properties.subtype == "basic") {
            var physobj = new BasicPhysicsObject(obj.properties.image, obj.x, obj.y, 100);
            physobj.configure(game);
            this.interactables.push(physobj);
        }
    }
}