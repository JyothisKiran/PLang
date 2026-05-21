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
  IndexExpression,
  ObjectLiteral,
  PropertyAccessExpression,
  MethodCallExpression,
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

    const target = node.target;

    // variable assignment
    if (target.type === "Identifier") {
      this.env.assign(target.name, value);

      return value;
    }

    // object property assignment
    if (target.type === "PropertyAccessExpression") {
      const obj = this.interpret(target.object);

      if (typeof obj !== "object" || obj === null) {
        throw new Error("Target is not an object");
      }

      (obj as Record<string, unknown>)[target.property] = value;

      return value;
    }

    // array index assignment
    if (target.type === "IndexExpression") {
      const array = this.interpret(target.array);

      const index = this.interpret(target.index);

      if (!Array.isArray(array)) {
        throw new Error("Target is not an array");
      }

      array[index as number] = value;

      return value;
    }

    throw new Error("Invalid assignment target");
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

  private visitCallExpression(node: CallExpression) {
    const callable = this.env.get(node.callee);

    // evaluate arguments
    const args = node.args.map((arg) => this.interpret(arg));

    // NATIVE FUNCTION
    if (callable instanceof NativeFunctionValue) {
      return callable.call(args);
    }

    // USER FUNCTION
    if (callable instanceof ClosureValue) {
      const fn = callable.declaration;

      const localEnv = new Environment(callable.env);

      // bind params
      for (let i = 0; i < fn.params.length; i++) {
        const param = fn.params[i];

        if (!param) {
          throw new Error("Missing parameter name");
        }

        localEnv.declare(param, args[i]);
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

      return null;
    }

    throw new Error(`${node.callee} is not callable`);
  }

  private visitIndexExpression(node: IndexExpression) {
    const array = this.interpret(node.array);
    const index = this.interpret(node.index);

    if (!Array.isArray(array)) {
      throw new Error("Target is not an array");
    }

    return array[index as number];
  }

  private visitObjectLiteral(node: ObjectLiteral) {
    const obj: Record<string, any> = {};

    for (const prop of node.properties) {
      obj[prop.key] = this.interpret(prop.value);
    }

    return obj;
  }

  private visitPropertyAccessExpression(node: PropertyAccessExpression) {
    let obj = this.interpret(node.object);

    if (typeof obj !== "object" || obj === null) {
      throw new Error("Target is not an object");
    }

    const property = node.property;

    // prototype chain lookup
    while (obj) {
      const record = obj as Record<string, unknown>;

      if (property in record) {
        return record[property];
      }

      obj = record["__proto__"];
    }

    throw new Error(`Property '${property}' not found`);
  }

  private visitMethodCallExpression(node: MethodCallExpression) {
    const obj = this.interpret(node.object);

    if (typeof obj !== "object" || obj === null) {
      throw new Error("Target is not an object");
    }

    let current: Record<string, unknown> | null = obj;

    let method: unknown;

    while (current) {
      const record = current as Record<string, any>;

      if (node.method in record) {
        method = record[node.method];

        break;
      }

      current = record["__proto__"];
    }

    if (!(method instanceof ClosureValue)) {
      throw new Error(`${node.method} is not a method`);
    }

    const fn = method.declaration;

    // method environment
    const localEnv = new Environment(method.env);

    // THIS BINDING
    localEnv.declare("this", obj);

    // bind parameters
    for (let i = 0; i < fn.params.length; i++) {
      const paramName = fn.params[i];
      const argNode = node.args[i];

      if (!argNode) {
        throw new Error("Missing argument");
      }
      if (!paramName) {
        throw new Error("Missing parameter name");
      }

      localEnv.declare(paramName, this.interpret(argNode));
    }

    const previousEnv = this.env;

    this.env = localEnv;

    try {
      for (const stmt of fn.body) {
        const result = this.interpret(stmt);

        if (result instanceof ReturnValue) {
          return result.value;
        }
      }
    } finally {
      this.env = previousEnv;
    }
  }

  public interpret(node: ASTNode): any {
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
        const closure = new ClosureValue(node, this.env);

        this.env.declare(node.name, closure);
        return;

      case "ReturnStatement":
        return new ReturnValue(this.interpret(node.value));

      case "CallExpression":
        return this.visitCallExpression(node);

      case "StringLiteral":
        return node.value;

      case "ArrayLiteral":
        return node.elements.map((el) => this.interpret(el));

      case "IndexExpression":
        return this.visitIndexExpression(node);

      case "ObjectLiteral":
        return this.visitObjectLiteral(node);

      case "PropertyAccessExpression":
        return this.visitPropertyAccessExpression(node);

      case "ThisExpression":
        return this.env.get("this");

      case "FunctionExpression":
        return new ClosureValue(
          {
            type: "FunctionDeclaration",
            name: "__anonymous__",
            params: node.params,
            body: node.body,
          },
          this.env,
        );

      case "MethodCallExpression":
        return this.visitMethodCallExpression(node);

      default:
        throw new Error(`Unknown node type`);
    }
  }
}

export class ReturnValue {
  constructor(public value: any) {}
}

export class ClosureValue {
  constructor(
    public declaration: FunctionDeclaration,
    public env: Environment,
  ) {}
}

export class NativeFunctionValue {
  constructor(public call: (args: unknown[]) => unknown) {}
}
