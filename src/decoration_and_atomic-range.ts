import { RangeSetBuilder, RangeSet, RangeValue } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, PluginValue, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { syntaxTree } from '@codemirror/language';

import { nodeText } from './utils';
import { BRACKET_MATH, INLINE_MATH_BEGIN, MATH_END } from 'node_names';


class DummyRangeValue extends RangeValue {}


export const decorator = ViewPlugin.fromClass(
    class implements PluginValue {
        decorations: DecorationSet;
        atomicRanges: RangeSet<DummyRangeValue>;

        constructor(view: EditorView) {
            this.impl(view);
        }

        update(update: ViewUpdate) {
            this.impl(update.view);
        }

        impl(view: EditorView) {
            const decorationBulder = new RangeSetBuilder<Decoration>();
            const atomicRangeBulder = new RangeSetBuilder<DummyRangeValue>();
            const tree = syntaxTree(view.state);

            let insideInlineMath = false;

            for (const { from, to } of view.visibleRanges) {
                tree.iterate({
                    from,
                    to,
                    enter(node) {
                        if (node.name == INLINE_MATH_BEGIN) {
                            insideInlineMath = true;
                        } else if (insideInlineMath && node.name == MATH_END) {
                            insideInlineMath = false;
                            const prev = node.node.prevSibling;
                            if (prev) {
                                const prevText = nodeText(prev, view.state);
                                if (prev.name == BRACKET_MATH && prevText == "{}") {
                                    decorationBulder.add(
                                        prev.from,
                                        prev.to,
                                        Decoration.replace({})
                                    );
                                    atomicRangeBulder.add(
                                        prev.from, 
                                        node.to, 
                                        new DummyRangeValue()
                                    );
                                }
                            }
                        }
                    }
                })
            }

            this.decorations = decorationBulder.finish();
            this.atomicRanges = atomicRangeBulder.finish();
        }
    }, {
    decorations: instance => instance.decorations,
    provide: plugin => EditorView.atomicRanges.of(view => {
        return view.plugin(plugin)?.atomicRanges ?? RangeSet.empty
    })
});
