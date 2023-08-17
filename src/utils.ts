import { EditorState } from '@codemirror/state';
import { SyntaxNodeRef } from '@lezer/common';
import { INLINE_MATH_BEGIN, MATH_END } from 'node_names';


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
