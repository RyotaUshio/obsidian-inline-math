import { EditorState } from '@codemirror/state';
import { MarkdownView, Plugin } from 'obsidian';
import { Extension } from '@codemirror/state';

import { DEFAULT_SETTINGS, NoMoreFlickerSettingTab, NoMoreFlickerSettings } from './settings';
import { cleanerCallback } from 'cleaner';
import { createViewPlugin } from 'decoration-and-atomic-range';
import { selectionSatisfies } from 'utils';
import { makeTransactionFilter } from 'transaction-filter';


export default class NoMoreFlicker extends Plugin {
	settings: NoMoreFlickerSettings;
	/** 
	 * a view plugin that provides
	 * - decorations to hide braces adjacent to "$"s
	 * - & atomic ranges to treat each of "${} " and " {}$" as one character
	 */
	viewPlugin: Extension[] = [];
	/** 
	 * Indicates whether the previous transaction was the first of the two transactions
	 * (1. text replacement & 2. cursor position change) that Latex Suite's "box current equation" 
	 * command produces or not. See the commend in the makeTransactionFilter() method for details.
	 */
	_latexSuiteBoxing = false;

	async onload() {

		/** Settings */
		await this.loadSettings();
		await this.saveSettings();
		this.addSettingTab(new NoMoreFlickerSettingTab(this.app, this));

		/** Editor extensions */
		this.registerEditorExtension(this.viewPlugin);
		this.remakeViewPlugin();
		this.registerEditorExtension(makeTransactionFilter(this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	shouldIgnore(state: EditorState): boolean {
		return this.settings.disableInTable && selectionSatisfies(
			state,
			node => node.name.includes("HyperMD-table") || node.name.includes("hmd-table")
		);
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
