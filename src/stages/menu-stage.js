import {globals} from "../globals";
import {Stage} from "./stage-abc";
import {MENU as NAME, PLAY as nextStage} from "./stage-names";
import Phaser from "phaser";

class Button {

    constructor(text, x, y, padding, fontSize, color, textColor, transparency = 1, extraOptions = {}) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.padding = padding;
        this.color = color;
        this.textColor = textColor;
        this.fontSize = fontSize;
        this.transparency = transparency;
        this.extraFontOptions = extraOptions;
        this._action = () => {
        };
        let mouseIsDown = false;
        menuStage.game.input.onDown.add(() => {
            mouseIsDown = true;
        });
        menuStage.game.input.onUp.add(() => {
            if (!mouseIsDown) {
                // fake mouse event weirdness
                // phaser seems to report extra mouse events onfocus
                return;
            }
            mouseIsDown = false;
            const mouse = menuStage.game.input.mousePointer;
            if (mouse.x >= this.x && mouse.x - this.x <= this.width &&
                mouse.y >= this.y && mouse.y - this.y <= this.height) {
                this.onClick();
            }
        });
        this.setup(menuStage.group, menuStage.graphics);
    }

    setup(group, graphics) {
        const options = {
            fill: this.textColor,
            fontSize: this.fontSize
        };
        for (let k of Object.keys(this.extraFontOptions)) {
            options[k] = this.extraFontOptions[k];
        }
        const text = new Phaser.Text(menuStage.game, this.x + this.padding, this.y + this.padding, this.text, options);
        group.add(text);
        this.width = text.width + this.padding * 2;
        this.height = text.height + this.padding;
        this.produceDrawRectangle(graphics);
    }

    produceDrawRectangle(g) {
        g.beginFill(this.color, this.transparency);
        g.drawRoundedRect(this.x, this.y, this.width, this.height, this.padding);
        g.endFill();
        return g;
    }

    action(callback) {
        this._action = callback || this._action;
        return this;
    }

    onClick() {
        this._action.apply(this);
    }

}

export class MenuStage extends Stage {

    constructor() {
        super(NAME);
    }

    preload() {
        const game = this.game;
        this.graphics = game.add.graphics(0, 0);
        this.group = game.add.group();
    }

    create() {
        this.game.stage.backgroundColor = 0xFFFFFF;
        if (globals.resizeBackground) {
            globals.resizeBackground();
        }
        const title = new Phaser.Text(this.game, 0, 10, "Ludum Dare 36", {
            align: "center",
            font: "bold 50pt fontstuck",
            stroke: "#000000",
            strokeThickness: 15,
            fill: "#FFDD00"
        });
        this.group.add(title);
        title.x += title.width / 4 - 50;
        new Button("Play", (this.game.width / 2 - 200), this.game.height - 150, 10, 75, 0xFFDD00, "#000000", 1, {
            font: "fontstuck"
        }).action(() => this.exit());
    }

    exit() {
        // transfer to play-stage
        this.state.start(nextStage);
    }

}
const menuStage = new MenuStage();
