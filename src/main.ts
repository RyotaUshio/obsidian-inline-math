import { EditorState, Transaction } from '@codemirror/state';
import { MarkdownView, Plugin } from 'obsidian';
import { Extension } from '@codemirror/state';

import { DEFAULT_SETTINGS, NoMoreFlickerSettingTab, NoMoreFlickerSettings } from './settings';
import { getChangesForDeletion, getChangesForInsertion, getChangesForSelection, handleLatexSuiteBoxing, handleLatexSuiteTabout } from './handlers';
import { cleanerCallback } from 'cleaner';
import { createViewPlugin } from 'decoration_and_atomic-range';
import { selectionSatisfies } from 'utils';


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
	_latexSuiteBoxing: boolean = false;

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

			if (userEvent === 'input') {
				const changes = getChangesForInsertion(tr.startState, tr.changes);
				return [tr, { changes }];
			} else if (userEvent === 'select' && tr.selection) {
				// Even if we cannot access to the new state (tr.state), 
				// we can still access to the new selection (tr.selection)!!
				const changes = getChangesForSelection(tr.startState, tr.selection);
				return [tr, { changes }];
			} else if (userEvent === 'delete') {
				const changes = getChangesForDeletion(tr.startState);
				return [tr, { changes }];
			} else if (userEvent === undefined) {
				/**
				 * This dirty block is dedicated to keeping compatibility with the following features of Latex Suite:
				 * 
				 * 1. The "box current equation" command: This command will wrap the equation that the cursor is placed on 
				 *    with a `\boxed{}`. When triggered on an inline math of the form "${} ... {}$", the hidden braces are
				 *    accidentally included in the `\boxed{}`.
				 * 
				 * 2. Tabout: When there is no braces after the cursor, pressing Tab will 
				 *    make the cursor escape from `$...$`. When there is a pair of braces after the cursor,
				 *    pressing Tab will move the cursor after the closing brace.
				 * 
				 *    This is problematic because the braces that this plugin inserts right before the closing `$`
				 *    should not be counted as braces by Tabout; it causes the cursor to be placed between " {}" and "$".
				 */

				if (tr.docChanged && !tr.selection) {
					// `tr` is the first transaction (text replacement) of Latex Suite's "box current equation" command
					const changes = handleLatexSuiteBoxing(tr.startState, tr.changes);
					if (changes) {
						this._latexSuiteBoxing = true;
						return { changes };
					}
				} else if (!tr.docChanged && tr.selection) {
					// !tr.docChanged is needed to filter out transactions produced by Latex Suite's matrix shortcuts feature
					if (this._latexSuiteBoxing) {
						// `tr` is the second transaction (text replacement) of Latex Suite's "box current equation" command
						this._latexSuiteBoxing = false;
						return { selection: { anchor: tr.selection.main.anchor - 3 } };	// 3 == "{} ".length					
					} else {
						// `tr` can be a transaction produced by Tabout
						const selection = handleLatexSuiteTabout(tr.startState, tr.selection);
						return [tr, { selection }];
					}
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
