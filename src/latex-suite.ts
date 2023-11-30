import { Transaction, ChangeSpec, EditorState, EditorSelection, ChangeSet, SelectionRange, TransactionSpec } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';

import NoMoreFlicker from 'main';
import { isInlineMathBegin, isInlineMathEnd } from 'utils';

/**
 * This dirty function is dedicated to keeping compatibility with the following features of Latex Suite:
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
export function handleLatexSuite(tr: Transaction, plugin: NoMoreFlicker): TransactionSpec | TransactionSpec[] | undefined {

    if (tr.docChanged && !tr.selection) {
        // `tr` is the first transaction (text replacement) of Latex Suite's "box current equation" command
        const changes = handleLatexSuiteBoxing(tr.startState, tr.changes);
        if (changes) {
            plugin._latexSuiteBoxing = true;
            return { changes };
        }
    } else if (!tr.docChanged && tr.selection) {
        // !tr.docChanged is needed to filter out transactions produced by Latex Suite's matrix shortcuts feature
        if (plugin._latexSuiteBoxing) {
            // `tr` is the second transaction (text replacement) of Latex Suite's "box current equation" command
            plugin._latexSuiteBoxing = false;
            return { selection: { anchor: tr.selection.main.anchor - 3 } };	// 3 == "{} ".length					
        } else {
            // `tr` can be a transaction produced by Tabout
            const selection = handleLatexSuiteTabout(tr.startState, tr.selection);
            return [tr, { selection }];
        }
    }
}


// handle Latex Suite's tabout: https://github.com/RyotaUshio/obsidian-inline-math/issues/4
export function handleLatexSuiteTabout(state: EditorState, newSelection: EditorSelection): EditorSelection {
    const tree = syntaxTree(state);
    const doc = state.doc.toString();
    const newRanges: SelectionRange[] = [];

    for (let i = 0; i < newSelection.ranges.length; i++) {
        const range = newSelection.ranges[i];
        const indexNextDollar = doc.indexOf("$", range.to);

        if (indexNextDollar >= 0) {
            const node = tree.cursorAt(indexNextDollar, 1).node;
            if (range.from === range.to && range.to === indexNextDollar && isInlineMathEnd(node, state) && state.sliceDoc(node.from - 3, node.from) === " {}") {
                newRanges.push(EditorSelection.cursor(node.to));
                continue;
            }
        }
        newRanges.push(range);
    }

    return EditorSelection.create(newRanges, newSelection.mainIndex);
}


// handle Latex Suite's "box current equation" command: https://github.com/RyotaUshio/obsidian-inline-math/issues/5
export function handleLatexSuiteBoxing(state: EditorState, changes: ChangeSet): ChangeSpec | undefined {
    const tree = syntaxTree(state);
    let changeToReplace: ChangeSpec | undefined;

    changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
        if (inserted.toString() === "\\boxed{" + state.sliceDoc(fromA, toA) + "}") {
            const nodeFrom = tree.cursorAt(fromA, -1).node;
            const nodeTo = tree.cursorAt(toA, 1).node;

            if (isInlineMathBegin(nodeFrom, state) && isInlineMathEnd(nodeTo, state)) {
                // Change generated by Latex Suite's command "box current equation"
                if (state.sliceDoc(fromA, fromA + 3) === "{} "
                    && state.sliceDoc(toA - 3, toA) === " {}"
                ) {
                    // trim the leading "{}" and the trailing " {}"
                    changeToReplace = { from: fromA, to: toA, insert: "\\boxed{" + state.sliceDoc(fromA + 3, toA - 3) + "}" };
                    // Yes, I want to also correct the cursor position as well, but Latex Suite dispatches the replacement
                    // and cursor position change in two separate transactions, so I can't do it here.
                }
            }
        }
    });

    return changeToReplace;
}