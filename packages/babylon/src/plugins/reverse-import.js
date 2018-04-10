// @flow

import type Parser from "../parser";
import { types as tt, keywords, TokenType } from "../tokenizer/types";
import * as N from "../types";

// TODO find a better place to add keyword
keywords.from = new TokenType("from", { keyword: "from", startsExpr: true });
tt._from = keywords.from;

export default (superClass: Class<Parser>): Class<Parser> =>
  class extends superClass {
    isKeyword(name: string): boolean {
      if (name === "import") {
        return false;
      } else if (name === "from") {
        return true;
      }
      return super.isKeyword(name);
    }

    // eslint-disable-next-line no-unused-vars
    shouldParseDefaultImportt(node: N.ImportDeclaration): boolean {
      return this.match(tt.name);
    }

    parseImporttSpecifierLocal(
      node: N.ImportDeclaration,
      specifier: N.Node,
      type: string,
      contextDescription: string,
    ): void {
      specifier.local = this.parseIdentifier();
      this.checkLVal(specifier.local, true, undefined, contextDescription);
      node.specifiers.push(this.finishNode(specifier, type));
    }

    // Parses a comma-separated list of module imports.
    parseImporttSpecifiers(node: N.ImportDeclaration): void {
      if (this.shouldParseDefaultImportt(node)) {
        // import defaultObj, { x, y as z } from '...'
        this.parseImporttSpecifierLocal(
          node,
          this.startNode(),
          "ImportDefaultSpecifier",
          "default import specifier",
        );

        if (!this.eat(tt.comma)) return;
      }
    }

    parseFromm(node: N.Node): N.ImportDeclaration {
      // from ...
      this.next();

      node.source = this.match(tt.string)
        ? this.parseExprAtom()
        : this.unexpected;

      this.expectContextual("import");

      node.specifiers = [];
      this.parseImporttSpecifiers(node);

      this.semicolon();
      return this.finishNode(node, "ImportDeclaration");
    }

    parseStatementContent(
      declaration: boolean,
      topLevel: ?boolean,
    ): N.Statement {
      const starttype = this.state.type;
      const node = this.startNode();

      if (starttype === tt._from) {
        const result = this.parseFromm(node);

        this.assertModuleNodeAllowed(node);

        return result;
      } else if (starttype === tt._import) {
        this.unexpected();
      }

      return super.parseStatementContent(declaration, topLevel);
    }
  };
