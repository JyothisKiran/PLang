import { TokenType, Token } from "./token";

export class Lexer {
  private input: string;
  private position: number = 0;
  private currentChar: string | null;

  constructor(input: string) {
    this.input = input;
    this.currentChar = input[0] || null;
  }

  private advance() {
    this.position++;

    if (this.position >= this.input.length) {
      this.currentChar = null;
    } else {
      this.currentChar = this.input[this.position] ?? null;
    }
  }

  private skipWhitespace() {
    while (this.currentChar && /\s/.test(this.currentChar)) {
      this.advance();
    }
  }

  private number(): Token {
    let result = "";

    while (this.currentChar && /[0-9]/.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }

    return {
      type: TokenType.NUMBER,
      value: result,
    };
  }

  private string(): Token {
    let result = "";

    this.advance(); // skip opening quote

    while (this.currentChar && this.currentChar !== '"') {
      result += this.currentChar;
      this.advance();
    }

    this.advance(); // skip closing quote

    return {
      type: TokenType.STRING,
      value: result,
    };
  }

  private identifier(): Token {
    let result = "";

    while (this.currentChar && /[a-zA-Z]/.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }

    if (result === "spilltea") {
      return {
        type: TokenType.SPILLTEA,
      };
    }

    if (result === "let") {
      return { type: TokenType.LET };
    }

    if (result === "if") {
      return { type: TokenType.IF };
    }

    if (result === "while") {
      return { type: TokenType.WHILE };
    }

    if (result === "fn") {
      return { type: TokenType.FN };
    }

    if (result === "return") {
      return { type: TokenType.RETURN };
    }

    if (result === "this") {
      return { type: TokenType.THIS };
    }

    return {
      type: TokenType.IDENTIFIER,
      value: result,
    };
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.currentChar !== null) {
      // Skip spaces
      if (/\s/.test(this.currentChar)) {
        this.skipWhitespace();
        continue;
      }

      // Strings
      if (this.currentChar === '"') {
        tokens.push(this.string());
        continue;
      }

      // Numbers
      if (/[0-9]/.test(this.currentChar)) {
        tokens.push(this.number());
        continue;
      }

      // Identifiers
      if (/[a-zA-Z]/.test(this.currentChar)) {
        tokens.push(this.identifier());
        continue;
      }

      if (this.currentChar === "=") {
        this.advance();

        if (this.currentChar === "=") {
          tokens.push({ type: TokenType.EQUAL_EQUAL });
          this.advance();
        } else {
          tokens.push({ type: TokenType.ASSIGN });
        }

        continue;
      }

      switch (this.currentChar) {
        case "+":
          tokens.push({ type: TokenType.PLUS });
          break;

        case "-":
          tokens.push({ type: TokenType.MINUS });
          break;

        case "*":
          tokens.push({ type: TokenType.STAR });
          break;

        case "/":
          tokens.push({ type: TokenType.SLASH });
          break;

        case "(":
          tokens.push({ type: TokenType.LPAREN });
          break;

        case ")":
          tokens.push({ type: TokenType.RPAREN });
          break;

        case "{":
          tokens.push({ type: TokenType.LBRACE });
          break;

        case "}":
          tokens.push({ type: TokenType.RBRACE });
          break;

        case ">":
          tokens.push({ type: TokenType.GREATER });
          break;

        case "<":
          tokens.push({ type: TokenType.LESS });
          break;

        case ",":
          tokens.push({ type: TokenType.COMMA });
          break;

        case "[":
          tokens.push({ type: TokenType.LBRACKET });
          break;

        case "]":
          tokens.push({ type: TokenType.RBRACKET });
          break;

        case ":":
          tokens.push({ type: TokenType.COLON });
          break;

        case ".":
          tokens.push({ type: TokenType.DOT });
          break;

        default:
          throw new Error(`Unexpected character: ${this.currentChar}`);
      }

      this.advance();
    }

    tokens.push({ type: TokenType.EOF });

    return tokens;
  }
}
