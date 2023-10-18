import { ChangeSpec, EditorState } from '@codemirror/state';
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
        // console.log(
        //     `range: ${range.from}-${range.to}\n`
        //     + `from = ${from} \ to = ${to}\n`
        //     + `text = "${text}"\n`
        //     + `index = ${index}`
        // );
        if (index == -1) {
            continue;
        }

        const indexNextDollar = doc.indexOf("$", from + index + 1);
        const indexPrevDollar = doc.lastIndexOf("$", from);
        // console.log(
        //     `!! ${indexPrevDollar}:${indexNextDollar}: "${state.sliceDoc(indexPrevDollar, indexNextDollar)}"`
        // );

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

export function getChangesForInsertion(state: EditorState): ChangeSpec {
    const tree = syntaxTree(state);
    const doc = state.doc.toString();
    let changes: ChangeSpec[] = [];

    for (const range of state.selection.ranges) {
        const indexNextDollar = doc.indexOf("$", range.to);
        const indexPrevDollar = doc.lastIndexOf("$", range.from);

        if (indexNextDollar >= 0) {
            tree.iterate({
                from: indexPrevDollar,
                to: indexNextDollar + 1,
                enter(node) {
                    if (isInlineMathBegin(node, state)) {
                        if (!(state.sliceDoc(node.to, node.to + 3) == "{} ")) {
                            changes.push({ from: node.to, insert: "{} " });
                        }
                    } else if (isInlineMathEnd(node, state)) {
                        if (!(state.sliceDoc(node.from - 3, node.from) == " {}")) {
                            changes.push({ from: node.from, insert: " {}" });
                        }
                    }
                }
            });
        }
    }

    return changes;
}
