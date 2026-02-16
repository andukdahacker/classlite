import { config } from "@workspace/eslint-config/react-internal"

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    rules: {
      "classlite/require-onblur-with-onchange": "off",
    },
  },
]
