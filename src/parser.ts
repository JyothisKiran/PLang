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

    if (token.type === TokenType.NUMBER) {
      this.advance();
      return {
        type: "NumberLiteral",
        value: Number(token.value),
      };
    }

    throw new Error("Unexpected token in factor");
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

  private parseStatement(): ASTNode {
    const token = this.currentToken();

    if (token.type === TokenType.SPILLTEA) {
      return this.parsePrintStatement();
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
