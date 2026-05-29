import * as fs from "fs";
import path from "path";
import { Lexer } from "./lexer";
import { Parser } from "./parser";
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
  LogicalExpression,
  UnaryExpression,
  ClassDeclaration,
  NewExpression,
  SuperCallExpression,
  ImportStatement,
  ThrowStatement,
  TryCatchStatement,
} from "./ast";
import { Environment } from "./environment";

export class Interpreter {
  constructor(private env: Environment) {}

  private classes = new Map<string, ClassDeclaration>();

  private modules = new Map<string, Record<string, unknown>>();

  private visitProgram(node: Program) {
    for (const statement of node.body) {
      const result = this.interpret(statement);

      if (result instanceof ReturnValue) {
        return result;
      }
    }
  }

  private isTruthy(value: unknown): boolean {
    return !!value;
  }

  private visitLogicalExpression(node: LogicalExpression) {
    // SHORT CIRCUIT

    if (node.operator === "&&") {
      const left = this.interpret(node.left);

      if (!this.isTruthy(left)) {
        return left;
      }

      return this.interpret(node.right);
    }

    if (node.operator === "||") {
      const left = this.interpret(node.left);

      if (this.isTruthy(left)) {
        return left;
      }

      return this.interpret(node.right);
    }

    throw new Error("Unknown logical operator");
  }

  private visitUnaryExpression(node: UnaryExpression) {
    const value = this.interpret(node.argument);

    switch (node.operator) {
      case "!":
        return !this.isTruthy(value);

      default:
        throw new Error("Unknown unary operator");
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

    const record = obj as Record<string, any>;

    let current: Record<string, unknown> | null = record;

    let method: unknown = undefined;

    while (current) {
      const record = current as Record<string, any>;

      if (node.method in record) {
        method = record[node.method];

        break;
      }

      current = record["__proto__"];
    }

    if (!method) {
      throw new Error(`Method ${node.method} not found`);
    }

    if (
      !method ||
      typeof method !== "object" ||
      !(method instanceof ClosureValue)
    ) {
      throw new Error(`${node.method} is not a method`);
    }

    const fn = method.declaration;

    // method environment
    const localEnv = new Environment(method.env);

    // THIS BINDING
    localEnv.declare("this", obj);
    localEnv.declare("__method", method);

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

  private visitNewExpression(node: NewExpression) {
    const classDecl = this.classes.get(node.className);

    if (!classDecl) {
      throw new Error(`Undefined class: ${node.className}`);
    }

    // object instance
    const instance: Record<string, unknown> = {};

    // attach methods
    const methods: Record<string, ClosureValue> = {};

    this.collectClassMethods(classDecl, methods);

    for (const key in methods) {
      instance[key] = methods[key];
    }

    // constructor
    const init = instance["init"];

    if (init instanceof ClosureValue) {
      const fn = init.declaration;

      const localEnv = new Environment(init.env);

      localEnv.declare("this", instance);

      for (let i = 0; i < fn.params.length; i++) {
        const param = fn.params[i];

        const arg = node.args[i];

        if (!param || !arg) {
          continue;
        }

        localEnv.declare(param, this.interpret(arg));
      }

      const previous = this.env;

      this.env = localEnv;

      try {
        for (const stmt of fn.body) {
          this.interpret(stmt);
        }
      } finally {
        this.env = previous;
      }
    }

    return instance;
  }

  private visitSuperCallExpression(node: SuperCallExpression) {
    const thisObj = this.env.get("this");

    const currentMethod = this.env.get("__method");

    if (!(currentMethod instanceof ClosureValue)) {
      throw new Error("super used outside method");
    }

    const ownerClass = currentMethod.ownerClass;

    if (!ownerClass?.superClass) {
      throw new Error("No superclass");
    }

    const parentClass = this.classes.get(ownerClass.superClass);

    if (!parentClass) {
      throw new Error("Superclass not found");
    }

    const parentMethod = parentClass.methods.find(
      (m) => m.name === node.method,
    );

    if (!parentMethod) {
      throw new Error(`Parent method not found: ${node.method}`);
    }

    const localEnv = new Environment(this.env);

    localEnv.declare("this", thisObj);

    const closure = new ClosureValue(parentMethod, this.env, parentClass);

    localEnv.declare("__method", closure);

    for (let i = 0; i < parentMethod.params.length; i++) {
      const param = parentMethod.params[i];

      const arg = node.args[i];

      if (!param || !arg) {
        continue;
      }

      localEnv.declare(param, this.interpret(arg));
    }

    const previous = this.env;

    this.env = localEnv;

    try {
      for (const stmt of parentMethod.body) {
        const result = this.interpret(stmt);

        if (result instanceof ReturnValue) {
          return result.value;
        }
      }
    } finally {
      this.env = previous;
    }
  }

  private visitImportStatement(node: ImportStatement) {
    const filePath = path.resolve(process.cwd(), `${node.moduleName}.pl`);

    const code = fs.readFileSync(filePath, "utf-8");

    // tokenize
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();

    // parse
    const parser = new Parser(tokens);
    const ast = parser.parseProgram();

    // module environment
    const moduleEnv = new Environment(this.env);

    // execute module
    const moduleInterpreter = new Interpreter(moduleEnv);

    moduleInterpreter.interpret(ast);

    // build module object
    const moduleObject: Record<string, unknown> = {};

    for (const [key, value] of moduleEnv.dump()) {
      moduleObject[key] = value;
    }

    // expose module
    this.env.declare(node.moduleName, moduleObject);
  }

  private visitThrowStatement(node: ThrowStatement) {
    throw new RuntimeThrow(this.interpret(node.value));
  }

  private visitTryCatchStatement(node: TryCatchStatement) {
    try {
      for (const stmt of node.tryBlock) {
        this.interpret(stmt);
      }
    } catch (err) {
      if (err instanceof RuntimeThrow) {
        const catchEnv = new Environment(this.env);

        catchEnv.declare(node.catchParam, err.value);

        const previousEnv = this.env;

        this.env = catchEnv;

        try {
          for (const stmt of node.catchBlock) {
            this.interpret(stmt);
          }
        } finally {
          this.env = previousEnv;
        }

        return;
      }

      throw err;
    }
  }
  private collectClassMethods(
    classDecl: ClassDeclaration,
    methods: Record<string, ClosureValue>,
  ) {
    // inherit parent first
    if (classDecl.superClass) {
      const parent = this.classes.get(classDecl.superClass);

      if (!parent) {
        throw new Error(`Undefined superclass: ${classDecl.superClass}`);
      }

      this.collectClassMethods(parent, methods);
    }

    // child overrides parent
    for (const method of classDecl.methods) {
      methods[method.name] = new ClosureValue(method, this.env, classDecl);
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

      case "BooleanLiteral":
        return node.value;

      case "NullLiteral":
        return null;

      case "LogicalExpression":
        return this.visitLogicalExpression(node);

      case "UnaryExpression":
        return this.visitUnaryExpression(node);

      case "ExpressionStatement":
        return this.interpret(node.expression);

      case "ClassDeclaration":
        this.classes.set(node.name, node);

        return;

      case "NewExpression":
        return this.visitNewExpression(node);

      case "SuperCallExpression":
        return this.visitSuperCallExpression(node);

      case "ImportStatement":
        return this.visitImportStatement(node);

      case "ThrowStatement":
        return this.visitThrowStatement(node);

      case "TryCatchStatement":
        return this.visitTryCatchStatement(node);

      default:
        throw new Error(`Unknown node type`);
    }
  }
}

export class ReturnValue {
  constructor(public value: any) {}
}

export class RuntimeThrow {
  constructor(public value: unknown) {}
}

export class ClosureValue {
  constructor(
    public declaration: FunctionDeclaration,

    public env: Environment,

    public ownerClass?: ClassDeclaration,
  ) {}
}

export class NativeFunctionValue {
  constructor(public call: (args: unknown[]) => unknown) {}
}
