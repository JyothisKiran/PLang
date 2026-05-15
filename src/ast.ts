export type ASTNode =
  | Program
  | PrintStatement
  | BinaryExpression
  | NumberLiteral
  | VariableDeclaration
  | IfStatement
  | ComparisonExpression
  | AssignmentExpression
  | WhileStatement
  | FunctionDeclaration
  | CallExpression
  | ReturnStatement
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

export interface IfStatement {
  type: "IfStatement";
  condition: ASTNode;
  body: ASTNode[];
}

export interface ComparisonExpression {
  type: "ComparisonExpression";
  left: ASTNode;
  operator: string;
  right: ASTNode;
}

export interface AssignmentExpression {
  type: "AssignmentExpression";
  name: string;
  value: ASTNode;
}

export interface WhileStatement {
  type: "WhileStatement";
  condition: ASTNode;
  body: ASTNode[];
}

export interface FunctionDeclaration {
  type: "FunctionDeclaration";
  name: string;
  params: string[];
  body: ASTNode[];
}

export interface CallExpression {
  type: "CallExpression";
  callee: string;
  args: ASTNode[];
}

export interface ReturnStatement {
  type: "ReturnStatement";
  value: ASTNode;
}