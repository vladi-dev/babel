// @flow

import type { Options } from "./options";
import Parser, { plugins } from "./parser";

import { types as tokTypes } from "./tokenizer/types";
import "./tokenizer/context";

import type { Expression, File } from "./types";

import estreePlugin from "./plugins/estree";
import flowPlugin from "./plugins/flow";
import jsxPlugin from "./plugins/jsx";
import typescriptPlugin from "./plugins/typescript";
import reverseImportPlugin from "./plugins/reverse-import";
plugins.estree = estreePlugin;
plugins.flow = flowPlugin;
plugins.jsx = jsxPlugin;
plugins.typescript = typescriptPlugin;
plugins.reverseImport = reverseImportPlugin;

export function parse(input: string, options?: Options): File {
  if (options && options.sourceType === "unambiguous") {
    options = Object.assign({}, options);
    try {
      options.sourceType = "module";
      const parser = getParser(options, input);
      const ast = parser.parse();

      // Rather than try to parse as a script first, we opt to parse as a module and convert back
      // to a script where possible to avoid having to do a full re-parse of the input content.
      if (!parser.sawUnambiguousESM) ast.program.sourceType = "script";
      return ast;
    } catch (moduleError) {
      try {
        options.sourceType = "script";
        return getParser(options, input).parse();
      } catch (scriptError) {}

      throw moduleError;
    }
  } else {
    return getParser(options, input).parse();
  }
}

export function parseExpression(input: string, options?: Options): Expression {
  const parser = getParser(options, input);
  if (parser.options.strictMode) {
    parser.state.strict = true;
  }
  return parser.getExpression();
}

export { tokTypes };

function getParser(options: ?Options, input: string): Parser {
  const cls =
    options && options.plugins ? getParserClass(options.plugins) : Parser;
  return new cls(options, input);
}

const parserClassCache: { [key: string]: Class<Parser> } = {};

/** Get a Parser class with plugins applied. */
function getParserClass(
  pluginsFromOptions: $ReadOnlyArray<string>,
): Class<Parser> {
  if (
    pluginsFromOptions.indexOf("decorators") >= 0 &&
    pluginsFromOptions.indexOf("decorators2") >= 0
  ) {
    throw new Error("Cannot use decorators and decorators2 plugin together");
  }

  // Filter out just the plugins that have an actual mixin associated with them.
  let pluginList = pluginsFromOptions.filter(
    p =>
      p === "estree" ||
      p === "flow" ||
      p === "jsx" ||
      p === "typescript" ||
      p === "reverseImport",
  );

  if (pluginList.indexOf("flow") >= 0) {
    // ensure flow plugin loads last
    pluginList = pluginList.filter(plugin => plugin !== "flow");
    pluginList.push("flow");
  }

  if (
    pluginList.indexOf("flow") >= 0 &&
    pluginList.indexOf("typescript") >= 0
  ) {
    throw new Error("Cannot combine flow and typescript plugins.");
  }

  if (pluginList.indexOf("typescript") >= 0) {
    // ensure typescript plugin loads last
    pluginList = pluginList.filter(plugin => plugin !== "typescript");
    pluginList.push("typescript");
  }

  if (pluginList.indexOf("estree") >= 0) {
    // ensure estree plugin loads first
    pluginList = pluginList.filter(plugin => plugin !== "estree");
    pluginList.unshift("estree");
  }

  const key = pluginList.join("/");
  let cls = parserClassCache[key];
  if (!cls) {
    cls = Parser;
    for (const plugin of pluginList) {
      cls = plugins[plugin](cls);
    }
    parserClassCache[key] = cls;
  }
  return cls;
}
