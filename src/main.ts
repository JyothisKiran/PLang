import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Interpreter, NativeFunctionValue } from "./interpreter";
import { Environment } from "./environment";

const source = `
let living = {
  alive: true
}

let animal = {
  __proto__: living
}

let dog = {
  __proto__: animal
}

spilltea(dog.alive)
`;

const lexer = new Lexer(source);
const tokens = lexer.tokenize();

console.log(tokens);


const parser = new Parser(tokens);
const ast = parser.parseProgram();

console.log(JSON.stringify(ast, null, 2));

const env = new Environment();
env.declare(
  "len",

  new NativeFunctionValue(
    (args) => {

      const value = args[0];

      if (
        typeof value === "string" ||
        Array.isArray(value)
      ) {
        return value.length;
      }

      throw new Error(
        "len() only supports arrays and strings"
      );
    }
  )
);
env.declare(
  "push",

  new NativeFunctionValue(
    (args) => {

      const array = args[0];
      const value = args[1];

      if (!Array.isArray(array)) {
        throw new Error(
          "push() expects array"
        );
      }

      array.push(value);

      return null;
    }
  )
);
env.declare(
  "pop",

  new NativeFunctionValue(
    (args) => {

      const array = args[0];

      if (!Array.isArray(array)) {
        throw new Error(
          "pop() expects array"
        );
      }

      return array.pop();
    }
  )
);
env.declare(
  "type",

  new NativeFunctionValue(
    (args) => {

      const value = args[0];

      if (Array.isArray(value)) {
        return "array";
      }

      return typeof value;
    }
  )
);
const interpreter = new Interpreter(env);

interpreter.interpret(ast);