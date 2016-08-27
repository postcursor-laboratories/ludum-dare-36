import Phaser from "phaser";
import {PLAY as NAME, BOOT as bootStageName} from "./stages/stage-names";
import * as staging from "./stages/stage-abc";
import "./stages/boot-stage";
import "./stages/init-stage";
import "./stages/menu-stage";

/**
 * A basic game container. Extend this for your actual game.
 */
export class Game extends staging.Stage {

    constructor(width, height) {
        super(NAME);
        this.preGameInit();
        this.allSprites = [];
        this.phaserGame = new Phaser.Game(width, height, Phaser.CANVAS, "gamediv");
        this.phaserGame.promethium = this;
        staging.loadAllStages(this.phaserGame);
        this.phaserGame.state.start(bootStageName);
    }

    preGameInit() {
    }

    getImages() {
        return [];
    }

    getPreLoadConfigurables() {
        return [];
    }

    getConfigurables() {
        return [];
    }

    preload() {
        // 1337 H4CK5
        var request = new XMLHttpRequest();
        request.open("GET", "config/baseurl.txt", false);
        request.send(null);

        if (request.status === 200) {
            this.phaserGame.load.baseURL = request.responseText;
        }
        let configurables = this.getPreLoadConfigurables();
        let nextConfigs = [];
        while (configurables.length > 0) {
            configurables.forEach(ele => {
                let extraConfigs = ele.configure(this.phaserGame);
                if (extraConfigs) {
                    Array.prototype.push.apply(nextConfigs, extraConfigs);
                }
            });
            configurables = nextConfigs;
            nextConfigs = [];
        }
        this.getImages().forEach(ele => {
            this.phaserGame.load.image(ele.getName(), ele.getLocation());
        });
    }

    create() {
        let configurables = this.getConfigurables();
        let nextConfigs = [];
        while (configurables.length > 0) {
            configurables.forEach(ele => {
                let extraConfigs = ele.configure(this.phaserGame);
                if (extraConfigs) {
                    Array.prototype.push.apply(nextConfigs, extraConfigs);
                }
            });
            configurables = nextConfigs;
            nextConfigs = [];
        }
    }

    msprite(cb) {
        this.allSprites.forEach(s => {
            if (!s.sprite.alive) {
                return;
            }
            cb(s);
        });
    }

    update() {
        this.msprite(s => s.update());
        this.allSprites = this.allSprites.filter(f => f.sprite.alive);
    }

    render() {
        this.msprite(s => s.render());
    }

}
