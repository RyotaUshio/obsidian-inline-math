import { App, ButtonComponent, PluginSettingTab, Setting } from "obsidian";

import NoMoreFlicker from "./main";
import { Key, asKey, noneKey, toString } from "./key";


export interface NoMoreFlickerSettings {
    deletionKeys: Key[];
}


export const DEFAULT_SETTINGS: NoMoreFlickerSettings = {
    deletionKeys: [
        {
            key: "Backspace",
            ctrlKey: false,
            metaKey: false,
            shiftKey: false,
            altKey: false,
        }, 
        {
            key: "h",
            ctrlKey: true,
            metaKey: false,
            shiftKey: false,
            altKey: false,
        }        
    ]
};


export class NoMoreFlickerSettingTab extends PluginSettingTab {
    plugin: NoMoreFlicker;

    constructor(app: App, plugin: NoMoreFlicker) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        const setting = new Setting(containerEl).setName('Register deletion keys');
        const list = containerEl.createEl('ul');

        const listDeletionKeys = () => {
            list.replaceChildren(
                ...this.plugin.settings.deletionKeys.map((key: Key) => {
                    const item = createEl('li', { text: "" });
                    new Setting(item)
                        .setName(toString(key))
                        .addExtraButton((btn) => {
                            btn.setIcon('x')
                                .onClick(async () => {
                                    this.plugin.settings.deletionKeys.remove(key);
                                    listDeletionKeys();
                                    await this.plugin.saveSettings();
                                });
                        });
                    return item;
                })
            );
        };

        listDeletionKeys();

        setting.addButton((button) => {
            button
                .setIcon("plus")
                .onClick(() => {
                    this.plugin.settings.deletionKeys.push(noneKey);
                    button.setButtonText("Press deletion keys...")
                    this.plugin.registerDomEvent(button.buttonEl, "keydown", (event: KeyboardEvent) => {
                        this.plugin.settings.deletionKeys[this.plugin.settings.deletionKeys.length - 1] = asKey(event);
                        listDeletionKeys();
                        if (list.lastChild instanceof HTMLElement) {
                            new ButtonComponent(list.lastChild)
                                .setButtonText("Save")
                                .onClick(async () => {
                                    await this.plugin.saveSettings();
                                    button.setIcon("plus");
                                })
                        }
                    });
                });
        });

        new Setting(containerEl)
            .addButton((button) => {
                button.setButtonText("Restore defaults")
                    .onClick(async () => {
                        this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS);
                        listDeletionKeys();
                        await this.plugin.saveSettings();
                    });
            })
    }



}


// function toStr(k: Key): string {
//     const modifierStr = Object.keys(k.modifiers)
//         .filter((key: keyof ModifierSpec) => k.modifiers[key])
//         .map((key: keyof ModifierSpec) => Key.modifierNames[key])
//         .join(" + ");
//     return (modifierStr ? modifierStr + " + " : "") + k.key.charAt(0).toUpperCase() + k.key.slice(1);
// }
