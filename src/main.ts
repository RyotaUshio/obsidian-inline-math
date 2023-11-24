import { EditorState, Transaction, ChangeSet, TransactionSpec } from '@codemirror/state';
import { MarkdownView, Plugin } from 'obsidian';
import { Extension } from '@codemirror/state';

import { DEFAULT_SETTINGS, NoMoreFlickerSettingTab, NoMoreFlickerSettings } from './settings';
import { getChangesForDeletion, getChangesForInsertion, getChangesForSelection } from './handlers';
import { cleanerCallback } from 'cleaner';
import { createViewPlugin } from 'decoration_and_atomic-range';
import { selectionSatisfies } from 'utils';


export default class NoMoreFlicker extends Plugin {
	settings: NoMoreFlickerSettings;
	viewPlugin: Extension[] = [];

	async onload() {

		/** Settings */

		await this.loadSettings();
		await this.saveSettings();
		this.addSettingTab(new NoMoreFlickerSettingTab(this.app, this));


		/** Editor extensions */

		this.registerEditorExtension(this.viewPlugin);
		this.remakeViewPlugin();
		this.registerEditorExtension(this.makeTransactionFilter());


		/** Clean-up commands */

		this.addCommand({
			id: "clean",
			name: "Clean up braces in this note",
			editorCallback: cleanerCallback,
		});

		this.addCommand({
			id: "clean-all",
			name: "Clean up braces in all the opened notes",
			editorCallback: this.cleanAllMarkdownViews.bind(this),
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private makeTransactionFilter() {
		return EditorState.transactionFilter.of(tr => {
			if (this.shouldIgnore(tr.startState)) {
				return tr;
			}
			const userEvent = tr.annotation(Transaction.userEvent)?.split('.')[0];
			if (userEvent) {
				if (userEvent === 'input') {
					const changes = getChangesForInsertion(tr.startState, tr.changes);
					return [tr, { changes }];
				}
				else if (userEvent === 'select' && tr.selection) {
					// Even if we cannot access to the new state (tr.state), 
					// we can still access to the new selection (tr.selection)!!
					const changes = getChangesForSelection(tr.startState, tr.selection);
					return [tr, { changes }];
				}
				else if (userEvent === 'delete') {
					const changes = getChangesForDeletion(tr.startState);
					return [tr, { changes }];
				}
			}
			return tr;
		});
	}

	private shouldIgnore(state: EditorState): boolean {
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
