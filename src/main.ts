import { Lexer } from "./lexer";
import { Parser } from "./parser";

const source = `
spilltea(5 + 3 * 2)
`;

const lexer = new Lexer(source);
const tokens = lexer.tokenize();

const parser =  new Parser(tokens);
const ast = parser.parseProgram();  

console.log(JSON.stringify(ast, null, 2));