export interface Key {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
}

export const asKey = (event: KeyboardEvent): Key => {
    const {key, ctrlKey, metaKey, shiftKey, altKey} = event;
    return {key, ctrlKey, metaKey, shiftKey, altKey};
};

export const is = (event: KeyboardEvent, key: Key): boolean => {
    return (
        key.key == event.key
        && key.ctrlKey == event.ctrlKey
        && key.metaKey == event.metaKey
        && key.shiftKey == event.shiftKey
        && key.altKey == event.altKey
    );
};

export const toString = (key: Key): string => {
    let ret = "";
    if (key.ctrlKey) ret += "Ctrl + ";
    if (key.shiftKey) ret += "Shift + ";
    if (key.metaKey) ret += "Neta + ";
    if (key.altKey) ret += "Alt + ";
    try {
    ret += key.key.charAt(0).toUpperCase() + key.key.slice(1);
    } catch (err) {
        console.log(key);
        throw err;
    }
    return ret;
}

export const noneKey = {
    key: "",
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
};
