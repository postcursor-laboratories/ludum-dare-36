import {Stage} from "./stage-abc";
import {INIT as NAME, MENU as nextStage} from "./stage-names";

// TODO move most of main.js and game.js loading into this stage

export class InitStage extends Stage {

    constructor() {
        super(NAME);
    }

    preload() {
        this.game.load.image("transparent", "img/transparent.png");
        this.game.load.image("default-background", "img/transparent.png");
    }

    create() {
        // transfer to menu-stage
        this.state.start(nextStage);
    }

}
new InitStage();
