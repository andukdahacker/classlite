import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export const OverlappingCommentHighlightPlugin = () =>
  new Plugin({
    key: new PluginKey("overlapping-comment-highlight"),
    state: {
      init: () => DecorationSet.empty,
      apply(tr) {
        const decos: Decoration[] = [];
        const commentMarkType = tr.doc.type.schema.marks.comment;
        if (!commentMarkType) return DecorationSet.empty;

        tr.doc.descendants((node, pos) => {
          if (node.isText) {
            const commentMarks = node.marks.filter(
              (mark) => mark.type === commentMarkType,
            );
            if (commentMarks.length > 1) {
              decos.push(
                Decoration.inline(pos, pos + node.nodeSize, {
                  class: "comment-highlight-overlapping",
                }),
              );
            }
          }
        });

        return DecorationSet.create(tr.doc, decos);
      },
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
