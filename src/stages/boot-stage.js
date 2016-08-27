import {Stage} from "./stage-abc";
import {BOOT as NAME, INIT as nextStage} from "./stage-names";

/**
 * Responsible for loading some JSON and text resources.
 * These resources should be loaded via Phaser, but they also specify images
 * and other objects we would like to load through Phaser as well.
 * So we load JSON/text here and images in InitStage.
 */
class BootStage extends Stage {

    constructor() {
        super(NAME);
    }

    preload() {
    }

    create() {
        // transfer to init-stage
        this.state.start(nextStage);
    }

}
new BootStage();
