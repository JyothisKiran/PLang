import { NativeFunction } from "./native";

export class NativeRegistry {
  private functions = new Map<string, NativeFunction>();

  register(name: string, fn: NativeFunction) {
    this.functions.set(name, fn);
  }

  get(name: string): NativeFunction | undefined {
    return this.functions.get(name);
  }

  has(name: string): boolean {
    return this.functions.has(name);
  }
}