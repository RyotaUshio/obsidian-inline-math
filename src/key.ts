export class Key {
    constructor(
        public key: string,
        public ctrlKey: boolean,
        public metaKey: boolean,
        public shiftKey: boolean,
        public altKey: boolean,
    ) {}

    is(event: KeyboardEvent): boolean {
        return JSON.stringify(Key.fromEvent(event)) == JSON.stringify(this);
    }

    toStr(): string {
        let ret = "";
        if (this.ctrlKey) ret += "Ctrl + ";
        if (this.shiftKey) ret += "Shift + ";
        if (this.metaKey) ret += "Neta + ";
        if (this.altKey) ret += "Alt + ";
        ret += this.key.charAt(0).toUpperCase() + this.key.slice(1);
        return ret;
    }

    static fromEvent(event: KeyboardEvent): Key {
        const {key, ctrlKey, shiftKey, metaKey, altKey} = event;
        return new Key(key, ctrlKey, shiftKey, metaKey, altKey);
    }

    static modifierNames = {
        ctrlKey: "Ctrl",
        metaKey: "Meta",
        shiftKey: "Shift",
        altKey: "Alt",
    }

    static none = new Key("", false, false, false, false);
}
