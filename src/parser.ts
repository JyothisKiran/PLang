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

    if (token.type === TokenType.LBRACE) {
      this.advance();

      const properties: {
        key: string;
        value: ASTNode;
      }[] = [];

      while (this.currentToken().type !== TokenType.RBRACE) {
        const keyToken = this.currentToken();

        if (keyToken.type !== TokenType.IDENTIFIER) {
          throw new Error("Expected property name");
        }

        const key = keyToken.value!;

        this.advance();

        if (this.currentToken().type !== TokenType.COLON) {
          throw new Error("Expected :");
        }

        this.advance();

        const value = this.parseExpression();

        properties.push({
          key,
          value,
        });

        if (this.currentToken().type === TokenType.COMMA) {
          this.advance();
        }
      }

      this.advance(); // skip }

      return {
        type: "ObjectLiteral",
        properties,
      };
    }

    if (token.type === TokenType.STRING) {
      this.advance();

      return {
        type: "StringLiteral",
        value: token.value!,
      };
    }

    if (token.type === TokenType.LBRACKET) {
      this.advance();

      const elements: ASTNode[] = [];

      while (this.currentToken().type !== TokenType.RBRACKET) {
        elements.push(this.parseExpression());

        if (this.currentToken().type === TokenType.COMMA) {
          this.advance();
        }
      }

      this.advance(); // skip ]

      return {
        type: "ArrayLiteral",
        elements,
      };
    }

    if (token.type === TokenType.THIS) {
      this.advance();

      let expr: ASTNode = {
        type: "ThisExpression",
      };

      while (true) {
        if (this.currentToken().type === TokenType.DOT) {
          this.advance();

          const property = this.currentToken();

          if (property.type !== TokenType.IDENTIFIER) {
            throw new Error("Expected property name");
          }

          expr = {
            type: "PropertyAccessExpression",
            object: expr,
            property: property.value!,
          };

          this.advance();

          continue;
        }

        break;
      }

      return expr;
    }

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
      1;
      const name = token.value!;

      this.advance();

      // function call
      if (this.currentToken().type === TokenType.LPAREN) {
        this.advance();

        const args: ASTNode[] = [];

        while (this.currentToken().type !== TokenType.RPAREN) {
          args.push(this.parseExpression());

          if (this.currentToken().type === TokenType.COMMA) {
            this.advance();
          }
        }

        this.advance(); // skip )

        return {
          type: "CallExpression",
          callee: name,
          args,
        };
      }

      let expr: ASTNode = {
        type: "Identifier",
        name,
      };

      while (true) {
        // array indexing
        if (this.currentToken().type === TokenType.LBRACKET) {
          this.advance();

          const index = this.parseExpression();

          if (this.currentToken().type !== TokenType.RBRACKET) {
            throw new Error("Expected ]");
          }

          this.advance();

          expr = {
            type: "IndexExpression",
            array: expr,
            index,
          };

          continue;
        }

        // property access
        if (this.currentToken().type === TokenType.DOT) {
          this.advance();

          const propertyToken = this.currentToken();

          if (propertyToken.type !== TokenType.IDENTIFIER) {
            throw new Error("Expected property name");
          }

          const property = propertyToken.value!;

          this.advance();

          // METHOD CALL
          if (this.currentToken().type === TokenType.LPAREN) {
            this.advance();

            const args: ASTNode[] = [];

            while (this.currentToken().type !== TokenType.RPAREN) {
              args.push(this.parseExpression());

              if (this.currentToken().type === TokenType.COMMA) {
                this.advance();
              }
            }

            this.advance();

            expr = {
              type: "MethodCallExpression",
              object: expr,
              method: property,
              args,
            };

            continue;
          }

          // NORMAL PROPERTY ACCESS
          expr = {
            type: "PropertyAccessExpression",
            object: expr,
            property,
          };

          continue;
        }

        break;
      }

      return expr;
    }

    if (token.type === TokenType.FN) {
      return this.parseFunctionExpression();
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

  private parseComparisonExpression(): ASTNode {
    let left = this.parseExpression();

    const token = this.currentToken();

    if (
      token.type === TokenType.GREATER ||
      token.type === TokenType.LESS ||
      token.type === TokenType.EQUAL_EQUAL
    ) {
      this.advance();

      const right = this.parseExpression();

      return {
        type: "ComparisonExpression",
        left,
        operator:
          token.type === TokenType.GREATER
            ? ">"
            : token.type === TokenType.LESS
              ? "<"
              : "==",
        right,
      };
    }

    return left;
  }

  private parseIfStatement(): ASTNode {
    this.advance(); // skip IF

    if (this.currentToken().type !== TokenType.LPAREN) {
      throw new Error("Expected ( after if");
    }

    this.advance(); // skip (

    const condition = this.parseComparisonExpression();

    if (this.currentToken().type !== TokenType.RPAREN) {
      throw new Error("Expected ) after condition");
    }

    this.advance(); // skip )

    if (this.currentToken().type !== TokenType.LBRACE) {
      throw new Error("Expected {");
    }

    this.advance(); // skip {

    const body: ASTNode[] = [];

    while (this.currentToken().type !== TokenType.RBRACE) {
      body.push(this.parseStatement());
    }

    this.advance(); // skip }

    return {
      type: "IfStatement",
      condition,
      body,
    };
  }

  private parseAssignmentExpression(): ASTNode {
    const target = this.parseExpression();

    if (this.currentToken().type === TokenType.ASSIGN) {
      this.advance();

      const value = this.parseExpression();

      return {
        type: "AssignmentExpression",
        target,
        value,
      };
    }

    return target;
  }

  private parseWhileStatement(): ASTNode {
    this.advance(); // skip WHILE

    if (this.currentToken().type !== TokenType.LPAREN) {
      throw new Error("Expected (");
    }

    this.advance();

    const condition = this.parseComparisonExpression();

    if (this.currentToken().type !== TokenType.RPAREN) {
      throw new Error("Expected )");
    }

    this.advance();

    if (this.currentToken().type !== TokenType.LBRACE) {
      throw new Error("Expected {");
    }

    this.advance();

    const body: ASTNode[] = [];

    while (this.currentToken().type !== TokenType.RBRACE) {
      body.push(this.parseStatement());
    }

    this.advance(); // skip }

    return {
      type: "WhileStatement",
      condition,
      body,
    };
  }

  private parseFunctionDeclaration(): ASTNode {
    this.advance(); // skip fn

    const nameToken = this.currentToken();

    if (nameToken.type !== TokenType.IDENTIFIER) {
      throw new Error("Expected function name");
    }

    const name = nameToken.value!;
    this.advance();

    if (this.currentToken().type !== TokenType.LPAREN) {
      throw new Error("Expected (");
    }

    this.advance();

    const params: string[] = [];

    while (this.currentToken().type !== TokenType.RPAREN) {
      const param = this.currentToken();

      if (param.type !== TokenType.IDENTIFIER) {
        throw new Error("Expected parameter name");
      }

      params.push(param.value!);

      this.advance();

      if (this.currentToken().type === TokenType.COMMA) {
        this.advance();
      }
    }

    this.advance(); // skip )

    if (this.currentToken().type !== TokenType.LBRACE) {
      throw new Error("Expected {");
    }

    this.advance();

    const body: ASTNode[] = [];

    while (this.currentToken().type !== TokenType.RBRACE) {
      body.push(this.parseStatement());
    }

    this.advance(); // skip }

    return {
      type: "FunctionDeclaration",
      name,
      params,
      body,
    };
  }

  private parseReturnStatement(): ASTNode {
    this.advance(); // skip return

    return {
      type: "ReturnStatement",
      value: this.parseExpression(),
    };
  }

  private peek(offset = 1): Token {
    const token = this.tokens[this.position + offset];
    if (!token) {
      throw new Error("Unexpected end of input");
    }
    return token;
  }

  private parseStatement(): ASTNode {
    const token = this.currentToken();

    if (token.type === TokenType.SPILLTEA) {
      return this.parsePrintStatement();
    }

    if (token.type === TokenType.LET) {
      return this.parseVariableDeclaration();
    }

    if (token.type === TokenType.IF) {
      return this.parseIfStatement();
    }

    if (token.type === TokenType.IDENTIFIER || token.type === TokenType.THIS) {
      return this.parseAssignmentExpression();
    }

    if (token.type === TokenType.WHILE) {
      return this.parseWhileStatement();
    }

    if (token.type === TokenType.FN) {
      return this.parseFunctionDeclaration();
    }

    if (token.type === TokenType.RETURN) {
      return this.parseReturnStatement();
    }

    throw new Error("Unknown statement");
  }

  private parseFunctionExpression(): ASTNode {
    this.advance(); // skip fn

    if (this.currentToken().type !== TokenType.LPAREN) {
      throw new Error("Expected (");
    }

    this.advance();

    const params: string[] = [];

    if (this.currentToken().type !== TokenType.RPAREN) {
      while (true) {
        const token = this.currentToken();

        if (token.type !== TokenType.IDENTIFIER) {
          throw new Error("Expected parameter name");
        }

        params.push(token.value!);

        this.advance();

        if (this.currentToken().type === TokenType.COMMA) {
          this.advance();
          continue;
        }

        break;
      }
    }

    this.advance(); // )

    if (this.currentToken().type !== TokenType.LBRACE) {
      throw new Error("Expected {");
    }

    this.advance();

    const body: ASTNode[] = [];

    while (this.currentToken().type !== TokenType.RBRACE) {
      body.push(this.parseStatement());
    }

    this.advance(); // }

    return {
      type: "FunctionExpression",
      params,
      body,
    };
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
