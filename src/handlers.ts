import { ChangeSpec, EditorState, EditorSelection, ChangeSet, SelectionRange, TransactionSpec } from '@codemirror/state';
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
    const changesToAdd: ChangeSpec[] = [];

    const beginningOfChanges: Map<number, boolean> = new Map();
    changes.iterChangedRanges((fromA, toA, fromB, toB) => {
        beginningOfChanges.set(fromA, true);
    });

    for (const range of state.selection.ranges) {
        if (range.from >= 1) {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/lastIndexOf#parameters
            // "If position is less than 0, the behavior is the same as for 0"
            const indexPrevDollar = doc.lastIndexOf("$", range.from - 1);

            if (indexPrevDollar >= 0) {
                const node = tree.cursorAt(indexPrevDollar, 1).node;
                if (isInlineMathBegin(node, state)) {
                    if (indexPrevDollar === range.from - 1 && beginningOfChanges.has(range.from)) {
                        // without this, 
                        // inserting "a" between the leading "$" and "x" of "$x$" results in "$a{} x {}$"
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
    const changes: ChangeSpec[] = [];

    for (let i = 0; i < newSelection.ranges.length; i++) {
        const range = newSelection.ranges[i];
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
                    changeToReplace ={ from: fromA, to: toA, insert: "\\boxed{" + state.sliceDoc(fromA + 3, toA - 3) + "}" };                        
                    // Yes, I want to also correct the cursor position as well, but Latex Suite dispatches the replacement
                    // and cursor position change in two separate transactions, so I can't do it here.
                }
            }
        }
    });

    return changeToReplace;
}