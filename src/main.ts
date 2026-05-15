import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Interpreter } from "./interpreter";
import { Environment } from "./environment";

const source = `
fn greet(name) {
  return "hello " + name
}


print(greet("john"))
`;

const lexer = new Lexer(source);
const tokens = lexer.tokenize();

console.log(tokens);


const parser = new Parser(tokens);
const ast = parser.parseProgram();

console.log(JSON.stringify(ast, null, 2));

const env = new Environment();
const interpreter = new Interpreter(env);

interpreter.interpret(ast);