import { ChangeSpec } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import { EditorView } from '@codemirror/view';

import { isInlineMathBegin, isInlineMathEnd, printNode } from './utils';


export function deletionHandler(view: EditorView) {
    
    const range = view.state.selection.main;
    const from = range.empty ? range.from - 4 : range.from;
    const to = range.to;
    const text = view.state.sliceDoc(from, to)
    const index = text.lastIndexOf("$");
    console.log(
        `range: ${range.from}-${range.to}\n`
        + `from = ${from} \ to = ${to}\n`
        + `text = "${text}"\n`
        + `index = ${index}`
    );
    if (index == -1) {
        return;
    }

    const doc = view.state.doc.toString();
    const indexNextDollar = doc.indexOf("$", from + index + 1);
    const indexPrevDollar = doc.lastIndexOf("$", from);
    console.log(
        `!! ${indexPrevDollar}:${indexNextDollar}: "${view.state.sliceDoc(indexPrevDollar, indexNextDollar)}"`
    );
    const tree = syntaxTree(view.state);

    const changes: ChangeSpec[] = [];
    tree.iterate({
        from: indexPrevDollar,
        to: indexNextDollar,
        enter(node) {
            if (isInlineMathBegin(node, view.state)
            && view.state.sliceDoc(node.to, node.to + 3) == "{} ") {
                changes.push({ from: node.to, to: node.to + 3 });
            } else if (isInlineMathEnd(node, view.state)
                && view.state.sliceDoc(node.from - 3, node.from) == " {}") {
                changes.push({ from: node.from - 3, to: node.from });
            }
        }
    });
    view.dispatch({ changes });
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
