/**
 * Custom ESLint rule: require-onblur-with-onchange
 *
 * Flags JSX elements that have an explicit `onChange` prop but no `onBlur` prop.
 * This catches the recurring pattern where exercise editor inputs use onChange
 * for local state but forget onBlur for persisting/validating.
 *
 * React Hook Form usage (`{...field}`) is safe — the spread includes onBlur,
 * and spread operators are not flagged by this rule.
 */

/** @type {import("eslint").Rule.RuleModule} */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require onBlur handler when onChange is present on interactive elements",
    },
    schema: [],
    messages: {
      missingOnBlur:
        "Element has `onChange` but no `onBlur`. Add an `onBlur` handler for validation/persistence, or suppress with // eslint-disable-next-line classlite/require-onblur-with-onchange if intentional.",
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const attrs = node.attributes;

        let hasOnChange = false;
        let hasOnBlur = false;
        let hasSpread = false;

        for (const attr of attrs) {
          if (attr.type === "JSXSpreadAttribute") {
            // Spread may include onBlur (e.g. react-hook-form's {...field})
            hasSpread = true;
          }
          if (attr.type === "JSXAttribute" && attr.name) {
            if (attr.name.name === "onChange") hasOnChange = true;
            if (attr.name.name === "onBlur") hasOnBlur = true;
          }
        }

        if (hasOnChange && !hasOnBlur && !hasSpread) {
          context.report({
            node,
            messageId: "missingOnBlur",
          });
        }
      },
    };
  },
};
