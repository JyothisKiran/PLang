import {
  ASTNode,
  Program,
  PrintStatement,
  BinaryExpression,
  NumberLiteral,
  ComparisonExpression,
  IfStatement,
  AssignmentExpression,
  WhileStatement,
  FunctionDeclaration,
  CallExpression,
} from "./ast";
import { Environment } from "./environment";

export class Interpreter {
  constructor(private env: Environment) {}

  private visitProgram(node: Program) {
    for (const statement of node.body) {
      const result = this.interpret(statement);

      if (result instanceof ReturnValue) {
        return result;
      }
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
    const left: any = this.interpret(node.left);
    const right: any = this.interpret(node.right);

    switch (node.operator) {
      case "+":
        if (typeof left === "number" && typeof right === "number") {
          return left + right;
        }

        if (typeof left === "string" || typeof right === "string") {
          return String(left) + String(right);
        }

        throw new Error("Invalid '+' operation");

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

  private visitComparisonExpression(node: ComparisonExpression) {
    const left = Number(this.interpret(node.left));
    const right = Number(this.interpret(node.right));

    switch (node.operator) {
      case ">":
        return left > right;

      case "<":
        return left < right;

      case "==":
        return left === right;

      default:
        throw new Error("Unknown comparison operator");
    }
  }

  private visitIfStatement(node: IfStatement) {
    const condition = this.interpret(node.condition);

    if (condition) {
      for (const statement of node.body) {
        const result = this.interpret(statement);

        if (result instanceof ReturnValue) {
          return result;
        }
      }
    }
  }

  private visitAssignmentExpression(node: AssignmentExpression) {
    const value = this.interpret(node.value);

    this.env.assign(node.name, value);

    return value;
  }

  private visitWhileStatement(node: WhileStatement) {
    while (this.interpret(node.condition)) {
      for (const statement of node.body) {
        const result = this.interpret(statement);

        if (result instanceof ReturnValue) {
          return result;
        }
      }
    }
  }

  private functions = new Map<string, FunctionDeclaration>();

  private visitCallExpression(node: CallExpression) {
    const fn = this.functions.get(node.callee);

    if (!fn) {
      throw new Error(`Undefined function: ${node.callee}`);
    }

    // local scope
    const localEnv = new Environment(this.env);

    // bind parameters
    for (let i = 0; i < fn.params.length; i++) {
      const paramName = fn.params[i];
      const argNode = node.args[i];

      if (paramName === undefined) {
        throw new Error("Function parameter name is missing");
      }

      if (!argNode) {
        throw new Error(`Missing argument for parameter '${paramName}'`);
      }

      const argValue = this.interpret(argNode);

      localEnv.declare(paramName, argValue);
    }

    const previousEnv = this.env;
    this.env = localEnv;

    try {
      for (const statement of fn.body) {
        const result = this.interpret(statement);

        if (result instanceof ReturnValue) {
          return result.value;
        }
      }
    } finally {
      this.env = previousEnv;
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

      case "IfStatement":
        return this.visitIfStatement(node);

      case "ComparisonExpression":
        return this.visitComparisonExpression(node);

      case "AssignmentExpression":
        return this.visitAssignmentExpression(node);

      case "WhileStatement":
        return this.visitWhileStatement(node);

      case "FunctionDeclaration":
        this.functions.set(node.name, node);
        return;

      case "ReturnStatement":
        return new ReturnValue(this.interpret(node.value));

      case "CallExpression":
        return this.visitCallExpression(node);

      case "StringLiteral":
        return node.value;

      default:
        throw new Error(`Unknown node type`);
    }
  }
}

export class ReturnValue {
  constructor(public value: any) {}
}
