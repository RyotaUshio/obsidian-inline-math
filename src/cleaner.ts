import { ChangeSpec } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import { EditorView } from '@codemirror/view';

import { isInlineMathBegin, isInlineMathEnd } from './utils';
import { Editor } from 'obsidian';


declare module "obsidian" {
	interface Editor {
		cm?: EditorView;
	}
}


export function cleaner(view: EditorView) {
    const changes: ChangeSpec[] = [];
    syntaxTree(view.state).iterate({
        enter(node) {
            if (isInlineMathBegin(node, view.state)) {
                if (view.state.sliceDoc(node.to, node.to + 3) == "{} ") {
                    changes.push({ from: node.to, to: node.to + 3});
                }
            } else if (isInlineMathEnd(node, view.state)) {
                if (view.state.sliceDoc(node.from - 3, node.from) == " {}") {
                    changes.push({ from: node.from - 3, to: node.from});
                }
            }
        }
    });
    view.dispatch({ changes });
}

export function cleanerCallback(editor: Editor) {
    const view = editor.cm;
    if (view) {
        cleaner(view);
    }
}