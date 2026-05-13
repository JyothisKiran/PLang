export enum TokenType {
  NUMBER = "NUMBER",
  PLUS = "PLUS",
  MINUS = "MINUS",
  STAR = "STAR",
  SLASH = "SLASH",

  LPAREN = "LPAREN",
  RPAREN = "RPAREN",

  SPILLTEA = "SPILLTEA",

  LET = "LET",
  IDENTIFIER = "IDENTIFIER",
  ASSIGN = "ASSIGN",

  EOF = "EOF",
}

export interface Token {
  type: TokenType;
  value?: string;
}
