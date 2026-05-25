export type ASTNode =
  | Program
  | PrintStatement
  | BinaryExpression
  | NumberLiteral
  | VariableDeclaration
  | ExpressionStatement
  | IfStatement
  | ComparisonExpression
  | AssignmentExpression
  | WhileStatement
  | FunctionDeclaration
  | CallExpression
  | ReturnStatement
  | Identifier
  | StringLiteral
  | ArrayLiteral
  | ObjectLiteral
  | PropertyAccessExpression
  | ThisExpression
  | FunctionExpression
  | MethodCallExpression
  | BooleanLiteral
  | NullLiteral
  | LogicalExpression
  | UnaryExpression
  | ClassDeclaration
  | NewExpression
  | IndexExpression;

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

  target: ASTNode;

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

export interface StringLiteral {
  type: "StringLiteral";
  value: string;
}

export interface ArrayLiteral {
  type: "ArrayLiteral";
  elements: ASTNode[];
}

export interface IndexExpression {
  type: "IndexExpression";
  array: ASTNode;
  index: ASTNode;
}

export interface ObjectLiteral {
  type: "ObjectLiteral";
  properties: {
    key: string;
    value: ASTNode;
  }[];
}

export interface PropertyAccessExpression {
  type: "PropertyAccessExpression";
  object: ASTNode;
  property: string;
}

export interface ThisExpression {
  type: "ThisExpression";
}

export interface FunctionExpression {
  type: "FunctionExpression";

  params: string[];

  body: ASTNode[];
}

export interface MethodCallExpression {
  type: "MethodCallExpression";

  object: ASTNode;

  method: string;

  args: ASTNode[];
}

export interface BooleanLiteral {
  type: "BooleanLiteral";

  value: boolean;
}

export interface NullLiteral {
  type: "NullLiteral";
}

export interface LogicalExpression {

  type: "LogicalExpression";

  left: ASTNode;

  operator: "&&" | "||";

  right: ASTNode;
}

export interface UnaryExpression {

  type: "UnaryExpression";

  operator: "!";

  argument: ASTNode;
}

export interface ExpressionStatement {
  type: "ExpressionStatement";
  expression: ASTNode;
}

export interface ClassDeclaration {

  type: "ClassDeclaration";

  name: string;

  methods: FunctionDeclaration[];

  superClass: string | undefined;
}

export interface NewExpression {

  type: "NewExpression";

  className: string;

  args: ASTNode[];
}