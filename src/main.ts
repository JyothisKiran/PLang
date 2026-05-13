import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Interpreter } from "./interpreter";
import { Environment } from "./environment";

const source = `
let x = 10
let y = 20
let z = x + y * 2
spilltea(z)
`;

const lexer = new Lexer(source);
const tokens = lexer.tokenize();

const parser = new Parser(tokens);
const ast = parser.parseProgram();

const env = new Environment();
const interpreter = new Interpreter(env);

interpreter.interpret(ast);