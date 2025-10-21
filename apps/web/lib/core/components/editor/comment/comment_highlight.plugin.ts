import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

export const CommentHighlightPlugin = (getId: () => string | null) =>
  new Plugin({
    key: new PluginKey("comment-highlight"),
    state: {
      init: () => DecorationSet.empty,
      apply(tr) {
        const id = getId();
        if (!id) {
          return;
        }

        const decos: Decoration[] = [];
        tr.doc.descendants((node, pos) => {
          if (!node.isText) {
            node.content?.forEach((child) => {
              if (!child.isText) return;
              const commentMark = child.marks.find(
                (mark) => mark.type.name == "comment" && mark.attrs.id == id,
              );
              if (commentMark) {
                decos.push(
                  Decoration.inline(pos, pos + (node.text?.length ?? 0) + 1, {
                    class: "comment-highlight-active",
                  }),
                );
              }
            });
            return;
          }

          const commentMark = node.marks.find(
            (mark) => mark.type.name === "comment" && mark.attrs.id === id,
          );
          if (commentMark) {
            decos.push(
              Decoration.inline(pos, pos + node.text!.length, {
                class: "comment-highlight-active",
              }),
            );
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
