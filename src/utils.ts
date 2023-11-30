import { syntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { SyntaxNodeRef } from '@lezer/common';

const INLINE_MATH_BEGIN = "formatting_formatting-math_formatting-math-begin_keyword_math";
const MATH_END = "formatting_formatting-math_formatting-math-end_keyword_math_math-";

export function nodeText(node: SyntaxNodeRef, state: EditorState): string {
    return state.sliceDoc(node.from, node.to);
}

export function printNode(node: SyntaxNodeRef, state: EditorState): void {
    // Debugging utility
    console.log(
        `${node.from}-${node.to}: "${nodeText(node, state)}" (${node.name})`
    );
}

export function isInlineMathBegin(node: SyntaxNodeRef, state: EditorState): boolean {
    return node.name == INLINE_MATH_BEGIN && nodeText(node, state) == "$"
}

export function isInlineMathEnd(node: SyntaxNodeRef, state: EditorState): boolean {
    return node.name == MATH_END && nodeText(node, state) == "$"
}

export function selectionSatisfies(state: EditorState, predicate: (node: SyntaxNodeRef) => boolean): boolean {
    let ret = false;
    const tree = syntaxTree(state);
    for (const { from, to } of state.selection.ranges) {
        const line = state.doc.lineAt(from);
        tree.iterate({
            from: line.from,
            to: line.to,
            enter: node => {
                if (predicate(node)) {
                    ret = true;
                }
            },
        });
    }
    return ret;
}
