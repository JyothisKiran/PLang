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
    console.log(this.currentChar);
    
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

  private identifier(): Token {
    let result = "";

    while (this.currentChar && /[a-zA-Z]/.test(this.currentChar)) {
      result += this.currentChar;
      this.advance();
    }

    if (result === "print") {
      return {
        type: TokenType.PRINT,
      };
    }

    throw new Error(`Unknown identifier: ${result}`);
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.currentChar !== null) {
      // Skip spaces
      if (/\s/.test(this.currentChar)) {
        this.skipWhitespace();
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

        default:
          console.log(`Unexpected character: ${this.currentChar}`);
      }

      this.advance();
    }

    tokens.push({ type: TokenType.EOF });

    return tokens;
  }
}
