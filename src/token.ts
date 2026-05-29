export enum TokenType {
  NUMBER = "NUMBER",
  PLUS = "PLUS",
  MINUS = "MINUS",
  STAR = "STAR",
  SLASH = "SLASH",

  LPAREN = "LPAREN",
  RPAREN = "RPAREN",

  SPILLTEA = "SPILLTEA",

  // Keywords
  LET = "LET",
  IDENTIFIER = "IDENTIFIER",
  ASSIGN = "ASSIGN",

  IF = "IF",
  LBRACE = "LBRACE",
  RBRACE = "RBRACE",

  GREATER = "GREATER",
  LESS = "LESS",

  EQUAL_EQUAL = "EQUAL_EQUAL",

  WHILE = "WHILE",
  FN = "FN",
  RETURN = "RETURN",
  COMMA = "COMMA",

  STRING = "STRING",

  LBRACKET = "LBRACKET",
  RBRACKET = "RBRACKET",

  COLON = "COLON",
  DOT = "DOT",

  THIS = "THIS",

  TRUE = "TRUE",
  FALSE = "FALSE",
  NULL = "NULL",

  AND = "AND",
  OR = "OR",
  NOT = "NOT",

  CLASS = "CLASS",
  NEW = "NEW",

  EXTENDS = "EXTENDS",

  SUPER = "SUPER",

  IMPORT = "IMPORT",

  TRY = "TRY",
  CATCH = "CATCH",
  THROW = "THROW",

  EOF = "EOF",
}

export interface Token {
  type: TokenType;
  value?: string;
}
