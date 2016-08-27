// Entry point: initialize babel-polyfill
import "babel-polyfill";
import {GameConfigurable, Resource} from "./game-helpers";
import {Game} from "./game";
import Phaser from "phaser";
import {globals} from "./globals";
import {HUD} from "./hud";
import {TestLevel} from "./levels/test-level";

class MainGame extends Game {

    constructor() {
        super(960, 640);
        this.currentLevel = null;
        this.player = null;
        this.triggered = false;
        globals.phaserGame = this.phaserGame;
    }

    preGameInit() {
        this.levels = [
            new TestLevel("test", "test")
        ];
    }

    getImages() {
        return [
        ];
    }

    getPreLoadConfigurables() {
        return [
            GameConfigurable.of(game => game.load.spritesheet("player", "sprites/player.png", 32, 32)),
            GameConfigurable.of(game => game.load.spritesheet("jackal", "sprites/jackal.png", 32, 32)),
            GameConfigurable.of(game => game.load.spritesheet("rock", "sprites/physicsobj/rock.png", 32, 32))
        ].concat(this.levels.map(l => GameConfigurable.of(game => l.preloadConfigure(game))));
    }

    getConfigurables() {
        return [
            GameConfigurable.of(game => this.configure(game))
        ].concat(this.levels.map(l => GameConfigurable.of(game => l.loadConfigure(game))))
            .concat(GameConfigurable.of(game => this.enterLevel(this.levels[0])));
    }

    configure(game) {
        game.physics.startSystem(Phaser.Physics.P2JS);
        globals.platformGroup = game.add.group();
        globals.enemyGroup = game.add.group();
        globals.player = game.add.group();
        globals.bulletsGroup = game.add.group();
        game.physics.p2.gravity.y = 300;
        game.stage.smoothed = false;
        game.stage.backgroundColor = 0xFFFFFF;

        return [
            this.hud = new HUD()
        ];
    }

    enterLevel(level) {
        if (this.currentLevel) {
            this.currentLevel.exitLevel(this.phaserGame);
        }
        this.currentLevel = level;
        globals.currentLevel = level;
        this.currentLevel.enterLevel(this.phaserGame);
    }

    nextLevel() {
        // Hmm. Could be better. Not today.
        const current = this.levels.indexOf(this.currentLevel);
        if (current >= 0) {
            if (this.levels.length == current + 1) {
                // ah!
                if (!this.triggered) {
                    alert("You win!");
                }
                this.triggered = true;
                return;
            }
            const nextLevel = this.levels[current + 1];
            this.enterLevel(nextLevel);
        }
    }

    update() {
        if (this.currentLevel) {
            this.currentLevel.tickLevel(this.phaserGame);
        }
        return super.update();
    }

    render() {
        return super.render();
    }
}
window.onload = () => {
    new MainGame();
};
