import { ChangeSpec, EditorState, EditorSelection, ChangeSet } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';

import { isInlineMathBegin, isInlineMathEnd, printNode } from './utils';


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
                // printNode(node, state);
                if (isInlineMathBegin(node, state)
                    && state.sliceDoc(node.to, node.to + 3) == "{} ") {
                    changes.push({ from: node.to, to: node.to + 3 });
                } else if (isInlineMathEnd(node, state)
                    && state.sliceDoc(node.from - 3, node.from) == " {}") {
                    changes.push({ from: node.from - 3, to: node.from });
                }
            }
        });
    }

    return changes;
}

export function getChangesForInsertion(state: EditorState, changes: ChangeSet): ChangeSpec {
    const tree = syntaxTree(state);
    const doc = state.doc.toString();
    let changesToAdd: ChangeSpec[] = [];

    const changesWithLeadingWhitespace: Map<number, boolean> = new Map();
    changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
        if (inserted.toString().startsWith(' ')) {
            changesWithLeadingWhitespace.set(fromA, true);
        }
    });

    for (const range of state.selection.ranges) {
        if (range.from >= 1) {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/lastIndexOf#parameters
            // "If position is less than 0, the behavior is the same as for 0"
            const indexPrevDollar = doc.lastIndexOf("$", range.from - 1);

            if (indexPrevDollar >= 0) {
                const node = tree.cursorAt(indexPrevDollar, 1).node;
                if (isInlineMathBegin(node, state)) {
                    if (indexPrevDollar === range.from - 1 && changesWithLeadingWhitespace.has(range.from)) {
                        changesToAdd.push({ from: indexPrevDollar, to: range.from, insert: "${} " });
                        continue;
                    }

                    if (state.sliceDoc(node.to, node.to + 3) !== "{} ") {
                        changesToAdd.push({ from: node.to, insert: "{} " });
                    }
                }
                else if (isInlineMathEnd(node, state) && state.sliceDoc(node.from - 3, node.from) === " {}") {
                    const openIndex = doc.lastIndexOf("${} ", node.from - 3);
                    changesToAdd.push({ from: openIndex + 1, to: node.from, insert: doc.slice(openIndex + 4, node.from - 3).trim() });
                }
            }
        }

        const indexNextDollar = doc.indexOf("$", range.to);
        if (indexNextDollar >= 0) {
            const node = tree.cursorAt(indexNextDollar, 1).node;
            if (isInlineMathEnd(node, state)) {
                if (state.sliceDoc(node.from - 3, node.from) !== " {}") {
                    changesToAdd.push({ from: node.from, insert: " {}" });
                }
            }
            else if (isInlineMathBegin(node, state) && state.sliceDoc(node.to, node.to + 3) === "{} ") {
                const closeIndex = doc.indexOf(" {}$", node.to + 3);
                if (closeIndex >= 0) {
                    changesToAdd.push({ from: node.to, to: closeIndex + 3, insert: doc.slice(node.to + 3, closeIndex).trim() });
                }
            }
        }
    }

    return changesToAdd;
}

export function getChangesForSelection(state: EditorState, newSelection: EditorSelection): ChangeSpec {
    const tree = syntaxTree(state);
    const doc = state.doc.toString();
    let changes: ChangeSpec[] = [];

    for (const range of newSelection.ranges) {
        const indexNextDollar = doc.indexOf("$", range.to);
        const indexPrevDollar = doc.lastIndexOf("$", range.from - 1);

        if (indexPrevDollar >= 0) {
            const node = tree.cursorAt(indexPrevDollar, 1).node;
            if (isInlineMathEnd(node, state) && state.sliceDoc(node.from - 3, node.from) === " {}") {
                const openIndex = doc.lastIndexOf("${} ", node.from - 3);
                changes.push({ from: openIndex + 1, to: node.from, insert: doc.slice(openIndex + 4, node.from - 3).trim() });
            }
        }

        if (indexNextDollar >= 0) {
            const node = tree.cursorAt(indexNextDollar, 1).node;
            if (isInlineMathBegin(node, state) && state.sliceDoc(node.to, node.to + 3) === "{} ") {
                const closeIndex = doc.indexOf(" {}$", node.to + 3);
                if (closeIndex >= 0) {
                    changes.push({ from: node.to, to: closeIndex + 3, insert: doc.slice(node.to + 3, closeIndex).trim() });
                }
            }
        }
    }

    return changes;
}
