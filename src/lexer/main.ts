import { Lexer } from "./lexer";

const source = `
printer
print(54 + 3 * 2)
`;

const lexer = new Lexer(source);

console.log(lexer.tokenize());