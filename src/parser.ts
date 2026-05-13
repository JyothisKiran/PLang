import { Token, TokenType } from "./token";
import { ASTNode } from "./ast";

export class Parser {
  private tokens: Token[];
  private position: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private currentToken(): Token {
    const token = this.tokens[this.position];
    if (!token) {
      throw new Error("Unexpected end of input");
    }
    return token;
  }

  private advance() {
    this.position++;
  }

  private parseFactor(): ASTNode {
    const token = this.currentToken();

    // NUMBER
    if (token.type === TokenType.NUMBER) {
      this.advance();
      return {
        type: "NumberLiteral",
        value: Number(token.value),
      };
    }

    // 🔥 PARENTHESES FIX
    if (token.type === TokenType.LPAREN) {
      this.advance(); // skip '('

      const expr = this.parseExpression();

      if (this.currentToken().type !== TokenType.RPAREN) {
        throw new Error("Expected closing parenthesis");
      }

      this.advance(); // skip ')'

      return expr;
    }

    if (token.type === TokenType.IDENTIFIER) {
      this.advance();

      return {
        type: "Identifier",
        name: token.value!,
      };
    }

    throw new Error(`Unexpected token: ${token.type}`);
  }

  private parseTerm(): ASTNode {
    let node = this.parseFactor();

    while (
      this.currentToken().type === TokenType.STAR ||
      this.currentToken().type === TokenType.SLASH
    ) {
      const operator = this.currentToken().type;
      this.advance();

      node = {
        type: "BinaryExpression",
        left: node,
        operator: operator === TokenType.STAR ? "*" : "/",
        right: this.parseFactor(),
      };
    }

    return node;
  }

  private parseExpression(): ASTNode {
    let node = this.parseTerm();

    while (
      this.currentToken().type === TokenType.PLUS ||
      this.currentToken().type === TokenType.MINUS
    ) {
      const operator = this.currentToken().type;
      this.advance();

      node = {
        type: "BinaryExpression",
        left: node,
        operator: operator === TokenType.PLUS ? "+" : "-",
        right: this.parseTerm(),
      };
    }

    return node;
  }

  private parsePrintStatement(): ASTNode {
    this.advance(); // skip PRINT

    // expect (
    this.advance();

    const expr = this.parseExpression();

    // expect )
    this.advance();

    return {
      type: "PrintStatement",
      expression: expr,
    };
  }

  private parseVariableDeclaration(): ASTNode {
    this.advance(); // skip LET

    const nameToken = this.currentToken();

    if (nameToken.type !== TokenType.IDENTIFIER) {
      throw new Error("Expected variable name");
    }

    const name = nameToken.value!;
    this.advance();

    if (this.currentToken().type !== TokenType.ASSIGN) {
      throw new Error("Expected =");
    }

    this.advance(); // skip '='

    const value = this.parseExpression();

    return {
      type: "VariableDeclaration",
      name,
      value,
    };
  }

  private parseStatement(): ASTNode {
    const token = this.currentToken();

    if (token.type === TokenType.SPILLTEA) {
      return this.parsePrintStatement();
    }

    if (token.type === TokenType.LET) {
      return this.parseVariableDeclaration();
    }

    throw new Error("Unknown statement");
  }

  public parseProgram(): ASTNode {
    const body: ASTNode[] = [];

    while (this.currentToken().type !== TokenType.EOF) {
      body.push(this.parseStatement());
    }

    return {
      type: "Program",
      body,
    };
  }
}
