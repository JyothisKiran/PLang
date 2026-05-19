import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Interpreter } from "./interpreter";
import { Environment } from "./environment";

const source = `
fn double(x) {
  return x * 2
}

let nums = [double(5), double(10), double(15)]

spilltea(nums)
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