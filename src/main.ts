import { MarkdownView, Plugin } from 'obsidian';
import { Extension, Prec } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

import { DEFAULT_SETTINGS, NoMoreFlickerSettingTab, NoMoreFlickerSettings } from './settings';
import { deletionHandler, insertionHandler } from './handlers';
import { is } from './key';
import { cleanerCallback } from 'cleaner';
import { createViewPlugin } from 'decoration_and_atomic-range';
import { shouldIgnore } from 'utils';


export default class NoMoreFlicker extends Plugin {
	settings: NoMoreFlickerSettings;
	viewPlugin: Extension[] = [];

	async onload() {
		
		/** Settings */
		
		await this.loadSettings();
		await this.saveSettings();
		this.addSettingTab(new NoMoreFlickerSettingTab(this.app, this));


		/** Decorations & atomic ranges */

		this.registerEditorExtension(this.viewPlugin);
		this.remakeViewPlugin();


		/** Key event handlers */

		this.registerEditorExtension(Prec.highest(EditorView.domEventHandlers({
			"keydown": this.onKeydown.bind(this)
		})));


		/** Clean-up commands */

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
		if (shouldIgnore(view.state)) {
			return;
		}

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

	remakeViewPlugin() {
		this.viewPlugin.length = 0;
		this.viewPlugin.push(createViewPlugin(this));
		this.app.workspace.updateOptions();
	}
}
