import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Interpreter, NativeFunctionValue } from "./interpreter";
import { Environment } from "./environment";

const source = `
spilltea("===== VARIABLES =====")

let x = 10
spilltea(x)

x = x + 5
spilltea(x)



spilltea("===== ARITHMETIC =====")

spilltea(1 + 2 * 3)
spilltea((1 + 2) * 3)



spilltea("===== COMPARISONS =====")

spilltea(10 > 5)
spilltea(10 < 5)
spilltea(10 == 10)



spilltea("===== LOGICAL =====")

spilltea(true && true)
spilltea(true && false)

spilltea(false || true)
spilltea(false || false)

spilltea(!true)
spilltea(!false)

spilltea((10 > 5) && (3 < 4))



spilltea("===== IF =====")

if (true && !false) {
  spilltea("if works")
}



spilltea("===== WHILE =====")

let counter = 0

while (counter < 3) {

  spilltea(counter)

  counter = counter + 1
}



spilltea("===== FUNCTIONS =====")

fn add(a, b) {
  return a + b
}

spilltea(add(10, 20))



spilltea("===== RECURSION =====")

fn factorial(n) {

  if (n == 1) {
    return 1
  }

  return n * factorial(n - 1)
}

spilltea(factorial(5))



spilltea("===== ARRAYS =====")

let nums = [10, 20, 30]

spilltea(nums[0])
spilltea(nums[1])

push(nums, 40)

spilltea(len(nums))

spilltea(pop(nums))

spilltea(len(nums))



spilltea("===== OBJECTS =====")

let person = {

  name: "alex",

  age: 25
}

spilltea(person.name)
spilltea(person.age)



spilltea("===== PROPERTY ASSIGNMENT =====")

person.name = "john"

spilltea(person.name)



spilltea("===== METHODS + THIS =====")

let counterObj = {

  count: 0,

  inc: fn() {

    this.count = this.count + 1
  }
}

counterObj.inc()
counterObj.inc()

spilltea(counterObj.count)



spilltea("===== CLOSURES =====")

fn outer(x) {

  return fn(y) {
    return x + y
  }
}

let addFive = outer(5)

spilltea(addFive(10))



spilltea("===== BUILTINS =====")

spilltea(type(123))
spilltea(type("hello"))
spilltea(type(true))
spilltea(type(nums))
spilltea(type(person))



spilltea("===== NULL =====")

let nothing = null

spilltea(nothing)



spilltea("===== PROTOTYPES =====")

let animal = {

  speak: fn() {
    spilltea("animal sound")
  }
}

let dog = {
  __proto__: animal
}

dog.speak()



spilltea("===== SHORT CIRCUIT =====")

fn explode() {
  spilltea("SHOULD NOT RUN")
}

spilltea(false && explode())



spilltea("===== DONE =====")
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