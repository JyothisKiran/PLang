import { NativeRegistry } from "./nativeRegistry";

export function registerBuiltins(registry: NativeRegistry) {
  registry.register("add", (a, b) => Number(a) + Number(b));

  registry.register("sub", (a, b) => Number(a) - Number(b));

  registry.register("len", (value) => {
    if (typeof value === "string" || Array.isArray(value)) {
      return value.length;
    }
    throw new Error("len expects string or array");
  });

  registry.register("print", (...args) => {
    console.log(...args);
    return null;
  });

  registry.register("random", () => Math.random());
}