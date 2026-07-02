import { _decorator, Button, Color, Component, Graphics, Label, Node, UITransform } from 'cc';

const { ccclass } = _decorator;

@ccclass('RuntimeEntry')
export class RuntimeEntry extends Component {
    private _root: Node | null = null;
    private _menu: Node | null = null;
    private _game: Node | null = null;
    private _startButton: Button | null = null;

    protected onLoad(): void {
        this._build();
        this._showMenu();
    }

    protected onDestroy(): void {
        if (this._startButton) {
            this._startButton.node.off(Button.EventType.CLICK, this._showGame, this);
            this._startButton = null;
        }
        this._root = null;
        this._menu = null;
        this._game = null;
    }

    private _build(): void {
        this._root = this._panel('RuntimeRoot', this.node, 480, 320, 0, 0);

        this._menu = this._panel('MenuScreen', this._root, 480, 320, 0, 0);
        this._block('MenuBg', this._menu, 440, 260, 0, 0, new Color(28, 46, 78, 255));
        this._label('Title', this._menu, 'Rollvive', 42, 0, 76, Color.WHITE);
        this._label('Subtitle', this._menu, 'Hex draft survival on Hexa-9', 16, 0, 26, new Color(220, 230, 255, 255));
        this._startButton = this._button('StartButton', this._menu, 'START', 168, 50, 0, -56);
        this._startButton.node.on(Button.EventType.CLICK, this._showGame, this);

        this._game = this._panel('GameScreen', this._root, 480, 320, 0, 0);
        this._block('GameBg', this._game, 480, 320, 0, 0, new Color(18, 22, 34, 255));
        this._label('Hud', this._game, 'Wave 1    HP 100/100    Gold 4', 16, 0, 132, new Color(230, 238, 255, 255));
        this._label('PlayerMarker', this._game, 'PLAYER', 28, 0, -8, new Color(255, 220, 120, 255));
        this._label('Prompt', this._game, 'Game screen loaded. Next step: reconnect combat systems.', 15, 0, -112, new Color(190, 205, 230, 255));
    }

    private _showMenu(): void {
        if (this._menu) this._menu.active = true;
        if (this._game) this._game.active = false;
    }

    private _showGame(): void {
        if (this._menu) this._menu.active = false;
        if (this._game) this._game.active = true;
    }

    private _panel(name: string, parent: Node, width: number, height: number, x: number, y: number): Node {
        const node = new Node(name);
        node.setParent(parent);
        node.setPosition(x, y, 0);
        node.layer = parent.layer;
        node.addComponent(UITransform).setContentSize(width, height);
        return node;
    }

    private _block(name: string, parent: Node, width: number, height: number, x: number, y: number, color: Color): Graphics {
        const node = this._panel(name, parent, width, height, x, y);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = color;
        graphics.roundRect(-width / 2, -height / 2, width, height, 8);
        graphics.fill();
        return graphics;
    }

    private _label(name: string, parent: Node, text: string, size: number, x: number, y: number, color: Color): Label {
        const node = this._panel(name, parent, 440, Math.max(32, size + 12), x, y);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = size;
        label.lineHeight = size + 8;
        label.color = color;
        return label;
    }

    private _button(name: string, parent: Node, text: string, width: number, height: number, x: number, y: number): Button {
        this._block(`${name}Bg`, parent, width, height, x, y, new Color(238, 174, 72, 255));
        const node = parent.children[parent.children.length - 1];
        const button = node.addComponent(Button);
        button.transition = Button.Transition.COLOR;
        this._label(`${name}Label`, node, text, 20, 0, 0, new Color(24, 26, 36, 255));
        return button;
    }
}
