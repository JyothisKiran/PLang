import {
  ASTNode,
  Program,
  PrintStatement,
  BinaryExpression,
  NumberLiteral,
} from "./ast";
import { Environment } from "./environment";

export class Interpreter {

  constructor(private env: Environment) {}

  private visitProgram(node: Program) {
    for (const statement of node.body) {
      this.interpret(statement);
    }
  }

  private visitPrintStatement(node: PrintStatement) {
    const value = this.interpret(node.expression);

    console.log(value);
  }

  private visitNumberLiteral(node: NumberLiteral) {
    return node.value;
  }

  private visitBinaryExpression(node: BinaryExpression) {
    const left = this.interpret(node.left);
    const right = this.interpret(node.right);

    switch (node.operator) {
      case "+":
        return Number(left) + Number(right);

      case "-":
        return Number(left) - Number(right);

      case "*":
        return Number(left) * Number(right);

      case "/":
        return Number(left) / Number(right);

      default:
        throw new Error(`Unknown operator: ${node.operator}`);
    }
  }

  public interpret(node: ASTNode): unknown {
    switch (node.type) {
      case "Program":
        return this.visitProgram(node);

      case "VariableDeclaration":
        this.env.declare(node.name, this.interpret(node.value));
        return;

      case "Identifier":
        return this.env.get(node.name);

      case "PrintStatement":
        return this.visitPrintStatement(node);

      case "BinaryExpression":
        return this.visitBinaryExpression(node);

      case "NumberLiteral":
        return this.visitNumberLiteral(node);

      default:
        throw new Error(`Unknown node type`);
    }
  }
}
