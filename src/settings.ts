import { App, PluginSettingTab, Setting } from "obsidian";
import NoMoreFlicker from "./main";


export interface NoMoreFlickerSettings {
    disableInTable: boolean;
    disableOnIME: boolean;
    disableDecorations: boolean;
    disableAtomicRanges: boolean;
}


export const DEFAULT_SETTINGS: NoMoreFlickerSettings = {
    disableInTable: false,
    disableOnIME: true,
    disableDecorations: false,
    disableAtomicRanges: false,
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

        new Setting(containerEl)
            .setName("Disable in tables")
            .setDesc("If turned on, braces won't be inserted in tables. Decorations & atomic ranges are enabled regardless of this setting.")
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.disableInTable)
                    .onChange(async (disable) => {
                        this.plugin.settings.disableInTable = disable;
                        await this.plugin.saveSettings();
                    })
            });

        new Setting(containerEl)
            .setName("Disable when using IME input")
            .setDesc("This option can be helpful for avoiding some strange behavior occurring when using IME inputs after escaping from a math block with the Latex Suite plugin's tabout feature.")
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.disableOnIME)
                    .onChange(async (disable) => {
                        this.plugin.settings.disableOnIME = disable;
                        await this.plugin.saveSettings();
                    })
            });

        containerEl.createEl("h4", { text: "Debug mode" })
        new Setting(containerEl)
            .setName("Disable decorations")
            .setDesc("If turned on, decorations to hide braces adjacent to dollar signs are disabled.")
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.disableDecorations)
                    .onChange(async (disable) => {
                        this.plugin.settings.disableDecorations = disable;
                        this.plugin.remakeViewPlugin();
                        await this.plugin.saveSettings();
                    })
            });
        new Setting(containerEl)
            .setName("Disable atomic ranges")
            .setDesc(createFragment((el) => {
                el.createSpan({ text: "If turned on, atomic ranges to treat each of \"" });
                el.createEl("code", { text: "${} " });
                el.createSpan({ text: "\" or \"" });
                el.createEl("code", { text: " {}$" });
                el.createSpan({ text: "\" as one character are disabled." });
            }))
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.disableAtomicRanges)
                    .onChange(async (disable) => {
                        this.plugin.settings.disableAtomicRanges = disable;
                        this.plugin.remakeViewPlugin();
                        await this.plugin.saveSettings();
                    })
            });

        new Setting(containerEl)
            .addButton((button) => {
                button.setButtonText("Restore defaults")
                    .onClick(async () => {
                        this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS);
                        await this.plugin.saveSettings();
                        this.display();
                    });
            });
    }
}
