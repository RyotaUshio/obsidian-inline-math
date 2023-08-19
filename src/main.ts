import { Prec } from '@codemirror/state';
import { MarkdownView, Plugin } from 'obsidian';
import { EditorView } from '@codemirror/view';

import { decorator } from './decoration_and_atomic-range';
import { DEFAULT_SETTINGS, NoMoreFlickerSettingTab, NoMoreFlickerSettings } from './settings';
import { deletionHandler, insertionHandler } from './handlers';
import { is } from './key';
import { cleanerCallback } from 'cleaner';


export default class NoMoreFlicker extends Plugin {
	settings: NoMoreFlickerSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new NoMoreFlickerSettingTab(this.app, this));

		this.registerEditorExtension(decorator);
		this.registerEditorExtension(Prec.highest(EditorView.domEventHandlers({
			"keydown": this.onKeydown.bind(this)
		})));

		this.addCommand({
			id: "clean",
			name: "Clean up brackets in this note",
			editorCallback: cleanerCallback,
		});

		this.addCommand({
			id: "clean-all", 
			name: "Clean up brackets in all the opened notes",
			editorCallback: this.cleanAllMarkdownViews.bind(this),
		});
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
		} else if (!event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) {
			insertionHandler(view);
		}
	}

	private isDeletion(event: KeyboardEvent): boolean {
		return this.settings.deletionKeys.some((key) => is(event, key));
	}

	private cleanAllMarkdownViews() {
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.view instanceof MarkdownView) {
				cleanerCallback(leaf.view.editor);
			}
		});		
	}
}
