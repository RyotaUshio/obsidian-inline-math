import { syntaxTree } from '@codemirror/language';
import { EditorView } from '@codemirror/view';

import { isInlineMathBegin, isInlineMathEnd } from './utils';


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
    tree.iterate({
        from: from + index,
        to: indexNextDollar,
        enter(node) {
            if (isInlineMathEnd(node, view.state)
                && view.state.sliceDoc(node.from - 3, node.from) == " {}"
            ) {
                view.dispatch({ changes: { from: node.from - 3, to: node.from } }) // delete " {}"
            }
        }
    });
}

export function insertionHandler(view: EditorView) {
    const tree = syntaxTree(view.state);
    const range = view.state.selection.main;
    const doc = view.state.doc.toString();
    const indexNextDollar = doc.indexOf("$", range.to);
    const indexPrevDollar = doc.lastIndexOf("$", range.from);

    if (indexNextDollar >= 0) {
        tree.iterate({
            from: indexPrevDollar,
            to: indexNextDollar + 1,
            enter(node) {
                if (isInlineMathBegin(node, view.state)) {
                    if (!(view.state.sliceDoc(node.to, node.to + 3) == "{} ")) {
                        view.dispatch({ changes: { from: node.to, insert: "{} " } });
                    }
                } else if (isInlineMathEnd(node, view.state)) {
                    if (!(view.state.sliceDoc(node.from - 3, node.from) == " {}")) {
                        view.dispatch({ changes: { from: node.from, insert: " {}" } });
                    }
                }
            }
        });
    }
}
