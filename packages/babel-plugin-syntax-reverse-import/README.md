# @babel/plugin-syntax-reverse-import



## Installation

```sh
npm install --save-dev @babel/plugin-syntax-reverse-impor
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["@babel/plugin-syntax-reverse-import"]
}
```

### Via CLI

```sh
babel --plugins @babel/plugin-syntax-reverse-import script.js
```

### Via Node API

```javascript
require("@babel/core").transform("code", {
  plugins: ["@babel/plugin-syntax-reverse-import"]
});
```
