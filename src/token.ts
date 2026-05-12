export enum TokenType {
  NUMBER = "NUMBER",
  PLUS = "PLUS",
  MINUS = "MINUS",
  STAR = "STAR",
  SLASH = "SLASH",

  LPAREN = "LPAREN",
  RPAREN = "RPAREN",

  SPILLTEA = "SPILLTEA",

  EOF = "EOF",
}

export interface Token {
  type: TokenType;
  value?: string;
}
