export type ASTNode =
  | Program
  | PrintStatement
  | BinaryExpression
  | NumberLiteral
  | VariableDeclaration
  | Identifier;

export interface Program {
  type: "Program";
  body: ASTNode[];
}

export interface PrintStatement {
  type: "PrintStatement";
  expression: ASTNode;
}

export interface VariableDeclaration {
  type: "VariableDeclaration";
  name: string;
  value: ASTNode;
}

export interface Identifier {
  type: "Identifier";
  name: string;
}

export interface BinaryExpression {
  type: "BinaryExpression";
  left: ASTNode;
  operator: string;
  right: ASTNode;
}

export interface NumberLiteral {
  type: "NumberLiteral";
  value: number;
}