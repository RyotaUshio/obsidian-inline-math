import { syntaxTree } from '@codemirror/language';
import { EditorView } from '@codemirror/view';

import { BRACKET_MATH, INLINE_MATH_BEGIN, MATH_END } from './node_names';
import { nodeText } from './utils';


export function deletionHandler(view: EditorView) {
    const range = view.state.selection.main;
    const from = range.empty ? range.from - 1 : range.from;
    const to = range.to;
    const text = view.state.sliceDoc(from, to)
    const index = text.lastIndexOf("$");
    if (index == -1) {
        return;
    }

    const indexNextDollar = view.state.doc.toString().indexOf("$", from + index + 1);
    const tree = syntaxTree(view.state);
    let insideInlineMath = false;
    tree.iterate({
        from: from + index,
        to: indexNextDollar,
        enter(node) {
            const next = node.node.nextSibling;
            if (node.name == INLINE_MATH_BEGIN) {
                insideInlineMath = true;
            } else if (insideInlineMath
                && node.name == BRACKET_MATH && nodeText(node, view.state) == "{}"
                && next?.name == MATH_END
            ) {
                view.dispatch({ changes: { from: node.from, to: node.to } }) // delete "{}"
            }
        }
    });
}

export function insertionHandler(view: EditorView) {
    const tree = syntaxTree(view.state);
    const range = view.state.selection.main;
    const indexNextDollar = view.state.doc.toString().indexOf("$", range.to);

    if (indexNextDollar >= 0) {
        tree.iterate({
            from: indexNextDollar,
            to: indexNextDollar + 1,
            enter(node) {
                if (node.name == MATH_END && nodeText(node, view.state) == "$") {
                    // end of inline math
                    const prev = node.node.prevSibling;
                    if (!(prev?.name == BRACKET_MATH && nodeText(prev, view.state) == "{}")) {
                        view.dispatch({ changes: { from: node.from, insert: "{}" } });
                    }
                }
            }
        });
    }
}
