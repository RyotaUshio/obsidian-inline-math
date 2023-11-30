import { ChangeSpec, EditorState, EditorSelection, ChangeSet, Transaction, Extension } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import { isInlineMathBegin, isInlineMathEnd } from './utils';
import NoMoreFlicker from 'main';
import { handleLatexSuite } from 'latex-suite';


export const makeTransactionFilter = (plugin: NoMoreFlicker): Extension => {
    return EditorState.transactionFilter.of(tr => {
        if (plugin.shouldIgnore(tr.startState)) return tr;

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
            const spec = handleLatexSuite(tr, plugin);
            if (spec) return spec;
        }

        return tr;
    });
}


export function getChangesForDeletion(state: EditorState): ChangeSpec {
    const tree = syntaxTree(state);
    const doc = state.doc.toString();
    const changes: ChangeSpec[] = [];

    for (const range of state.selection.ranges) {
        const from = range.empty ? range.from - 4 : range.from;
        const to = range.to;
        const text = state.sliceDoc(from, to)
        const index = text.lastIndexOf("$");
        if (index == -1) {
            continue;
        }

        const indexNextDollar = doc.indexOf("$", from + index + 1);
        const indexPrevDollar = doc.lastIndexOf("$", from);

        tree.iterate({
            from: indexPrevDollar,
            to: indexNextDollar >= 0 ? indexNextDollar : to,
            enter(node) {
                if (isInlineMathBegin(node, state) && state.sliceDoc(node.to, node.to + 3) == "{} ") {
                    changes.push({ from: node.to, to: node.to + 3 });
                } else if (isInlineMathEnd(node, state) && state.sliceDoc(node.from - 3, node.from) == " {}") {
                    changes.push({ from: node.from - 3, to: node.from });
                }
            }
        });
    }

    return changes;
}


export function getChangesForInsertion(state: EditorState, changes: ChangeSet): ChangeSpec {
    const tree = syntaxTree(state);
    const changesToAdd: ChangeSpec[] = [];

    const beginningOfChanges: Map<number, boolean> = new Map();
    changes.iterChangedRanges((fromA, toA, fromB, toB) => {
        beginningOfChanges.set(fromA, true);
    });

    for (const range of state.selection.ranges) {
        if (range.from >= 1) {
            // "range.from >= 1" is necessary because
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/lastIndexOf#parameters
            // "If position is less than 0, the behavior is the same as for 0"
            const line = state.doc.lineAt(range.from);
            const indexPrevDollar = line.from + line.text.lastIndexOf("$", range.from - 1 - line.from);

            if (indexPrevDollar >= 0) {
                const node = tree.cursorAt(indexPrevDollar, 1).node;
                if (isInlineMathBegin(node, state)) {
                    if (indexPrevDollar === range.from - 1 && beginningOfChanges.has(range.from)) {
                        // without this, 
                        // inserting "a" between the leading "$" and "x" of "$x$" results in "$a{} x {}$"
                        changesToAdd.push({ from: indexPrevDollar, to: range.from, insert: "${} " });
                    } else if (state.sliceDoc(node.to, node.to + 3) !== "{} ") {
                        changesToAdd.push({ from: node.to, insert: "{} " });
                    }
                }
                else if (isInlineMathEnd(node, state) && state.sliceDoc(node.from - 3, node.from) === " {}") {
                    const openIndex = line.from + line.text.lastIndexOf("${} ", node.from - 3 - line.from);
                    changesToAdd.push({ from: openIndex + 1, to: node.from, insert: state.sliceDoc(openIndex + 4, node.from - 3).trim() });
                }
            }
        }

        const line = state.doc.lineAt(range.to);
        const indexNextDollar = line.from + line.text.indexOf("$", range.to - line.from);
        if (indexNextDollar >= 0) {
            const node = tree.cursorAt(indexNextDollar, 1).node;
            if (isInlineMathEnd(node, state)) {
                if (state.sliceDoc(node.from - 3, node.from) !== " {}") {
                    changesToAdd.push({ from: node.from, insert: " {}" });
                }
            }
            else if (isInlineMathBegin(node, state) && state.sliceDoc(node.to, node.to + 3) === "{} ") {
                const closeIndex = line.from + line.text.indexOf(" {}$", node.to + 3 - line.from,);
                if (closeIndex >= 0) {
                    changesToAdd.push({ from: node.to, to: closeIndex + 3, insert: state.sliceDoc(node.to + 3, closeIndex).trim() });
                }
            }
        }
    }

    return changesToAdd;
}


export function getChangesForSelection(state: EditorState, newSelection: EditorSelection): ChangeSpec {
    const tree = syntaxTree(state);
    const changes: ChangeSpec[] = [];

    for (let i = 0; i < newSelection.ranges.length; i++) {
        const range = newSelection.ranges[i];

        const lineFrom = state.doc.lineAt(range.from);
        const lineTo = state.doc.lineAt(range.to);

        const indexNextDollar = lineTo.from + lineTo.text.indexOf("$", range.to - lineTo.from);
        const indexPrevDollar = lineFrom.from + lineFrom.text.lastIndexOf("$", range.from - 1 - lineFrom.from);

        if (indexPrevDollar >= 0) {
            const node = tree.cursorAt(indexPrevDollar, 1).node;
            if (isInlineMathEnd(node, state) && state.sliceDoc(node.from - 3, node.from) === " {}") {
                const openIndex = lineFrom.from + lineFrom.text.lastIndexOf("${} ", node.from - 3 - lineFrom.from);
                changes.push({ from: openIndex + 1, to: node.from, insert: state.sliceDoc(openIndex + 4, node.from - 3).trim() });
            }
        }

        if (indexNextDollar >= 0) {
            const node = tree.cursorAt(indexNextDollar, 1).node;
            if (isInlineMathBegin(node, state) && state.sliceDoc(node.to, node.to + 3) === "{} ") {
                const closeIndex = lineTo.from + lineTo.text.indexOf(" {}$", node.to + 3 - lineTo.from);
                if (closeIndex >= 0) {
                    changes.push({ from: node.to, to: closeIndex + 3, insert: state.sliceDoc(node.to + 3, closeIndex).trim() });
                }
            }
        }
    }

    return changes;
}
