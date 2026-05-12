export type ASTNode =
  | Program
  | PrintStatement
  | BinaryExpression
  | NumberLiteral;

export interface Program {
  type: "Program";
  body: ASTNode[];
}

export interface PrintStatement {
  type: "PrintStatement";
  expression: ASTNode;
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