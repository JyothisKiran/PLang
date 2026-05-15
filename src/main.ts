import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Interpreter } from "./interpreter";
import { Environment } from "./environment";

const source = `
fn test() {
  if (1 == 1) {
    return 5
  }

  spilltea(100)
}

spilltea(test())
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