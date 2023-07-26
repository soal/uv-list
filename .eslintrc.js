export default {
    env: {
        browser: true,
        es2021: true,
    },
    extends: "eslint:recommended",
    parser: "@babel/eslint-parser",
    parserOptions: {
        ecmaVersion: 12,
        sourceType: "module",
        requireConfigFile: false,
    },
    rules: {},
};
