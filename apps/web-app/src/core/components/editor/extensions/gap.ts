import { Node, mergeAttributes } from "@tiptap/core";

export interface GapOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    gap: {
      setGap: (options: { order: number }) => ReturnType;
    };
  }
}

export const Gap = Node.create<GapOptions>({
  name: "gap",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      order: {
        default: 1,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-type=gap]",
        getAttrs: (dom) => {
          const element = dom as HTMLElement;
          const order = element.getAttribute("data-order");
          return {
            order: order ? parseInt(order, 10) : 1,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "gap",
        "data-order": HTMLAttributes.order,
      }),
      `[GAP ${HTMLAttributes.order}]`,
    ];
  },

  addCommands() {
    return {
      setGap:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
