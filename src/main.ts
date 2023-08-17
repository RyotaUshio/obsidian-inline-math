import { Prec } from '@codemirror/state';
import { Plugin } from 'obsidian';
import { EditorView } from '@codemirror/view';

import { decorator } from './decoration_and_atomic-range';
import { DEFAULT_SETTINGS, NoMoreFlickerSettingTab, NoMoreFlickerSettings } from './settings';
import { deletionHandler, insertionHandler } from 'handlers';


export default class NoMoreFlicker extends Plugin {
	settings: NoMoreFlickerSettings;

	async onload() {
		await this.loadSettings();

		// this.addSettingTab(new NoMoreFlickerSettingTab(this.app, this));

		this.registerEditorExtension(decorator);
		this.registerEditorExtension(Prec.highest(EditorView.domEventHandlers({
			"keydown": this.onKeydown.bind(this)
		})));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private onKeydown(event: KeyboardEvent, view: EditorView) {
		if (this.isDeletion(event)) {
			deletionHandler(view);
		} else {
			insertionHandler(view);
		}
	}

	private isDeletion(event: KeyboardEvent): boolean {
		return event.key == "Backspace" || (event.ctrlKey && event.key == "h");
		// let ret = false;
		// for (const key of this.settings.deletionKeys) {
		// 	console.log(key.is);
		// }
		// return false;
	}
}
