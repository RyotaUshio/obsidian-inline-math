import { RangeSetBuilder, RangeSet, RangeValue } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, PluginValue, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { syntaxTree } from '@codemirror/language';

import { isInlineMathBegin, isInlineMathEnd } from './utils';


class DummyRangeValue extends RangeValue { }


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

            for (const { from, to } of view.visibleRanges) {
                tree.iterate({
                    from,
                    to,
                    enter(node) {
                        if (isInlineMathBegin(node, view.state)) {
                            if (view.state.sliceDoc(node.to, node.to + 3) == "{} ") {
                                decorationBulder.add(
                                    node.to,
                                    node.to + 3,
                                    Decoration.replace({})
                                );
                                atomicRangeBulder.add(
                                    node.from,
                                    node.to + 3,
                                    new DummyRangeValue()
                                );
                            }
                        } else if (isInlineMathEnd(node, view.state)) {
                            if (view.state.sliceDoc(node.from - 3, node.from) == " {}") {
                                decorationBulder.add(
                                    node.from - 3,
                                    node.from,
                                    Decoration.replace({})
                                );
                                atomicRangeBulder.add(
                                    node.from - 3,
                                    node.to,
                                    new DummyRangeValue()
                                );
                            }
                        }
                    }
                })
            }

            this.decorations = decorationBulder.finish();
            this.atomicRanges = atomicRangeBulder.finish();
        }
    }, {
    // decorations: instance => instance.decorations,
    provide: plugin => EditorView.atomicRanges.of(view => {
        return view.plugin(plugin)?.atomicRanges ?? RangeSet.empty
    })
});
