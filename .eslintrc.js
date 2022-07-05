module.exports = {
  "env": {
    "commonjs": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "eslint-config-prettier"
  ],
  "plugins": [
    "prettier"
  ],
  "parserOptions": {
    "ecmaVersion": "latest"
  },
  "ignorePatterns": [
    "**/migrations",
    "**/.git",
    "**/.svn",
    "**/.hg",
    " **/node_modules",
    ".env",
    ".env.example",
    " **/.yml",
    "**/.yaml",
    "Dockerfile",
    ".gitignore",
    "database.json",
    "**/upload",
    "**/migrations",
    "**/govnodata",
    "**/.idea",
    "**/mariadb",
    "**/.husky",
    "**/getJsonByContent.js",
    "**/services/"
  ],
  "rules": {
    "prettier/prettier": "error",
    "no-prototype-builtins": 0,
    "no-fallthrough": 0,
    "indent": [
      "error",
      2,
      { "SwitchCase": 1 ,  "ignoredNodes": ["ConditionalExpression"] },
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "quotes": [
      "error",
      "double"
    ],
    "semi": [
      "error",
      "always"
    ]
  }
};
