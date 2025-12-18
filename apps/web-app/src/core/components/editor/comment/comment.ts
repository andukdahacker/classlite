import { Mark, mergeAttributes } from "@tiptap/core";

export interface CommentOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    comment: {
      addComment: (id: string) => ReturnType;
      removeComment: (id: string) => ReturnType;
    };
  }
}

export const Comment = Mark.create<CommentOptions>({
  name: "comment",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-comment-id]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-comment-id": HTMLAttributes.id,
        class: "comment-highlight",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      addComment:
        (id) =>
        ({ commands }) =>
          commands.setMark(this.name, { id }),

      removeComment:
        (id: string) =>
        ({ tr, state, dispatch }) => {
          const markType = state.schema.marks.comment;
          if (!markType) return false;

          let removed = false;
          state.doc.descendants((node, pos) => {
            const mark = node.marks.find(
              (mark) => mark.type === markType && mark.attrs.id === id,
            );

            if (mark) {
              tr.removeMark(pos, pos + node.nodeSize, mark);
              removed = true;
            }
          });

          if (removed && dispatch) {
            dispatch(tr);
          }

          return removed;
        },
    };
  },
});
